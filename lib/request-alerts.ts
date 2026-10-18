import { prisma } from '@/lib/chat'
import { sendWhatsApp, sendWhatsAppTemplate } from '@/lib/whatsapp'

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://pageplus.in'
const MAX_ALERTS_PER_LISTING = 50
const IGNORE = new Set(['the', 'a', 'an', 'of', 'for', 'and', 'by', 'in', 'to'])

// "NCERT Maths, Class 10!" -> ['ncert', 'math', 'class', '10']
function words(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(w => w && !IGNORE.has(w))
    .map(w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
}

// A listing matches a request when every word of the requested title is in the listing title
function matches(requestTitle: string, listingTitle: string): boolean {
  const want = words(requestTitle)
  if (want.length === 0) return false
  const have = new Set(words(listingTitle))
  return want.every(w => have.has(w))
}

async function send(phone: string, listing: { id: string; title: string; price: number }) {
  const link = APP_BASE + '/listing/' + listing.id
  const priceParam = listing.price === 0 ? '0 (free)' : String(listing.price)
  const template = process.env.META_REQUEST_TEMPLATE
  if (template) {
    await sendWhatsAppTemplate(phone, template, process.env.META_REQUEST_TEMPLATE_LANG || 'en', [listing.title, priceParam, link])
  } else {
    // Plain text only reaches people who messaged the business number in the last 24 hours
    await sendWhatsApp(
      phone,
      '📚 *A book you asked for is now on Pageplus!*\n\n' + listing.title + '\n' + (listing.price === 0 ? 'Free' : '₹' + listing.price) + '\n\nOpen it here: ' + link
    )
  }
}

// Call this when a listing goes live. Safe to call more than once: nobody is alerted twice.
export async function notifyRequestMatches(listing: { id: string; title: string; price: number; sellerId: string }): Promise<number> {
  try {
    const candidates = await prisma.bookRequest.findMany({
      where: {
        status: 'open',
        userId: { not: listing.sellerId },
        OR: [{ maxPrice: null }, { maxPrice: { gte: listing.price } }],
      },
      take: 500,
      select: { id: true, title: true, user: { select: { phone: true } } },
    })

    const matched = candidates.filter(r => matches(r.title, listing.title) && !!r.user?.phone)
    let sent = 0

    for (const r of matched.slice(0, MAX_ALERTS_PER_LISTING)) {
      try {
        // The unique (request, listing) row is what stops a second alert
        await prisma.requestAlert.create({ data: { requestId: r.id, listingId: listing.id } })
      } catch {
        continue
      }
      try {
        await send(r.user!.phone as string, listing)
        sent++
      } catch {
        // Alerts are best-effort
      }
    }
    return sent
  } catch (error) {
    console.error('Request alerts error:', error)
    return 0
  }
}