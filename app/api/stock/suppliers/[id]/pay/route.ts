import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser, PAY_MODES } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// POST { amount, mode, note }: record a payment made to a supplier (part payments are fine)
export async function POST(request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const b = await request.json().catch(() => ({}))
  const amount = Math.round(Number(b.amount) * 100) / 100
  if (!(amount > 0 && amount < 1e8)) return NextResponse.json({ error: 'bad_amount' }, { status: 400 })
  if (!PAY_MODES.includes(b.mode)) return NextResponse.json({ error: 'bad_mode' }, { status: 400 })
  const supplier = await prisma.supplier.findUnique({ where: { id }, select: { id: true } })
  if (!supplier) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await prisma.supplierPayment.create({
    data: { supplierId: id, amount, mode: b.mode, note: typeof b.note === 'string' ? b.note.trim().slice(0, 120) || null : null, by: me.name },
  })
  return NextResponse.json({ ok: true })
}
