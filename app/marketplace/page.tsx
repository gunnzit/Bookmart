import type { Metadata } from 'next'
import { prisma } from '@/lib/chat'
import MarketplaceClient from './MarketplaceClient'

// The first batch of books is put into the page on the server, so Google (and slow phones) see real books straight away
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Buy Second-Hand Books in Chandigarh',
  description: 'Browse second-hand textbooks, novels, notebooks and stationery from students in Chandigarh, Mohali and Panchkula. Chat with the seller, meet nearby and pay when happy.',
  alternates: { canonical: '/marketplace' },
}

export default async function MarketplacePage() {
  let initial: any[] = []
  try {
    const rows = await prisma.listing.findMany({
      where: { status: 'active' },
      include: { seller: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    // Plain data for the browser part (dates become text)
    initial = JSON.parse(JSON.stringify(rows))
  } catch {
    initial = []
  }
  return <MarketplaceClient initial={initial} />
}