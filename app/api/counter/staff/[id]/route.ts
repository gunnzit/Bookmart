import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { counterStaff, canManage, hashPin, validPin } from '@/lib/counter'

export const dynamic = 'force-dynamic'

// PATCH { pin } to reset a PIN, or { active: false } to remove someone (their past bills stay).
// Only an unlocked owner/family member can do this.
export async function PATCH(request: Request, context: any) {
  const me = await counterStaff()
  if (!canManage(me)) return NextResponse.json({ error: 'not_allowed' }, { status: 403 })
  const { id } = await context.params
  const b = await request.json().catch(() => ({}))
  const target = await prisma.staff.findUnique({ where: { id }, select: { role: true } })
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (target.role === 'owner' && me!.role !== 'owner') return NextResponse.json({ error: 'not_allowed' }, { status: 403 })

  const data: any = {}
  if (b.pin !== undefined) {
    if (!validPin(b.pin)) return NextResponse.json({ error: 'bad_pin' }, { status: 400 })
    data.pinHash = hashPin(b.pin)
  }
  if (b.active === false) {
    if (id === me!.id) return NextResponse.json({ error: 'not_self' }, { status: 400 })
    data.active = false
  }
  await prisma.staff.update({ where: { id }, data })
  return NextResponse.json({ ok: true })
}
