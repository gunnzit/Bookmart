import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clerkId, name, email } = body

    let user = await prisma.user.findFirst({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: clerkId,
          name: name || 'Anonymous',
          email,
        }
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}