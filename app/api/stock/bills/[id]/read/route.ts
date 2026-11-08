import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser, loadPhoto } from '@/lib/stock'
import { readAndStore } from '@/lib/stock-read'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// POST: "Read again": read the saved photos once more (for when the first read failed or was poor).
// Replaces the bill's lines; not allowed once the bill is added to stock.
export async function POST(_request: Request, context: any) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const { id } = await context.params
  const bill = await prisma.stockBill.findUnique({ where: { id }, select: { status: true, photos: true } })
  if (!bill) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (bill.status === 'added') return NextResponse.json({ error: 'already_added' }, { status: 409 })
  if (bill.photos.length === 0) return NextResponse.json({ error: 'no_photo' }, { status: 400 })

  let images
  try {
    images = await Promise.all(bill.photos.map(loadPhoto))
  } catch {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }
  const r = await readAndStore(id, images)
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 502 })
}
