'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'

// ── Contact / links (change here only) ────────────────────────────────────
const ADMIN_WA = '919914735738'
const SHARE_BASE = 'https://buddybooks.in' // switch to https://pageplus.in once the domain is verified
const WA_HELP_LINK = 'https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent('Hi, I need help on Pageplus')

const conditions = ['New', 'Good', 'Fair']

const TIERS = [
  { tier: 'basic',    price: 19, days: 3,  label: 'Basic',    desc: '3 days at the top' },
  { tier: 'standard', price: 29, days: 7,  label: 'Standard', desc: '7 days — most popular', popular: true },
  { tier: 'premium',  price: 49, days: 15, label: 'Premium',  desc: '15 days max visibility' },
]

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#E0A100' : '#D9CFC2' }}>★</span>
      ))}
    </span>
  )
}

export default function ListingPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()

  const [logoOk, setLogoOk] = useState(true)
  const [listing, setListing] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [activeImg, setActiveImg] = useState(0)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingWishlist, setSavingWishlist] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showTiers, setShowTiers] = useState(false)
  const [reported, setReported] = useState(false)

  const [reviews, setReviews] = useState<any[]>([])
  const [reviewAvg, setReviewAvg] = useState(0)
  const [reviewTotal, setReviewTotal] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  useEffect(() => {
    fetch('/api/listings/' + id + '?track=true')
      .then(res => res.json())
      .then(data => {
        setListing(data)
        setForm({ title: data.title, subtitle: data.subtitle || '', price: data.price, origPrice: data.origPrice || '', condition: data.condition, location: data.location })
        setLoading(false)
        if (data.sellerId) {
          fetch('/api/reviews?sellerId=' + data.sellerId)
            .then(r => r.json())
            .then(rd => {
              if (rd.reviews) { setReviews(rd.reviews); setReviewAvg(rd.avg); setReviewTotal(rd.total) }
            })
        }
        fetch('/api/listings?t=' + Date.now(), { cache: 'no-store' })
          .then(r => r.json())
          .then(all => {
            if (Array.isArray(all)) {
              const rel = all.filter((l: any) => l.id !== data.id && l.category === data.category && !l.sold).slice(0, 4)
              setRelated(rel)
            }
          })
      })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch('/api/wishlist?userId=' + user.id)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSaved(data.some((w: any) => w.listingId === id)) })
  }, [isSignedIn, user, id])

  const isOwner = isSignedIn && user && listing && user.id === listing.sellerId

  async function toggleWishlist() {
    if (!isSignedIn || !user) { openSignIn(); return }
    setSavingWishlist(true)
    const res = await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, listingId: id }) })
    const data = await res.json()
    setSaved(data.saved)
    setSavingWishlist(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(true)
    await fetch('/api/listings/' + id, { method: 'DELETE' })
    router.push('/marketplace')
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/listings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const updated = await res.json()
    setListing({ ...listing, ...updated })
    setEditing(false)
    setSaving(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareOnWhatsApp() {
    const url = SHARE_BASE + '/listing/' + id
    const text = listing ? ('Check out this listing on Pageplus: ' + listing.title + ' — ' + url) : url
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')
  }

  function reportListing() {
    const text = 'REPORT: Listing "' + (listing?.title || '') + '" (ID: ' + id + ') at ' + SHARE_BASE + '/listing/' + id + ' — Reason: '
    window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(text), '_blank')
    setReported(true)
  }

  // ── Chat with seller ─────────────────────────────────────────────────────
  // One place to change when Pageplus gets its own messaging: replace the body
  // of this function. For now it opens WhatsApp with the seller.
  function openChat() {
    if (!isSignedIn) { openSignIn(); return }
    const phone = String(listing?.seller?.phone || '').replace(/\D/g, '').slice(-10)
    const text = 'Hi, I am interested in your listing on Pageplus: ' + listing.title + ' for Rs.' + listing.price
    const link = phone.length === 10
      ? 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(text)
      : 'https://wa.me/?text=' + encodeURIComponent(text)
    window.open(link, '_blank')
  }

  async function handleFeaturePayment(tier: string, price: number) {
    if (!isSignedIn) { openSignIn(); return }
    if (!(window as any).Razorpay) { alert('Payment is still loading. Please try again in a moment.'); return }
    setPaymentLoading(true)
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, tier }),
      })
      const order = await res.json()
      if (order.error) { alert('Payment failed: ' + JSON.stringify(order.error)); setPaymentLoading(false); return }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Pageplus',
        description: 'Feature listing — ' + (TIERS.find(t => t.tier === tier)?.desc || ''),
        image: '/pageplus-logo.png',
        order_id: order.id,
        handler: async (response: any) => {
          const verify = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, listingId: id }),
          })
          const result = await verify.json()
          if (result.success) { setListing({ ...listing, featured: true }); setShowTiers(false); alert('Your listing is now featured!') }
          else alert('Payment verification failed. Contact support.')
        },
        prefill: { name: user?.fullName, email: user?.primaryEmailAddress?.emailAddress },
        theme: { color: '#C4501A' },
        modal: { ondismiss: () => setPaymentLoading(false) },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch { alert('Something went wrong. Try again.') }
    setPaymentLoading(false)
  }

  async function submitReview() {
    if (!isSignedIn || !user) { openSignIn(); return }
    if (reviewRating === 0) { alert('Please select a star rating'); return }
    setSubmittingReview(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerId: user.id, sellerId: listing.sellerId, listingId: id, rating: reviewRating, comment: reviewComment }),
    })
    const data = await res.json()
    if (data.error === 'already_reviewed') { alert('You have already reviewed this listing'); setSubmittingReview(false); return }
    if (data.id) {
      setReviews(prev => [{ ...data, reviewer: { name: user.fullName } }, ...prev])
      const newTotal = reviewTotal + 1
      const newAvg = Math.round(((reviewAvg * reviewTotal) + reviewRating) / newTotal * 10) / 10
      setReviewAvg(newAvg); setReviewTotal(newTotal)
      setReviewDone(true); setShowReviewForm(false); setReviewRating(0); setReviewComment('')
    }
    setSubmittingReview(false)
  }

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center">
        <div className="text-center text-outline">
          <span className="material-symbols-outlined text-[48px] text-primary animate-pulse">menu_book</span>
          <div className="font-body-sm text-body-sm mt-2">Loading…</div>
        </div>
      </div>
    )
  }

  if (!listing || listing.error) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-5">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-primary">search_off</span>
          <h1 className="font-headline-md text-headline-md text-on-surface mt-2 mb-1">Listing not found</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">It may have been removed by the seller.</p>
          <button onClick={() => router.push('/marketplace')} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md active:scale-[0.98] transition-transform">Browse marketplace</button>
        </div>
      </div>
    )
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const discount = listing.origPrice ? Math.round((1 - listing.price / listing.origPrice) * 100) : 0
  const hasImages = listing.images?.length > 0
  const isVerified = !listing.status || listing.status === 'active'
  const sellerName: string = listing.seller?.name || 'Seller'
  const sellerInitial = sellerName.charAt(0).toUpperCase()
  const canChat = !isOwner && !listing.sold

  const condClass =
    listing.condition === 'New' ? 'text-[#2E8B57]'
    : listing.condition === 'Fair' ? 'text-[#9A6B00]'
    : 'text-primary'

  const iconBtn = 'h-10 px-3 rounded-full bg-surface-container-lowest border border-[#EADFCC] text-on-surface-variant font-label-md text-label-md flex items-center gap-1.5 hover:bg-surface-container-low active:scale-95 transition'
  const inputCls = 'w-full px-4 py-3 rounded-xl bg-white font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-[#E8632B]/20 focus:border-[#E8632B] border border-[#EADFCC]'

  const chatButton = (extra: string) => (
    <button onClick={openChat}
      className={'min-h-[48px] px-space-lg rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-[0_4px_14px_rgba(196,80,26,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ' + extra}>
      <span className="material-symbols-outlined text-[20px]">forum</span>
      <span>{isSignedIn ? 'Chat to buy' : 'Sign in to chat with seller'}</span>
    </button>
  )

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">

      {/* Lightbox */}
      {lightbox && hasImages && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center cursor-zoom-out p-4" onClick={() => setLightbox(false)}>
          <img src={listing.images[activeImg]} alt={listing.title} className="max-w-full max-h-[88vh] object-contain rounded-lg" />
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)]">
        <div className="h-16 px-margin md:px-margin-desktop flex items-center justify-between gap-2 max-w-md mx-auto md:max-w-[1100px]">
          <div className="flex items-center gap-space-sm min-w-0">
            <button aria-label="Back to marketplace" onClick={() => router.push('/marketplace')} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            {logoOk ? (
              <img alt="Pageplus" className="h-8 w-auto object-contain cursor-pointer" src="/pageplus-logo.png" onError={() => setLogoOk(false)} onClick={() => router.push('/')} />
            ) : (
              <span className="font-headline-sm text-headline-sm text-on-surface cursor-pointer" onClick={() => router.push('/')}>Page<span className="text-secondary-container">plus</span></span>
            )}
            <div className="hidden lg:flex items-center gap-1.5 font-body-sm text-body-sm text-outline min-w-0 ml-2">
              <button onClick={() => router.push('/marketplace')} className="text-primary font-semibold">Marketplace</button>
              <span>›</span>
              <span className="capitalize">{listing.category}</span>
              <span>›</span>
              <span className="text-on-surface font-semibold truncate max-w-[260px]">{listing.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isOwner && (
              <button onClick={toggleWishlist} disabled={savingWishlist} aria-label={saved ? 'Remove from saved' : 'Save listing'}
                className={iconBtn + (saved ? ' !bg-error-container !text-on-error-container' : '')}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
              </button>
            )}
            <button onClick={copyLink} aria-label="Copy link" className={iconBtn + (copied ? ' !text-[#2E8B57]' : '')}>
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'link'}</span>
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy link'}</span>
            </button>
            <button onClick={shareOnWhatsApp} aria-label="Share on WhatsApp" className={iconBtn}>
              <span className="material-symbols-outlined text-[18px] text-[#25D366]">share</span>
              <span className="hidden sm:inline">Share</span>
            </button>
            {!isOwner && (
              <button onClick={reportListing} aria-label="Report listing" className={iconBtn + (reported ? ' !bg-error-container !text-on-error-container' : '')}>
                <span className="material-symbols-outlined text-[18px]">flag</span>
                <span className="hidden sm:inline">{reported ? 'Reported' : 'Report'}</span>
              </button>
            )}
            {isOwner && !editing && (
              <>
                <button onClick={() => setEditing(true)} className={iconBtn}>
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button onClick={handleDelete} disabled={deleting} aria-label="Delete listing" className={iconBtn + ' !text-error'}>
                  <span className="material-symbols-outlined text-[18px]">{deleting ? 'hourglass_empty' : 'delete'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-[1100px] pt-16 pb-32 md:pb-16 px-margin md:px-margin-desktop">
        <div className="pt-space-md lg:pt-6">

          {editing ? (
            /* ── Edit form ── */
            <div className="max-w-xl mx-auto bg-surface-container-lowest rounded-2xl p-space-md md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Edit listing</h2>
              </div>
              {(['title', 'subtitle', 'price', 'origPrice', 'location'] as const).map(field => (
                <div key={field} className="mb-3.5">
                  <label className="font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5">
                    {field === 'origPrice' ? 'Original price' : field === 'price' ? 'Price' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input type={['price', 'origPrice'].includes(field) ? 'number' : 'text'} value={form[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })} className={inputCls} />
                </div>
              ))}
              <div className="mb-5">
                <label className="font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5">Condition</label>
                <div className="flex gap-2">
                  {conditions.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, condition: c })}
                      className={'flex-1 py-2.5 rounded-xl font-label-md text-label-md transition-colors ' + (form.condition === c ? 'bg-[#FDE7D8] border-[1.5px] border-[#E8632B] text-[#C4501A] font-semibold' : 'bg-white border border-[#EADFCC] text-[#6B6560]')}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2.5">
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-transform disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
                <button onClick={() => setEditing(false)} className="flex-1 bg-surface-container-low text-on-surface font-label-lg text-label-lg font-semibold py-3.5 rounded-xl border border-[#EADFCC]">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-space-md lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

                {/* LEFT: gallery */}
                <div className="lg:col-span-6 lg:sticky lg:top-24">
                  <div className="relative rounded-2xl overflow-hidden bg-primary-fixed/50 shadow-sm">
                    <div className="relative w-full aspect-[4/3]">
                      {hasImages ? (
                        <img key={activeImg} src={listing.images[activeImg]} alt={listing.title} onClick={() => setLightbox(true)} className="w-full h-full object-cover cursor-zoom-in" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[88px]">{listing.emoji || '📚'}</div>
                      )}
                    </div>
                    {listing.condition && (
                      <span className={'absolute top-3 left-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md font-label-micro text-label-micro font-bold shadow-sm ' + condClass}>{listing.condition}</span>
                    )}
                    {discount >= 15 && !listing.sold && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-primary-container text-on-primary font-label-micro text-label-micro font-bold">-{discount}% OFF</span>
                    )}
                    {listing.featured && !listing.sold && (
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-[#E0A100] text-white font-label-micro text-label-micro font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>Featured
                      </span>
                    )}
                    {hasImages && <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-inverse-surface/70 text-inverse-on-surface font-label-micro text-[10px]">Tap to zoom</span>}
                    {listing.sold && (
                      <div className="absolute inset-0 bg-inverse-surface/65 flex flex-col items-center justify-center">
                        <span className="text-white font-headline-lg text-headline-lg tracking-[0.25em]">SOLD</span>
                        <span className="text-white/70 font-body-sm text-body-sm mt-1">No longer available</span>
                      </div>
                    )}
                  </div>
                  {hasImages && listing.images.length > 1 && (
                    <div className="flex gap-2 mt-2.5 overflow-x-auto scrollbar-none">
                      {listing.images.map((img: string, i: number) => (
                        <img key={i} src={img} alt="" onClick={() => setActiveImg(i)}
                          className={'w-16 h-16 rounded-lg object-cover cursor-pointer shrink-0 transition ' + (activeImg === i ? 'ring-2 ring-primary-container' : 'opacity-60 hover:opacity-100')} />
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT: details */}
                <div className="lg:col-span-6 flex flex-col gap-space-md">

                  {/* Item card */}
                  <section className={'bg-surface-container-lowest rounded-2xl p-space-md md:p-5 shadow-sm flex flex-col gap-3 ' + (listing.featured ? 'ring-2 ring-[#E0A100]/50' : '')}>
                    {isVerified && (
                      <span className="self-start inline-flex items-center gap-1 bg-[#2E8B57]/10 text-[#2E8B57] px-2 py-0.5 rounded-full font-label-micro text-label-micro font-bold">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Verified
                      </span>
                    )}
                    <h1 className={'font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg font-semibold leading-snug ' + (listing.sold ? 'text-outline' : 'text-on-surface')}>{listing.title}</h1>
                    {listing.subtitle && <p className="font-body-md text-body-md text-on-surface-variant -mt-1">{listing.subtitle}</p>}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={'font-display-mobile md:font-display text-[32px] font-bold ' + (listing.sold ? 'text-outline' : 'text-primary')}>₹{listing.price}</span>
                      {listing.origPrice && <span className="font-body-md text-body-md text-outline line-through">₹{listing.origPrice}</span>}
                      {discount > 0 && !listing.sold && (
                        <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded font-label-micro text-label-micro font-bold">Save ₹{listing.origPrice - listing.price}</span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {listing.location && (
                        <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full font-label-md text-label-md text-on-surface-variant">
                          <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>{listing.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full font-label-md text-label-md text-on-surface-variant capitalize">
                        <span className="material-symbols-outlined text-[15px] text-primary">sell</span>{listing.category}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full font-label-md text-label-md text-on-surface-variant">
                        <span className="material-symbols-outlined text-[15px] text-primary">visibility</span>{listing.views || 0} views
                      </span>
                      {reviewTotal > 0 && (
                        <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full font-label-md text-label-md text-on-surface-variant">
                          <Stars rating={reviewAvg} size={11} /><b>{reviewAvg}</b><span className="text-outline">({reviewTotal})</span>
                        </span>
                      )}
                    </div>

                    {/* Seller row */}
                    <div className="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-lg font-bold shrink-0">{sellerInitial}</div>
                        <div className="min-w-0">
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface truncate">{sellerName}</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                            {reviewTotal > 0 ? (<><Stars rating={reviewAvg} size={11} /><span>{reviewAvg} ({reviewTotal} review{reviewTotal !== 1 ? 's' : ''})</span></>) : <span>No reviews yet</span>}
                          </div>
                        </div>
                      </div>
                      {isVerified && <span className="material-symbols-outlined text-[#2E8B57] text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    </div>
                  </section>

                  {/* Verified card */}
                  {isVerified && (
                    <section className="bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#2E8B57] text-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        </div>
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface">Verified listing</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[#2E8B57] text-[16px]">check</span>
                          <span className="font-body-sm text-body-sm">Seller&apos;s phone number verified</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[#2E8B57] text-[16px]">check</span>
                          <span className="font-body-sm text-body-sm">Listing approved by Pageplus</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Action area */}
                  {isOwner ? (
                    <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-2.5">
                      <div className="bg-[#2E8B57]/10 text-[#2E8B57] rounded-xl p-3 text-center font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>This is your listing
                      </div>
                      {listing.status && listing.status !== 'active' && (
                        <div className={'rounded-xl p-2.5 text-center font-label-md text-label-md font-semibold ' + (listing.status === 'rejected' ? 'bg-error-container text-on-error-container' : 'bg-[#E0A100]/15 text-[#9A6B00]')}>
                          {listing.status === 'rejected' ? 'Not approved — please check your photos and list again.' : 'Waiting for approval — it will go live once checked.'}
                        </div>
                      )}
                      {listing.featured ? (
                        <div className="bg-[#E0A100]/10 border border-[#E0A100] rounded-xl p-3 text-center font-label-md text-label-md font-bold text-[#9A6B00] flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>Featured — showing at the top of the marketplace
                        </div>
                      ) : !listing.sold ? (
                        <div>
                          <button onClick={() => setShowTiers(s => !s)}
                            className={'w-full rounded-xl px-4 py-3 font-label-lg text-label-lg font-bold flex items-center justify-between transition-colors ' + (showTiers ? 'bg-surface-container-low text-on-surface' : 'bg-primary-container text-on-primary shadow-md')}>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">star</span>Feature this listing</span>
                            <span className="material-symbols-outlined text-[20px] transition-transform" style={{ transform: showTiers ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                          </button>
                          {showTiers && (
                            <div className="mt-2 flex flex-col gap-2">
                              <p className="font-body-sm text-body-sm text-on-surface-variant">Choose a plan — your listing appears at the top:</p>
                              {TIERS.map(t => (
                                <button key={t.tier} onClick={() => handleFeaturePayment(t.tier, t.price)} disabled={paymentLoading}
                                  className={'w-full rounded-xl px-4 py-3 flex items-center justify-between text-left transition active:scale-[0.99] disabled:opacity-50 ' + (t.popular ? 'bg-[#FDE7D8] border-[1.5px] border-[#E8632B]' : 'bg-white border border-[#EADFCC]')}>
                                  <div>
                                    <div className="font-label-lg text-label-lg font-bold text-on-surface flex items-center gap-2">
                                      {t.label}
                                      {t.popular && <span className="bg-primary-container text-on-primary font-label-micro text-label-micro px-1.5 py-0.5 rounded-full">Popular</span>}
                                    </div>
                                    <div className="font-body-sm text-body-sm text-on-surface-variant">{t.desc}</div>
                                  </div>
                                  <span className="font-headline-sm text-headline-sm font-bold text-primary shrink-0">₹{t.price}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                      <button onClick={() => router.push('/marketplace')} className="w-full rounded-xl py-3 border border-[#EADFCC] text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-low">Back to listings</button>
                    </section>
                  ) : listing.sold ? (
                    <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-2.5">
                      <div className="bg-surface-container rounded-xl p-3 text-center font-label-md text-label-md text-on-surface-variant flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">lock</span>This item has been sold
                      </div>
                      <button onClick={() => router.push('/marketplace')} className="w-full rounded-xl py-3 border border-[#EADFCC] text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-low">Back to listings</button>
                    </section>
                  ) : (
                    <>
                      {/* How buying works */}
                      <section className="bg-surface-container rounded-2xl p-space-md flex flex-col gap-3">
                        <h2 className="font-label-lg text-label-lg font-semibold text-on-surface">How buying works</h2>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { icon: 'forum', t: '1. Chat', s: 'Message the seller' },
                            { icon: 'event_available', t: '2. Decide', s: 'Agree time & place' },
                            { icon: 'handshake', t: '3. Meet & pay', s: 'Check, then pay' },
                          ].map(x => (
                            <div key={x.t} className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm mb-1.5 text-primary">
                                <span className="material-symbols-outlined text-[20px]">{x.icon}</span>
                              </div>
                              <span className="font-label-md text-[12px] text-on-surface font-semibold">{x.t}</span>
                              <span className="font-body-sm text-[11px] text-outline leading-tight mt-0.5">{x.s}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                      <div className="hidden md:block">{chatButton('w-full')}</div>
                    </>
                  )}

                  {/* Safety tip */}
                  <section className="bg-primary-fixed/40 rounded-2xl p-space-md flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                    </div>
                    <div>
                      <h2 className="font-label-md text-label-md font-semibold text-on-surface">Stay safe when buying</h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Meet in a <strong className="text-on-surface">public place</strong>, check the book before you pay, and <strong className="text-on-surface">never share an OTP</strong> or bank details.</p>
                    </div>
                  </section>
                </div>
              </div>

              {/* Seller reviews */}
              <section className="mt-space-lg bg-surface-container-lowest rounded-2xl p-space-md md:p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h2 className="font-headline-sm md:font-headline-md text-headline-sm md:text-headline-md text-on-surface mb-1">Seller reviews</h2>
                    {reviewTotal > 0 ? (
                      <div className="flex items-center gap-2">
                        <Stars rating={reviewAvg} size={16} />
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">{reviewAvg}</span>
                        <span className="font-body-sm text-body-sm text-outline">from {reviewTotal} review{reviewTotal !== 1 ? 's' : ''}</span>
                      </div>
                    ) : (
                      <span className="font-body-sm text-body-sm text-outline">No reviews yet — be the first!</span>
                    )}
                  </div>
                  {!isOwner && isSignedIn && !reviewDone && (
                    <button onClick={() => setShowReviewForm(s => !s)} className={'rounded-full px-4 py-2 font-label-md text-label-md font-bold transition-colors ' + (showReviewForm ? 'bg-surface-container-low text-on-surface' : 'bg-primary-container text-on-primary shadow-sm')}>
                      {showReviewForm ? 'Cancel' : 'Leave a review'}
                    </button>
                  )}
                  {!isOwner && !isSignedIn && (
                    <button onClick={() => openSignIn()} className="rounded-full px-4 py-2 bg-surface-container-low text-on-surface font-label-md text-label-md font-semibold">Sign in to review</button>
                  )}
                </div>

                {reviewDone && (
                  <div className="bg-[#2E8B57]/10 text-[#2E8B57] rounded-xl p-3 mb-4 font-label-md text-label-md font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>Thanks for your review! It helps other buyers.
                  </div>
                )}

                {showReviewForm && !reviewDone && (
                  <div className="bg-surface-container-low rounded-xl p-4 mb-4 border border-[#E8632B]/40">
                    <p className="font-label-lg text-label-lg font-semibold text-on-surface mb-2">Rate your experience with this seller</p>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button key={i} aria-label={i + ' star'} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => setReviewRating(i)} className="text-[28px] leading-none p-0.5 hover:scale-110 transition-transform">
                          <span style={{ color: i <= (hoverRating || reviewRating) ? '#E0A100' : '#D9CFC2' }}>★</span>
                        </button>
                      ))}
                      {reviewRating > 0 && <span className="font-body-sm text-body-sm text-on-surface-variant ml-1.5">{['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][reviewRating]}</span>}
                    </div>
                    <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience (optional)…" rows={3} className={inputCls + ' resize-none mb-3'} />
                    <button onClick={submitReview} disabled={submittingReview || reviewRating === 0} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-2.5 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      {submittingReview ? 'Submitting…' : 'Submit review'}
                    </button>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {reviews.map((r: any) => (
                      <div key={r.id} className="bg-surface-container-low rounded-xl p-3.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-md font-bold shrink-0">{r.reviewer?.name?.charAt(0).toUpperCase() || '?'}</div>
                            <div>
                              <div className="font-label-md text-label-md font-semibold text-on-surface">{r.reviewer?.name || 'Anonymous'}</div>
                              <Stars rating={r.rating} size={11} />
                            </div>
                          </div>
                          <span className="font-body-sm text-[12px] text-outline">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {r.comment && <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mt-1">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  !showReviewForm && (
                    <div className="text-center py-6 text-outline">
                      <span className="material-symbols-outlined text-[32px]">star</span>
                      <p className="font-body-sm text-body-sm mt-1">No reviews yet for this seller</p>
                    </div>
                  )
                )}
              </section>

              {/* Related */}
              {related.length > 0 && (
                <section className="mt-space-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-headline-sm md:font-headline-md text-headline-sm md:text-headline-md text-on-surface capitalize">More {listing.category}s you might like</h2>
                    <button onClick={() => router.push('/marketplace')} className="font-label-md text-label-md text-primary font-semibold">See all</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {related.map(l => {
                      const d = l.origPrice ? Math.round((1 - l.price / l.origPrice) * 100) : 0
                      return (
                        <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className="bg-surface-container-lowest rounded-2xl p-2.5 shadow-sm hover:shadow-md transition cursor-pointer">
                          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-primary-fixed/50 mb-2 flex items-center justify-center text-[36px]">
                            {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /> : <span>{l.emoji || '📚'}</span>}
                            {l.condition && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 text-primary font-label-micro text-[10px] font-bold">{l.condition}</span>}
                            {d >= 15 && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-primary-container text-on-primary font-label-micro text-[10px] font-bold">-{d}%</span>}
                          </div>
                          <h3 className="font-label-lg text-label-lg font-semibold text-on-surface line-clamp-1">{l.title}</h3>
                          {l.location && <p className="font-body-sm text-[12px] text-outline truncate">{l.location}</p>}
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="font-headline-sm text-[17px] font-bold text-primary">₹{l.price}</span>
                            {l.origPrice && <span className="font-body-sm text-[12px] text-outline line-through">₹{l.origPrice}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {/* Sticky chat bar (phones) */}
      {!editing && canChat && (
        <aside className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-8px_24px_rgba(45,30,18,0.08)]">
          <div className="max-w-md mx-auto px-margin py-space-sm flex items-center justify-between gap-space-md">
            <div className="flex flex-col shrink-0">
              <span className="font-label-md text-label-md text-on-surface-variant">Price</span>
              <span className="font-headline-md text-headline-md text-on-surface">₹{listing.price}</span>
            </div>
            {chatButton('flex-1')}
          </div>
        </aside>
      )}
    </div>
  )
}