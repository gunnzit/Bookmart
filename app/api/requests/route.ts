import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function GET() {
  const requests = await prisma.bookRequest.findMany({
    where: { status: "open" },
    include: { user: { select: { name: true, phone: true, clerkId: true } } },
    orderBy: { createdAt: "desc" },
  })
  return Response.json(requests)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { title, author, category, maxPrice, location, note, clerkId, name, email } = body
  if (!title || !category || !location || !clerkId) {
    return Response.json({ error: "Missing fields" }, { status: 400 })
  }
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: {
      clerkId,
      name: name || "User",
      email: email || (clerkId + "@buddybooks.in"),
    },
  })
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
}
