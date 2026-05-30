import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    if (!sellerId) return NextResponse.json({ error: 'sellerId required' }, { status: 400 })

    const reviews = await prisma.review.findMany({
      where: { sellerId },
      include: { reviewer: { select: { name: true, clerkId: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
    return NextResponse.json({ reviews, avg: Math.round(avg * 10) / 10, total: reviews.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reviewerId, sellerId, listingId, rating, comment } = body

    if (!reviewerId || !sellerId || !rating) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (reviewerId === sellerId) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    // Check if already reviewed this listing
    if (listingId) {
      const existing = await prisma.review.findFirst({ where: { reviewerId, listingId } })
      if (existing) return NextResponse.json({ error: 'already_reviewed' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: { reviewerId, sellerId, listingId, rating, comment: comment || null },
      include: { reviewer: { select: { name: true } } },
    })
    return NextResponse.json(review)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}