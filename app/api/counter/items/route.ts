import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { counterStaff } from '@/lib/counter'

export const dynamic = 'force-dynamic'

// GET ?q= : loose items from the stock register (name, MRP, how many left)
export async function GET(request: Request) {
  if (!(await counterStaff())) return NextResponse.json({ error: 'locked' }, { status: 401 })
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 60)
  const items = await prisma.stockItem.findMany({
    where: q ? { AND: q.split(/\s+/).map(w => ({ name: { contains: w, mode: 'insensitive' as const } })) } : {},
    orderBy: { name: 'asc' },
    take: 40,
    select: { id: true, name: true, mrp: true, qty: true },
  })
  return NextResponse.json({ items })
}
