import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isKnownItem } from '@/lib/kit-prices'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

// GET — PUBLIC. Returns the list of out-of-stock item names so the kit page can
// disable them. Fails OPEN (empty list) so a DB hiccup never breaks the store.
export async function GET() {
  try {
    const rows = await prisma.outOfStockItem.findMany({ select: { name: true } })
    return NextResponse.json({ outOfStock: rows.map(r => r.name) })
  } catch {
    return NextResponse.json({ outOfStock: [] })
  }
}

// PATCH — ADMIN only. Toggle an item in/out of stock.
// Body: { itemName: string, inStock: boolean }
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId || userId !== ADMIN_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { itemName, inStock } = await request.json()
    if (!itemName || typeof inStock !== 'boolean') {
      return NextResponse.json({ error: 'Need itemName and inStock(boolean)' }, { status: 400 })
    }
    if (!isKnownItem(itemName)) {
      return NextResponse.json({ error: 'Unknown item: ' + itemName }, { status: 400 })
    }

    if (inStock) {
      // back in stock → remove from the out-of-stock table
      await prisma.outOfStockItem.deleteMany({ where: { name: itemName } })
    } else {
      // out of stock → add it (idempotent)
      await prisma.outOfStockItem.upsert({
        where: { name: itemName },
        update: {},
        create: { name: itemName },
      })
    }

    return NextResponse.json({ ok: true, itemName, inStock })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}