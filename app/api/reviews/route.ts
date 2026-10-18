import { NextResponse } from 'next/server'
import { prisma, getMe } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// Who may review a seller: only a buyer who really talked to them about that book.
// true  = the buyer AND the seller must each have sent at least one message in that chat
// false = the buyer sending one message is enough
const REQUIRE_SELLER_REPLY = true

async function hasChatted(buyerId: string, sellerId: string, listingId: string): Promise<boolean> {
  const conv = await prisma.conversation.findUnique({
    where: { listingId_buyerId: { listingId, buyerId } },
    select: { id: true },
  })
  if (!conv) return false
  const fromBuyer = await prisma.message.count({ where: { conversationId: conv.id, senderId: buyerId } })
  if (fromBuyer === 0) return false
  if (!REQUIRE_SELLER_REPLY) return true
  const fromSeller = await prisma.message.count({ where: { conversationId: conv.id, senderId: sellerId } })
  return fromSeller > 0
}

// GET /api/reviews?sellerId=xxx — public. Only the reviewer's name is sent, never ids.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    if (!sellerId) return NextResponse.json({ error: 'sellerId required' }, { status: 400 })

    const reviews = await prisma.review.findMany({
      where: { sellerId },
      include: { reviewer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

    // Optional: ?listingId=… also says whether the signed-in person may review this seller for that book
    let canReview = false
    let reason: string = 'signin'
    const listingId = searchParams.get('listingId')
    if (listingId) {
      const me = await getMe().catch(() => null)
      if (!me) {
        reason = 'signin'
      } else if (me.id === sellerId) {
        reason = 'own'
      } else if (await prisma.review.findFirst({ where: { reviewerId: me.id, listingId }, select: { id: true } })) {
        reason = 'done'
      } else if (!(await hasChatted(me.id, sellerId, listingId))) {
        reason = 'chat_first'
      } else {
        canReview = true
        reason = 'ok'
      }
    }

    return NextResponse.json({ reviews, avg: Math.round(avg * 10) / 10, total: reviews.length, canReview, reason })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/reviews — leave a review. Who is reviewing comes from the login session, never from the browser.
// Body: { listingId, rating, comment? }  (the seller is taken from the listing itself)
export async function POST(request: Request) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in to leave a review.' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const listingId = typeof body.listingId === 'string' ? body.listingId : ''
    const rating = Number(body.rating)
    const comment = typeof body.comment === 'string' ? body.comment.replace(/\s+/g, ' ').trim().slice(0, 500) : ''

    if (!listingId) return NextResponse.json({ error: 'Missing listing' }, { status: 400 })
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, sellerId: true } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    if (listing.sellerId === me.id) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
    }

    // Only people who chatted with the seller about this book
    if (!(await hasChatted(me.id, listing.sellerId, listingId))) {
      return NextResponse.json({ error: 'chat_first' }, { status: 403 })
    }

    // One review per person per listing
    const existing = await prisma.review.findFirst({ where: { reviewerId: me.id, listingId } })
    if (existing) return NextResponse.json({ error: 'already_reviewed' }, { status: 400 })

    const review = await prisma.review.create({
      data: { reviewerId: me.id, sellerId: listing.sellerId, listingId, rating, comment: comment || null },
      include: { reviewer: { select: { name: true } } },
    })
    return NextResponse.json(review)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}