import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser, nameKey } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// GET ?q=&filter=all|book|notebook|stationery|low|uncounted&barcode= : the stock list
export async function GET(request: Request) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 60)
  const filter = searchParams.get('filter') || 'all'

  const where: any = {}
  if (q) where.OR = q.split(/\s+/).map(w => ({ name: { contains: w, mode: 'insensitive' } }))
  if (q) { where.AND = where.OR; delete where.OR }
  if (filter === 'book' || filter === 'notebook' || filter === 'stationery') where.category = filter
  if (filter === 'uncounted') where.countedAt = null
  const barcode = (searchParams.get('barcode') || '').replace(/\D/g, '')
  if (barcode) { delete where.AND; where.barcode = barcode }
  if (filter === 'low') where.qty = { lte: 5 }

  const items = await prisma.stockItem.findMany({
    where,
    orderBy: filter === 'low' ? { qty: 'asc' } : { name: 'asc' },
    take: 200,
    select: { id: true, name: true, category: true, qty: true, mrp: true, costPrice: true, lowAt: true, countedAt: true, barcode: true, className: true },
  })
  return NextResponse.json({ items })
}

// POST { name, category, mrp, publisher, className, barcode, ncert, count }: add a new item found on
// the shelf (usually from "Snap an item"), with its shelf count.
export async function POST(request: Request) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const b = await request.json().catch(() => ({}))
  const name = typeof b.name === 'string' ? b.name.replace(/\s+/g, ' ').trim().slice(0, 160) : ''
  const count = Number(b.count)
  if (name.length < 2) return NextResponse.json({ error: 'need_name' }, { status: 400 })
  if (!Number.isInteger(count) || count < 0 || count > 100000) return NextResponse.json({ error: 'bad_qty' }, { status: 400 })
  const key = nameKey(name)
  if (await prisma.stockItem.findUnique({ where: { nameKey: key }, select: { id: true } })) return NextResponse.json({ error: 'exists' }, { status: 409 })

  const mrp = Number(b.mrp)
  const cls = Number(b.className)
  const digits: string = typeof b.barcode === 'string' ? b.barcode.replace(/\D/g, '') : ''
  const barcodeFree = digits.length >= 8 && digits.length <= 14 && !(await prisma.stockItem.findUnique({ where: { barcode: digits }, select: { id: true } }))
  const barcode = barcodeFree ? digits : null
  const category = ['book', 'notebook', 'stationery', 'other'].includes(b.category) ? b.category : 'other'
  const item = await prisma.stockItem.create({
    data: {
      name, nameKey: key, category, barcode,
      publisher: typeof b.publisher === 'string' ? b.publisher.trim().slice(0, 80) || null : null,
      className: Number.isInteger(cls) && cls >= 1 && cls <= 12 ? cls : null,
      ncert: !!b.ncert,
      mrp: mrp > 0 && mrp < 1e6 ? mrp : null,
      gstRate: b.ncert || category === 'book' ? 0 : null,
      hsn: b.ncert || category === 'book' ? '4901' : null,
      qty: count,
      countedAt: new Date(),
    },
    select: { id: true, name: true, qty: true },
  })
  if (count > 0) await prisma.stockMove.create({ data: { itemId: item.id, change: count, reason: 'count', note: 'First count', by: me.name } })
  return NextResponse.json({ ok: true, item })
}

