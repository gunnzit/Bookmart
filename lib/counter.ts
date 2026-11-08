import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/chat'
import { stockUser } from '@/lib/stock'
import { schools } from '@/lib/kit-prices'

// Counter billing at Bedi Book Store. The shop phone/tablet is signed in (Clerk) as the owner or a
// parent; whoever is billing then picks their name and types a 4-digit PIN. That choice is kept in a
// signed cookie for 12 hours, or until they tap Lock.

const COOKIE = 'counter_staff'
const HOURS = 12

function secret() {
  return process.env.OTP_SECRET || process.env.CLERK_SECRET_KEY || 'counter-secret'
}

// ── PINs (never stored as typed) ──
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex')
  return salt + ':' + scryptSync(pin, salt, 32).toString('hex')
}
export function checkPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const a = Buffer.from(hash, 'hex')
  const b = scryptSync(pin, salt, 32)
  return a.length === b.length && timingSafeEqual(a, b)
}
export const validPin = (pin: unknown) => typeof pin === 'string' && /^\d{4}$/.test(pin)

// ── Who is billing ──
const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('hex').slice(0, 32)

export async function startShift(staffId: string) {
  const exp = Date.now() + HOURS * 3600 * 1000
  const v = `${staffId}.${exp}`
  ;(await cookies()).set(COOKIE, `${v}.${sign(v)}`, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: HOURS * 3600 })
}
export async function endShift() {
  ;(await cookies()).delete(COOKIE)
}

export type CounterStaff = { id: string; name: string; role: string }

// The device must be a stock account (owner/parent) AND someone must have unlocked with their PIN
export async function counterStaff(): Promise<CounterStaff | null> {
  if (!(await stockUser())) return null
  const raw = (await cookies()).get(COOKIE)?.value || ''
  const [id, exp, sig] = raw.split('.')
  if (!id || !exp || !sig || sign(`${id}.${exp}`) !== sig || Number(exp) < Date.now()) return null
  const staff = await prisma.staff.findUnique({ where: { id }, select: { id: true, name: true, role: true, active: true } })
  return staff?.active ? { id: staff.id, name: staff.name, role: staff.role } : null
}
export const canManage = (s: CounterStaff | null) => !!s && (s.role === 'owner' || s.role === 'family')

// ── School sets (from the kit price list) ──
export type SetLine = { name: string; qty: number; unitPrice: number; group: 'NCERT' | 'Books' | 'Notebooks' | 'Stationery'; outOfPrint: boolean }

export function schoolList() {
  return Object.entries(schools).map(([name, kits]) => ({ name, classes: Object.keys(kits).map(Number).sort((a, b) => a - b) }))
}

export function setLines(school: string, cls: number): SetLine[] | null {
  const kit = (schools as any)[school]?.[cls]
  if (!kit) return null
  return [
    ...kit.ncert.map((i: any) => ({ name: i.name, qty: 1, unitPrice: i.price, group: 'NCERT' as const, outOfPrint: !!i.oos })),
    ...kit.pvt.map((i: any) => ({ name: i.name, qty: 1, unitPrice: i.price, group: 'Books' as const, outOfPrint: !!i.oos })),
    ...kit.notebooks.map((n: any) => ({ name: n.name, qty: n.qty, unitPrice: n.unitPrice, group: 'Notebooks' as const, outOfPrint: !!n.oos })),
    ...kit.stationery.map((i: any) => ({ name: i.name, qty: 1, unitPrice: i.price, group: 'Stationery' as const, outOfPrint: !!i.oos })),
  ]
}

// ── Invoice details (set in Vercel; shown on every GST invoice) ──
export function shopDetails() {
  return {
    name: process.env.SHOP_LEGAL_NAME || 'Bedi Book Store',
    address: process.env.SHOP_ADDRESS || 'Booth 48, Sector 40-C, Chandigarh',
    gstin: process.env.SHOP_GSTIN || '',
    state: 'Chandigarh (04)',
  }
}

// Indian financial year label for an invoice date, e.g. 2026-27
export function financialYear(d: Date) {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
}
export const invoiceCode = (no: number, d: Date) => `BBS/${financialYear(d)}/${String(no).padStart(5, '0')}`
