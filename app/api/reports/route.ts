import { NextResponse, after } from 'next/server'
import { prisma, getMe } from '@/lib/chat'
import { notifyAdminReport } from '@/lib/listing-alerts'

export const dynamic = 'force-dynamic'

const REASONS: Record<string, string> = {
  scam: 'Looks fake or a scam',
  price: 'Wrong or misleading price',
  sold: 'Already sold',
  photos: 'Photos do not match the book',
  inappropriate: 'Not a book or inappropriate',
  other: 'Something else',
}
const MAX_PER_DAY = 10

// POST { listingId, reason, note? } — the person reporting comes from the sign-in, never from the browser
export async function POST(request: Request) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'signin' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const listingId = typeof body.listingId === 'string' ? body.listingId : ''
    const reasonKey = typeof body.reason === 'string' ? body.reason : ''
    const note = typeof body.note === 'string' ? body.note.replace(/\s+/g, ' ').trim().slice(0, 200) : ''
    if (!listingId || !REASONS[reasonKey]) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, sellerId: true, status: true } })
    if (!listing || listing.status !== 'active') return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (listing.sellerId === me.id) return NextResponse.json({ error: 'own' }, { status: 400 })

    // Same person, same listing: already counted
    const existing = await prisma.report.findUnique({
      where: { listingId_reporterId: { listingId, reporterId: me.id } },
      select: { id: true },
    })
    if (existing) return NextResponse.json({ ok: true, already: true })

    // Stops one person flooding the admin
    const today = await prisma.report.count({
      where: { reporterId: me.id, createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } },
    })
    if (today >= MAX_PER_DAY) return NextResponse.json({ error: 'too_many' }, { status: 429 })

    await prisma.report.create({
      data: { listingId, reporterId: me.id, reason: REASONS[reasonKey], note: note || null },
    })
    const count = await prisma.report.count({ where: { listingId } })

    const job = () => notifyAdminReport(listingId, REASONS[reasonKey], note, count)
    try {
      after(job)
    } catch {
      job().catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Report error', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}