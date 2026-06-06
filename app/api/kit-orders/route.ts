import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'
const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

// Server-side rule: a customer may request cancellation only while the order is
// still 'confirmed' AND within 24h of ordering. Enforced here so the browser
// can't fake an expired window.
function canRequestCancel(status: string, createdAt: Date, now: number): boolean {
  if (status !== 'confirmed') return false
  const ageMs = now - new Date(createdAt).getTime()
  return ageMs >= 0 && ageMs <= CANCEL_WINDOW_MS
}

// GET: admin gets ALL orders; a signed-in buyer gets ONLY their own.
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    if (userId === ADMIN_ID) {
      const orders = await prisma.kitOrder.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, phone: true } } },
      })
      return NextResponse.json(orders)
    }

    const orders = await prisma.kitOrder.findMany({
      where: { buyerClerkId: userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PATCH: role-aware.
//   Customer (owner): action 'request-cancel'  → status 'cancellation_requested'
//   Admin: action 'approve-cancel'  → status 'cancelled'
//          action 'decline-cancel'  → status 'confirmed'
//          { status }               → set any status (Assembling/Ready/Delivered…)
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { id, action, status } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
    }

    const order = await prisma.kitOrder.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const isAdmin = userId === ADMIN_ID
    const isOwner = order.buyerClerkId === userId

    // ── Customer cancellation request ────────────────────────────────────
    if (action === 'request-cancel') {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Not your order' }, { status: 403 })
      }
      if (!canRequestCancel(order.status, order.createdAt, Date.now())) {
        return NextResponse.json(
          { error: 'This order can no longer be cancelled online. Please contact the store.' },
          { status: 400 }
        )
      }
      const updated = await prisma.kitOrder.update({
        where: { id },
        data: { status: 'cancellation_requested' },
      })
      return NextResponse.json(updated)
    }

    // ── Everything below is admin-only ───────────────────────────────────
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'approve-cancel') {
      // NOTE: this records the cancellation. The actual money refund is done by
      // you in the Razorpay dashboard (paymentId is on the order record).
      const updated = await prisma.kitOrder.update({
        where: { id },
        data: { status: 'cancelled' },
      })
      return NextResponse.json(updated)
    }

    if (action === 'decline-cancel') {
      const updated = await prisma.kitOrder.update({
        where: { id },
        data: { status: 'confirmed' },
      })
      return NextResponse.json(updated)
    }

    // Generic admin status update (Assembling / Ready / Delivered, etc.)
    if (status) {
      const updated = await prisma.kitOrder.update({
        where: { id },
        data: { status },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'No valid action or status' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}