import { NextResponse } from 'next/server'
import { prisma, getMe, cleanBody, firstName, addMessage } from '@/lib/chat'

// GET — my conversations (inbox)
export async function GET() {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const rows = await prisma.conversation.findMany({
      where: { AND: [{ OR: [{ buyerId: me.id }, { sellerId: me.id }] }, { lastMessageText: { not: null } }] },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: {
        listing: { select: { id: true, title: true, images: true, emoji: true, sold: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
    })

    const conversations = rows.map(c => {
      const isBuyer = c.buyerId === me.id
      const myReadAt = isBuyer ? c.buyerReadAt : c.sellerReadAt
      const lastMine = c.lastSenderId === me.id
      const unread = !!c.lastSenderId && !lastMine && (!myReadAt || myReadAt < c.lastMessageAt)
      return {
        id: c.id,
        role: isBuyer ? 'buying' : 'selling',
        otherName: firstName(isBuyer ? c.seller.name : c.buyer.name),
        listing: c.listing,
        lastText: c.lastMessageText,
        lastAt: c.lastMessageAt,
        lastMine,
        unread,
      }
    })

    return NextResponse.json({ conversations, unreadCount: conversations.filter(c => c.unread).length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST — start (or reopen) a chat about a listing. Body: { listingId, message? }
export async function POST(request: Request) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const listingId = typeof body.listingId === 'string' ? body.listingId : ''
    if (!listingId) return NextResponse.json({ error: 'Missing listing' }, { status: 400 })

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, sold: true, status: true },
    })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.sellerId === me.id) return NextResponse.json({ error: 'This is your own listing.' }, { status: 400 })

    let conv = await prisma.conversation.findUnique({
      where: { listingId_buyerId: { listingId, buyerId: me.id } },
      select: { id: true },
    })

    if (!conv) {
      if (listing.status && listing.status !== 'active') return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      if (listing.sold) return NextResponse.json({ error: 'This book has already been sold.' }, { status: 400 })
      conv = await prisma.conversation.create({
        data: { listingId, buyerId: me.id, sellerId: listing.sellerId },
        select: { id: true },
      })
    }

    const first = cleanBody(body.message)
    if (first) await addMessage(conv.id, me.id, true, first)

    return NextResponse.json({ id: conv.id })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}