import { PrismaClient } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'
import { after } from 'next/server'
import { sendWhatsApp } from '@/lib/whatsapp'
import { notifyRequestMatches } from '@/lib/request-alerts'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://pageplus.in'

// Same admin as the admin pages and the listings route (set ADMIN_CLERK_ID in Vercel to override)
const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

// Makes text safe to put inside the admin result page
function esc(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function page(status: number, heading: string, body: string, color: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title><style>body{font-family:sans-serif;background:#f7f6f3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#fff;border-radius:16px;padding:40px;text-align:center;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.08)}h1{color:${color}}a{display:inline-block;margin-top:20px;background:#1B2A4A;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none}</style></head><body><div class="card"><h1>${esc(heading)}</h1>${body}<a href="${APP_BASE}/admin">Admin Panel</a></div></body></html>`
  return new Response(html, { status, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
}

export async function GET(request: Request, context: any) {
  try {
    // Only the admin may approve or reject. Link previews and strangers are turned away.
    let userId: string | null = null
    try {
      const a = await auth()
      userId = a.userId || null
    } catch {
      userId = null
    }
    if (!userId) {
      return page(401, 'Sign in first', `<p>Sign in to Pageplus as the admin, then open this link again.</p><a href="${APP_BASE}" style="background:#E8632B">Open Pageplus</a>`, '#E24B4A')
    }
    if (userId !== ADMIN_ID) {
      return page(403, 'Not allowed', '<p>Only the Pageplus admin can approve or reject listings.</p>', '#E24B4A')
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action !== 'approve' && action !== 'reject') {
      return new Response('Invalid action', { status: 400 })
    }

    let listing
    try {
      listing = await prisma.listing.update({
        where: { id },
        data: { status: action === 'approve' ? 'active' : 'rejected' },
        include: { seller: true },
      })
    } catch (e: any) {
      if (e?.code === 'P2025') return page(404, 'Listing not found', '<p>It may have been deleted.</p>', '#E24B4A')
      throw e
    }

    // Fire WhatsApp notification (non-blocking — won't break approval if it fails)
    if (listing.seller?.phone) {
      const message = action === 'approve'
        ? `✅ *Your listing is live on Pageplus!*\n\n📚 *${listing.title}*\n💰 ₹${listing.price}\n\nView it here: ${APP_BASE}/listing/${listing.id}\n\n_Bedi Book Store · Pageplus_`
        : `❌ *Your listing was not approved.*\n\n📚 *${listing.title}*\n\nReason: Does not meet our listing guidelines. Please check your photos (MRP tag must be visible) and re-list.\n\nQuestions? Chat with us: https://wa.me/919914735738\n\n_Bedi Book Store · Pageplus_`

      sendWhatsApp(listing.seller.phone, message).catch(() => {
        // Silently ignore — approval is unaffected
      })
    }

    // Tell buyers who asked for this book (after the reply is sent, so approval stays fast)
    if (action === 'approve') {
      const job = () => notifyRequestMatches({ id: listing.id, title: listing.title, price: listing.price, sellerId: listing.sellerId })
      try {
        after(job)
      } catch {
        job().catch(() => {})
      }
    }

    const isApprove = action === 'approve'
    return page(
      200,
      isApprove ? '✅ Approved!' : '❌ Rejected',
      `<p>${esc(listing.title)}</p><p>₹${listing.price} · ${esc(listing.location)}</p>`,
      isApprove ? '#1D9E75' : '#E24B4A'
    )
  } catch (error) {
    return new Response('Error: ' + String(error), { status: 500 })
  }
}