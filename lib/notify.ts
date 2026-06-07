// Sends a Telegram alert to the store admin.
// FIRE-SAFE: this never throws and never blocks an order. If the bot token or
// chat id aren't set, or Telegram is down, it silently does nothing.
export async function sendOrderAlert(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    })
  } catch {
    // Never let a notification failure affect the order.
  }
}