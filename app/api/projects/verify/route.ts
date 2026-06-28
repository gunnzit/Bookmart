import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
import { PROJECT_STATUS, advancePaise, balancePaise, verifyRazorpaySignature, sendProjectAlert } from '@/lib/projects'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const phase = String(body.phase || '')
  const orderId = String(body.razorpay_order_id || '')
  const paymentId = String(body.razorpay_payment_id || '')
  const signature = String(body.razorpay_signature || '')

  const r = await prisma.projectRequest.findUnique({ where: { id } })
  if (!r || r.userId !== userId) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  if (r.quotePrice == null || r.advanceAmount == null)
    return NextResponse.json({ error: 'No quote on this request.' }, { status: 400 })

  if (!verifyRazorpaySignature(orderId, paymentId, signature))
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })

  if (phase === 'advance') {
    if (r.advanceOrderId !== orderId)
      return NextResponse.json({ error: 'Order mismatch.' }, { status: 400 })
    await prisma.projectRequest.update({
      where: { id },
      data: {
        advancePaidPaise: advancePaise(r.advanceAmount),
        advancePaymentId: paymentId,
        status: PROJECT_STATUS.IN_PROGRESS,
      },
    })
    await sendProjectAlert('✅ Advance paid — ' + r.topic + ' (₹' + r.advanceAmount + '). Start building!')
  } else if (phase === 'balance') {
    if (r.balanceOrderId !== orderId)
      return NextResponse.json({ error: 'Order mismatch.' }, { status: 400 })
    await prisma.projectRequest.update({
      where: { id },
      data: {
        balancePaidPaise: balancePaise(r.quotePrice, r.advanceAmount),
        balancePaymentId: paymentId,
        status: PROJECT_STATUS.DELIVERED,
      },
    })
    await sendProjectAlert('✅ Balance paid — ' + r.topic + '. Fully paid.')
  } else {
    return NextResponse.json({ error: 'Invalid phase.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}