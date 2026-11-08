import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { counterStaff, schoolList, setLines } from '@/lib/counter'
import { nameKey } from '@/lib/stock'

export const dynamic = 'force-dynamic'

// GET: schools and classes. GET ?school=&class= : that class's full set, with how many of each
// item are in the shop (null = this item is not in the stock register yet).
export async function GET(request: Request) {
  if (!(await counterStaff())) return NextResponse.json({ error: 'locked' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const school = searchParams.get('school')
  const cls = Number(searchParams.get('class'))
  if (!school) return NextResponse.json({ schools: schoolList() })

  const lines = setLines(school, cls)
  if (!lines) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const items = await prisma.stockItem.findMany({ where: { nameKey: { in: lines.map(l => nameKey(l.name)) } }, select: { nameKey: true, qty: true } })
  const stock = new Map(items.map(i => [i.nameKey, i.qty]))
  return NextResponse.json({ lines: lines.map(l => ({ ...l, inStock: stock.has(nameKey(l.name)) ? stock.get(nameKey(l.name)) : null })) })
}
