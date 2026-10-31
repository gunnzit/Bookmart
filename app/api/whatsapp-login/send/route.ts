import { NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { prisma } from '@/lib/chat'
import { sendWhatsAppOtp } from '@/lib/whatsapp'
import { cleanPhone, hashCode, OTP_MINUTES, MAX_SENDS_PER_HOUR, RESEND_SECONDS } from '@/lib/phone-otp'
import { accountForPhone, clientIp, allowIp } from '@/lib/whatsapp-login'

export const dynamic = 'force-dynamic'

// POST { phone } — "Continue with WhatsApp": sends a sign-in code to that number, if it belongs to an account.
// The answer is the same either way, so nobody can use this to find out whose number is registered.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const phone = cleanPhone(body.phone)
    if (!phone) return NextResponse.json({ error: 'bad_number' }, { status: 400 })

    // Limits: one code per minute and three per hour for each number, ten per hour for each connection
    const now = Date.now()
    const old = await prisma.loginOtp.findUnique({ where: { phone } })
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
    if (!(await allowIp(clientIp(request)))) return NextResponse.json({ error: 'too_many' }, { status: 429 })

    const done = NextResponse.json({ ok: true, resendIn: RESEND_SECONDS })
    const account = await accountForPhone(phone)
    const code = String(randomInt(100000, 1000000))
    const data = {
      // No account: an empty fingerprint that no code can match, so the resend limits still look the same
      codeHash: account ? hashCode(code, 'login', phone) : '',
      expiresAt: new Date(now + OTP_MINUTES * 60 * 1000),
      attempts: 0,
      sentCount,
      windowStart,
      lastSentAt: new Date(now),
    }
    await prisma.loginOtp.upsert({ where: { phone }, create: { phone, ...data }, update: data })
    if (!account) return done

    const template = process.env.META_OTP_TEMPLATE
    const lang = process.env.META_OTP_TEMPLATE_LANG || process.env.META_LISTING_TEMPLATE_LANG || 'en'
    if (!template) {
      console.error('WhatsApp sign-in code not sent: META_OTP_TEMPLATE is not set')
      return NextResponse.json({ error: 'send_failed' }, { status: 502 })
    }
    const ok = await sendWhatsAppOtp(phone, template, lang, code)
    if (!ok) return NextResponse.json({ error: 'send_failed' }, { status: 502 })
    return done
  } catch (error) {
    console.error('WhatsApp sign-in send error', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
