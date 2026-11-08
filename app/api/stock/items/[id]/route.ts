import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// GET: one item with its recent stock changes
export async function GET(_request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const item = await prisma.stockItem.findUnique({ where: { id }, include: { moves: { orderBy: { createdAt: 'desc' }, take: 30 } } })
  if (!item) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ item })
}

// POST { change, reason: 'sold' | 'adjust', note }: stock going out (sold/used) or a count correction.
// Until counter billing exists, this is how sales come off stock.
export async function POST(request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const b = await request.json().catch(() => ({}))
  const change = Math.round(Number(b.change))
  const reason = b.reason === 'adjust' ? 'adjust' : 'sold'
  if (!change || Math.abs(change) > 10000) return NextResponse.json({ error: 'bad_qty' }, { status: 400 })
  if (reason === 'sold' && change > 0) return NextResponse.json({ error: 'bad_qty' }, { status: 400 })

  const item = await prisma.stockItem.findUnique({ where: { id }, select: { qty: true } })
  if (!item) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (item.qty + change < 0) return NextResponse.json({ error: 'not_enough', qty: item.qty }, { status: 400 })

  const [updated] = await prisma.$transaction([
    prisma.stockItem.update({ where: { id }, data: { qty: { increment: change } }, select: { qty: true } }),
    prisma.stockMove.create({ data: { itemId: id, change, reason, note: typeof b.note === 'string' ? b.note.slice(0, 120) : null, by: me.name } }),
  ])
  return NextResponse.json({ ok: true, qty: updated.qty })
}
