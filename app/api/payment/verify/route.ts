import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId } = await request.json()

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: { featured: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}