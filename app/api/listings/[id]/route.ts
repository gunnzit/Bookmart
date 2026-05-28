import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: true },
    })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(listing)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const { id } = await context.params
    await prisma.listing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: any) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const listing = await prisma.listing.update({
      where: { id },
      data: {
  title: body.title,
  subtitle: body.subtitle,
  price: Number(body.price),
  origPrice: body.origPrice ? Number(body.origPrice) : null,
  condition: body.condition,
  location: body.location,
  sold: body.sold !== undefined ? body.sold : undefined,
},
    })
    return NextResponse.json(listing)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}