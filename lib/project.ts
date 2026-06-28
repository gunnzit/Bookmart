import crypto from 'crypto'
 
export const PROJECT_STATUS = {
  QUOTE_REQUESTED: 'quote_requested', // student submitted, awaiting your quote
  QUOTED: 'quoted',                   // you sent a price, awaiting advance payment
  IN_PROGRESS: 'in_progress',         // advance paid, you are building
  READY: 'ready',                     // done, awaiting balance + handover
  DELIVERED: 'delivered',             // balance paid + handed over
  CANCELLED: 'cancelled',
} as const
 
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS]
 
// Statuses an admin may set directly via /api/projects/status
export const ADMIN_SETTABLE_STATUSES: string[] = [
  PROJECT_STATUS.IN_PROGRESS,
  PROJECT_STATUS.READY,
  PROJECT_STATUS.DELIVERED,
  PROJECT_STATUS.CANCELLED,
]
 
export const PROJECT_CATEGORIES: string[] = [
  'Working model',
  'Static model',
  'Chart / poster',
  'Project file / report',
  'Display board',
  'Other',
]
 
// Comma-separated Clerk user IDs in the ADMIN_USER_IDS env var.
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false
  const ids = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return ids.includes(userId)
}
 
// ── Money (everything in paise on the wire to Razorpay) ───────────────────
export function balanceRupees(quotePrice: number, advanceAmount: number): number {
  return Math.max(0, Math.round(quotePrice) - Math.round(advanceAmount))
}
export function advancePaise(advanceAmount: number): number {
  return Math.max(0, Math.round(advanceAmount)) * 100
}
export function balancePaise(quotePrice: number, advanceAmount: number): number {
  return balanceRupees(quotePrice, advanceAmount) * 100
}
 
// ── Razorpay (REST, no SDK dependency) ────────────────────────────────────
export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || ''
}
 
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string>
): Promise<{ id: string; amount: number }> {
  const keyId = process.env.RAZORPAY_KEY_ID || ''
  const keySecret = process.env.RAZORPAY_KEY_SECRET || ''
  const auth = Buffer.from(keyId + ':' + keySecret).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error('Razorpay order failed: ' + res.status + ' ' + t)
  }
  return res.json()
}
 
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || ''
  if (!secret || !orderId || !paymentId || !signature) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(orderId + '|' + paymentId)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
 
// ── Telegram alert (same idea as your kit order alerts) ───────────────────
export async function sendProjectAlert(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return
  try {
    await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' }),
    })
  } catch {
    /* never block the request on a failed alert */
  }
}
 
// ── Supabase Storage upload via REST (no SDK dependency) ──────────────────
// Requires a PUBLIC bucket named 'project-photos'. Returns the public URL.
export async function uploadProjectPhoto(
  bytes: Buffer,
  contentType: string,
  filename: string
): Promise<string | null> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const bucket = 'project-photos'
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + safe
  const res = await fetch(url + '/storage/v1/object/' + bucket + '/' + path, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: bytes,
  })
  if (!res.ok) return null
  return url + '/storage/v1/object/public/' + bucket + '/' + path
}