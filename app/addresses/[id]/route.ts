import { NextResponse } from 'next/server'
import { prisma, getMe } from '@/lib/chat'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getMe()
  if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const { id } = await params
  // userId in the filter means nobody can delete someone else's address
  await prisma.savedAddress.deleteMany({ where: { id, userId: me.id } })
  return NextResponse.json({ ok: true })
}