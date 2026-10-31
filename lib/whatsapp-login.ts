import { prisma } from '@/lib/chat'

// "Continue with WhatsApp" on the sign-in and sign-up pages.
// Only a number that is already verified on an account can sign in this way, and never the admin account.

export const MAX_SENDS_PER_IP_PER_HOUR = 10

// Both admin IDs used across the site, plus the one set in Vercel
const ADMIN_IDS = new Set(
  [process.env.ADMIN_CLERK_ID, 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD', 'user_3KzRslgyuOOk5UY4fABoZ67plzS'].filter(Boolean) as string[]
)

// The account a verified number belongs to, as its Clerk user ID. null when there is none (or it is the admin).
export async function accountForPhone(phone: string): Promise<string | null> {
  const users = await prisma.user.findMany({
    where: { phone, phoneVerifiedAt: { not: null } },
    select: { id: true, clerkId: true },
    take: 2,
  })
  // One number, one account. Two would mean something is wrong, so do not guess.
  if (users.length !== 1) return null
  const clerkUserId = users[0].clerkId || users[0].id
  if (!clerkUserId.startsWith('user_')) return null
  if (ADMIN_IDS.has(clerkUserId) || ADMIN_IDS.has(users[0].id)) return null
  return clerkUserId
}

// The visitor's internet address, as Vercel passes it on
export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for') || ''
  return (fwd.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim().slice(0, 64)
}

// Counts one send for this address. false when the address has asked for too many codes this hour.
export async function allowIp(ip: string): Promise<boolean> {
  const now = Date.now()
  const row = await prisma.loginOtpIp.findUnique({ where: { ip } })
  if (!row || now - row.windowStart.getTime() >= 3600 * 1000) {
    await prisma.loginOtpIp.upsert({
      where: { ip },
      create: { ip, sentCount: 1, windowStart: new Date(now) },
      update: { sentCount: 1, windowStart: new Date(now) },
    })
    return true
  }
  if (row.sentCount >= MAX_SENDS_PER_IP_PER_HOUR) return false
  await prisma.loginOtpIp.update({ where: { ip }, data: { sentCount: { increment: 1 } } })
  return true
}
