import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { validateKitOrder } from '@/lib/kit-prices'

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
      kitData,
    } = body

    // 1) Verify the Razorpay signature (proves the payment is real & matches the order)
    const sigBody = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sigBody)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // ── Kit order payment ────────────────────────────────────────────────
    if (kitData) {
      // 2) Re-validate the price server-side BEFORE writing anything.
      //    Even if create-order was somehow bypassed, a tampered amount or
      //    item price is caught here.
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

      // 3) Confirm the amount the customer claims they paid matches the server price.
      //    (kitData.paidNow is in rupees; expectedPayNowPaise is in paise.)
      if (Math.round(Number(kitData.paidNow) * 100) !== check.expectedPayNowPaise) {
        return NextResponse.json(
          { error: 'Payment amount mismatch — order not recorded.' },
          { status: 400 }
        )
      }

      // 4) Compute the authoritative amounts to STORE (never the browser's numbers).
      const b = check.breakdown
      const afterDiscount = check.itemsSubtotal - b.siblingDiscount

      // Find or create user by clerkId, then email
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
          // ↓ all money fields are SERVER-computed, not from the browser
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

    // ── Featured listing payment ─────────────────────────────────────────
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