import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      listingId,
      // Kit order fields (present only for kit payments)
      kitData,
    } = body

    // Verify Razorpay signature
    const sigBody = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sigBody)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Kit order payment
    if (kitData) {
      // Find or create user by clerkId
      let user = await prisma.user.findUnique({ where: { clerkId: kitData.buyerClerkId } })
      if (!user) {
        user = await prisma.user.findFirst({ where: { email: kitData.buyerEmail } })
      }
      if (!user) {
        user = await prisma.user.create({
          data: {
            clerkId: kitData.buyerClerkId,
            name: kitData.buyerName,
            email: kitData.buyerEmail,
            phone: kitData.buyerPhone,
          }
        })
      }

      await prisma.kitOrder.create({
        data: {
          school: kitData.school,
          class: kitData.class,
          items: kitData.items,
          kitSubtotal: kitData.kitSubtotal,
          deliveryFee: kitData.deliveryFee,
          totalAmount: kitData.totalAmount,
          paidNow: kitData.paidNow,
          payLater: kitData.payLater,
          paymentMode: kitData.paymentMode,
          deliveryMode: kitData.deliveryMode,
          address: kitData.address || null,
          buyerName: kitData.buyerName,
          buyerPhone: kitData.buyerPhone,
          buyerClerkId: kitData.buyerClerkId,
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          status: 'confirmed',
          userId: user.id,
        }
      })

      return NextResponse.json({ success: true, type: 'kit' })
    }

    // Featured listing payment
    if (listingId) {
      await prisma.listing.update({
        where: { id: listingId },
        data: { featured: true },
      })
      return NextResponse.json({ success: true, type: 'featured' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}