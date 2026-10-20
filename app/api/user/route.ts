import { NextResponse } from 'next/server'
import { prisma, getMe } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// GET: does the signed-in person already have a WhatsApp number saved? Only their own number is sent back.
export async function GET() {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const u = await prisma.user.findUnique({ where: { id: me.id }, select: { phone: true, phoneVerifiedAt: true } })
    return NextResponse.json({ hasPhone: !!u?.phone, phone: u?.phone || '', verified: !!u?.phone && !!u?.phoneVerifiedAt })
  } catch {
    return NextResponse.json({ error: 'Could not check your number.' }, { status: 500 })
  }
}

// POST: make sure the signed-in person has a user record. The pages call this on sign-in.
// Who they are comes from the login session on the server. Anything the browser sends is ignored.
// Only the id and name are sent back, never phone or email.
export async function POST() {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    return NextResponse.json({ id: me.id, name: me.name })
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json({ error: 'Could not sync your account.' }, { status: 500 })
  }
}

// PATCH: save the signed-in person's own WhatsApp number. Body: { phone }
export async function PATCH(request: Request) {
  try {
    const me = await getMe()
    if (!me) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const raw = typeof body.phone === 'string' ? body.phone : ''

    // Keep digits only (drops spaces, dashes, brackets and a leading +)
    const phone = raw.replace(/\D/g, '')
    if (phone.length < 10 || phone.length > 15) {
      return NextResponse.json({ error: 'Enter a valid WhatsApp number.' }, { status: 400 })
    }

    // Remember when the number was first saved (used by the unfinished-listing reminder)
    // A changed number is no longer verified (selling needs a verified number, see /api/phone-otp)
    const before = await prisma.user.findUnique({ where: { id: me.id }, select: { phone: true } })
    const changed = before?.phone !== phone
    await prisma.user.update({
      where: { id: me.id },
      data: {
        phone,
        ...(before?.phone ? {} : { phoneSavedAt: new Date() }),
        ...(changed ? { phoneVerifiedAt: null } : {}),
      },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Could not save your number.' }, { status: 500 })
  }
}