import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'
import { savePhoto } from '@/lib/stock'
import { readBill } from '@/lib/bill-reader'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // reading a bill can take 10-30 seconds

const MAX_PHOTOS = 4
const MAX_BYTES = 8 * 1024 * 1024

// GET: recent bills for the stock home
export async function GET() {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const bills = await prisma.stockBill.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { id: true, supplierName: true, billNo: true, billDate: true, total: true, status: true, createdAt: true },
  })
  return NextResponse.json({ bills })
}

// POST (form data, field "photos", 1-4 images): saves the photos privately, reads the bill with AI,
// and returns the bill id for the check screen. Nothing is added to stock yet.
export async function POST(request: Request) {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })

  let files: File[] = []
  try {
    const form = await request.formData()
    files = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
  } catch {
    return NextResponse.json({ error: 'no_photo' }, { status: 400 })
  }
  if (files.length === 0) return NextResponse.json({ error: 'no_photo' }, { status: 400 })
  if (files.length > MAX_PHOTOS) return NextResponse.json({ error: 'too_many_photos' }, { status: 400 })
  if (files.some(f => f.size > MAX_BYTES || !f.type.startsWith('image/'))) return NextResponse.json({ error: 'bad_photo' }, { status: 400 })

  // 1. Save the photos (private) so the bill can always be checked against the paper
  const id = randomUUID()
  const images: { mime: string; base64: string }[] = []
  const paths: string[] = []
  try {
    for (let i = 0; i < files.length; i++) {
      const bytes = new Uint8Array(await files[i].arrayBuffer())
      const path = `${new Date().toISOString().slice(0, 7)}/${id}-${i + 1}.jpg`
      await savePhoto(path, bytes, files[i].type || 'image/jpeg')
      paths.push(path)
      images.push({ mime: files[i].type || 'image/jpeg', base64: Buffer.from(bytes).toString('base64') })
    }
  } catch (e: any) {
    console.error('Bill photo save failed', e?.message)
    return NextResponse.json({ error: e?.message === 'storage_not_set' ? 'storage_not_set' : 'save_failed' }, { status: 500 })
  }

  const bill = await prisma.stockBill.create({ data: { photos: paths, uploadedBy: me.name, status: 'reading' } })

  // 2. Read it. If reading fails, the bill stays with its photos so it can be filled in by hand.
  try {
    const read = await readBill(images)
    const billDate = read.billDate ? new Date(read.billDate + 'T00:00:00+05:30') : null
    await prisma.stockBill.update({
      where: { id: bill.id },
      data: {
        status: 'check',
        supplierName: read.supplierName,
        gstin: read.gstin,
        billNo: read.billNo,
        billDate,
        dueDate: billDate ? new Date(billDate.getTime() + 30 * 86400000) : null,
        total: read.total,
        lines: { create: read.lines.map((l, i) => ({ ...l, position: i })) },
      },
    })
  } catch (e: any) {
    await prisma.stockBill.update({ where: { id: bill.id }, data: { status: 'check', readError: e?.message || 'read_failed' } })
  }
  return NextResponse.json({ ok: true, id: bill.id })
}
