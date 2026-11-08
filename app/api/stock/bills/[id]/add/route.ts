import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser, nameKey } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// POST: add a checked bill to stock. Each line raises the matching item's quantity (a new item is
// created when there is no match), records a StockMove, and the bill is linked to its supplier so
// it shows in the supplier khata. Runs once: a bill already added is refused.
export async function POST(_request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params

  const bill = await prisma.stockBill.findUnique({ where: { id }, include: { lines: { orderBy: { position: 'asc' } } } })
  if (!bill) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (bill.status === 'added') return NextResponse.json({ error: 'already_added' }, { status: 409 })
  if (!bill.supplierName.trim()) return NextResponse.json({ error: 'need_supplier' }, { status: 400 })
  const lines = bill.lines.filter(l => l.name.trim() && l.qty > 0)
  if (lines.length === 0) return NextResponse.json({ error: 'no_lines' }, { status: 400 })

  const total = bill.total ?? Math.round(lines.reduce((s, l) => s + (l.amount ?? (l.unitPrice ?? 0) * l.qty), 0) * 100) / 100

  await prisma.$transaction(async tx => {
    // claim the bill first, so two taps can never add it twice
    const claimed = await tx.stockBill.updateMany({ where: { id, status: { not: 'added' } }, data: { status: 'added', addedAt: new Date(), total } })
    if (claimed.count === 0) throw new Error('already_added')

    const sKey = nameKey(bill.supplierName)
    const supplier = await tx.supplier.upsert({
      where: { nameKey: sKey },
      create: { name: bill.supplierName.trim(), nameKey: sKey, gstin: bill.gstin },
      update: bill.gstin ? { gstin: bill.gstin } : {},
    })
    await tx.stockBill.update({ where: { id }, data: { supplierId: supplier.id } })

    for (const l of lines) {
      const key = nameKey(l.name)
      const qty = Math.round(l.qty)
      const item = await tx.stockItem.upsert({
        where: { nameKey: key },
        create: { name: l.name.trim(), nameKey: key, category: l.category, hsn: l.hsn, gstRate: l.gstRate, mrp: l.mrp, costPrice: l.unitPrice, qty },
        update: {
          qty: { increment: qty },
          ...(l.mrp != null ? { mrp: l.mrp } : {}),
          ...(l.unitPrice != null ? { costPrice: l.unitPrice } : {}),
          ...(l.hsn ? { hsn: l.hsn } : {}),
          ...(l.gstRate != null ? { gstRate: l.gstRate } : {}),
        },
      })
      await tx.stockBillLine.update({ where: { id: l.id }, data: { itemId: item.id } })
      await tx.stockMove.create({ data: { itemId: item.id, change: qty, reason: 'bill', billId: id, by: me.name } })
    }
  }, { timeout: 30000, maxWait: 10000 }).catch(e => {
    if (e?.message === 'already_added') return 'already_added'
    throw e
  })

  const after = await prisma.stockBill.findUnique({ where: { id }, select: { status: true } })
  if (after?.status !== 'added') return NextResponse.json({ error: 'failed' }, { status: 500 })
  return NextResponse.json({ ok: true, items: lines.length })
}
