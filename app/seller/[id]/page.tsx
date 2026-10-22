import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma, firstName } from '@/lib/chat'
import { getReplyStats } from '@/lib/seller-stats'
import VerifiedBadge from '@/components/VerifiedBadge'

export const revalidate = 60

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

function loadSeller(id: string) {
  return prisma.user.findFirst({
    where: { OR: [{ id }, { clerkId: id }] },
    select: { id: true, name: true, createdAt: true, phoneVerifiedAt: true },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const u = await loadSeller(id).catch(() => null)
  const name = u ? firstName(u.name) : 'Seller'
  return {
    title: name + ' on Pageplus',
    description: 'Books listed by ' + name + ' on Pageplus.',
    // Thin personal pages are for buyers who are already looking at a book, not for Google
    robots: { index: false, follow: true },
  }
}

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, lineHeight: 1, color: i <= Math.round(rating) ? '#F5B82E' : '#E8DCD3' }}>★</span>
      ))}
    </span>
  )
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const seller = await loadSeller(id)
  if (!seller) notFound()

  const [soldCount, ratingAgg, reviews, listings, reply] = await Promise.all([
    prisma.listing.count({ where: { sellerId: seller.id, sold: true, status: 'active' } }),
    prisma.review.aggregate({ where: { sellerId: seller.id }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, rating: true, comment: true, createdAt: true, reviewer: { select: { name: true } } },
    }),
    prisma.listing.findMany({
      where: { sellerId: seller.id, status: 'active', sold: false },
      orderBy: { createdAt: 'desc' },
      take: 24,
      select: { id: true, title: true, price: true, origPrice: true, condition: true, location: true, images: true, emoji: true },
    }),
    getReplyStats(seller.id).catch(() => null),
  ])

  const name = firstName(seller.name)
  const verified = !!seller.phoneVerifiedAt
  const reviewTotal = ratingAgg._count._all
  const reviewAvg = reviewTotal > 0 ? Math.round((ratingAgg._avg.rating || 0) * 10) / 10 : 0
  const joined = seller.createdAt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const tiles = [
    { icon: 'sell', v: String(soldCount), l: 'Books sold' },
    { icon: 'star', v: reviewTotal > 0 ? String(reviewAvg) : 'New', l: reviewTotal > 0 ? reviewTotal + (reviewTotal === 1 ? ' review' : ' reviews') : 'No reviews yet' },
    { icon: 'schedule', v: reply ? reply.short : 'New', l: reply ? 'Usually replies' : 'Reply time' },
  ]

  return (
    <div className="min-h-screen text-[#1E1B19] antialiased font-['Plus_Jakarta_Sans',sans-serif]" style={{ background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }}>
      <main className="w-full max-w-md md:max-w-3xl mx-auto px-5 pb-16" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>

        {/* Top bar */}
        <header className="grid grid-cols-[1fr_auto_1fr] items-center mb-5">
          <div className="flex justify-start">
            <a aria-label="Back to the marketplace" href="/marketplace" className={'w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E1B19] active:scale-90 transition-transform ' + SHADOW}>
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </a>
          </div>
          <h1 className="text-[16px] font-semibold">Seller</h1>
          <span />
        </header>

        {/* Who */}
        <section className={'bg-white rounded-[22px] p-5 ' + SHADOW}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FCE3D6] text-[#C4501A] flex items-center justify-center text-[24px] font-bold shrink-0">{name.charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[20px] font-bold tracking-tight truncate">{name}</h2>
                {verified && <VerifiedBadge size={20} />}
              </div>
              <p className="text-[13px] text-[#5E5650] mt-0.5">Joined {joined}</p>
              {verified && <p className="text-[12px] text-[#2E8B57] font-semibold mt-0.5">WhatsApp number verified</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-5">
            {tiles.map(t => (
              <div key={t.icon} className="bg-[#F8EDE6] rounded-[16px] py-3 px-1 flex flex-col items-center gap-0.5 text-center">
                <span className="material-symbols-outlined text-[18px] text-[#E8632B]">{t.icon}</span>
                <span className="text-[15px] leading-[20px] font-bold">{t.v}</span>
                <span className="text-[12px] text-[#5E5650] leading-tight">{t.l}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Their books */}
        <section className="mt-7">
          <h2 className="text-[17px] font-bold mb-3 px-1">Books from {name}{listings.length > 0 ? ' (' + listings.length + ')' : ''}</h2>
          {listings.length === 0 ? (
            <div className={'bg-white rounded-[22px] p-6 text-center ' + SHADOW}>
              <p className="text-[15px] font-semibold">No books listed right now</p>
              <p className="text-[13px] text-[#5E5650] mt-1">Check back soon, or browse what others are selling.</p>
              <a href="/marketplace" className="mt-4 flex items-center justify-center h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Browse books</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {listings.map(l => (
                <a key={l.id} href={'/listing/' + l.id} className={'bg-white rounded-[22px] p-3 block active:scale-[0.99] transition-transform ' + SHADOW}>
                  <div className="w-full aspect-[4/5] rounded-[18px] overflow-hidden bg-[#FFF1EA] flex items-center justify-center text-[36px] mb-2.5">
                    {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /> : <span>{l.emoji || '📚'}</span>}
                  </div>
                  <h3 className="text-[13px] font-bold leading-tight line-clamp-2">{l.title}</h3>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-[15px] font-extrabold">{l.price === 0 ? 'Free' : '₹' + l.price}</span>
                    {l.origPrice != null && l.origPrice > l.price && <span className="text-[12px] text-[#9A908A] line-through">₹{l.origPrice}</span>}
                  </div>
                  {l.condition && <p className="text-[12px] text-[#5E5650] mt-0.5">{l.condition}</p>}
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className={'bg-white rounded-[22px] p-5 mt-7 ' + SHADOW}>
            <h2 className="text-[15px] font-semibold mb-1">Reviews</h2>
            <div className="flex items-center gap-2 mb-4">
              <Stars rating={reviewAvg} size={15} />
              <span className="text-[13px] font-semibold">{reviewAvg}</span>
              <span className="text-[12px] text-[#9A908A]">from {reviewTotal}</span>
            </div>
            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-[#FFF7F2] rounded-2xl p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#FCE3D6] text-[#C4501A] flex items-center justify-center text-[13px] font-bold shrink-0">{firstName(r.reviewer?.name).charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate">{firstName(r.reviewer?.name)}</p>
                        <Stars rating={r.rating} size={11} />
                      </div>
                    </div>
                    <span className="text-[12px] text-[#9A908A] shrink-0">{r.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {r.comment && <p className="text-[13px] text-[#5E5650] leading-relaxed mt-1.5">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-[12px] text-[#9A908A] text-center mt-8">Every listing is checked by our team before it goes live.</p>
      </main>
    </div>
  )
}