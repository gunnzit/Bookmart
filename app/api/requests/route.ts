import { NextResponse } from 'next/server'
import { prisma, getMe, firstName } from '@/lib/chat'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['textbook', 'stationery', 'novel', 'competitive']
const MAX_OPEN_PER_USER = 5

function clean(input: unknown, max: number): string {
  if (typeof input !== 'string') return ''
  return input.replace(/\s+/g, ' ').trim().slice(0, max)
}

// GET: the public list of requests. Anyone can see it, signed in or not.
// Only safe fields are sent: first name, never phone, email or account ids.
export async function GET() {
  try {
    const me = await getMe().catch(() => null)

    const rows = await prisma.bookRequest.findMany({
      where: me ? { OR: [{ status: 'open' }, { userId: me.id }] } : { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true } } },
    })

    const requests = rows.map(r => ({
      id: r.id,
      title: r.title,
      author: r.author,
      category: r.category,
      maxPrice: r.maxPrice,
      location: r.location,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt,
      name: firstName(r.user?.name),
      mine: !!me && r.userId === me.id,
    }))

    return NextResponse.json({ requests, signedIn: !!me })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST: post a new request (sign-in required)
export async function POST(request: Request) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in to post a request.' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const title = clean(body.title, 120)
    const author = clean(body.author, 80)
    const location = clean(body.location, 80)
    const note = clean(body.note, 300)
    const category = CATEGORIES.includes(body.category) ? body.category : ''

    if (title.length < 2) return NextResponse.json({ error: 'Enter the book title.' }, { status: 400 })
    if (!location) return NextResponse.json({ error: 'Choose a meetup area.' }, { status: 400 })
    if (!category) return NextResponse.json({ error: 'Choose a category.' }, { status: 400 })

    let maxPrice: number | null = null
    if (body.maxPrice !== undefined && body.maxPrice !== null && String(body.maxPrice).trim() !== '') {
      const n = Math.floor(Number(body.maxPrice))
      if (!n || n < 1 || n > 100000) return NextResponse.json({ error: 'Enter a price between ₹1 and ₹1,00,000.' }, { status: 400 })
      maxPrice = n
    }

    const openCount = await prisma.bookRequest.count({ where: { userId: me.id, status: 'open' } })
    if (openCount >= MAX_OPEN_PER_USER) {
      return NextResponse.json({ error: 'You already have ' + MAX_OPEN_PER_USER + ' open requests. Mark one as found first.' }, { status: 400 })
    }

    const created = await prisma.bookRequest.create({
      data: { userId: me.id, title, author: author || null, category, maxPrice, location, note: note || null },
    })

    return NextResponse.json({
      request: {
        id: created.id,
        title: created.title,
        author: created.author,
        category: created.category,
        maxPrice: created.maxPrice,
        location: created.location,
        note: created.note,
        status: created.status,
        createdAt: created.createdAt,
        name: firstName(me.name),
        mine: true,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}