import { NextResponse } from 'next/server'
import { prisma, getMe } from '@/lib/chat'
import { cleanPhone, hashCode, sameHash, MAX_WRONG_TRIES } from '@/lib/phone-otp'

export const dynamic = 'force-dynamic'

// POST { phone, code } — checks the code. Only a correct code saves the number as verified.
export async function POST(request: Request) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'signin' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const phone = cleanPhone(body.phone)
    const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : ''
    if (!phone || code.length !== 6) return NextResponse.json({ error: 'bad_code' }, { status: 400 })

    const otp = await prisma.phoneOtp.findUnique({ where: { userId: me.id } })
    if (!otp || otp.phone !== phone) return NextResponse.json({ error: 'no_code' }, { status: 400 })
    if (otp.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: 'expired' }, { status: 400 })
    if (otp.attempts >= MAX_WRONG_TRIES) return NextResponse.json({ error: 'locked' }, { status: 429 })

    if (!sameHash(hashCode(code, me.id, phone), otp.codeHash)) {
      await prisma.phoneOtp.update({ where: { userId: me.id }, data: { attempts: { increment: 1 } } })
      const left = MAX_WRONG_TRIES - otp.attempts - 1
      return NextResponse.json({ error: 'wrong', left: Math.max(0, left) }, { status: 400 })
    }

    // Someone else may have verified this number while this code was waiting
    const taken = await prisma.user.findFirst({
      where: { phone, phoneVerifiedAt: { not: null }, NOT: { id: me.id } },
      select: { id: true },
    })
    if (taken) return NextResponse.json({ error: 'phone_taken' }, { status: 409 })

    const before = await prisma.user.findUnique({ where: { id: me.id }, select: { phoneSavedAt: true } })
    await prisma.user.update({
      where: { id: me.id },
      data: { phone, phoneVerifiedAt: new Date(), ...(before?.phoneSavedAt ? {} : { phoneSavedAt: new Date() }) },
    })
    await prisma.phoneOtp.delete({ where: { userId: me.id } }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('OTP verify error', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}