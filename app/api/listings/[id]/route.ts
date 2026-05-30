import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const ADMIN_WHATSAPP = '919914735738'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://buddybooks.in'

async function moderateListing(title: string, subtitle: string, category: string): Promise<{ approved: boolean; reason: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `You are a content moderator for BuddyBooks, a student marketplace in Chandigarh, India for buying and selling books, notebooks, stationery and art supplies.

Review this listing and respond with ONLY a JSON object like: {"approved": true} or {"approved": false, "reason": "short explanation"}

Approve if: it's a book, notebook, stationery item, art supply, or educational material with a reasonable title.
Reject if: offensive/abusive language, spam, completely unrelated items (food, electronics, clothing, etc.), gibberish, or fake/misleading content.

Listing:
Title: ${title}
Subtitle: ${subtitle || 'none'}
Category: ${category}

Respond with JSON only, nothing else.`,
        }],
      }),
    })
    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || ''
    const parsed = JSON.parse(text)
    return { approved: parsed.approved === true, reason: parsed.reason || '' }
  } catch (err) {
    console.error('Moderation error:', err)
    return { approved: true, reason: '' }
  }
}

function buildWhatsAppNotification(listing: any, seller: any): string {
  const approveUrl = `${APP_URL}/api/listings/${listing.id}/approve?action=approve`
  const rejectUrl = `${APP_URL}/api/listings/${listing.id}/approve?action=reject`

  const msg = [
    '📚 *New listing pending approval*',
    '',
    `*Title:* ${listing.title}`,
    listing.subtitle ? `*Subtitle:* ${listing.subtitle}` : null,
    `*Price:* ₹${listing.price}${listing.origPrice ? ` (MRP ₹${listing.origPrice})` : ''}`,
    `*Category:* ${listing.category}`,
    `*Condition:* ${listing.condition}`,
    `*Location:* ${listing.location}`,
    `*Seller:* ${seller?.name || 'Unknown'}`,
    listing.images?.length ? `*Photos:* ${listing.images.length} uploaded` : '*Photos:* None',
    '',
    `🔗 View: ${APP_URL}/listing/${listing.id}`,
    '',
    `✅ Approve: ${approveUrl}`,
    `❌ Reject: ${rejectUrl}`,
  ].filter(Boolean).join('\n')

  return msg
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const admin = searchParams.get('admin') === 'true'

    const listings = await prisma.listing.findMany({
      include: { seller: true },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    return NextResponse.json(listings)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // AI moderation check
    const moderation = await moderateListing(body.title, body.subtitle || '', body.category)
    if (!moderation.approved) {
      return NextResponse.json(
        { error: 'listing_rejected', reason: moderation.reason || 'This listing does not meet our guidelines. Please post only books, stationery, or educational materials.' },
        { status: 422 }
      )
    }

    // Create listing with status: pending
    const listing = await prisma.listing.create({
      data: {
        title: body.title,
        subtitle: body.subtitle || '',
        price: Number(body.price),
        origPrice: body.origPrice ? Number(body.origPrice) : null,
        condition: body.condition,
        category: body.category,
        emoji: body.emoji || '📗',
        location: body.location,
        sellerId: body.sellerId,
        images: body.images || [],
        status: 'pending',
      },
      include: { seller: true },
    })

    // Send WhatsApp notification to admin
    try {
      const msg = buildWhatsAppNotification(listing, listing.seller)
      const waUrl = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(msg)}`
      // Log the WhatsApp URL to server logs — admin can also check Vercel logs
      console.log('WhatsApp notification URL:', waUrl)

      // Also try to send via WhatsApp Cloud API if configured
      if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
        await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: ADMIN_WHATSAPP,
            type: 'text',
            text: { body: msg },
          }),
        })
      }
    } catch (notifyErr) {
      console.error('WhatsApp notify error:', notifyErr)
      // Don't fail the listing creation if notification fails
    }

    return NextResponse.json({ ...listing, status: 'pending' })
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}