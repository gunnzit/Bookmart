import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function DELETE(req: Request, context: any) {
  const { id } = await context.params
  await prisma.bookRequest.update({ where: { id }, data: { status: 'closed' } })
  return Response.json({ success: true })
}