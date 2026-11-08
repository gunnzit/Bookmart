import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// GET: all suppliers with what is still owed to each (most owed first)
export async function GET() {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const [suppliers, billed, paid] = await Promise.all([
    prisma.supplier.findMany({ select: { id: true, name: true } }),
    prisma.stockBill.groupBy({ by: ['supplierId'], where: { status: 'added' }, _sum: { total: true } }),
    prisma.supplierPayment.groupBy({ by: ['supplierId'], _sum: { amount: true } }),
  ])
  const b = new Map(billed.map(r => [r.supplierId, r._sum.total || 0]))
  const p = new Map(paid.map(r => [r.supplierId, r._sum.amount || 0]))
  const list = suppliers
    .map(s => ({ ...s, owed: Math.round((b.get(s.id) || 0) - (p.get(s.id) || 0)) }))
    .sort((x, y) => y.owed - x.owed)
  return NextResponse.json({ suppliers: list })
}
