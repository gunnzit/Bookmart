import { NextResponse, after } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma, getMe } from '@/lib/chat'
import { notifyRequestMatches } from '@/lib/request-alerts'
import { notifySellerDecision } from '@/lib/listing-alerts'
import { withFeaturedNow, isFeaturedNow, featuredDaysLeft } from '@/lib/featured'

export const dynamic = 'force-dynamic'

// Same admin as the admin pages and the approve link (set ADMIN_CLERK_ID in Vercel to override)
const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'
const STATUSES = ['pending', 'active', 'rejected']

// Who is asking, decided on the server
async function whoIsAsking(sellerId?: string) {
  let clerkId: string | null = null
  try {
    clerkId = (await auth()).userId || null
  } catch {
    clerkId = null
  }
  const isAdmin = !!clerkId && clerkId === ADMIN_ID
  let isOwner = false
  if (clerkId && sellerId) {
    if (clerkId === sellerId) {
      isOwner = true
    } else {
      const me = await getMe().catch(() => null)
      isOwner = !!me && me.id === sellerId
    }
  }
  return { signedIn: !!clerkId, isAdmin, isOwner }
}

function text(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

// GET: one listing (public). The seller's phone and email are never sent, except to the admin.
export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const track = searchParams.get('track') === 'true'

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: true },
    })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const who = await whoIsAsking(listing.sellerId)

    // Listings that are not approved are visible only to their seller and the admin
    if (listing.status !== 'active' && !who.isOwner && !who.isAdmin) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // The seller looking at their own book is not a view
    const counted = track && listing.status === 'active' && !who.isOwner
    if (counted) {
      await prisma.listing.update({ where: { id }, data: { views: { increment: 1 } } })
    }

    // Attention numbers, shown only to the seller (and the admin)
    let stats: { chats: number; saves: number } | undefined
    if (who.isOwner || who.isAdmin) {
      const [chats, saves] = await Promise.all([
        prisma.conversation.count({ where: { listingId: id } }),
        prisma.wishlist.count({ where: { listingId: id } }),
      ])
      stats = { chats, saves }
    }

    // Only a yes/no for the Verified badge. The phone number itself is never sent.
    const verified = !!listing.seller?.phoneVerifiedAt
    const seller = who.isAdmin
      ? (listing.seller ? { ...listing.seller, verified } : null)
      : listing.seller
        ? { id: listing.seller.id, name: listing.seller.name, verified }
        : null

    return NextResponse.json({
      ...withFeaturedNow(listing),
      // Days left on a paid feature, for the seller's "Featured, X days left"
      ...((who.isOwner || who.isAdmin) && isFeaturedNow(listing) ? { featuredDaysLeft: featuredDaysLeft(listing) } : {}),
      seller,
      views: counted ? listing.views + 1 : listing.views,
      ...(stats ? { stats } : {}),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE: only the seller or the admin
export async function DELETE(request: Request, context: any) {
  try {
    const { id } = await context.params
    const listing = await prisma.listing.findUnique({ where: { id }, select: { sellerId: true } })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const who = await whoIsAsking(listing.sellerId)
    if (!who.signedIn) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (!who.isOwner && !who.isAdmin) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

    await prisma.listing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PATCH: the seller can edit their own book and mark it sold. Only the admin can change status or featured.
export async function PATCH(request: Request, context: any) {
  try {
    const { id } = await context.params
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true },
    })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const who = await whoIsAsking(listing.sellerId)
    if (!who.signedIn) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    if (!who.isOwner && !who.isAdmin) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const data: any = {}

    if (body.title !== undefined) {
      const t = text(body.title, 120)
      if (t.length < 2) return NextResponse.json({ error: 'Enter the book title.' }, { status: 400 })
      data.title = t
    }
    if (body.subtitle !== undefined) data.subtitle = text(body.subtitle, 150)
    if (body.price !== undefined) {
      const p = Number(body.price)
      if (!Number.isInteger(p) || p < 0 || p > 100000) return NextResponse.json({ error: 'Enter a price between ₹0 and ₹1,00,000.' }, { status: 400 })
      data.price = p
    }
    if (body.origPrice !== undefined) {
      if (body.origPrice === null || body.origPrice === '') {
        data.origPrice = null
      } else {
        const o = Number(body.origPrice)
        if (!Number.isInteger(o) || o < 0 || o > 1000000) return NextResponse.json({ error: 'Enter a valid original price.' }, { status: 400 })
        data.origPrice = o
      }
    }
    if (body.condition !== undefined) data.condition = text(body.condition, 40)
    if (body.location !== undefined) {
      const loc = text(body.location, 80)
      if (!loc) return NextResponse.json({ error: 'Enter a location.' }, { status: 400 })
      data.location = loc
    }
    if (typeof body.sold === 'boolean') data.sold = body.sold

    // Admin only
    if (who.isAdmin) {
      // Featuring by hand has no end date; unfeaturing clears any paid one too
      if (typeof body.featured === 'boolean') { data.featured = body.featured; data.featuredUntil = null }
      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
        data.status = body.status
      }
    }

    const updated = await prisma.listing.update({ where: { id }, data })

    // Keep a private record of who bought it (only a person who chatted about this book can be picked)
    if (typeof body.sold === 'boolean') {
      try {
        if (body.sold) {
          let buyerId: string | null = null
          if (typeof body.soldToId === 'string' && body.soldToId) {
            const conv = await prisma.conversation.findFirst({
              where: { listingId: id, buyerId: body.soldToId },
              select: { buyerId: true },
            })
            buyerId = conv ? conv.buyerId : null
          }
          await prisma.sale.upsert({
            where: { listingId: id },
            create: { listingId: id, sellerId: listing.sellerId, buyerId },
            update: { buyerId },
          })
        } else {
          await prisma.sale.deleteMany({ where: { listingId: id } })
        }
      } catch (e) {
        console.error('Sale record error:', e)
      }
    }

    // If the admin approved or rejected it from here, tell the seller
    if ((data.status === 'active' || data.status === 'rejected') && listing.status !== data.status) {
      const sellerJob = () => notifySellerDecision(updated.id, data.status === 'active')
      try {
        after(sellerJob)
      } catch {
        sellerJob().catch(() => {})
      }
    }

    // If the admin approved it from here, tell buyers who asked for this book
    if (data.status === 'active' && listing.status !== 'active') {
      const job = () => notifyRequestMatches({ id: updated.id, title: updated.title, price: updated.price, sellerId: updated.sellerId })
      try {
        after(job)
      } catch {
        job().catch(() => {})
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}