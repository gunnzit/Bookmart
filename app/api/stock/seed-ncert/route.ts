import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser, nameKey } from '@/lib/stock'
import { schools, BINDING_CHARGE } from '@/lib/kit-prices'

export const dynamic = 'force-dynamic'

// POST: put every NCERT book from the school set lists into the stock list (count 0), so they only
// need counting. NCERT books stay the same from year to year. Items already there are left as they are.
// Set-list NCERT prices include the binding charge; the stock MRP is the printed price without it.
export async function POST() {
  const me = await stockUser()
  if (!me) return NextResponse.json({ error: 'no_access' }, { status: 403 })

  const seen = new Map<string, { name: string; mrp: number; className: number }>()
  for (const kits of Object.values(schools)) {
    for (const [cls, kit] of Object.entries(kits)) {
      for (const it of kit.ncert) {
        const key = nameKey(it.name)
        if (!seen.has(key)) seen.set(key, { name: it.name, mrp: Math.max(0, it.price - BINDING_CHARGE), className: Number(cls) })
      }
    }
  }
  const made = await prisma.stockItem.createMany({
    data: [...seen.entries()].map(([key, v]) => ({ name: v.name, nameKey: key, category: 'book', ncert: true, className: v.className, publisher: 'NCERT', mrp: v.mrp, gstRate: 0, hsn: '4901', qty: 0 })),
    skipDuplicates: true,
  })
  return NextResponse.json({ ok: true, added: made.count, total: seen.size })
}
