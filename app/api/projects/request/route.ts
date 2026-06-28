import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
import { PROJECT_STATUS, sendProjectAlert, uploadProjectPhoto } from '@/lib/projects'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Please sign in to request a project.' }, { status: 401 })

  const form = await req.formData()
  const get = (k: string) => (form.get(k)?.toString() || '').trim()
  const category = get('category')
  const topic = get('topic')
  const classLevel = get('classLevel')
  const deadlineStr = get('deadline')
  const size = get('size')
  const description = get('description')
  const buyerName = get('buyerName')
  const phone = get('phone').replace(/\D/g, '').slice(0, 10)

  if (!category || !topic || !classLevel || !deadlineStr)
    return NextResponse.json({ error: 'Please fill category, topic, class and deadline.' }, { status: 400 })
  if (phone.length !== 10)
    return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 })
  const deadline = new Date(deadlineStr)
  if (isNaN(deadline.getTime()))
    return NextResponse.json({ error: 'Invalid deadline date.' }, { status: 400 })

  let photoUrl: string | null = null
  const file = form.get('photo')
  if (file && typeof file !== 'string') {
    const f = file as File
    if (f.size > 0) {
      if (f.size > 6 * 1024 * 1024)
        return NextResponse.json({ error: 'Photo too large (max 6MB).' }, { status: 400 })
      const buf = Buffer.from(await f.arrayBuffer())
      photoUrl = await uploadProjectPhoto(buf, f.type || 'image/jpeg', f.name || 'photo.jpg')
    }
  }

  const created = await prisma.projectRequest.create({
    data: {
      userId, buyerName, phone, category, topic, classLevel, deadline,
      size: size || null, description: description || null, photoUrl,
      status: PROJECT_STATUS.QUOTE_REQUESTED,
    },
  })

  await sendProjectAlert(
    '🆕 <b>New project request</b>\n' + category + ' — ' + topic +
    '\nClass ' + classLevel + ' · due ' + deadlineStr +
    '\nBy ' + (buyerName || 'student') + ' (' + phone + ')\nID ' + created.id
  )
  return NextResponse.json({ ok: true, id: created.id })
}