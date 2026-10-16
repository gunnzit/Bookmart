function toE164(to: string) {
  const cleaned = to.replace(/\D/g, '')
  if (cleaned.length === 10) return '91' + cleaned
  return cleaned.startsWith('91') ? cleaned : '91' + cleaned
}

async function postMessage(payload: Record<string, unknown>) {
  const token = process.env.META_WHATSAPP_TOKEN
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) return

  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  })
}

// Plain text — Meta only delivers this to people who messaged your number in the last 24 hours.
export async function sendWhatsApp(to: string, message: string) {
  await postMessage({
    to: toE164(to),
    type: 'text',
    text: { body: message },
  })
}

// Approved message template — works outside the 24-hour window.
// params fill {{1}}, {{2}}, ... in the template body, in order.
export async function sendWhatsAppTemplate(to: string, template: string, lang: string, params: string[]) {
  // Meta rejects newlines, tabs and long runs of spaces inside template variables
  const clean = params.map(p => String(p).replace(/\s+/g, ' ').trim().slice(0, 200))
  await postMessage({
    to: toE164(to),
    type: 'template',
    template: {
      name: template,
      language: { code: lang },
      components: [{ type: 'body', parameters: clean.map(text => ({ type: 'text', text })) }],
    },
  })
}