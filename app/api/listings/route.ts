import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Same admin as the admin pages (set ADMIN_CLERK_ID in Vercel to override)
const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

const CATEGORIES = ['textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const CONDITIONS = ['New', 'Good', 'Fair']

async function getUserId(): Promise<string | null> {
  try {
    const { userId } = await auth()
    return userId || null
  } catch {
    return null
  }
}

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
            content: `You are a content moderator for Pageplus, a student marketplace in Chandigarh, India for buying and selling books, notebooks, stationery and art supplies.

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
    const text = (data.content?.[0]?.text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
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
    const userId = await getUserId()
    const isAdmin = !!userId && userId === ADMIN_ID

    // Admin: everything. Everyone else: live listings, plus their own.
    const where = isAdmin
      ? undefined
      : userId
        ? { OR: [{ status: 'active' }, { sellerId: userId }] }
        : { status: 'active' }

    const rows = await prisma.listing.findMany({
      where,
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
    })

    // Phone numbers and emails are never sent to other people.
    const out = isAdmin
      ? rows
      : rows.map(l => ({
          ...l,
          seller: l.sellerId === userId
            ? { id: l.seller.id, name: l.seller.name, phone: l.seller.phone }
            : { id: l.seller.id, name: l.seller.name },
        }))

    return NextResponse.json(out)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const body = await request.json().catch(() => ({}))

    // The seller is always the signed-in person
    if (body.sellerId && body.sellerId !== userId) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    const title = String(body.title || '').replace(/\s+/g, ' ').trim()
    const subtitle = String(body.subtitle || '').replace(/\s+/g, ' ').trim()
    const location = String(body.location || '').trim()
    const category = String(body.category || '')
    const condition = String(body.condition || '')
    const price = Number(body.price)
    const origPrice = body.origPrice ? Number(body.origPrice) : null
    const images: string[] = Array.isArray(body.images)
      ? body.images.filter((u: unknown) => typeof u === 'string' && u.startsWith('https://') && u.length < 600).slice(0, 3)
      : []

    if (title.length < 3 || title.length > 120) return NextResponse.json({ error: 'Title must be 3 to 120 characters' }, { status: 400 })
    if (subtitle.length > 120) return NextResponse.json({ error: 'Subtitle is too long' }, { status: 400 })
    if (location.length < 2 || location.length > 100) return NextResponse.json({ error: 'Choose a location' }, { status: 400 })
    if (!CATEGORIES.includes(category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    if (!CONDITIONS.includes(condition)) return NextResponse.json({ error: 'Invalid condition' }, { status: 400 })
    if (!Number.isInteger(price) || price < 1 || price > 10000) return NextResponse.json({ error: 'Price must be between ₹1 and ₹10,000' }, { status: 400 })
    if (origPrice !== null) {
      if (!Number.isInteger(origPrice) || origPrice <= price) return NextResponse.json({ error: 'Original price must be higher than your price' }, { status: 400 })
      if (Math.round((1 - price / origPrice) * 100) > 90) return NextResponse.json({ error: 'Discount cannot exceed 90%' }, { status: 400 })
    }

    // AI moderation check
    const moderation = await moderateListing(title, subtitle, category)
    if (!moderation.approved) {
      return NextResponse.json(
        { error: 'listing_rejected', reason: moderation.reason || 'This listing does not meet our guidelines. Please post only books, stationery, or educational materials.' },
        { status: 422 }
      )
    }

    // status is left to the database default ("pending") so it waits for approval
    const listing = await prisma.listing.create({
      data: {
        title,
        subtitle,
        price,
        origPrice,
        condition,
        category,
        emoji: String(body.emoji || '📗').slice(0, 8),
        location,
        sellerId: userId,
        images,
      },
    })
    return NextResponse.json(listing)
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}