import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
import { isAdmin, PROJECT_STATUS, sendProjectAlert } from '@/lib/projects'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const quotePrice = Math.round(Number(body.quotePrice))
  const advanceAmount = Math.round(Number(body.advanceAmount))
  const quoteNote = (body.quoteNote ? String(body.quoteNote) : '').slice(0, 500)

  if (!id || !(quotePrice > 0) || !(advanceAmount >= 0) || advanceAmount > quotePrice)
    return NextResponse.json({ error: 'Invalid quote (advance must be 0..total, total > 0).' }, { status: 400 })

  const r = await prisma.projectRequest.findUnique({ where: { id } })
  if (!r) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

  await prisma.projectRequest.update({
    where: { id },
    data: { quotePrice, advanceAmount, quoteNote: quoteNote || null, status: PROJECT_STATUS.QUOTED },
  })
  await sendProjectAlert('💬 Quote sent — ' + r.topic + ': ₹' + quotePrice + ' (advance ₹' + advanceAmount + ')')
  return NextResponse.json({ ok: true })
}