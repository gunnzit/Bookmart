import { NextResponse } from 'next/server'
import { prisma, getMe } from '@/lib/chat'

type Ctx = { params: Promise<{ id: string }> }

async function loadMine(id: string, meId: string) {
  const r = await prisma.bookRequest.findUnique({ where: { id }, select: { id: true, userId: true } })
  return r && r.userId === meId ? r : null
}

// PATCH: mark my request as found. Body: { action: 'found' }
export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const { id } = await ctx.params
    if (!(await loadMine(id, me.id))) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    if (body.action !== 'found') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

    await prisma.bookRequest.update({ where: { id }, data: { status: 'found' } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE: remove my request
export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const { id } = await ctx.params
    if (!(await loadMine(id, me.id))) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    await prisma.bookRequest.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}