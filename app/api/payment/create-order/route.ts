import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: Request) {
  try {
    const { listingId } = await request.json()
    const order = await razorpay.orders.create({
      amount: 4900,
      currency: 'INR',
      receipt: `feat_${listingId.slice(-10)}_${Date.now().toString().slice(-8)}`,
      notes: { listingId },
    })
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Razorpay order error:', JSON.stringify(error))
    return NextResponse.json({ 
      error: error?.message || error?.error?.description || JSON.stringify(error) 
    }, { status: 500 })
  }
}