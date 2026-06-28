import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
import { isAdmin, ADMIN_SETTABLE_STATUSES, PROJECT_STATUS, balancePaise, sendProjectAlert } from '@/lib/projects'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const status = String(body.status || '')
  const markBalancePaidCash = !!body.markBalancePaidCash
  if (!id || !ADMIN_SETTABLE_STATUSES.includes(status))
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })

  const r = await prisma.projectRequest.findUnique({ where: { id } })
  if (!r) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

  const data: Record<string, unknown> = { status }
  if (markBalancePaidCash && status === PROJECT_STATUS.DELIVERED && r.quotePrice != null && r.advanceAmount != null) {
    data.balancePaidPaise = balancePaise(r.quotePrice, r.advanceAmount)
  }
  await prisma.projectRequest.update({ where: { id }, data })
  await sendProjectAlert('📦 ' + r.topic + ' → ' + status + (markBalancePaidCash ? ' (balance paid cash)' : ''))
  return NextResponse.json({ ok: true })
}