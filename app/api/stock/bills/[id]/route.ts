import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser, photoLinks, CATEGORIES } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// GET: one bill with its lines and short-lived photo links (for the check screen)
export async function GET(_request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const bill = await prisma.stockBill.findUnique({ where: { id }, include: { lines: { orderBy: { position: 'asc' } } } })
  if (!bill) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  let photoUrls: string[] = []
  try { photoUrls = await photoLinks(bill.photos) } catch {}
  return NextResponse.json({ bill, photoUrls })
}

const text = (v: unknown, max = 200) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const numOrNull = (v: unknown) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return isFinite(n) && n >= 0 && n < 1e8 ? n : null
}
const dateOrNull = (v: unknown) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return new Date(v + 'T00:00:00+05:30')
}

// PATCH: save the checked bill (header and all lines). Not allowed once it is added to stock.
export async function PATCH(request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const bill = await prisma.stockBill.findUnique({ where: { id }, select: { status: true } })
  if (!bill) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (bill.status === 'added') return NextResponse.json({ error: 'already_added' }, { status: 409 })

  const b = await request.json().catch(() => ({}))
  const lines = (Array.isArray(b.lines) ? b.lines : []).slice(0, 300).map((l: any, i: number) => ({
    position: i,
    name: text(l.name, 160),
    qty: Math.max(0, Math.round(Number(l.qty) || 0)),
    unitPrice: numOrNull(l.unitPrice),
    mrp: numOrNull(l.mrp),
    gstRate: numOrNull(l.gstRate),
    hsn: text(l.hsn, 12) || null,
    amount: numOrNull(l.amount),
    category: CATEGORIES.includes(l.category) ? l.category : 'other',
    unsure: !!l.unsure,
  })).filter((l: any) => l.name)

  await prisma.$transaction([
    prisma.stockBillLine.deleteMany({ where: { billId: id } }),
    prisma.stockBill.update({
      where: { id },
      data: {
        supplierName: text(b.supplierName, 120),
        gstin: text(b.gstin, 15).toUpperCase() || null,
        billNo: text(b.billNo, 40) || null,
        billDate: dateOrNull(b.billDate),
        dueDate: dateOrNull(b.dueDate),
        total: numOrNull(b.total),
        lines: { create: lines },
      },
    }),
  ])
  return NextResponse.json({ ok: true })
}

// DELETE: throw away a wrong upload (only before it is added to stock)
export async function DELETE(_request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const bill = await prisma.stockBill.findUnique({ where: { id }, select: { status: true } })
  if (!bill) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (bill.status === 'added') return NextResponse.json({ error: 'already_added' }, { status: 409 })
  await prisma.stockBill.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
