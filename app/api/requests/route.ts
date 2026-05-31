import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET() {
  const requests = await prisma.bookRequest.findMany({
    where: { status: 'open' },
    include: { user: { select: { name: true, phone: true, clerkId: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(requests)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, author, category, maxPrice, location, note, clerkId, name, email } = body

    if (!title || !category || !location || !clerkId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Find user by clerkId first
    let user = await prisma.user.findUnique({ where: { clerkId } })

    // Try by email
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        // Link clerkId to existing email user
        user = await prisma.user.update({
          where: { email },
          data: { clerkId },
        })
      }
    }

    // Create new user if still not found
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          name: name || 'User',
          email: email || `${clerkId}_${Date.now()}@buddybooks.in`,
        },
      })
    }

    const request = await prisma.bookRequest.create({
      data: {
        title,
        author,
        category,
        maxPrice: maxPrice ? parseInt(maxPrice) : null,
        location,
        note,
        userId: user.id,
      },
      include: { user: { select: { name: true, phone: true, clerkId: true } } },
    })

    return Response.json(request)
  } catch (error) {
    console.error('POST /api/requests error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}