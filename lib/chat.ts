import { PrismaClient } from '@prisma/client'
import { auth, currentUser } from '@clerk/nextjs/server'
import { after } from 'next/server'
import { sendWhatsApp, sendWhatsAppTemplate } from '@/lib/whatsapp'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const MAX_MESSAGE_LENGTH = 1000

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://pageplus.in'

// First name only — chats never reveal full names, phones or emails.
export function firstName(name?: string | null): string {
  const n = String(name || '').trim().split(/\s+/)[0]
  return n || 'Pageplus user'
}

export function cleanBody(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE_LENGTH)
}

// Finds the signed-in person's database user from their Clerk sign-in
// (never from anything the browser sends). Creates the record if it's missing.
export async function getMe(): Promise<{ id: string; name: string } | null> {
  const { userId } = await auth()
  if (!userId) return null

  const select = { id: true, name: true }
  const found = await prisma.user.findFirst({
    where: { OR: [{ id: userId }, { clerkId: userId }] },
    select,
  })
  if (found) return found

  try {
    const cu = await currentUser()
    const email = cu?.primaryEmailAddress?.emailAddress
    if (!cu || !email) return null
    const byEmail = await prisma.user.findUnique({ where: { email }, select })
    if (byEmail) return byEmail
    return await prisma.user.create({
      data: { id: userId, clerkId: userId, name: cu.fullName || cu.firstName || 'Pageplus user', email },
      select,
    })
  } catch {
    return null
  }
}

// WhatsApp alert for a new chat message. Never includes the message text.
async function notifyNewMessage(phone: string, senderName: string, bookTitle: string, conversationId: string) {
  try {
    const link = APP_BASE + '/messages/' + conversationId
    const template = process.env.META_CHAT_TEMPLATE
    if (template) {
      await sendWhatsAppTemplate(phone, template, process.env.META_CHAT_TEMPLATE_LANG || 'en', [senderName, bookTitle, link])
    } else {
      await sendWhatsApp(phone, '💬 New message on Pageplus\n\n' + senderName + ' wrote about "' + bookTitle + '".\n\nOpen the chat: ' + link)
    }
  } catch {
    // Alerts are best-effort. The in-app unread badge always works.
  }
}

// Saves a message, updates the conversation summary, and alerts the other
// person once per run of unread messages.
export async function addMessage(conversationId: string, senderId: string, isBuyer: boolean, body: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      lastSenderId: true,
      lastMessageAt: true,
      lastMessageText: true,
      buyerReadAt: true,
      sellerReadAt: true,
      listing: { select: { title: true } },
      buyer: { select: { name: true, phone: true } },
      seller: { select: { name: true, phone: true } },
    },
  })

  const msg = await prisma.message.create({ data: { conversationId, senderId, body } })
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: msg.createdAt,
      lastMessageText: body.slice(0, 120),
      lastSenderId: senderId,
      ...(isBuyer ? { buyerReadAt: msg.createdAt } : { sellerReadAt: msg.createdAt }),
    },
  })

  if (conv) {
    const recipient = isBuyer ? conv.seller : conv.buyer
    const sender = isBuyer ? conv.buyer : conv.seller
    const recipientReadAt = isBuyer ? conv.sellerReadAt : conv.buyerReadAt
    // Already has unread messages from this sender? Then they were alerted before.
    const alreadyUnread =
      !!conv.lastMessageText &&
      conv.lastSenderId === senderId &&
      (!recipientReadAt || recipientReadAt < conv.lastMessageAt)

    if (!alreadyUnread && recipient.phone) {
      const phone = recipient.phone
      const senderName = firstName(sender.name)
      const title = conv.listing.title
      try {
        after(() => notifyNewMessage(phone, senderName, title, conversationId))
      } catch {
        await notifyNewMessage(phone, senderName, title, conversationId)
      }
    }
  }

  return msg
}