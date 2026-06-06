import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { validateKitOrder } from '@/lib/kit-prices'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Created inside the handler (not at top of file) so it only runs at request
// time — avoids the "key_id is mandatory" build error.
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

// Valid featured-tier amounts in paise — keep in sync with create-order TIERS.
const VALID_TIER_AMOUNTS = new Set([1900, 2900, 4900])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      listingId,
      kitData,
    } = body

    // 1) Verify the Razorpay signature
    const sigBody = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sigBody)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // ── Kit order payment (Fix #1) ───────────────────────────────────────
    if (kitData) {
      const check = validateKitOrder({
        items: kitData.items,
        numKits: kitData.numKits,
        deliveryMode: kitData.deliveryMode,
        paymentMode: kitData.paymentMode,
      })

      if (!check.ok) {
        return NextResponse.json(
          { error: 'Order validation failed. ' + (check.reason || 'Invalid items.') },
          { status: 400 }
        )
      }

      if (Math.round(Number(kitData.paidNow) * 100) !== check.expectedPayNowPaise) {
        return NextResponse.json(
          { error: 'Payment amount mismatch — order not recorded.' },
          { status: 400 }
        )
      }

      const b = check.breakdown
      const afterDiscount = check.itemsSubtotal - b.siblingDiscount

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
          kitSubtotal: afterDiscount,
          deliveryFee: b.deliveryFee,
          totalAmount: b.total,
          paidNow: b.payNow,
          payLater: b.payLater,
          paymentMode: kitData.paymentMode === 'partial' ? 'partial' : 'full',
          deliveryMode: kitData.deliveryMode === 'delivery' ? 'delivery' : 'pickup',
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

    // ── Featured listing payment (Fix #3) ────────────────────────────────
    if (listingId) {
      let order: any
      try {
        const razorpay = getRazorpay()
        order = await razorpay.orders.fetch(razorpay_order_id)
      } catch {
        return NextResponse.json({ error: 'Could not verify order' }, { status: 400 })
      }

      const paidForListing = order?.notes?.listingId
      const orderAmount = Number(order?.amount)

      if (paidForListing !== listingId) {
        return NextResponse.json(
          { error: 'Payment does not correspond to this listing.' },
          { status: 400 }
        )
      }
      if (!VALID_TIER_AMOUNTS.has(orderAmount)) {
        return NextResponse.json(
          { error: 'Invalid featured amount.' },
          { status: 400 }
        )
      }

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