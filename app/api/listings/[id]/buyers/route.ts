import { NextResponse } from 'next/server'
import { prisma, getMe, firstName } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// GET: people who chatted with the seller about this book. Only the seller can ask.
// Gives first names only. Phones and emails are never sent.
export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const listing = await prisma.listing.findUnique({ where: { id }, select: { sellerId: true } })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.sellerId !== me.id) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

    const convs = await prisma.conversation.findMany({
      where: { listingId: id },
      orderBy: { lastMessageAt: 'desc' },
      take: 30,
      select: { buyerId: true, lastMessageAt: true, buyer: { select: { name: true } } },
    })

    // When opened from inside a chat (?conv=...), say which buyer that chat is with
    const convId = new URL(request.url).searchParams.get('conv')
    let preselect: string | null = null
    if (convId) {
      const c = await prisma.conversation.findFirst({ where: { id: convId, listingId: id }, select: { buyerId: true } })
      preselect = c ? c.buyerId : null
    }

    return NextResponse.json({
      preselect,
      buyers: convs.map(c => ({
        id: c.buyerId,
        name: firstName(c.buyer.name),
        lastMessageAt: c.lastMessageAt,
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}