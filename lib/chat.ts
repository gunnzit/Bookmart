import { PrismaClient } from '@prisma/client'
import { auth, currentUser } from '@clerk/nextjs/server'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const MAX_MESSAGE_LENGTH = 1000

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

// Saves a message and updates the conversation summary.
export async function addMessage(conversationId: string, senderId: string, isBuyer: boolean, body: string) {
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
  return msg
}