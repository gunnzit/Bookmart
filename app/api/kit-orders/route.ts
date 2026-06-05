import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Admin identity is checked against the SIGNED SESSION, never a query param.
// Knowing this ID is now useless to an attacker — you must actually be logged
// in as this Clerk user (a cookie Clerk signs and verifies) to pass.
const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

// GET: admin gets ALL orders; a signed-in buyer gets ONLY their own.
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    // Admin — full list with buyer contact info
    if (userId === ADMIN_ID) {
      const orders = await prisma.kitOrder.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, phone: true } } },
      })
      return NextResponse.json(orders)
    }

    // Regular buyer — scoped to their own orders by SESSION id, not query.
    const orders = await prisma.kitOrder.findMany({
      where: { buyerClerkId: userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PATCH: only the admin (by session) may change an order's status.
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId || userId !== ADMIN_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, status } = await request.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const order = await prisma.kitOrder.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}