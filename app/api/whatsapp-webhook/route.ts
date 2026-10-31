import { createHmac, timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

// WhatsApp delivery reports. Meta calls this address each time a message the site sent is
// sent, delivered, read or failed. Each report becomes one line in the Vercel logs
// ("WhatsApp status: ..."), with the phone number partly hidden. Nothing is saved or sent.
//
// Needs two settings in Vercel: META_WEBHOOK_VERIFY_TOKEN (the password typed into Meta's
// "Verify token" box) and META_APP_SECRET (Meta app > App settings > Basic > App secret).

// GET: Meta's one-time handshake when the address is saved in "Configure Webhooks"
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN
  if (!expected) {
    console.error('WhatsApp webhook: META_WEBHOOK_VERIFY_TOKEN is not set in Vercel')
    return new Response('Not set up', { status: 403 })
  }
  if (params.get('hub.mode') === 'subscribe' && params.get('hub.verify_token') === expected) {
    return new Response(params.get('hub.challenge') || '', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }
  return new Response('Forbidden', { status: 403 })
}

function fromMeta(raw: string, signature: string | null): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret || !signature?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const got = signature.slice(7)
  return got.length === expected.length && timingSafeEqual(Buffer.from(got, 'hex'), Buffer.from(expected, 'hex'))
}

function hideNumber(n: unknown): string {
  const d = String(n || '').replace(/\D/g, '').slice(-10)
  return d.length === 10 ? d.slice(0, 5) + '•••' + d.slice(-2) : '•••'
}

// POST: the delivery reports
export async function POST(request: Request) {
  const raw = await request.text()
  if (!fromMeta(raw, request.headers.get('x-hub-signature-256'))) {
    console.error('WhatsApp webhook: ignored a report that was not signed by Meta (check META_APP_SECRET)')
    // 200 so Meta does not keep retrying; the report is simply not used
    return new Response('ok', { status: 200 })
  }

  try {
    const body = JSON.parse(raw)
    for (const entry of body?.entry || []) {
      for (const change of entry?.changes || []) {
        const value = change?.value || {}
        for (const s of value.statuses || []) {
          const err = (s.errors || [])[0]
          const reason = err
            ? ` · error ${err.code} · ${err.title || ''}${err.error_data?.details ? ' · ' + err.error_data.details : ''}`
            : ''
          const log = s.status === 'failed' ? console.error : console.log
          log(`WhatsApp status: ${s.status} · to ${hideNumber(s.recipient_id)}${reason}`)
        }
        // People replying to the business number. Not used by the site; counted so it shows up.
        const incoming = (value.messages || []).length
        if (incoming) console.log(`WhatsApp webhook: ${incoming} incoming message(s) to the business number (not read by the site)`)
      }
    }
  } catch {
    console.error('WhatsApp webhook: could not read a report')
  }
  return new Response('ok', { status: 200 })
}
