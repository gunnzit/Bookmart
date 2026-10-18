import { NextResponse } from 'next/server'
import { prisma, getMe } from '@/lib/chat'

export const dynamic = 'force-dynamic'

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

    await prisma.user.update({ where: { id: me.id }, data: { phone } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Could not save your number.' }, { status: 500 })
  }
}