function toE164(to: string) {
  const cleaned = to.replace(/\D/g, '')
  if (cleaned.length === 10) return '91' + cleaned
  return cleaned.startsWith('91') ? cleaned : '91' + cleaned
}

async function postMessage(payload: Record<string, unknown>): Promise<boolean> {
  const token = process.env.META_WHATSAPP_TOKEN
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.error('WhatsApp not sent: META_WHATSAPP_TOKEN or META_PHONE_NUMBER_ID is missing')
    return false
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  })

  // Meta answers 200 when it accepts the message and an error code when it does not.
  // Logging the reason makes a silent failure show up in the Vercel logs.
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('WhatsApp send failed', res.status, text.slice(0, 500))
    return false
  }
  return true
}

// Plain text — Meta only delivers this to people who messaged your number in the last 24 hours.
export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  return postMessage({
    to: toE164(to),
    type: 'text',
    text: { body: message },
  })
}

// Approved message template — works outside the 24-hour window.
// params fill {{1}}, {{2}}, ... in the template body, in order.
export async function sendWhatsAppTemplate(to: string, template: string, lang: string, params: string[]): Promise<boolean> {
  // Meta rejects newlines, tabs and long runs of spaces inside template variables
  const clean = params.map(p => String(p).replace(/\s+/g, ' ').trim().slice(0, 200))
  return postMessage({
    to: toE164(to),
    type: 'template',
    template: {
      name: template,
      language: { code: lang },
      components: [{ type: 'body', parameters: clean.map(text => ({ type: 'text', text })) }],
    },
  })
}

// Verification code (a Meta "Authentication" template). The code goes in the body and in the Copy code button.
export async function sendWhatsAppOtp(to: string, template: string, lang: string, code: string): Promise<boolean> {
  return postMessage({
    to: toE164(to),
    type: 'template',
    template: {
      name: template,
      language: { code: lang },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ],
    },
  })
}