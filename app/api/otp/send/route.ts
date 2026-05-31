import { NextRequest, NextResponse } from 'next/server'

const otpStore = new Map<string, { otp: string; expires: number }>()

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone || phone.length < 10) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 })

  const cleaned = phone.replace(/\D/g, '')
  const e164 = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  otpStore.set(e164, { otp, expires: Date.now() + 10 * 60 * 1000 }) // 10 min expiry

  await fetch(`https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: e164,
      type: 'text',
      text: { body: `Your BuddyBooks verification code is: *${otp}*\n\nValid for 10 minutes. Do not share this with anyone.` },
    }),
  })

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')
  const otp = searchParams.get('otp')
  if (!phone || !otp) return NextResponse.json({ valid: false })

  const cleaned = phone.replace(/\D/g, '')
  const e164 = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  const record = otpStore.get(e164)

  if (!record) return NextResponse.json({ valid: false, reason: 'No OTP sent' })
  if (Date.now() > record.expires) { otpStore.delete(e164); return NextResponse.json({ valid: false, reason: 'Expired' }) }
  if (record.otp !== otp) return NextResponse.json({ valid: false, reason: 'Wrong OTP' })

  otpStore.delete(e164)
  return NextResponse.json({ valid: true })
}