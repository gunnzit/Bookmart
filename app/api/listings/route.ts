import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(listings)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('POST body received:', body)
    const listing = await prisma.listing.create({
      data: {
        title: body.title,
        subtitle: body.subtitle || '',
        price: Number(body.price),
        origPrice: body.origPrice ? Number(body.origPrice) : null,
        condition: body.condition,
        category: body.category,
        emoji: body.emoji || '📗',
        location: body.location,
        sellerId: body.sellerId,
      },
    })
    return NextResponse.json(listing)
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}