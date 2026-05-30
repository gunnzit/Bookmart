import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// Pricing tiers
const TIERS: Record<string, { amount: number; days: number; label: string }> = {
  basic:    { amount: 1900, days: 3,  label: 'Basic — 3 days'    },
  standard: { amount: 2900, days: 7,  label: 'Standard — 7 days'  },
  premium:  { amount: 4900, days: 15, label: 'Premium — 15 days'  },
}

export async function POST(request: Request) {
  try {
    const { listingId, tier = 'standard' } = await request.json()
    const selected = TIERS[tier] || TIERS.standard

    const order = await razorpay.orders.create({
      amount: selected.amount,
      currency: 'INR',
      receipt: `feat_${tier[0]}_${listingId.slice(-8)}_${Date.now().toString().slice(-6)}`,
      notes: { listingId, tier, days: String(selected.days) },
    })
    return NextResponse.json({ ...order, tier, days: selected.days })
  } catch (error: any) {
    console.error('Razorpay order error:', JSON.stringify(error))
    return NextResponse.json({
      error: error?.message || error?.error?.description || JSON.stringify(error)
    }, { status: 500 })
  }
}