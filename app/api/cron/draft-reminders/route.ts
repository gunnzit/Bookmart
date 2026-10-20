import { NextResponse } from 'next/server'
import { prisma } from '@/lib/chat'
import { sendWhatsApp, sendWhatsAppTemplate } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://pageplus.in'
const LANG = process.env.META_LISTING_TEMPLATE_LANG || 'en'

const WAIT_HOURS = 3        // give people this long to finish before the reminder
const GIVE_UP_DAYS = 7      // never remind about something older than this
const MAX_PER_RUN = 50      // safety limit per daily run

// Runs once a day (see vercel.json). Vercel sends  Authorization: Bearer <CRON_SECRET>.
// Anyone else is turned away.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 401 })
  }

  try {
    const now = Date.now()
    // Saved a WhatsApp number, never submitted a listing, not reminded yet
    const people = await prisma.user.findMany({
      where: {
        phone: { not: null },
        phoneSavedAt: { lt: new Date(now - WAIT_HOURS * 3600 * 1000), gt: new Date(now - GIVE_UP_DAYS * 86400 * 1000) },
        draftReminderAt: null,
        listings: { none: {} },
      },
      select: { id: true, name: true, phone: true },
      take: MAX_PER_RUN,
    })

    let sent = 0
    for (const u of people) {
      if (!u.phone) continue
      // Mark first, so a person is never reminded twice even if something fails below
      const claimed = await prisma.user.updateMany({
        where: { id: u.id, draftReminderAt: null },
        data: { draftReminderAt: new Date() },
      })
      if (claimed.count === 0) continue

      const first = String(u.name || '').trim().split(/\s+/)[0] || 'there'
      const link = `${APP_BASE}/sell`
      try {
        const template = process.env.META_DRAFT_REMINDER_TEMPLATE
        if (template) {
          await sendWhatsAppTemplate(u.phone, template, LANG, [first, link])
        } else {
          await sendWhatsApp(
            u.phone,
            `Hi ${first}, you started listing a book on Pageplus but did not finish. It takes about a minute: add two photos and your price, and students nearby can find it.\n\nFinish your listing: ${link}\n\nFree to list. You keep the full price.`
          )
        }
        sent++
      } catch (e) {
        console.error('Draft reminder failed', e)
      }
    }

    return NextResponse.json({ checked: people.length, sent })
  } catch (error) {
    console.error('Draft reminder run failed', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}