import { NextResponse } from 'next/server'
import { prisma, getMe } from '@/lib/chat'
import { isAllowedArea } from '@/lib/locations'

export const dynamic = 'force-dynamic'

const LABELS = ['Home', 'Office', "Parents' Home", 'Other']
const MAX_ADDRESSES = 3

// The signed-in person's saved addresses. The person is found from their
// sign-in on the server, never from anything the browser sends.
export async function GET() {
  const me = await getMe()
  if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const addresses = await prisma.savedAddress.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, label: true, line1: true, area: true, pin: true },
  })
  return NextResponse.json({ addresses })
}

export async function POST(req: Request) {
  const me = await getMe()
  if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const label = String(body.label || '')
  const line1 = String(body.line1 || '').replace(/\s+/g, ' ').trim()
  const area = String(body.area || '').trim()
  const pin = String(body.pin || '').replace(/\D/g, '')

  if (!LABELS.includes(label)) return NextResponse.json({ error: 'Choose a label' }, { status: 400 })
  if (line1.length < 5 || line1.length > 120) return NextResponse.json({ error: 'Enter your house or flat details (5 to 120 characters)' }, { status: 400 })
  if (!isAllowedArea(area)) return NextResponse.json({ error: 'We deliver in Chandigarh, Mohali and Panchkula. Pick your area from the list' }, { status: 400 })
  if (pin && pin.length !== 6) return NextResponse.json({ error: 'PIN code must be 6 digits' }, { status: 400 })

  const count = await prisma.savedAddress.count({ where: { userId: me.id } })
  if (count >= MAX_ADDRESSES) return NextResponse.json({ error: 'You can save up to ' + MAX_ADDRESSES + ' addresses. Delete one first' }, { status: 400 })

  const created = await prisma.savedAddress.create({
    data: { userId: me.id, label, line1, area, pin: pin || null },
    select: { id: true, label: true, line1: true, area: true, pin: true },
  })
  return NextResponse.json({ address: created })
}