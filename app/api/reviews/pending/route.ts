import { NextResponse } from 'next/server'
import { prisma, getMe, firstName } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// GET /api/reviews/pending — books the signed-in person bought (the seller marked them sold to
// this person) that they have not rated yet. Shown on their profile as "Rate your sellers".
export async function GET() {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ items: [] })

    const sales = await prisma.sale.findMany({
      where: { buyerId: me.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        listingId: true,
        sellerId: true,
        listing: { select: { title: true, images: true, seller: { select: { name: true } } } },
      },
    })
    if (sales.length === 0) return NextResponse.json({ items: [] })

    const done = await prisma.review.findMany({
      where: { reviewerId: me.id, listingId: { in: sales.map(s => s.listingId) } },
      select: { listingId: true },
    })
    const doneSet = new Set(done.map(d => d.listingId))

    const items = sales
      .filter(s => !doneSet.has(s.listingId))
      .map(s => ({
        listingId: s.listingId,
        title: s.listing.title,
        image: s.listing.images?.[0] || null,
        sellerName: firstName(s.listing.seller?.name),
      }))

    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}