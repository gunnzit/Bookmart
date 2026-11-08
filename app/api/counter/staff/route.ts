import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'
import { counterStaff, canManage, hashPin, validPin } from '@/lib/counter'

export const dynamic = 'force-dynamic'

// GET: the "Who's billing?" list (names only) on a shop device
export async function GET() {
  if (!(await stockUser())) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const staff = await prisma.staff.findMany({ where: { active: true }, orderBy: [{ role: 'asc' }, { name: 'asc' }], select: { id: true, name: true, role: true } })
  const me = await counterStaff()
  return NextResponse.json({ staff, me })
}

// POST { name, pin, role }: add a person. The very first person can be added by the signed-in
// owner/parent (to set the counter up); after that only an owner/family member who is unlocked can add.
export async function POST(request: Request) {
  const user = await stockUser()
  if (!user) return NextResponse.json({ error: 'no_access' }, { status: 403 })
  const count = await prisma.staff.count()
  const me = await counterStaff()
  if (count > 0 && !canManage(me)) return NextResponse.json({ error: 'not_allowed' }, { status: 403 })

  const b = await request.json().catch(() => ({}))
  const name = typeof b.name === 'string' ? b.name.replace(/\s+/g, ' ').trim().slice(0, 40) : ''
  if (name.length < 2) return NextResponse.json({ error: 'bad_name' }, { status: 400 })
  if (!validPin(b.pin)) return NextResponse.json({ error: 'bad_pin' }, { status: 400 })
  const role = count === 0 ? (user.isOwner ? 'owner' : 'family') : b.role === 'family' ? 'family' : 'helper'
  const staff = await prisma.staff.create({ data: { name, role, pinHash: hashPin(b.pin) }, select: { id: true, name: true, role: true } })
  return NextResponse.json({ ok: true, staff })
}
