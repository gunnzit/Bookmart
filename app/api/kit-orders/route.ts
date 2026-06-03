import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET: fetch orders — admin gets all, buyer gets their own
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clerkId = searchParams.get('clerkId')
    const admin = searchParams.get('admin')
    const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

    if (admin === 'true' && clerkId === ADMIN_ID) {
      const orders = await prisma.kitOrder.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, phone: true } } },
      })
      return NextResponse.json(orders)
    }

    if (clerkId) {
      const orders = await prisma.kitOrder.findMany({
        where: { buyerClerkId: clerkId },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(orders)
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PATCH: admin updates order status
export async function PATCH(request: Request) {
  try {
    const { id, status, clerkId } = await request.json()
    const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'
    if (clerkId !== ADMIN_ID) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const order = await prisma.kitOrder.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}