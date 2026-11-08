import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// GET ?q=&filter=all|book|stationery|low : the stock list
export async function GET(request: Request) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 60)
  const filter = searchParams.get('filter') || 'all'

  const where: any = {}
  if (q) where.OR = q.split(/\s+/).map(w => ({ name: { contains: w, mode: 'insensitive' } }))
  if (q) { where.AND = where.OR; delete where.OR }
  if (filter === 'book' || filter === 'stationery') where.category = filter
  if (filter === 'low') where.qty = { lte: 5 }

  const items = await prisma.stockItem.findMany({
    where,
    orderBy: filter === 'low' ? { qty: 'asc' } : { name: 'asc' },
    take: 200,
    select: { id: true, name: true, category: true, qty: true, mrp: true, costPrice: true, lowAt: true },
  })
  return NextResponse.json({ items })
}
