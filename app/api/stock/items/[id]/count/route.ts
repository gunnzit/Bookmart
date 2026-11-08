import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// POST { count, mrp?, barcode? }: the shelf count for an item. Sets the quantity to exactly this
// number, records the difference as a 'count' StockMove, and fills in MRP/barcode if given.
export async function POST(request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const b = await request.json().catch(() => ({}))
  const count = Number(b.count)
  if (!Number.isInteger(count) || count < 0 || count > 100000) return NextResponse.json({ error: 'bad_qty' }, { status: 400 })
  const item = await prisma.stockItem.findUnique({ where: { id }, select: { qty: true } })
  if (!item) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const data: any = { qty: count, countedAt: new Date() }
  const mrp = Number(b.mrp)
  if (b.mrp != null && b.mrp !== '' && mrp > 0 && mrp < 1e6) data.mrp = mrp
  const barcode = typeof b.barcode === 'string' ? b.barcode.replace(/\D/g, '') : ''
  if (barcode.length >= 8 && barcode.length <= 14) {
    const other = await prisma.stockItem.findUnique({ where: { barcode }, select: { id: true } })
    if (!other || other.id === id) data.barcode = barcode
  }
  const diff = count - item.qty
  await prisma.$transaction([
    prisma.stockItem.update({ where: { id }, data }),
    ...(diff !== 0 ? [prisma.stockMove.create({ data: { itemId: id, change: diff, reason: 'count', by: me.name } })] : []),
  ])
  return NextResponse.json({ ok: true, qty: count })
}
