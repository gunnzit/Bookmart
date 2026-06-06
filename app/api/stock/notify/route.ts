import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isKnownItem } from '@/lib/kit-prices'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const ADMIN_ID = process.env.ADMIN_CLERK_ID || 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

// POST — PUBLIC. A customer asks to be notified when an item is back.
// Body: { itemName, phone, buyerName? }
export async function POST(request: Request) {
  try {
    const { itemName, phone, buyerName } = await request.json()

    if (!itemName || !isKnownItem(itemName)) {
      return NextResponse.json({ error: 'Unknown item' }, { status: 400 })
    }
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 })
    }

    // Upsert so the same person can't pile up duplicate requests for one item.
    await prisma.stockNotify.upsert({
      where: { itemName_phone: { itemName, phone: cleanPhone } },
      update: { notified: false, buyerName: buyerName || undefined },
      create: { itemName, phone: cleanPhone, buyerName: buyerName || null },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET — ADMIN only. All notify requests (newest first).
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId || userId !== ADMIN_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const rows = await prisma.stockNotify.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PATCH — ADMIN only. Mark a request as notified (after you WhatsApp them),
// or delete it. Body: { id, notified } or { id, delete: true }
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId || userId !== ADMIN_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id, notified, delete: del } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (del) {
      await prisma.stockNotify.delete({ where: { id } })
      return NextResponse.json({ ok: true, deleted: true })
    }

    await prisma.stockNotify.update({ where: { id }, data: { notified: !!notified } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}