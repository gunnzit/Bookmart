import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Who is signed in, decided on the server. A userId sent by the browser is ignored.
async function signedInId(): Promise<string | null> {
  try {
    const a = await auth()
    return a.userId || null
  } catch {
    return null
  }
}

// GET /api/wishlist — the signed-in person's wishlist (the ?userId= the pages still send is ignored)
export async function GET() {
  try {
    const userId = await signedInId()
    if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const items = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            // Only what the pages show. Never send the seller's phone or email.
            seller: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/wishlist — toggle a listing in the signed-in person's wishlist. Body: { listingId }
export async function POST(request: Request) {
  try {
    const userId = await signedInId()
    if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const listingId = typeof body.listingId === 'string' ? body.listingId : ''
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const existing = await prisma.wishlist.findUnique({
      where: { userId_listingId: { userId, listingId } },
    })

    if (existing) {
      await prisma.wishlist.delete({ where: { userId_listingId: { userId, listingId } } })
      return NextResponse.json({ saved: false })
    }

    await prisma.wishlist.create({ data: { userId, listingId } })
    return NextResponse.json({ saved: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}