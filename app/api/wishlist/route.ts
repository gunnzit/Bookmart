import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET /api/wishlist?userId=xxx — get all wishlist items for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const items = await prisma.wishlist.findMany({
      where: { userId },
      include: { listing: { include: { seller: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/wishlist — toggle wishlist item
export async function POST(request: Request) {
  try {
    const { userId, listingId } = await request.json()
    if (!userId || !listingId) return NextResponse.json({ error: 'userId and listingId required' }, { status: 400 })

    const existing = await prisma.wishlist.findUnique({
      where: { userId_listingId: { userId, listingId } },
    })

    if (existing) {
      await prisma.wishlist.delete({ where: { userId_listingId: { userId, listingId } } })
      return NextResponse.json({ saved: false })
    } else {
      await prisma.wishlist.create({ data: { userId, listingId } })
      return NextResponse.json({ saved: true })
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}