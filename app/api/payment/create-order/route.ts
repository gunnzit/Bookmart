import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { validateKitOrder } from '@/lib/kit-prices'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const TIERS: Record<string, { amount: number; days: number; label: string }> = {
  basic:    { amount: 1900, days: 3,  label: 'Basic — 3 days'   },
  standard: { amount: 2900, days: 7,  label: 'Standard — 7 days' },
  premium:  { amount: 4900, days: 15, label: 'Premium — 15 days' },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      listingId,
      tier,
      amount: rawAmount,
      receipt: rawReceipt,
      // School-kit fields (sent by checkout so the server can price-check)
      items,
      numKits,
      deliveryMode,
      paymentMode,
    } = body

    let amount: number
    let receipt: string
    let notes: Record<string, string> = {}

    // ── School kit order ────────────────────────────────────────────────
    // We do NOT trust rawAmount. We recompute the price from the items the
    // browser sent, using server-side prices, and reject any mismatch.
    if (rawAmount && Array.isArray(items)) {
      const check = validateKitOrder({ items, numKits, deliveryMode, paymentMode })

      if (!check.ok) {
        return NextResponse.json(
          { error: 'Order validation failed. ' + (check.reason || 'Invalid items.') },
          { status: 400 }
        )
      }

      // The amount the browser asked to charge must equal what the server computed.
      if (Math.round(Number(rawAmount)) !== check.expectedPayNowPaise) {
        return NextResponse.json(
          {
            error: 'Price mismatch. Please refresh and try again.',
            // (debug fields are safe to expose: they reveal only the correct price)
            expected: check.expectedPayNowPaise,
            received: Math.round(Number(rawAmount)),
          },
          { status: 400 }
        )
      }

      // Use the SERVER amount, never the browser's.
      amount = check.expectedPayNowPaise
      receipt = rawReceipt || 'kit_' + Date.now().toString().slice(-8)
      notes = {
        type: 'school_kit',
        numKits: String(check.breakdown ? numKits : 1),
        deliveryMode: deliveryMode === 'delivery' ? 'delivery' : 'pickup',
        paymentMode: paymentMode === 'partial' ? 'partial' : 'full',
        itemsSubtotal: String(check.itemsSubtotal),
      }
    } else if (rawAmount) {
      // Legacy / non-kit raw amount path with no items to validate — refuse,
      // because an amount with no validatable contents is exactly the exploit.
      return NextResponse.json(
        { error: 'Missing order items for validation.' },
        { status: 400 }
      )
    } else {
      // ── Featured listing order ────────────────────────────────────────
      const selected = TIERS[tier] || TIERS.standard
      amount = selected.amount
      receipt = 'feat_' + (tier?.[0] || 's') + '_' + (listingId?.slice(-8) || 'x') + '_' + Date.now().toString().slice(-6)
      notes = { listingId: listingId || '', tier: tier || 'standard', days: String(selected.days) }
    }

    const order = await razorpay.orders.create({ amount, currency: 'INR', receipt, notes })
    return NextResponse.json({ ...order, tier, days: tier ? (TIERS[tier]?.days || 7) : undefined })
  } catch (error: any) {
    console.error('Razorpay order error:', JSON.stringify(error))
    return NextResponse.json({
      error: error?.message || error?.error?.description || JSON.stringify(error)
    }, { status: 500 })
  }
}