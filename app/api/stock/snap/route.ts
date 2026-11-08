import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser, nameKey } from '@/lib/stock'
import { readItem } from '@/lib/bill-reader'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

// POST (form data "photos", 1-3 images of one item): the AI reads name, MRP, class, barcode, and we
// look for the same item already in the stock list (barcode first, then name). Nothing is saved here.
export async function POST(request: Request) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  let files: File[] = []
  try {
    files = (await request.formData()).getAll('photos').filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3)
  } catch {}
  if (files.length === 0) return NextResponse.json({ error: 'no_photo' }, { status: 400 })
  if (files.some(f => f.size > 8 * 1024 * 1024 || !f.type.startsWith('image/'))) return NextResponse.json({ error: 'bad_photo' }, { status: 400 })

  let read
  try {
    read = await readItem(await Promise.all(files.map(async f => ({ mime: f.type || 'image/jpeg', base64: Buffer.from(await f.arrayBuffer()).toString('base64') }))))
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'read_failed' }, { status: 502 })
  }

  const select = { id: true, name: true, mrp: true, qty: true, category: true, barcode: true, countedAt: true }
  const match =
    (read.barcode && (await prisma.stockItem.findUnique({ where: { barcode: read.barcode }, select }))) ||
    (read.name && (await prisma.stockItem.findUnique({ where: { nameKey: nameKey(read.name) }, select }))) ||
    null
  const words = read.name.split(/\s+/).filter(w => w.length > 2).slice(0, 3)
  const similar = match || words.length === 0 ? [] : await prisma.stockItem.findMany({
    where: { AND: words.map(w => ({ name: { contains: w, mode: 'insensitive' as const } })) },
    take: 5,
    select,
  })
  return NextResponse.json({ read, match, similar })
}
