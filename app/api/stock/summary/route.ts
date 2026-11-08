import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// GET: the numbers on the stock home: items in stock, stock value, running low, owed to suppliers
export async function GET() {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })

  try {
    return await summary(me)
  } catch (e: any) {
    // P2021: the stock tables have not been created in the database yet
    if (e?.code === 'P2021') return NextResponse.json({ error: 'not_set_up' }, { status: 503 })
    throw e
  }
}

async function summary(me: { name: string; isOwner: boolean }) {
  const now = new Date()
  const week = new Date(now.getTime() + 7 * 86400000)
  const [items, billed, paid, dueSoon, recent, low] = await Promise.all([
    prisma.stockItem.findMany({ select: { qty: true, costPrice: true, mrp: true, lowAt: true } }),
    prisma.stockBill.aggregate({ where: { status: 'added' }, _sum: { total: true } }),
    prisma.supplierPayment.aggregate({ _sum: { amount: true } }),
    prisma.stockBill.count({ where: { status: 'added', dueDate: { lte: week } } }),
    prisma.stockBill.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, supplierName: true, billNo: true, total: true, status: true, createdAt: true } }),
    prisma.stockItem.count({ where: { qty: { lte: 5 } } }),
  ])

  const units = items.reduce((s, i) => s + Math.max(0, i.qty), 0)
  const value = items.reduce((s, i) => s + Math.max(0, i.qty) * (i.costPrice ?? i.mrp ?? 0), 0)
  return NextResponse.json({
    me: { name: me.name, isOwner: me.isOwner },
    units,
    value: Math.round(value),
    low,
    owed: Math.round((billed._sum.total || 0) - (paid._sum.amount || 0)),
    dueSoon,
    recent,
  })
}
