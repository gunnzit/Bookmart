import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/chat'

// Stock register (pageplus.in/stock): who may use it, where bill photos live, and shared helpers.
// Only the owner (admin) and the emails in STOCK_EMAILS (Vercel, comma-separated: the owner's
// parents) can open it. Customers never see it.

const ADMIN_IDS = new Set(
  [process.env.ADMIN_CLERK_ID, 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD', 'user_3KzRslgyuOOk5UY4fABoZ67plzS'].filter(Boolean) as string[]
)

export type StockUser = { id: string; name: string; isOwner: boolean }

// The signed-in person if they may use the stock register, otherwise null
export async function stockUser(): Promise<StockUser | null> {
  const { userId } = await auth()
  if (!userId) return null
  const cu = await currentUser()
  const name = cu?.firstName || cu?.fullName || 'Staff'
  if (ADMIN_IDS.has(userId)) return { id: userId, name, isOwner: true }
  const allowed = (process.env.STOCK_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const emails = (cu?.emailAddresses || []).map(e => e.emailAddress.toLowerCase())
  if (emails.some(e => allowed.includes(e))) return { id: userId, name, isOwner: false }
  return null
}

// Same supplier / item even if typed differently: lower-case, letters and digits only
export function nameKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, '')
}

// ── Bill photos: private Supabase bucket "bills" (needs the service key; never public) ──

const BUCKET = 'bills'

function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('storage_not_set')
  return createClient(url, key, { auth: { persistSession: false } }).storage.from(BUCKET)
}

export async function savePhoto(path: string, bytes: Uint8Array, contentType: string) {
  const { error } = await storage().upload(path, bytes, { contentType, upsert: false })
  if (error) throw new Error('upload_failed: ' + error.message)
}

// Short-lived links so the bill can be viewed on the check screen
export async function photoLinks(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return []
  const { data } = await storage().createSignedUrls(paths, 60 * 30)
  return (data || []).map(d => d.signedUrl || '').filter(Boolean)
}

// Amount still owed to a supplier: bills added to stock minus payments made
export async function supplierBalance(supplierId: string) {
  const [bills, paid] = await Promise.all([
    prisma.stockBill.aggregate({ where: { supplierId, status: 'added' }, _sum: { total: true } }),
    prisma.supplierPayment.aggregate({ where: { supplierId }, _sum: { amount: true } }),
  ])
  const billed = bills._sum.total || 0
  const paidSum = paid._sum.amount || 0
  return { billed, paid: paidSum, owed: Math.round((billed - paidSum) * 100) / 100 }
}

export const CATEGORIES = ['book', 'stationery', 'other'] as const
export const PAY_MODES = ['cash', 'upi', 'bank', 'cheque'] as const
