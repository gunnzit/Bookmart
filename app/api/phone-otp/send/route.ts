import { NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { prisma, getMe } from '@/lib/chat'
import { sendWhatsApp, sendWhatsAppOtp } from '@/lib/whatsapp'
import { cleanPhone, hashCode, OTP_MINUTES, MAX_SENDS_PER_HOUR, RESEND_SECONDS } from '@/lib/phone-otp'

export const dynamic = 'force-dynamic'

// POST { phone } — sends a 6-digit code to that WhatsApp number for the signed-in person
export async function POST(request: Request) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'signin' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const phone = cleanPhone(body.phone)
    if (!phone) return NextResponse.json({ error: 'bad_number' }, { status: 400 })

    // One number, one account
    const taken = await prisma.user.findFirst({
      where: { phone, phoneVerifiedAt: { not: null }, NOT: { id: me.id } },
      select: { id: true },
    })
    if (taken) return NextResponse.json({ error: 'phone_taken' }, { status: 409 })

    // Limits: one code per minute, three per hour
    const now = Date.now()
    const old = await prisma.phoneOtp.findUnique({ where: { userId: me.id } })
    let sentCount = 1
    let windowStart = new Date(now)
    if (old) {
      const wait = RESEND_SECONDS * 1000 - (now - old.lastSentAt.getTime())
      if (wait > 0) return NextResponse.json({ error: 'wait', seconds: Math.ceil(wait / 1000) }, { status: 429 })
      if (now - old.windowStart.getTime() < 3600 * 1000) {
        if (old.sentCount >= MAX_SENDS_PER_HOUR) return NextResponse.json({ error: 'too_many' }, { status: 429 })
        sentCount = old.sentCount + 1
        windowStart = old.windowStart
      }
    }

    const code = String(randomInt(100000, 1000000))
    const data = {
      phone,
      codeHash: hashCode(code, me.id, phone),
      expiresAt: new Date(now + OTP_MINUTES * 60 * 1000),
      attempts: 0,
      sentCount,
      windowStart,
      lastSentAt: new Date(now),
    }
    await prisma.phoneOtp.upsert({ where: { userId: me.id }, create: { userId: me.id, ...data }, update: data })

    const template = process.env.META_OTP_TEMPLATE
    const lang = process.env.META_OTP_TEMPLATE_LANG || process.env.META_LISTING_TEMPLATE_LANG || 'en'
    const ok = template
      ? await sendWhatsAppOtp(phone, template, lang, code)
      : await sendWhatsApp(phone, `${code} is your Pageplus verification code. It expires in ${OTP_MINUTES} minutes. Do not share it with anyone.`)
    if (!ok) return NextResponse.json({ error: 'send_failed' }, { status: 502 })

    return NextResponse.json({ ok: true, resendIn: RESEND_SECONDS })
  } catch (error) {
    console.error('OTP send error', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}