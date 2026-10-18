'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'

// ── Contact / links (change here only) ────────────────────────────────────
const ADMIN_WA = '919914735738'
const SHARE_BASE = 'https://pageplus.in'

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

// Frosted glass, the same look as the bottom bar and the Sets page
const GLASS: CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.7)',
  boxShadow: '0 6px 20px rgba(120,70,40,0.12)',
}

const CONDITIONS = ['New', 'Good', 'Fair']
const CONDITION_DESC: Record<string, string> = {
  New: 'Unused, sealed or as good as new.',
  Good: 'Minor wear only, nothing missing.',
  Fair: 'Used but fully readable, may have marks.',
}

const TIERS = [
  { tier: 'basic', price: 19, label: 'Basic', desc: '3 days at the top' },
  { tier: 'standard', price: 29, label: 'Standard', desc: '7 days, most popular', popular: true },
  { tier: 'premium', price: 49, label: 'Premium', desc: '15 days, maximum visibility' },
]

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, lineHeight: 1, color: i <= Math.round(rating) ? '#F5B82E' : '#E8DCD3' }}>★</span>
      ))}
    </span>
  )
}

function timeAgo(iso?: string) {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return mins <= 1 ? 'just now' : mins + ' mins ago'
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return hrs + (hrs === 1 ? ' hr ago' : ' hrs ago')
  const days = Math.round(hrs / 24)
  if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago')
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const firstName = (n?: string | null) => String(n || '').trim().split(/\s+/)[0] || 'Seller'

export default function ListingPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()

  const galleryRef = useRef<HTMLDivElement>(null)

  const [listing, setListing] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [activeImg, setActiveImg] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingWishlist, setSavingWishlist] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showTiers, setShowTiers] = useState(false)
  const [chatBusy, setChatBusy] = useState('')
  const [toast, setToast] = useState('')

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
        if (data && !data.error) {
          setForm({ title: data.title, subtitle: data.subtitle || '', price: data.price, origPrice: data.origPrice || '', condition: data.condition, location: data.location })
          if (data.sellerId) {
            fetch('/api/reviews?sellerId=' + data.sellerId)
              .then(r => r.json())
              .then(rd => { if (rd.reviews) { setReviews(rd.reviews); setReviewAvg(rd.avg); setReviewTotal(rd.total) } })
              .catch(() => {})
          }
          fetch('/api/listings?t=' + Date.now(), { cache: 'no-store' })
            .then(r => r.json())
            .then(all => {
              if (Array.isArray(all)) {
                setRelated(all.filter((l: any) => l.id !== data.id && l.category === data.category && !l.sold && (!l.status || l.status === 'active')).slice(0, 4))
              }
            })
            .catch(() => {})
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch('/api/wishlist?userId=' + user.id)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSaved(data.some((w: any) => w.listingId === id)) })
      .catch(() => {})
  }, [isSignedIn, user, id])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const isOwner = !!(isSignedIn && user && listing && user.id === listing.sellerId)

  async function toggleWishlist() {
    if (!isSignedIn || !user) { openSignIn(); return }
    setSavingWishlist(true)
    try {
      const res = await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, listingId: id }) })
      const data = await res.json()
      setSaved(!!data.saved)
    } catch {}
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
    try {
      const res = await fetch('/api/listings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const updated = await res.json()
      if (updated && !updated.error) setListing({ ...listing, ...updated })
      else alert((updated && updated.error) || 'Could not save. Please try again.')
    } catch { alert('Could not save. Please try again.') }
    setEditing(false)
    setSaving(false)
  }

  async function shareBook() {
    const url = SHARE_BASE + '/listing/' + id
    const text = listing ? 'Check out this book on Pageplus: ' + listing.title : 'Check out this book on Pageplus'
    try {
      if (navigator.share) { await navigator.share({ title: listing?.title || 'Pageplus', text, url }); return }
    } catch { return }
    try {
      await navigator.clipboard.writeText(url)
      setToast('Link copied')
    } catch {
      window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank')
    }
  }

  function reportListing() {
    const text = 'REPORT: Listing "' + (listing?.title || '') + '" (ID: ' + id + ') at ' + SHARE_BASE + '/listing/' + id + ' — Reason: '
    window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(text), '_blank')
  }

  async function startChat(listingId: string) {
    if (chatBusy) return
    setChatBusy(listingId)
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.id) { router.push('/messages/' + d.id); return }
      alert(typeof d.error === 'string' && d.error.length < 120 ? d.error : 'Could not start the chat. Please try again.')
    } catch {
      alert('Could not start the chat. Please check your connection.')
    }
    setChatBusy('')
  }

  function openChat() {
    if (!isSignedIn) { openSignIn(); return }
    startChat(id)
  }

  async function handleFeaturePayment(tier: string) {
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
        image: '/pwa-icon/192',
        order_id: order.id,
        handler: async (response: any) => {
          const verify = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, listingId: id }),
          })
          const result = await verify.json()
          if (result.success) { setListing({ ...listing, featured: true }); setShowTiers(false); setToast('Your listing is now featured') }
          else alert('Payment verification failed. Contact support.')
        },
        prefill: { name: user?.fullName, email: user?.primaryEmailAddress?.emailAddress },
        theme: { color: '#E8632B' },
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

  function onGalleryScroll() {
    const el = galleryRef.current
    if (!el || !el.clientWidth) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== activeImg) setActiveImg(i)
  }

  function goToImage(i: number) {
    const el = galleryRef.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setActiveImg(i)
  }

  const iconBtn = 'relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E1B19] active:scale-90 transition-transform ' + SHADOW
  const inputCls = 'w-full px-4 py-3 rounded-2xl bg-[#FFF1EA] text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] border border-transparent focus:outline-none focus:bg-white focus:border-[#E8632B] focus:ring-2 focus:ring-[#E8632B]/20'
  const pageBg = { background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }
  const pageCls = 'min-h-screen text-[#1E1B19] antialiased font-[\'Plus_Jakarta_Sans\',sans-serif]'

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={pageCls} style={pageBg}>
        <div className="w-full max-w-md mx-auto px-5 flex flex-col gap-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          <div className="h-10 w-10 rounded-full bg-white/70 animate-pulse" />
          <div className="aspect-[4/5] rounded-[22px] bg-white/70 animate-pulse" />
          <div className="h-32 rounded-[22px] bg-white/70 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!listing || listing.error) {
    return (
      <div className={pageCls + ' flex items-center justify-center p-5'} style={pageBg}>
        <div className={'bg-white rounded-[22px] p-6 text-center max-w-sm w-full ' + SHADOW}>
          <h1 className="text-[18px] font-bold mb-1">Book not found</h1>
          <p className="text-[14px] text-[#5E5650] mb-5">It may have been removed by the seller.</p>
          <button onClick={() => router.push('/marketplace')} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Browse books</button>
        </div>
      </div>
    )
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const images: string[] = Array.isArray(listing.images) ? listing.images : []
  const hasImages = images.length > 0
  const sold = !!listing.sold
  const live = !listing.status || listing.status === 'active'
  const discount = listing.origPrice && listing.price ? Math.round((1 - listing.price / listing.origPrice) * 100) : 0
  const sellerName = firstName(listing.seller?.name)
  const canChat = !isOwner && !sold
  const note = String(listing.subtitle || '').trim()

  const chatButton = (cls: string) => (
    <button onClick={openChat} disabled={!!chatBusy} className={'disabled:opacity-70 h-[52px] rounded-full bg-[#E8632B] text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_6px_20px_rgba(232,99,43,0.3)] ' + cls}>
      <span className={'material-symbols-outlined text-[20px] ' + (chatBusy ? 'animate-spin' : '')}>{chatBusy ? 'progress_activity' : 'chat_bubble'}</span>
      {chatBusy ? 'Opening chat…' : isSignedIn ? 'Chat to buy' : 'Sign in to chat'}
    </button>
  )

  // ── Edit form (owner) ────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className={pageCls} style={pageBg}>
        <main className="w-full max-w-md mx-auto px-5 pb-12" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          <header className="flex items-center justify-between mb-5">
            <button aria-label="Cancel" onClick={() => setEditing(false)} className={iconBtn}><span className="material-symbols-outlined text-[22px]">arrow_back</span></button>
            <h1 className="text-[16px] font-semibold">Edit listing</h1>
            <span className="w-10" />
          </header>
          <div className={'bg-white rounded-[22px] p-5 flex flex-col gap-4 ' + SHADOW}>
            {(['title', 'subtitle', 'location'] as const).map(f => (
              <div key={f}>
                <label className="text-[12px] text-[#9A908A] block mb-1.5">{f === 'subtitle' ? 'Note for buyers' : cap(f)}</label>
                <input type="text" value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} className={inputCls} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {(['price', 'origPrice'] as const).map(f => (
                <div key={f}>
                  <label className="text-[12px] text-[#9A908A] block mb-1.5">{f === 'price' ? 'Your price (₹)' : 'Original price (₹)'}</label>
                  <input type="number" value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} className={inputCls} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[12px] text-[#9A908A] block mb-1.5">Condition</label>
              <div className="flex gap-2">
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, condition: c })}
                    className={'flex-1 h-11 rounded-full text-[14px] transition-colors active:scale-95 ' + (form.condition === c ? 'bg-[#E8632B] text-white font-semibold' : 'bg-[#FFF1EA] text-[#1E1B19] font-medium')}>{c}</button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
            <button onClick={() => setEditing(false)} className="text-[14px] font-semibold text-[#5E5650] active:opacity-70">Cancel</button>
          </div>
        </main>
      </div>
    )
  }

  // ── Page ─────────────────────────────────────────────────────────────────
  return (
    <div className={pageCls} style={pageBg}>

      {/* Photo viewer */}
      {lightbox && hasImages && (
        <div className="fixed inset-0 z-[400] bg-black/85 flex items-center justify-center p-5" onClick={() => setLightbox(false)}>
          <img src={images[activeImg]} alt={listing.title} className="max-w-full max-h-[85vh] object-contain rounded-[22px]" />
          <button aria-label="Close" onClick={() => setLightbox(false)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 flex justify-center pointer-events-none px-5" style={{ zIndex: 350, top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
          <div className="bg-[#1E1B19] text-white rounded-full px-4 py-2.5 text-[13px] shadow-[0_10px_28px_rgba(30,27,25,0.28)]">{toast}</div>
        </div>
      )}

      <main className={'w-full max-w-md md:max-w-5xl mx-auto px-5 ' + (canChat ? 'pb-32 lg:pb-16' : 'pb-16')} style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>

        {/* Top bar */}
        <header className="flex items-center justify-between mb-4">
          <button aria-label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/marketplace'))} className={iconBtn}>
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 className="text-[16px] font-semibold">Book detail</h1>
          <button aria-label="Share" onClick={shareBook} className={iconBtn}>
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </header>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

          {/* LEFT: photos */}
          <div className="lg:col-span-6 lg:sticky lg:top-6">
            <div className={'bg-white rounded-[22px] p-3 ' + SHADOW}>
              <div className="relative w-full aspect-[4/5] rounded-[18px] overflow-hidden bg-[#FFF1EA]">
                {hasImages ? (
                  <div
                    ref={galleryRef}
                    onScroll={onGalleryScroll}
                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {images.map((src, i) => (
                      <img key={i} src={src} alt={listing.title} onClick={() => setLightbox(true)}
                        className={'min-w-full w-full h-full object-cover snap-center cursor-zoom-in ' + (sold ? 'opacity-60' : '')} />
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[88px]">{listing.emoji || '📚'}</div>
                )}

                {!isOwner && (
                  <button aria-label={saved ? 'Remove from saved' : 'Save book'} onClick={toggleWishlist} disabled={savingWishlist}
                    className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform shadow-[0_4px_12px_rgba(120,70,40,0.12)]">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: saved ? '#E8632B' : '#1E1B19', fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                  </button>
                )}

                {listing.featured && !sold && (
                  <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full bg-white/95 text-[12px] font-semibold flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-[#F5B82E]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>Featured
                  </span>
                )}

                {listing.condition && !sold && (
                  <span className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[12px] font-medium shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2E8B57]" />Condition: {listing.condition}
                  </span>
                )}

                {sold && (
                  <div className="absolute inset-0 bg-[#1E1B19]/35 flex items-center justify-center pointer-events-none">
                    <span className="px-4 py-1.5 rounded-full bg-white text-[14px] font-bold">Sold</span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
                  {images.map((_, i) => (
                    <button key={i} aria-label={'Photo ' + (i + 1)} onClick={() => goToImage(i)}
                      className={'h-1.5 rounded-full transition-all ' + (i === activeImg ? 'w-5 bg-[#E8632B]' : 'w-1.5 bg-[#F0E2DA]')} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: details */}
          <div className="lg:col-span-6 flex flex-col gap-5 mt-5 lg:mt-0">

            {/* Price and title */}
            <section className={'bg-white rounded-[22px] p-5 ' + SHADOW}>
              <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                <span className={'text-[24px] leading-7 font-bold ' + (sold ? 'text-[#9A908A]' : '')}>{Number(listing.price) === 0 ? 'Free' : '₹' + listing.price}</span>
                {Number(listing.origPrice) > Number(listing.price) && <span className="text-[14px] text-[#9A908A] line-through">₹{listing.origPrice}</span>}
                {discount > 0 && !sold && <span className="text-[12px] font-semibold text-[#E8632B]">{discount}% off</span>}
              </div>
              <h2 className="text-[20px] font-bold tracking-tight leading-snug">{listing.title}</h2>
              {listing.location && (
                <p className="text-[14px] text-[#5E5650] mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-[#9A908A]">location_on</span>
                  <span>{listing.location}</span>
                </p>
              )}
              <div className="mt-4 pt-3.5 border-t border-[#F0E2DA] flex items-center justify-between gap-3 text-[12px]">
                {live
                  ? <span className="flex items-center gap-1.5 text-[#5E5650]"><span className="material-symbols-outlined text-[18px] text-[#2E8B57]">verified</span>Checked by Pageplus</span>
                  : <span className="text-[#9A908A]">Waiting for approval</span>}
                <span className="flex items-center gap-1.5 text-[#9A908A]"><span className="material-symbols-outlined text-[16px]">schedule</span>Listed {timeAgo(listing.createdAt)}</span>
              </div>

              {canChat && <div className="hidden lg:block mt-5">{chatButton('w-full')}</div>}
            </section>

            {/* Owner panel */}
            {isOwner && (
              <section className={'bg-white rounded-[22px] p-5 flex flex-col gap-3 ' + SHADOW}>
                <h2 className="text-[15px] font-semibold">This is your listing</h2>
                {listing.status && listing.status !== 'active' && (
                  <p className={'text-[13px] rounded-2xl px-3.5 py-2.5 ' + (listing.status === 'rejected' ? 'bg-[#FFDAD6] text-[#93000A]' : 'bg-[#FFF1EA] text-[#5E5650]')}>
                    {listing.status === 'rejected' ? 'Not approved. Please check your photos and list again.' : 'Waiting for approval. It goes live once checked.'}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => setEditing(true)} className={'h-11 rounded-full bg-white text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform ' + SHADOW}>
                    <span className="material-symbols-outlined text-[18px]">edit</span>Edit
                  </button>
                  <button onClick={() => router.push('/messages')} className={'h-11 rounded-full bg-white text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform ' + SHADOW}>
                    <span className="material-symbols-outlined text-[18px]">forum</span>Messages
                  </button>
                </div>

                {!sold && (listing.featured ? (
                  <p className="text-[13px] text-[#5E5650] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#F5B82E]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>Featured. Showing at the top of the marketplace.
                  </p>
                ) : (
                  <div>
                    <button onClick={() => setShowTiers(s => !s)} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                      <span className="material-symbols-outlined text-[20px]">star</span>Feature this listing
                    </button>
                    {showTiers && (
                      <div className="mt-3 flex flex-col gap-2">
                        {TIERS.map(t => (
                          <button key={t.tier} onClick={() => handleFeaturePayment(t.tier)} disabled={paymentLoading}
                            className={'w-full rounded-2xl px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition-transform disabled:opacity-50 ' + (t.popular ? 'bg-[#FFF1EA] border-2 border-[#E8632B]' : 'bg-[#FFF7F2] border border-[#F0E2DA]')}>
                            <div>
                              <div className="text-[15px] font-semibold">{t.label}</div>
                              <div className="text-[12px] text-[#9A908A]">{t.desc}</div>
                            </div>
                            <span className="text-[16px] font-bold shrink-0">{Number(t.price) === 0 ? 'Free' : '₹' + t.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <button onClick={handleDelete} disabled={deleting} className="text-[13px] font-semibold text-[#D64545] active:opacity-70 self-start disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Delete this listing'}
                </button>
              </section>
            )}

            {/* Seller */}
            <section className={'bg-white rounded-[22px] p-5 ' + SHADOW}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#FCE3D6] text-[#C4501A] flex items-center justify-center text-[18px] font-bold shrink-0">{sellerName.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[15px] font-semibold truncate">{sellerName}</h2>
                    {reviewTotal > 0 && (
                      <span className="flex items-center gap-1 text-[12px] font-semibold shrink-0">
                        <span className="material-symbols-outlined text-[15px] text-[#F5B82E]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>{reviewAvg}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#5E5650] truncate">
                    {reviewTotal > 0 ? reviewTotal + (reviewTotal === 1 ? ' review' : ' reviews') : 'No reviews yet'}
                    {listing.location ? ' • ' + String(listing.location).split(',')[0] : ''}
                  </p>
                </div>
              </div>
            </section>

            {/* Condition and notes */}
            <section className={'bg-white rounded-[22px] p-5 ' + SHADOW}>
              <h2 className="text-[15px] font-semibold mb-3">Condition and notes</h2>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#F8EDE6] rounded-full mb-2.5">
                {CONDITIONS.map(c => {
                  const on = listing.condition === c
                  return (
                    <div key={c} className={'py-2 text-center rounded-full text-[12px] flex items-center justify-center gap-1 ' + (on ? 'bg-white text-[#C4501A] font-bold shadow-[0_2px_8px_rgba(120,70,40,0.08)]' : 'text-[#9A908A] font-medium')}>
                      {on && <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />}{c}
                    </div>
                  )
                })}
              </div>
              <p className="text-[12px] text-[#5E5650] mb-4"><span className="font-semibold text-[#1E1B19]">What it means: </span>{CONDITION_DESC[listing.condition] || 'See the photos for the condition.'}</p>

              {note && <p className="text-[14px] text-[#5E5650] leading-relaxed mb-4">{note}</p>}

              <div className="flex flex-col gap-2.5 pt-3 border-t border-[#F0E2DA] text-[14px]">
                <div className="flex items-center justify-between"><span className="text-[#9A908A]">Category</span><span className="font-medium">{cap(listing.category || '')}</span></div>
                <div className="flex items-center justify-between"><span className="text-[#9A908A]">Meetup area</span><span className="font-medium text-right">{listing.location}</span></div>
                <div className="flex items-center justify-between"><span className="text-[#9A908A]">Views</span><span className="font-medium">{listing.views || 0}</span></div>
              </div>
            </section>

            {/* Good to know */}
            <section className={'bg-white rounded-[22px] p-5 ' + SHADOW}>
              <h2 className="text-[15px] font-semibold mb-3.5">Good to know</h2>
              <div className="flex flex-col gap-4">
                {[
                  { icon: 'forum', t: 'Chat in the app', s: 'Agree a time and a public place. Your number is not shared in chats.' },
                  { icon: 'task_alt', t: 'Check before you pay', s: 'Look at the book in person, then pay the seller directly. No advance needed.' },
                  { icon: 'shield', t: 'Stay safe', s: 'Meet in a public place and never share an OTP or bank details.' },
                ].map(x => (
                  <div key={x.t} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#E8632B] mt-0.5">{x.icon}</span>
                    <div>
                      <h3 className="text-[14px] font-semibold">{x.t}</h3>
                      <p className="text-[12px] text-[#5E5650] mt-0.5 leading-snug">{x.s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Reviews */}
        <section className={'bg-white rounded-[22px] p-5 mt-5 ' + SHADOW}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[15px] font-semibold mb-1">Reviews of {sellerName}</h2>
              {reviewTotal > 0 ? (
                <div className="flex items-center gap-2"><Stars rating={reviewAvg} size={15} /><span className="text-[13px] font-semibold">{reviewAvg}</span><span className="text-[12px] text-[#9A908A]">from {reviewTotal}</span></div>
              ) : (
                <span className="text-[12px] text-[#9A908A]">No reviews yet</span>
              )}
            </div>
            {!isOwner && isSignedIn && !reviewDone && (
              <button onClick={() => setShowReviewForm(s => !s)} className={'px-4 py-2 rounded-full text-[13px] font-semibold shrink-0 active:scale-95 transition-transform ' + (showReviewForm ? 'bg-[#FFF1EA] text-[#1E1B19]' : 'bg-white ' + SHADOW)}>
                {showReviewForm ? 'Cancel' : 'Write a review'}
              </button>
            )}
            {!isOwner && !isSignedIn && (
              <button onClick={() => openSignIn()} className={'px-4 py-2 rounded-full text-[13px] font-semibold shrink-0 bg-white active:scale-95 transition-transform ' + SHADOW}>Sign in to review</button>
            )}
          </div>

          {reviewDone && <p className="text-[13px] text-[#2E8B57] bg-[#2E8B57]/10 rounded-2xl px-3.5 py-2.5 mb-4">Thanks for your review. It helps other buyers.</p>}

          {showReviewForm && !reviewDone && (
            <div className="bg-[#FFF7F2] rounded-2xl p-4 mb-4">
              <p className="text-[14px] font-semibold mb-2">How was your experience?</p>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} aria-label={i + ' star'} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => setReviewRating(i)} className="p-0.5 active:scale-90 transition-transform">
                    <span style={{ fontSize: 28, lineHeight: 1, color: i <= (hoverRating || reviewRating) ? '#F5B82E' : '#E8DCD3' }}>★</span>
                  </button>
                ))}
                {reviewRating > 0 && <span className="text-[13px] text-[#5E5650] ml-1.5">{['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][reviewRating]}</span>}
              </div>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience (optional)" rows={3} className={inputCls + ' resize-none mb-3'} />
              <button onClick={submitReview} disabled={submittingReview || reviewRating === 0} className="w-full h-12 bg-[#E8632B] text-white text-[15px] font-semibold rounded-full active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                {submittingReview ? 'Sending…' : 'Submit review'}
              </button>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="flex flex-col gap-3">
              {reviews.map((r: any) => (
                <div key={r.id} className="bg-[#FFF7F2] rounded-2xl p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#FCE3D6] text-[#C4501A] flex items-center justify-center text-[13px] font-bold shrink-0">{firstName(r.reviewer?.name).charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate">{firstName(r.reviewer?.name)}</p>
                        <Stars rating={r.rating} size={11} />
                      </div>
                    </div>
                    <span className="text-[12px] text-[#9A908A] shrink-0">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {r.comment && <p className="text-[13px] text-[#5E5650] leading-relaxed mt-1.5">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* More like this */}
        {related.length > 0 && (
          <section className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold">More like this</h2>
              <button onClick={() => router.push('/marketplace')} className="text-[13px] font-semibold text-[#9A908A] active:opacity-70">See all</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map(l => (
                <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className={'bg-white rounded-[22px] p-3 cursor-pointer ' + SHADOW}>
                  <div className="w-full aspect-[4/5] rounded-[18px] overflow-hidden bg-[#FFF1EA] flex items-center justify-center text-[36px] mb-2.5">
                    {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /> : <span>{l.emoji || '📚'}</span>}
                  </div>
                  <h3 className="text-[13px] font-bold leading-tight line-clamp-2">{l.title}</h3>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-[15px] font-extrabold">{Number(l.price) === 0 ? 'Free' : '₹' + l.price}</span>
                    {Number(l.origPrice) > Number(l.price) && <span className="text-[12px] text-[#9A908A] line-through">₹{l.origPrice}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col items-center gap-2 mt-8">
          <p className="text-[12px] text-[#9A908A] text-center">Every listing is checked by our team before it goes live.</p>
          {!isOwner && <button onClick={reportListing} className="text-[12px] font-semibold text-[#9A908A] underline underline-offset-2 active:opacity-70">Report this listing</button>}
        </div>
      </main>

      {/* Glass chat bar (phones and tablets) */}
      {canChat && (
        <div className="lg:hidden fixed inset-x-0 flex justify-center pointer-events-none px-5" style={{ zIndex: 40, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <div className="pointer-events-auto w-full max-w-md flex items-center gap-3 rounded-full pl-5 pr-1.5 py-1.5" style={GLASS}>
            <div className="flex flex-col leading-tight shrink-0">
              <span className="text-[12px] text-[#5E5650]">Price</span>
              <span className="text-[18px] font-bold">{Number(listing.price) === 0 ? 'Free' : '₹' + listing.price}</span>
            </div>
            {chatButton('flex-1 !h-12')}
          </div>
        </div>
      )}
    </div>
  )
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}