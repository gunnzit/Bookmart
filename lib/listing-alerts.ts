import { prisma } from '@/lib/chat'
import { sendWhatsApp, sendWhatsAppTemplate } from '@/lib/whatsapp'

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://pageplus.in'
const LANG = process.env.META_LISTING_TEMPLATE_LANG || 'en'

const priceText = (p: number) => (Number(p) === 0 ? 'Free' : '₹' + p)

// Sends the approved template when its name is set in Vercel, otherwise plain text
// (plain text only reaches people who messaged your number in the last 24 hours).
async function send(phone: string, template: string | undefined, params: string[], fallback: string) {
  if (template) await sendWhatsAppTemplate(phone, template, LANG, params)
  else await sendWhatsApp(phone, fallback)
}

// To the admin: a seller just listed a book.
// Needs ADMIN_WHATSAPP (the admin's number). Template name: META_ADMIN_LISTING_TEMPLATE
export async function notifyAdminNewListing(listing: { id: string; title: string; price: number; sellerId: string }) {
  try {
    const phone = process.env.ADMIN_WHATSAPP
    if (!phone) {
      console.error('Admin alert not sent: ADMIN_WHATSAPP is not set')
      return
    }
    const seller = await prisma.user.findUnique({ where: { id: listing.sellerId }, select: { name: true } })
    const sellerName = seller?.name || 'A seller'
    const view = `${APP_BASE}/listing/${listing.id}`
    const approve = `${APP_BASE}/api/listings/${listing.id}/approve?action=approve`
    await send(
      phone,
      process.env.META_ADMIN_LISTING_TEMPLATE,
      [listing.title, priceText(listing.price), sellerName, view, approve],
      `📥 New listing to approve\n\n📚 ${listing.title}\n💰 ${priceText(listing.price)}\n👤 ${sellerName}\n\nView: ${view}\nApprove: ${approve}`
    )
  } catch (e) {
    console.error('Admin alert failed', e)
  }
}

// To the seller: their listing was approved or rejected.
// Template names: META_LISTING_LIVE_TEMPLATE and META_LISTING_REJECTED_TEMPLATE
export async function notifySellerDecision(listingId: string, approved: boolean) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, price: true, seller: { select: { phone: true } } },
    })
    const phone = listing?.seller?.phone
    if (!listing || !phone) return

    if (approved) {
      const link = `${APP_BASE}/listing/${listing.id}`
      await send(
        phone,
        process.env.META_LISTING_LIVE_TEMPLATE,
        [listing.title, priceText(listing.price), link],
        `✅ Your listing is live on Pageplus!\n\n📚 ${listing.title}\n💰 ${priceText(listing.price)}\n\nView it here: ${link}\n\nBedi Book Store · Pageplus`
      )
    } else {
      await send(
        phone,
        process.env.META_LISTING_REJECTED_TEMPLATE,
        [listing.title],
        `❌ Your listing was not approved.\n\n📚 ${listing.title}\n\nPlease check your photos (the cover and the MRP tag must be visible) and list it again.\n\nQuestions? Chat with us: https://wa.me/919914735738\n\nBedi Book Store · Pageplus`
      )
    }
  } catch (e) {
    console.error('Seller alert failed', e)
  }
}

// To the admin: someone reported a listing.
// Template name: META_ADMIN_REPORT_TEMPLATE  (variables: book, reason, number of reports, note, link)
export async function notifyAdminReport(listingId: string, reason: string, note: string, count: number) {
  try {
    const phone = process.env.ADMIN_WHATSAPP
    if (!phone) {
      console.error('Report alert not sent: ADMIN_WHATSAPP is not set')
      return
    }
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { title: true } })
    const title = listing?.title || 'A listing'
    const link = `${APP_BASE}/listing/${listingId}`
    const shownNote = note || 'No note'
    await send(
      phone,
      process.env.META_ADMIN_REPORT_TEMPLATE,
      [title, reason, String(count), shownNote, link],
      `🚩 A listing was reported\n\n📚 ${title}\nReason: ${reason}\nReports so far: ${count}\nNote: ${shownNote}\n\nReview it: ${link}`
    )
  } catch (e) {
    console.error('Report alert failed', e)
  }
}