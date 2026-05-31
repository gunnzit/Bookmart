export async function sendWhatsApp(to: string, message: string) {
  const token = process.env.META_WHATSAPP_TOKEN
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) return

  const cleaned = to.replace(/\D/g, '')
  const e164 = cleaned.startsWith('91') ? cleaned : `91${cleaned}`

  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: e164,
      type: 'text',
      text: { body: message },
    }),
  })
}