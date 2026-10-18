import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'
import { SETS_OPEN } from '@/lib/features'

// Rebuild the sitemap at most once an hour so new listings show up without hitting the database on every crawl
export const revalidate = 3600

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://pageplus.in'
  const now = new Date()

  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    ...(SETS_OPEN ? [{ url: `${base}/school-sets`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 }] : []),
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/requests`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/sell`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Every live, unsold listing. If the database is unreachable, the fixed pages are still served.
  let listings: MetadataRoute.Sitemap = []
  try {
    const rows = await prisma.listing.findMany({
      where: { status: 'active', sold: false },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })
    listings = rows.map(l => ({
      url: `${base}/listing/${l.id}`,
      lastModified: l.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    listings = []
  }

  return [...pages, ...listings]
}