// Featured listings: the paid packages and the "is it featured right now" rule.
// Prices live here only. The payment routes and the book page all read from this file.

export type FeatureTier = 'basic' | 'standard' | 'premium'

export const FEATURE_TIERS: { tier: FeatureTier; price: number; days: number; label: string; desc: string; popular?: boolean }[] = [
  { tier: 'basic', price: 19, days: 3, label: 'Basic', desc: '3 days at the top' },
  { tier: 'standard', price: 29, days: 7, label: 'Standard', desc: '7 days, most popular', popular: true },
  { tier: 'premium', price: 49, days: 15, label: 'Premium', desc: '15 days, maximum visibility' },
]

export const FEATURE_FROM = Math.min(...FEATURE_TIERS.map(t => t.price))

export function tierByName(tier: string | undefined) {
  return FEATURE_TIERS.find(t => t.tier === tier)
}

// Razorpay amounts are in paise
export function tierByPaise(amount: number) {
  return FEATURE_TIERS.find(t => t.price * 100 === amount)
}

// A paid feature runs until featuredUntil. No end date means the admin featured it by hand.
export function isFeaturedNow(l: { featured?: boolean | null; featuredUntil?: Date | string | null }, now = Date.now()) {
  if (!l.featured) return false
  if (!l.featuredUntil) return true
  return new Date(l.featuredUntil).getTime() > now
}

// Whole days left (rounded up), or null when there is no end date
export function featuredDaysLeft(l: { featuredUntil?: Date | string | null }, now = Date.now()) {
  if (!l.featuredUntil) return null
  const ms = new Date(l.featuredUntil).getTime() - now
  return ms > 0 ? Math.ceil(ms / 86400000) : 0
}

// Use on every listing sent to the browser, so "featured" is always the current truth
export function withFeaturedNow<T extends { featured?: boolean | null; featuredUntil?: Date | string | null }>(l: T): T {
  return { ...l, featured: isFeaturedNow(l) }
}

// New end date for a purchase: extends a feature that is still running, otherwise starts now
export function nextFeaturedUntil(current: Date | string | null | undefined, days: number, now = Date.now()) {
  const base = current && new Date(current).getTime() > now ? new Date(current).getTime() : now
  return new Date(base + days * 86400000)
}
