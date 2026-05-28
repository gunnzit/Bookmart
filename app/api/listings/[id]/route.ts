import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET(
  request: Request,
  context: any
) {
  try {
    const { id } = await context.params
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: true },
    })
    if (!listing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(listing)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}