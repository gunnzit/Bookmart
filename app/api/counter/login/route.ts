import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'
import { checkPin, startShift } from '@/lib/counter'

export const dynamic = 'force-dynamic'

// Small in-memory brake on PIN guessing (per staff member, per server instance)
const tries = new Map<string, { n: number; until: number }>()

// POST { staffId, pin }: unlock the counter for this person
export async function POST(request: Request) {
  if (!(await stockUser())) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const b = await request.json().catch(() => ({}))
  const staffId = typeof b.staffId === 'string' ? b.staffId : ''
  const t = tries.get(staffId)
  if (t && t.until > Date.now()) return NextResponse.json({ error: 'wait' }, { status: 429 })

  const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true, pinHash: true, active: true } })
  if (!staff?.active || typeof b.pin !== 'string' || !checkPin(b.pin, staff.pinHash)) {
    const n = (t?.n || 0) + 1
    tries.set(staffId, { n: n >= 5 ? 0 : n, until: n >= 5 ? Date.now() + 60000 : 0 })
    return NextResponse.json({ error: 'wrong_pin' }, { status: 400 })
  }
  tries.delete(staffId)
  await startShift(staff.id)
  return NextResponse.json({ ok: true })
}
