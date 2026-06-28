import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
import { PROJECT_STATUS, advancePaise, balancePaise, createRazorpayOrder, razorpayKeyId } from '@/lib/projects'

// Student triggers a payment. The AMOUNT is computed here from the quote we
// stored — never taken from the request body. Ownership is enforced.
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const phase = String(body.phase || '') // 'advance' | 'balance'

  const r = await prisma.projectRequest.findUnique({ where: { id } })
  if (!r || r.userId !== userId) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  if (r.quotePrice == null || r.advanceAmount == null)
    return NextResponse.json({ error: 'No quote on this request yet.' }, { status: 400 })

  let amountPaise = 0
  if (phase === 'advance') {
    if (r.status !== PROJECT_STATUS.QUOTED)
      return NextResponse.json({ error: 'Advance is not payable right now.' }, { status: 400 })
    amountPaise = advancePaise(r.advanceAmount)
  } else if (phase === 'balance') {
    if (r.status !== PROJECT_STATUS.READY)
      return NextResponse.json({ error: 'Balance is payable once your project is ready.' }, { status: 400 })
    amountPaise = balancePaise(r.quotePrice, r.advanceAmount)
  } else {
    return NextResponse.json({ error: 'Invalid payment phase.' }, { status: 400 })
  }

  if (amountPaise <= 0) return NextResponse.json({ error: 'Nothing to pay.' }, { status: 400 })

  const order = await createRazorpayOrder(amountPaise, 'proj_' + phase + '_' + id, { projectId: id, phase })
  await prisma.projectRequest.update({
    where: { id },
    data: phase === 'advance' ? { advanceOrderId: order.id } : { balanceOrderId: order.id },
  })

  return NextResponse.json({ orderId: order.id, amount: amountPaise, keyId: razorpayKeyId(), name: r.buyerName, topic: r.topic })
}