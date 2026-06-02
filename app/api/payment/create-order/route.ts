import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'

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
    const { listingId, tier, amount: rawAmount, receipt: rawReceipt } = body

    let amount: number
    let receipt: string
    let notes: Record<string, string> = {}

    if (rawAmount) {
      // School kit order — amount passed directly in paise
      amount = rawAmount
      receipt = rawReceipt || 'kit_' + Date.now().toString().slice(-8)
      notes = { type: 'school_kit', ...body }
    } else {
      // Featured listing order
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