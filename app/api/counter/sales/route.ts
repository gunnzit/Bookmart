import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/chat'
import { nameKey } from '@/lib/stock'
import { counterStaff, canManage, setLines } from '@/lib/counter'

export const dynamic = 'force-dynamic'

type In =
  | { kind: 'set'; name: string; qty: number }
  | { kind: 'item'; itemId: string; qty: number; price?: number }
  | { kind: 'custom'; name: string; qty: number; price: number }

const qtyOk = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 500
const money = (n: number) => Math.round(n * 100) / 100

// POST: bill a sale at the counter. Prices for school-set items come from the kit price list and
// for stock items from their MRP (never trusted from the phone). Stock comes off; anything not in
// the shop is kept as "to hand over later". Returns the invoice link.
export async function POST(request: Request) {
  const me = await counterStaff()
  if (!me) return NextResponse.json({ error: 'locked' }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  const input: In[] = Array.isArray(b.lines) ? b.lines.slice(0, 200) : []
  if (input.length === 0) return NextResponse.json({ error: 'empty' }, { status: 400 })
  if (!['cash', 'upi'].includes(b.payMode)) return NextResponse.json({ error: 'bad_pay' }, { status: 400 })

  const school = typeof b.school === 'string' ? b.school : null
  const cls = Number.isInteger(b.className) ? b.className : null
  const kit = school && cls ? setLines(school, cls) : null

  // 1. Resolve every line to a name, a trusted price and (if any) a stock item
  type Line = { name: string; qty: number; unitPrice: number; fromSet: boolean; itemId: string | null; gstRate: number | null; hsn: string | null }
  const lines: Line[] = []
  for (const l of input) {
    if (!qtyOk(l.qty)) return NextResponse.json({ error: 'bad_qty' }, { status: 400 })
    if (l.kind === 'set') {
      const k = kit?.find(x => x.name === l.name)
      if (!k) return NextResponse.json({ error: 'bad_item', name: l.name }, { status: 400 })
      const item = await prisma.stockItem.findUnique({ where: { nameKey: nameKey(k.name) }, select: { id: true, gstRate: true, hsn: true } })
      const isBook = k.group === 'NCERT' || k.group === 'Books'
      lines.push({ name: k.name, qty: l.qty, unitPrice: k.unitPrice, fromSet: true, itemId: item?.id || null, gstRate: item?.gstRate ?? (isBook ? 0 : null), hsn: item?.hsn ?? (isBook ? '4901' : null) })
    } else if (l.kind === 'item') {
      const item = await prisma.stockItem.findUnique({ where: { id: l.itemId }, select: { id: true, name: true, mrp: true, gstRate: true, hsn: true } })
      if (!item) return NextResponse.json({ error: 'bad_item' }, { status: 400 })
      const price = item.mrp ?? (Number(l.price) > 0 ? Number(l.price) : null)
      if (price == null) return NextResponse.json({ error: 'need_price', name: item.name }, { status: 400 })
      lines.push({ name: item.name, qty: l.qty, unitPrice: price, fromSet: false, itemId: item.id, gstRate: item.gstRate, hsn: item.hsn })
    } else if (l.kind === 'custom') {
      const name = typeof l.name === 'string' ? l.name.replace(/\s+/g, ' ').trim().slice(0, 120) : ''
      const price = Number(l.price)
      if (!name || !(price > 0 && price < 1e6)) return NextResponse.json({ error: 'bad_item' }, { status: 400 })
      lines.push({ name, qty: l.qty, unitPrice: price, fromSet: false, itemId: null, gstRate: null, hsn: null })
    } else return NextResponse.json({ error: 'bad_item' }, { status: 400 })
  }

  // 2. Totals. Prices include GST; the discount is spread across lines for the tax breakup.
  const subtotal = money(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0))
  const discount = Math.min(subtotal, Math.max(0, money(Number(b.discount) || 0)))
  const total = money(subtotal - discount)
  const factor = subtotal > 0 ? total / subtotal : 1
  let taxable = 0, gst = 0
  for (const l of lines) {
    const amt = l.unitPrice * l.qty * factor
    const r = l.gstRate ?? 0
    const t = amt / (1 + r / 100)
    taxable += t
    gst += amt - t
  }

  const phone = typeof b.customerPhone === 'string' ? b.customerPhone.replace(/\D/g, '').slice(-10) : ''
  const custName = typeof b.customerName === 'string' ? b.customerName.trim().slice(0, 60) : ''
  const token = randomBytes(12).toString('base64url')

  // 3. Save the sale and take stock off (what is not in the shop becomes "to hand over later")
  const sale = await prisma.$transaction(async tx => {
    const pending: number[] = []
    for (const l of lines) {
      let left = l.qty
      if (l.itemId) {
        for (let attempt = 0; attempt < 2 && left > 0; attempt++) {
          const cur = await tx.stockItem.findUnique({ where: { id: l.itemId }, select: { qty: true } })
          const take = Math.min(left, Math.max(0, cur?.qty || 0))
          if (take === 0) break
          const done = await tx.stockItem.updateMany({ where: { id: l.itemId, qty: { gte: take } }, data: { qty: { decrement: take } } })
          if (done.count === 1) {
            await tx.stockMove.create({ data: { itemId: l.itemId, change: -take, reason: 'sold', note: 'Counter sale', by: me.name } })
            left -= take
          }
        }
        pending.push(left) // tracked item: whatever could not come off stock is owed to the customer
      } else pending.push(0) // not in the stock register: sold without tracking
    }
    return tx.counterSale.create({
      data: {
        token, staffId: me.id, customerName: custName || null, customerPhone: phone.length === 10 ? phone : null,
        school: kit ? school : null, className: kit ? cls : null,
        subtotal, discount, total, taxable: money(taxable), gst: money(gst), payMode: b.payMode,
        lines: { create: lines.map((l, i) => ({ position: i, name: l.name, qty: l.qty, unitPrice: l.unitPrice, amount: money(l.unitPrice * l.qty), hsn: l.hsn, gstRate: l.gstRate, fromSet: l.fromSet, itemId: l.itemId, pendingQty: pending[i] })) },
      },
      select: { id: true, invoiceNo: true, token: true, total: true, lines: { where: { pendingQty: { gt: 0 } }, select: { name: true, pendingQty: true } } },
    })
  }, { timeout: 30000, maxWait: 10000 })

  return NextResponse.json({ ok: true, sale })
}

// GET: today's bills (newest first) with totals by cash/UPI. Owner/family see everyone's;
// helpers see only their own.
export async function GET() {
  const me = await counterStaff()
  if (!me) return NextResponse.json({ error: 'locked' }, { status: 401 })
  const start = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) + 'T00:00:00+05:30')
  const sales = await prisma.counterSale.findMany({
    where: { createdAt: { gte: start }, ...(canManage(me) ? {} : { staffId: me.id }) },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, invoiceNo: true, token: true, total: true, payMode: true, status: true, createdAt: true, customerName: true, school: true, className: true, staff: { select: { name: true } } },
  })
  const paid = sales.filter(s => s.status === 'paid')
  return NextResponse.json({
    sales,
    totals: {
      count: paid.length,
      cash: money(paid.filter(s => s.payMode === 'cash').reduce((a, s) => a + s.total, 0)),
      upi: money(paid.filter(s => s.payMode === 'upi').reduce((a, s) => a + s.total, 0)),
    },
  })
}
