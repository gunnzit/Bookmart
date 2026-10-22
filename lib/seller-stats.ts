import { prisma } from '@/lib/chat'

export type ReplyStats = { short: string; long: string }

// How fast a seller usually answers a buyer's first message.
// Looks at their 40 most recent chats, takes the gap between the buyer's first
// message and the seller's first reply, and uses the middle value.
// Needs at least 3 answered chats, otherwise returns null (shown as "New").
export async function getReplyStats(sellerId: string): Promise<ReplyStats | null> {
  const convs = await prisma.conversation.findMany({
    where: { sellerId },
    orderBy: { lastMessageAt: 'desc' },
    take: 40,
    select: {
      buyerId: true,
      messages: { orderBy: { createdAt: 'asc' }, take: 12, select: { senderId: true, createdAt: true } },
    },
  })

  const waits: number[] = []
  for (const c of convs) {
    const first = c.messages.find(m => m.senderId === c.buyerId)
    if (!first) continue
    const reply = c.messages.find(m => m.senderId === sellerId && m.createdAt > first.createdAt)
    if (!reply) continue
    waits.push((reply.createdAt.getTime() - first.createdAt.getTime()) / 60000)
  }
  if (waits.length < 3) return null

  waits.sort((a, b) => a - b)
  const mins = waits[Math.floor(waits.length / 2)]

  if (mins < 60) return { short: 'Under 1 hr', long: 'within an hour' }
  if (mins < 240) return { short: 'A few hrs', long: 'within a few hours' }
  if (mins < 1440) return { short: 'Same day', long: 'within a day' }
  return { short: '1–2 days', long: 'in a day or two' }
}