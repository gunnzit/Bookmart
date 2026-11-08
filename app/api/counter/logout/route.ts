import { NextResponse } from 'next/server'
import { endShift } from '@/lib/counter'

export const dynamic = 'force-dynamic'

// POST: Lock the counter (the next person picks their name and PIN)
export async function POST() {
  await endShift()
  return NextResponse.json({ ok: true })
}
