import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
import { isAdmin } from '@/lib/projects'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const admin = isAdmin(userId)
  const items = await prisma.projectRequest.findMany({
    where: admin ? {} : { userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ items, admin })
}