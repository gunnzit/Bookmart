import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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
        messages: [
          {
            role: 'user',
            content: `You are a content moderator for BookMart, a student marketplace in Chandigarh, India for buying and selling books, notebooks, stationery and art supplies.

Review this listing and respond with ONLY a JSON object like: {"approved": true} or {"approved": false, "reason": "short explanation"}

Approve if: it's a book, notebook, stationery item, art supply, or educational material with a reasonable title.
Reject if: offensive/abusive language, spam, completely unrelated items (food, electronics, clothing, etc.), gibberish, or fake/misleading content.

Listing:
Title: ${title}
Subtitle: ${subtitle || 'none'}
Category: ${category}

Respond with JSON only, nothing else.`,
          },
        ],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || ''
    const parsed = JSON.parse(text)
    return { approved: parsed.approved === true, reason: parsed.reason || '' }
  } catch (err) {
    console.error('Moderation error:', err)
    // If moderation fails, allow the listing (fail open)
    return { approved: true, reason: '' }
  }
}

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      include: { seller: true },
   orderBy: { createdAt: 'desc' }
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
      },
    })
    return NextResponse.json(listing)
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}