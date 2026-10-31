import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/chat'
import { cleanPhone, hashCode, sameHash, MAX_WRONG_TRIES } from '@/lib/phone-otp'
import { accountForPhone } from '@/lib/whatsapp-login'

export const dynamic = 'force-dynamic'

// POST { phone, code } — checks a "Continue with WhatsApp" code. A correct code returns a one-time
// Clerk sign-in pass (valid for two minutes) that the sign-in page uses to sign the person in.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const phone = cleanPhone(body.phone)
    const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : ''
    if (!phone || code.length !== 6) return NextResponse.json({ error: 'bad_code' }, { status: 400 })

    const otp = await prisma.loginOtp.findUnique({ where: { phone } })
    if (!otp) return NextResponse.json({ error: 'no_code' }, { status: 400 })
    if (otp.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: 'expired' }, { status: 400 })
    if (otp.attempts >= MAX_WRONG_TRIES) return NextResponse.json({ error: 'locked' }, { status: 429 })

    if (!sameHash(hashCode(code, 'login', phone), otp.codeHash)) {
      await prisma.loginOtp.update({ where: { phone }, data: { attempts: { increment: 1 } } })
      const left = MAX_WRONG_TRIES - otp.attempts - 1
      return NextResponse.json({ error: 'wrong', left: Math.max(0, left) }, { status: 400 })
    }

    // A code works once. Keep the row (it holds the resend limits) but make the code useless.
    await prisma.loginOtp.update({ where: { phone }, data: { codeHash: '', expiresAt: new Date(0) } })

    // The number could have been moved or un-verified while the code was waiting
    const account = await accountForPhone(phone)
    if (!account) return NextResponse.json({ error: 'no_account' }, { status: 404 })

    const client = await clerkClient()
    const token = await client.signInTokens.createSignInToken({ userId: account, expiresInSeconds: 120 })
    return NextResponse.json({ ok: true, ticket: token.token })
  } catch (error) {
    console.error('WhatsApp sign-in verify error', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
