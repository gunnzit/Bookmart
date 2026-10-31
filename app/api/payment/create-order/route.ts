import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { validateKitOrder } from '@/lib/kit-prices'
import { FEATURE_TIERS } from '@/lib/featured'

// NOTE: Razorpay is created INSIDE the handler (not at the top of the file),
// so it only runs at request time when the secret keys exist — not during the
// build, which is what caused the "key_id is mandatory" build error.
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

// Featured packages come from lib/featured.ts (amounts in paise)
const TIERS: Record<string, { amount: number; days: number; label: string }> = Object.fromEntries(
  FEATURE_TIERS.map(t => [t.tier, { amount: t.price * 100, days: t.days, label: t.label + ' — ' + t.days + ' days' }])
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      listingId,
      tier,
      amount: rawAmount,
      receipt: rawReceipt,
      items,
      numKits,
      deliveryMode,
      paymentMode,
    } = body

    let amount: number
    let receipt: string
    let notes: Record<string, string> = {}

    // ── School kit order ────────────────────────────────────────────────
    if (rawAmount && Array.isArray(items)) {
      const check = validateKitOrder({ items, numKits, deliveryMode, paymentMode })

      if (!check.ok) {
        return NextResponse.json(
          { error: 'Order validation failed. ' + (check.reason || 'Invalid items.') },
          { status: 400 }
        )
      }

      if (Math.round(Number(rawAmount)) !== check.expectedPayNowPaise) {
        return NextResponse.json(
          {
            error: 'Price mismatch. Please refresh and try again.',
            expected: check.expectedPayNowPaise,
            received: Math.round(Number(rawAmount)),
          },
          { status: 400 }
        )
      }

      amount = check.expectedPayNowPaise
      receipt = rawReceipt || 'kit_' + Date.now().toString().slice(-8)
      notes = {
        type: 'school_kit',
        numKits: String(numKits || 1),
        deliveryMode: deliveryMode === 'delivery' ? 'delivery' : 'pickup',
        paymentMode: paymentMode === 'partial' ? 'partial' : 'full',
        itemsSubtotal: String(check.itemsSubtotal),
      }
    } else if (rawAmount) {
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

    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({ amount, currency: 'INR', receipt, notes })
    return NextResponse.json({ ...order, tier, days: tier ? (TIERS[tier]?.days || 7) : undefined })
  } catch (error: any) {
    console.error('Razorpay order error:', JSON.stringify(error))
    return NextResponse.json({
      error: error?.message || error?.error?.description || JSON.stringify(error)
    }, { status: 500 })
  }
}