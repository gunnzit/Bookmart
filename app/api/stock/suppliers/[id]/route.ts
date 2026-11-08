import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser, supplierBalance } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// GET: a supplier's khata: balance, plus bills and payments in date order (newest first)
export async function GET(_request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const [bills, payments, balance] = await Promise.all([
    prisma.stockBill.findMany({ where: { supplierId: id, status: 'added' }, select: { id: true, billNo: true, billDate: true, dueDate: true, total: true, createdAt: true, _count: { select: { lines: true } } } }),
    prisma.supplierPayment.findMany({ where: { supplierId: id }, select: { id: true, amount: true, mode: true, note: true, paidAt: true, by: true } }),
    supplierBalance(id),
  ])

  const entries = [
    ...bills.map(b => ({ kind: 'bill' as const, id: b.id, date: b.billDate || b.createdAt, amount: b.total || 0, label: b.billNo ? `Bill ${b.billNo}` : 'Bill', sub: `${b._count.lines} items` })),
    ...payments.map(p => ({ kind: 'payment' as const, id: p.id, date: p.paidAt, amount: p.amount, label: p.mode.toUpperCase(), sub: [p.note, p.by].filter(Boolean).join(' · ') })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date))

  // the oldest unpaid bill's due date is the next "pay by"
  const nextDue = balance.owed > 0 ? bills.filter(b => b.dueDate).map(b => b.dueDate!).sort((a, b) => +a - +b)[0] || null : null
  return NextResponse.json({ supplier, balance, nextDue, entries })
}
