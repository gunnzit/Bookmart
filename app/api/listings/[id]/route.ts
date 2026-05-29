import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const track = searchParams.get('track') === 'true'

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: true },
    })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Increment view count only when track=true (from listing detail page)
    if (track) {
      await prisma.listing.update({
        where: { id },
        data: { views: { increment: 1 } },
      })
    }

    return NextResponse.json({ ...listing, views: track ? listing.views + 1 : listing.views })
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

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.subtitle !== undefined) data.subtitle = body.subtitle
    if (body.price !== undefined) data.price = Number(body.price)
    if (body.origPrice !== undefined) data.origPrice = body.origPrice ? Number(body.origPrice) : null
    if (body.condition !== undefined) data.condition = body.condition
    if (body.location !== undefined) data.location = body.location
    if (body.sold !== undefined) data.sold = body.sold

    const listing = await prisma.listing.update({
      where: { id },
      data,
    })
    return NextResponse.json(listing)
  } catch (error) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}