import { NextResponse } from 'next/server'
import { prisma, getMe, cleanBody, firstName, addMessage } from '@/lib/chat'

type Ctx = { params: Promise<{ id: string }> }

// Load a conversation only if the signed-in user is the buyer or the seller
async function loadMine(id: string, meId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      listing: {
        select: { id: true, title: true, subtitle: true, price: true, origPrice: true, condition: true, category: true, emoji: true, images: true, sold: true, status: true },
      },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
    },
  })
  if (!conv) return null
  if (conv.buyerId !== meId && conv.sellerId !== meId) return null
  return conv
}

// GET — the chat: who it is with, the book, and the messages.
// ?after=<time> returns only messages newer than that time (used for refreshing).
export async function GET(request: Request, ctx: Ctx) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const { id } = await ctx.params
    const conv = await loadMine(id, me.id)
    if (!conv) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

    const isBuyer = conv.buyerId === me.id
    const afterRaw = new URL(request.url).searchParams.get('after')
    const afterDate = afterRaw ? new Date(afterRaw) : null
    const hasAfter = !!afterDate && !isNaN(afterDate.getTime())

    let rows
    if (hasAfter) {
      rows = await prisma.message.findMany({
        where: { conversationId: id, createdAt: { gt: afterDate as Date } },
        orderBy: { createdAt: 'asc' },
        take: 200,
      })
    } else {
      // First load: the latest 200 messages, oldest first
      const latest = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
      rows = latest.reverse()
    }

    // Opening the chat marks the other person's messages as read
    const myReadAt = isBuyer ? conv.buyerReadAt : conv.sellerReadAt
    const hasUnread = !!conv.lastSenderId && conv.lastSenderId !== me.id && (!myReadAt || myReadAt < conv.lastMessageAt)
    if (hasUnread) {
      await prisma.conversation.update({
        where: { id },
        data: isBuyer ? { buyerReadAt: new Date() } : { sellerReadAt: new Date() },
      })
    }

    return NextResponse.json({
      me: me.id,
      isBuyer,
      other: { name: firstName(isBuyer ? conv.seller.name : conv.buyer.name) },
      listing: conv.listing,
      otherReadAt: isBuyer ? conv.sellerReadAt : conv.buyerReadAt,
      messages: rows.map(m => ({ id: m.id, senderId: m.senderId, body: m.body, createdAt: m.createdAt })),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST — send a message. Body: { body: string }
export async function POST(request: Request, ctx: Ctx) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const { id } = await ctx.params
    const conv = await loadMine(id, me.id)
    if (!conv) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

    const payload = await request.json().catch(() => ({}))
    const text = cleanBody(payload.body)
    if (!text) return NextResponse.json({ error: 'Message is empty' }, { status: 400 })

    const isBuyer = conv.buyerId === me.id
    const message = await addMessage(id, me.id, isBuyer, text)

    return NextResponse.json({
      message: { id: message.id, senderId: message.senderId, body: message.body, createdAt: message.createdAt },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}