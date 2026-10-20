import { createHmac, timingSafeEqual } from 'crypto'

export const OTP_MINUTES = 10
export const MAX_WRONG_TRIES = 5
export const MAX_SENDS_PER_HOUR = 3
export const RESEND_SECONDS = 60

// 10-digit Indian mobile number from whatever the person typed (drops spaces, +91, 0 ...). '' if it is not valid.
export function cleanPhone(input: unknown): string {
  let d = typeof input === 'string' ? input.replace(/\D/g, '') : ''
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d) ? d : ''
}

function secret() {
  return process.env.OTP_SECRET || process.env.CLERK_SECRET_KEY || 'pageplus-otp'
}

// The code is never stored, only this fingerprint of it (tied to the person and the number)
export function hashCode(code: string, userId: string, phone: string): string {
  return createHmac('sha256', secret()).update(`${userId}:${phone}:${code}`).digest('hex')
}

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex')
  const y = Buffer.from(b, 'hex')
  return x.length === y.length && timingSafeEqual(x, y)
}