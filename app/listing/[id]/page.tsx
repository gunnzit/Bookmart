'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import SoldSheet from '@/components/SoldSheet'
import FeatureSheet from '@/components/FeatureSheet'
import VerifiedBadge from '@/components/VerifiedBadge'
import { FEATURE_TIERS } from '@/lib/featured'

// ── Contact / links (change here only) ────────────────────────────────────
const ADMIN_WA = '918872235738'
const SHARE_BASE = 'https://pageplus.in'

const SHADOW = 'shadow-[0_2px_12px_rgba(28,28,25,0.06)]'

const REPORT_REASONS = [
  { key: 'scam', label: 'Looks fake or a scam' },
  { key: 'price', label: 'Wrong or misleading price' },
  { key: 'sold', label: 'Already sold' },
  { key: 'photos', label: 'Photos do not match the book' },
  { key: 'inappropriate', label: 'Not a book or inappropriate' },
  { key: 'other', label: 'Something else' },
]


const CONDITIONS = ['New', 'Good', 'Fair']
const CONDITION_DESC: Record<string, string> = {
  New: 'Unused, sealed or as good as new.',
  Good: 'Minor wear only, nothing missing.',
  Fair: 'Used but fully readable, may have marks.',
}

const TIERS = FEATURE_TIERS

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
  const [soldBusy, setSoldBusy] = useState(false)
  const [soldSheet, setSoldSheet] = useState(false)
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
  const [canReview, setCanReview] = useState(false)
  const [reviewReason, setReviewReason] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportNote, setReportNote] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [reportError, setReportError] = useState('')

  // "Feature from ₹19" in My listings links here with ?feature=1: open the packages straight away
  const loadedId = listing?.id
  useEffect(() => {
    if (!loadedId || !new URLSearchParams(window.location.search).has('feature')) return
    setShowTiers(true)
  }, [loadedId])

  useEffect(() => {
    fetch('/api/listings/' + id + '?track=true')
      .then(res => res.json())
      .then(data => {
        setListing(data)
        if (data && !data.error) {
          setForm({ title: data.title, subtitle: data.subtitle || '', price: data.price, origPrice: data.origPrice || '', condition: data.condition, location: data.location })
          if (data.sellerId) {
            fetch('/api/reviews?sellerId=' + data.sellerId + '&listingId=' + id)
              .then(r => r.json())
              .then(rd => { if (rd.reviews) { setReviews(rd.reviews); setReviewAvg(rd.avg); setReviewTotal(rd.total); setCanReview(!!rd.canReview); setReviewReason(rd.reason || '') } })
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

  async function toggleSold(next: boolean) {
    if (soldBusy) return
    if (next) { setSoldSheet(true); return }
    const ask = next
      ? 'Mark this book as sold? Buyers will see it as Sold right away.'
      : 'Mark this book as available again?'
    if (!window.confirm(ask)) return
    setSoldBusy(true)
    try {
      const res = await fetch('/api/listings/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sold: next }),
      })
      if (res.ok) setListing((prev: any) => prev ? { ...prev, sold: next } : prev)
      else {
        const d = await res.json().catch(() => ({}))
        alert(d?.error || 'Could not update. Please try again.')
      }
    } catch {
      alert('Could not update. Please try again.')
    }
    setSoldBusy(false)
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
    const text = listing ? 'Check out this book on wrap&read: ' + listing.title : 'Check out this book on wrap&read'
    try {
      if (navigator.share) { await navigator.share({ title: listing?.title || 'wrap&read', text, url }); return }
    } catch { return }
    try {
      await navigator.clipboard.writeText(url)
      setToast('Link copied')
    } catch {
      window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank')
    }
  }

  function reportListing() {
    if (!isSignedIn) { openSignIn(); return }
    setReportReason('')
    setReportNote('')
    setReportError('')
    setReportOpen(true)
  }

  async function submitReport() {
    if (!reportReason || reportBusy) return
    setReportBusy(true)
    setReportError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, reason: reportReason, note: reportNote }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setReportOpen(false)
        setToast('Thanks, our team will look at this listing')
      } else if (d.error === 'too_many') {
        setReportError('You have sent many reports today. Please try again tomorrow.')
      } else if (d.error === 'signin') {
        setReportOpen(false)
        openSignIn()
      } else {
        setReportError('Could not send the report. Please try again.')
      }
    } catch {
      setReportError('Could not connect. Please try again.')
    }
    setReportBusy(false)
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
      if (order.error) { alert('Could not start the payment. Please try again in a minute.'); setPaymentLoading(false); return }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'wrap&read',
        description: 'Feature listing — ' + (TIERS.find(t => t.tier === tier)?.desc || ''),
        image: '/pwa-icon/192?v=2',
        order_id: order.id,
        handler: async (response: any) => {
          const verify = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, listingId: id }),
          })
          const result = await verify.json()
          if (result.success) {
            const days = TIERS.find(t => t.tier === tier)?.days || 0
            setListing({ ...listing, featured: true, featuredDaysLeft: (listing.featured ? listing.featuredDaysLeft || 0 : 0) + days })
            setShowTiers(false); setToast('Featured until ' + new Date(Date.now() + days * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))
          }
          else alert('Payment verification failed. Contact support.')
        },
        prefill: { name: user?.fullName, email: user?.primaryEmailAddress?.emailAddress },
        theme: { color: '#fbbf24' },
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
      body: JSON.stringify({ listingId: id, rating: reviewRating, comment: reviewComment }),
    })
    const data = await res.json()
    if (data.error === 'not_buyer') { alert('Only the buyer the seller marked this book sold to can review.'); setSubmittingReview(false); return }
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

  // ── wrap&read look (colours from the Stitch DESIGN.md) ───────────────────
  const iconBtn = 'relative w-11 h-11 rounded-full flex items-center justify-center text-[#4f4633] hover:bg-[#f0ede9] active:scale-90 transition-transform'
  const inputCls = 'w-full px-4 py-3 rounded-2xl bg-[#f6f3ee] text-[15px] text-[#1c1c19] placeholder:text-[#817661] border border-transparent focus:outline-none focus:bg-white focus:border-[#fbbf24] focus:ring-2 focus:ring-[#fbbf24]/30'
  const card = 'bg-white rounded-[2rem] p-4 ' + SHADOW
  const primaryBtn = 'h-12 rounded-full bg-[#fbbf24] text-[#6c4f00] text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-[0_4px_14px_rgba(251,191,36,0.35)] disabled:opacity-50'
  const softBtn = 'h-10 rounded-full bg-[#f0ede9] text-[#1c1c19] text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60'
  const pageCls = 'min-h-screen bg-[#fcf9f4] text-[#1c1c19] antialiased font-[\'Plus_Jakarta_Sans\',sans-serif]'
  const topPad = { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)' }
  const fill = { fontVariationSettings: "'FILL' 1" }

  const topBar = (title: string, onBack: () => void, right?: ReactNode) => (
    <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-[#fcf9f4]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="w-full max-w-md md:max-w-5xl mx-auto h-16 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          <button aria-label="Back" onClick={onBack} className={iconBtn + ' !text-[#1c1c19]'}><span className="material-symbols-outlined text-[24px]">arrow_back</span></button>
          <h1 className="text-[20px] leading-[26px] font-bold tracking-tight truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-0.5">{right}</div>
      </div>
    </header>
  )

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={pageCls}>
        <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
          <div className="h-11 w-11 rounded-full bg-[#f0ede9] animate-pulse" />
          <div className="aspect-[4/3] rounded-[2rem] bg-[#f0ede9] animate-pulse" />
          <div className="h-8 w-2/3 rounded-full bg-[#f0ede9] animate-pulse" />
          <div className="h-28 rounded-[2rem] bg-[#f0ede9] animate-pulse" />
        </div>
      </div>
    )
  }

  if (!listing || listing.error) {
    return (
      <div className={pageCls + ' flex items-center justify-center p-5'}>
        <div className={card + ' !p-6 text-center max-w-sm w-full'}>
          <span className="material-symbols-outlined text-[40px] text-[#817661]">menu_book</span>
          <h1 className="text-[20px] font-bold mt-2 mb-1">Book not found</h1>
          <p className="text-[14px] text-[#4f4633] mb-5">It may have been removed by the seller.</p>
          <button onClick={() => router.push('/marketplace')} className={primaryBtn + ' w-full'}>Browse books</button>
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
  const priceText = (p: any) => Number(p) === 0 ? 'Free' : '₹' + p
  const goBack = () => (window.history.length > 1 ? router.back() : router.push('/marketplace'))

  const heartButton = (cls: string) => (
    <button aria-label={saved ? 'Remove from saved' : 'Save book'} onClick={toggleWishlist} disabled={savingWishlist}
      className={'rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0 ' + cls}>
      <span className="material-symbols-outlined text-[24px]" style={{ color: saved ? '#a73a00' : '#1c1c19', fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
    </button>
  )

  const shareButton = (
    <button aria-label="Share" onClick={shareBook} className="w-12 h-12 rounded-full bg-[#f0ede9] flex items-center justify-center active:scale-90 transition-transform shrink-0">
      <span className="material-symbols-outlined text-[22px]">share</span>
    </button>
  )

  const chatButton = (cls: string) => (
    <button onClick={openChat} disabled={!!chatBusy} className={primaryBtn + ' ' + cls}>
      <span className={'material-symbols-outlined text-[20px] ' + (chatBusy ? 'animate-spin' : '')} style={chatBusy ? undefined : fill}>{chatBusy ? 'progress_activity' : 'chat_bubble'}</span>
      {chatBusy ? 'Opening chat…' : isSignedIn ? 'Chat with seller' : 'Sign in to chat'}
    </button>
  )

  // ── Edit form (owner) ────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className={pageCls}>
        {topBar('Edit listing', () => setEditing(false))}
        <main className="w-full max-w-md mx-auto px-4 pb-12 lg:max-w-xl lg:pt-8!" style={topPad}>
          <div className={card + ' flex flex-col gap-4'}>
            <h1 className="hidden lg:block text-[24px] font-extrabold tracking-tight">Edit listing</h1>
            {(['title', 'subtitle', 'location'] as const).map(f => (
              <div key={f}>
                <label className="text-[12px] font-semibold text-[#4f4633] block mb-1.5">{f === 'subtitle' ? 'Note for buyers' : cap(f)}</label>
                <input type="text" value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} className={inputCls} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {(['price', 'origPrice'] as const).map(f => (
                <div key={f}>
                  <label className="text-[12px] font-semibold text-[#4f4633] block mb-1.5">{f === 'price' ? 'Your price (₹)' : 'Original price (₹)'}</label>
                  <input type="number" value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} className={inputCls} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#4f4633] block mb-1.5">Condition</label>
              <div className="flex gap-2">
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, condition: c })}
                    className={'flex-1 h-11 rounded-full text-[14px] transition-colors active:scale-95 ' + (form.condition === c ? 'bg-[#fbbf24] text-[#6c4f00] font-bold' : 'bg-[#f0ede9] text-[#1c1c19] font-medium')}>{c}</button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className={primaryBtn + ' w-full'}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button onClick={() => setEditing(false)} className="text-[14px] font-semibold text-[#4f4633] active:opacity-70">Cancel</button>
          </div>
        </main>
      </div>
    )
  }

  // ── Page ─────────────────────────────────────────────────────────────────
  return (
    <div className={pageCls}>

      {/* Photo viewer */}
      {lightbox && hasImages && (
        <div className="fixed inset-0 z-[400] bg-black/85 flex items-center justify-center p-5" onClick={() => setLightbox(false)}>
          <img src={images[activeImg]} alt={listing.title} className="max-w-full max-h-[85vh] object-contain rounded-[1rem]" />
          <button aria-label="Close" onClick={() => setLightbox(false)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Report sheet */}
      {reportOpen && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={() => setReportOpen(false)}>
          <div className="bg-[#fcf9f4] rounded-t-[2rem] md:rounded-[2rem] p-6 w-full max-w-md shadow-[0_-10px_35px_rgba(28,28,25,0.2)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[#e5e2dd] mx-auto mb-4 md:hidden" />
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[20px] font-bold tracking-tight">Report this listing</h3>
                <p className="text-[13px] text-[#4f4633] mt-0.5">Tell us what is wrong. Our team will check it.</p>
              </div>
              <button aria-label="Close" onClick={() => setReportOpen(false)} className="w-9 h-9 rounded-full bg-[#f0ede9] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button key={r.key} type="button" onClick={() => { setReportReason(r.key); setReportError('') }}
                  className={'px-3.5 py-1.5 rounded-full text-[13px] active:scale-95 transition-transform ' + (reportReason === r.key ? 'bg-[#fbbf24] text-[#6c4f00] font-bold' : 'bg-[#f0ede9] text-[#1c1c19] font-medium')}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea value={reportNote} onChange={e => setReportNote(e.target.value.slice(0, 200))} rows={3}
              placeholder="Add details (optional)" className={inputCls + ' resize-none'} />
            {reportError && <p className="text-[12px] text-[#ba1a1a] mt-2">{reportError}</p>}
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setReportOpen(false)} className="h-12 px-6 rounded-full bg-[#f0ede9] text-[14px] font-bold active:scale-95 transition-transform">Cancel</button>
              <button onClick={submitReport} disabled={!reportReason || reportBusy} className={primaryBtn + ' flex-1'}>
                {reportBusy ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature your book: preview and packages, for the seller only */}
      {showTiers && isOwner && (
        <FeatureSheet
          listingId={id}
          book={listing}
          busy={paymentLoading}
          onPay={t => handleFeaturePayment(t)}
          onClose={() => { if (!paymentLoading) setShowTiers(false) }}
        />
      )}
      {/* Mark as sold: pick who bought it */}
      {soldSheet && (
        <SoldSheet
          listingId={id}
          title={listing.title}
          onClose={() => setSoldSheet(false)}
          onDone={() => { setSoldSheet(false); setListing((prev: any) => prev ? { ...prev, sold: true } : prev); setToast('Marked as sold') }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 flex justify-center pointer-events-none px-5" style={{ zIndex: 350, top: 'calc(env(safe-area-inset-top, 0px) + 76px)' }}>
          <div className="bg-[#31302d] text-[#f3f0eb] rounded-full px-4 py-2.5 text-[13px] font-medium shadow-[0_10px_28px_rgba(28,28,25,0.28)]">{toast}</div>
        </div>
      )}

      {topBar('Book Detail', goBack, <>
        <button aria-label="Share" onClick={shareBook} className={iconBtn}><span className="material-symbols-outlined text-[22px]">share</span></button>
        {!isOwner && <button aria-label="Report this listing" onClick={reportListing} className={iconBtn}><span className="material-symbols-outlined text-[22px]">flag</span></button>}
      </>)}

      <main className={'w-full max-w-md md:max-w-5xl lg:max-w-[1200px] mx-auto px-4 lg:px-6 lg:pt-8! ' + (canChat ? 'pb-32 lg:pb-16' : 'pb-16')} style={topPad}>

        {/* Owner banner */}
        {isOwner && (
          <div className="bg-[#fbbf24]/25 rounded-[1rem] p-2.5 pl-3 flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[20px] text-[#795900] shrink-0" style={fill}>storefront</span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold truncate">{sold ? 'Sold' : live ? 'Listing active • Live' : listing.status === 'rejected' ? 'Not approved' : 'Waiting for approval'}</p>
                <p className="text-[11px] leading-tight text-[#4f4633] truncate">This is your listing</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setEditing(true)} className="bg-white text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">edit</span>Edit
              </button>
              {live && (
                <button onClick={() => toggleSold(!sold)} disabled={soldBusy} className="bg-[#31302d] text-[#f3f0eb] text-[12px] font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-60">
                  {soldBusy ? 'Saving…' : sold ? 'Relist' : 'Mark Sold'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

          {/* LEFT: photos */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className={'relative bg-[#f6f3ee] rounded-[2rem] overflow-hidden aspect-[4/3] lg:aspect-square ' + SHADOW}>
              {hasImages ? (
                <div ref={galleryRef} onScroll={onGalleryScroll} className="flex w-full h-full overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                  {images.map((src, i) => (
                    <div key={i} className="min-w-full h-full p-3 flex items-center justify-center snap-center">
                      <img src={src} alt={listing.title} onClick={() => setLightbox(true)}
                        className={'h-full w-auto max-w-full object-contain rounded-[1rem] shadow-md cursor-zoom-in ' + (sold ? 'opacity-60' : '')} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[88px]">{listing.emoji || '📚'}</div>
              )}

              <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                {live && (
                  <span className="bg-white/90 backdrop-blur-md text-[#795900] text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[15px] text-[#6e5e0d]" style={fill}>verified</span>Checked by wrap&amp;read
                  </span>
                )}
                {listing.featured && !sold && (
                  <span className="bg-[#fbbf24] text-[#6c4f00] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[14px]" style={fill}>star</span>Featured
                  </span>
                )}
              </div>

              {/* Save button sits on the photo when there is no bottom bar */}
              {!isOwner && !canChat && heartButton('absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-md shadow-sm')}

              {sold && (
                <div className="absolute inset-0 bg-[#1c1c19]/30 flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-1.5 rounded-full bg-[#a73a00] text-white text-[12px] font-bold uppercase tracking-wider">Sold</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button aria-label="Previous photo" onClick={() => goToImage(Math.max(0, activeImg - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button aria-label="Next photo" onClick={() => goToImage(Math.min(images.length - 1, activeImg + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                  <span className="absolute bottom-3 right-3 bg-[#31302d]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[#f3f0eb] text-[11px] font-semibold">{activeImg + 1} / {images.length}</span>
                </>
              )}
            </div>

            {/* Thumbnails (desktop) */}
            {images.length > 1 && (
              <div className="hidden lg:flex gap-3 mt-4 flex-wrap">
                {images.map((src, i) => (
                  <button key={i} type="button" aria-label={'Photo ' + (i + 1)} onClick={() => goToImage(i)}
                    className={'w-20 h-20 rounded-2xl bg-white overflow-hidden border-2 p-1 transition-colors ' + (i === activeImg ? 'border-[#F7CF65]' : 'border-stone-200 hover:border-stone-300')}>
                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: details */}
          <div className="lg:col-span-6 flex flex-col gap-4 mt-4 lg:mt-0">

            {/* Title and price */}
            <section>
              <div className="flex flex-wrap gap-1.5 items-center mb-2">
                {listing.category && <span className="bg-[#ffdf9f] text-[#261a00] text-[12px] font-semibold px-3 py-1 rounded-full">{cap(listing.category)}</span>}
                {listing.condition && <span className="bg-[#ebe8e3] text-[#4f4633] text-[12px] font-semibold px-2.5 py-1 rounded-full">{listing.condition} condition</span>}
              </div>
              <h2 className="text-[30px] leading-[36px] font-extrabold tracking-[-0.02em]">{listing.title}</h2>
              <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
                <span className={'text-[32px] leading-none font-extrabold ' + (sold ? 'text-[#817661]' : '')}>{priceText(listing.price)}</span>
                {Number(listing.origPrice) > Number(listing.price) && <span className="text-[15px] line-through text-[#817661]">₹{listing.origPrice}</span>}
                {discount > 0 && !sold && <span className="bg-[#fd651e]/20 text-[#a73a00] text-[12px] font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[#4f4633] text-[13px]">
                <span className="material-symbols-outlined text-[16px] text-[#6e5e0d]">visibility</span>
                <span>{listing.views || 0} views</span>
                <span>•</span>
                <span>Listed {timeAgo(listing.createdAt)}{listing.location ? ' in ' + String(listing.location).split(',')[0] : ''}</span>
              </div>
              {!live && !isOwner && <p className="mt-2 text-[12px] text-[#817661]">Waiting for approval</p>}
              {canChat && <div className="hidden lg:flex items-center gap-3 mt-5">{heartButton('w-12 h-12 bg-[#f0ede9]')}{shareButton}{chatButton('flex-1')}</div>}
              {!canChat && <div className="hidden lg:flex items-center gap-3 mt-5">{shareButton}</div>}
            </section>

            {/* Owner tools */}
            {isOwner && (
              <section className={card + ' flex flex-col gap-3'}>
                {live && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: 'visibility', n: listing.views || 0, t: 'Views' },
                      { icon: 'forum', n: listing.stats?.chats || 0, t: 'Chats' },
                      { icon: 'favorite', n: listing.stats?.saves || 0, t: 'Saves' },
                    ].map(x => (
                      <div key={x.t} className="bg-[#f6f3ee] rounded-[1rem] py-3 flex flex-col items-center gap-0.5">
                        <span className="material-symbols-outlined text-[18px] text-[#795900]">{x.icon}</span>
                        <span className="text-[17px] leading-[22px] font-extrabold">{x.n}</span>
                        <span className="text-[12px] text-[#4f4633]">{x.t}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!live && (
                  <p className={'text-[13px] rounded-[1rem] px-3.5 py-2.5 ' + (listing.status === 'rejected' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#f6f3ee] text-[#4f4633]')}>
                    {listing.status === 'rejected' ? 'Not approved. Please check your photos and list again.' : 'Waiting for approval. It goes live once checked.'}
                  </p>
                )}
                <button onClick={() => router.push('/messages')} className={softBtn + ' w-full'}>
                  <span className="material-symbols-outlined text-[18px]">forum</span>Messages
                </button>

                {/* Featuring is offered once the book is live (fees are non-refundable) */}
                {!sold && live && (listing.featured ? (
                  <p className="text-[13px] text-[#4f4633] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#795900]" style={fill}>star</span>
                    {listing.featuredDaysLeft ? `Featured, ${listing.featuredDaysLeft} ${listing.featuredDaysLeft === 1 ? 'day' : 'days'} left. Showing at the top of the marketplace.` : 'Featured. Showing at the top of the marketplace.'}
                  </p>
                ) : (
                  <div>
                    <button onClick={() => setShowTiers(true)} className={primaryBtn + ' w-full'}>
                      <span className="material-symbols-outlined text-[20px]" style={fill}>star</span>Feature this listing
                    </button>
                  </div>
                ))}

                <button onClick={handleDelete} disabled={deleting} className="text-[13px] font-semibold text-[#ba1a1a] active:opacity-70 self-start disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Delete this listing'}
                </button>
              </section>
            )}

            {/* Seller */}
            <section className={card}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#f9e287] text-[#221b00] flex items-center justify-center text-[20px] font-bold shrink-0">{sellerName.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 min-w-0"><span className="text-[14px] font-bold truncate">{sellerName}</span>{listing.seller?.verified && <VerifiedBadge />}</div>
                    <p className="text-[12px] text-[#4f4633] truncate">{listing.location ? String(listing.location).split(',')[0] : 'Seller'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {reviewTotal > 0 ? (
                    <>
                      <div className="flex items-center gap-1 bg-[#ebe8e3] px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[15px] text-[#795900]" style={fill}>star</span>
                        <span className="text-[12px] font-bold">{reviewAvg}</span>
                      </div>
                      <span className="text-[11px] text-[#817661] block mt-0.5">{reviewTotal} {reviewTotal === 1 ? 'review' : 'reviews'}</span>
                    </>
                  ) : <span className="text-[11px] text-[#817661]">No reviews yet</span>}
                </div>
              </div>
              {listing.seller?.id && (
                <a href={'/seller/' + listing.seller.id} className="mt-3 flex items-center justify-between bg-[#f6f3ee] px-3 py-2 rounded-[1rem] active:opacity-80">
                  <span className="flex items-center gap-1.5 text-[13px] text-[#4f4633]">
                    <span className="material-symbols-outlined text-[16px] text-[#795900]">person</span>See their other books
                  </span>
                  <span className="text-[12px] font-bold text-[#795900] flex items-center gap-0.5">View profile<span className="material-symbols-outlined text-[16px]">chevron_right</span></span>
                </a>
              )}
            </section>
          </div>
        </div>

        {/* Below the photos: meetup, notes, tips (full width on desktop) */}
        <div className="flex flex-col gap-4 mt-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start lg:mt-8">
          {/* Meetup */}
          {listing.location && (
            <section className={card + ' flex items-start gap-3 lg:order-2'}>
              <div className="w-10 h-10 rounded-full bg-[#ffdbce] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px] text-[#a73a00]">location_on</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold">Meetup area</h3>
                <p className="text-[15px] text-[#4f4633] mt-0.5">{listing.location}</p>
                <span className="mt-2 inline-flex bg-[#ebe8e3] text-[11px] font-semibold px-2.5 py-1 rounded-full items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#795900]">directions_walk</span>Meet in person
                </span>
              </div>
            </section>
          )}

          {/* Condition and notes */}
          <section className="lg:order-1">
            <h3 className="text-[20px] leading-[26px] font-bold mb-2.5">Condition & Notes</h3>
            <div className={card + ' flex flex-col gap-3'}>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#f0ede9] rounded-full">
                {CONDITIONS.map(c => {
                  const on = listing.condition === c
                  return (
                    <div key={c} className={'py-2 text-center rounded-full text-[12px] flex items-center justify-center gap-1 ' + (on ? 'bg-[#fbbf24] text-[#6c4f00] font-bold' : 'text-[#817661] font-medium')}>
                      {on && <span className="material-symbols-outlined text-[14px]" style={fill}>check_circle</span>}{c}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#f0ede9] flex items-center justify-center shrink-0 text-[#4f4633]"><span className="material-symbols-outlined text-[16px]">book</span></span>
                <div>
                  <h4 className="text-[12px] font-bold">What it means</h4>
                  <p className="text-[13px] text-[#4f4633]">{CONDITION_DESC[listing.condition] || 'See the photos for the condition.'}</p>
                </div>
              </div>
              {note && (
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#f0ede9] flex items-center justify-center shrink-0 text-[#4f4633]"><span className="material-symbols-outlined text-[16px]">edit_note</span></span>
                  <div>
                    <h4 className="text-[12px] font-bold">Seller&apos;s note</h4>
                    <p className="text-[13px] text-[#4f4633] leading-relaxed">{note}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Good to know */}
          <section className="lg:order-3">
            <h3 className="text-[20px] leading-[26px] font-bold mb-2.5">Good to know</h3>
            <div className="bg-[#f6f3ee] rounded-[2rem] p-4 flex flex-col gap-2.5">
              {[
                { icon: 'forum', s: 'Chat in the app and agree a time and a public place. Your number is not shared in chats.' },
                { icon: 'task_alt', s: 'Look at the book in person, then pay the seller directly. No advance needed.' },
                { icon: 'verified_user', s: 'Meet in a public place and never share an OTP or bank details.' },
              ].map(x => (
                <div key={x.icon} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#795900] shrink-0 mt-0.5">{x.icon}</span>
                  <p className="text-[13px]">{x.s}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Reviews */}
        <section className="mt-4 lg:mt-8">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[20px] leading-[26px] font-bold">Reviews of {sellerName}</h3>
            {reviewTotal > 0 && <span className="flex items-center gap-1.5"><Stars rating={reviewAvg} size={14} /><span className="text-[13px] text-[#817661]">{reviewAvg} from {reviewTotal}</span></span>}
          </div>
          <div className={card}>
            {!isOwner && isSignedIn && !reviewDone && canReview && (
              <div className="flex items-center justify-between pb-3">
                <span className="text-[12px] font-bold">How was your experience?</span>
                <button onClick={() => setShowReviewForm(s => !s)} className={softBtn + ' px-4 !h-8'}>{showReviewForm ? 'Cancel' : 'Write a review'}</button>
              </div>
            )}
            {!isOwner && isSignedIn && !reviewDone && !canReview && reviewReason === 'not_buyer' && sold && (
              <p className="text-[12px] text-[#817661] pb-3">Only the buyer of this book can review the seller.</p>
            )}
            {!isOwner && !isSignedIn && (
              <div className="flex items-center justify-between pb-3">
                <span className="text-[12px] font-bold">Bought from {sellerName}?</span>
                <button onClick={() => openSignIn()} className={softBtn + ' px-4 !h-8'}>Sign in to review</button>
              </div>
            )}

            {reviewDone && <p className="text-[13px] text-[#795900] bg-[#ffdf9f]/50 rounded-[1rem] px-3.5 py-2.5 mb-3">Thanks for your review. It helps other buyers.</p>}

            {showReviewForm && !reviewDone && (
              <div className="bg-[#f6f3ee] rounded-[1rem] p-4 mb-3">
                <p className="text-[14px] font-bold mb-2">How was your experience?</p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} aria-label={i + ' star'} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => setReviewRating(i)} className="p-0.5 active:scale-90 hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[28px]" style={{ color: i <= (hoverRating || reviewRating) ? '#fbbf24' : '#e5e2dd', fontVariationSettings: "'FILL' 1" }}>star</span>
                    </button>
                  ))}
                  {reviewRating > 0 && <span className="text-[13px] text-[#4f4633] ml-1.5">{['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][reviewRating]}</span>}
                </div>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience (optional)" rows={3} className={inputCls + ' !bg-white resize-none mb-3'} />
                <button onClick={submitReview} disabled={submittingReview || reviewRating === 0} className={primaryBtn + ' w-full'}>
                  {submittingReview ? 'Sending…' : 'Submit review'}
                </button>
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-[#f6f3ee] rounded-[1rem] p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#f9e287] text-[#221b00] flex items-center justify-center text-[13px] font-bold shrink-0">{firstName(r.reviewer?.name).charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold truncate">{firstName(r.reviewer?.name)}</p>
                          <Stars rating={r.rating} size={11} />
                        </div>
                      </div>
                      <span className="text-[12px] text-[#817661] shrink-0">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {r.comment && <p className="text-[13px] text-[#4f4633] leading-relaxed mt-1.5">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-[#f6f3ee]/60 rounded-[1rem] p-3">
                <span className="material-symbols-outlined text-[22px] text-[#817661] shrink-0">mark_chat_unread</span>
                <p className="text-[13px] text-[#4f4633]">No reviews yet for {sellerName}.</p>
              </div>
            )}
          </div>
        </section>

        {/* More like this */}
        {related.length > 0 && (
          <section className="mt-5 -mx-4 lg:mx-0 lg:mt-10">
            <div className="px-4 lg:px-0 flex items-center justify-between mb-2.5">
              <h3 className="text-[20px] leading-[26px] font-bold">More like this</h3>
              <button onClick={() => router.push('/marketplace')} className="text-[12px] font-bold text-[#795900] active:scale-95">See all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0" style={{ scrollbarWidth: 'none' }}>
              {related.map(l => (
                <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className={'w-40 shrink-0 bg-white rounded-[1rem] p-2.5 cursor-pointer flex flex-col justify-between active:scale-[0.98] transition-transform lg:w-auto lg:rounded-2xl lg:p-3 lg:border lg:border-stone-200 lg:hover:shadow-md ' + SHADOW}>
                  <div>
                    <div className="w-full h-32 rounded-[1rem] bg-[#f6f3ee] overflow-hidden flex items-center justify-center text-[36px] mb-2 lg:h-auto lg:aspect-[3/4] lg:rounded-xl">
                      {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="h-full w-auto object-contain lg:w-full lg:object-cover" /> : <span>{l.emoji || '📚'}</span>}
                    </div>
                    {l.condition && <span className="bg-[#f0ede9] text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mb-1">{l.condition}</span>}
                    <h4 className="text-[12px] font-bold line-clamp-1 lg:text-[14px] lg:line-clamp-2 lg:min-h-[2.6em]">{l.title}</h4>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[14px] font-bold">{priceText(l.price)}</span>
                    <span className="w-7 h-7 rounded-full bg-[#fbbf24] text-[#6c4f00] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col items-center gap-2 mt-8">
          <p className="text-[12px] text-[#817661] text-center">Every listing is checked by our team before it goes live.</p>
          {!isOwner && <button onClick={reportListing} className="text-[12px] font-semibold text-[#817661] underline underline-offset-2 active:opacity-70">Report this listing</button>}
        </div>
      </main>

      {/* Bottom chat bar (phones and tablets) */}
      {canChat && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#fcf9f4]/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="max-w-md mx-auto px-4 py-2.5 flex items-center gap-3">
            <div className="flex flex-col shrink-0">
              <span className="text-[11px] text-[#4f4633] leading-tight">Price</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[20px] leading-[26px] font-extrabold">{priceText(listing.price)}</span>
                {Number(listing.origPrice) > Number(listing.price) && <span className="text-[11px] text-[#817661] line-through">₹{listing.origPrice}</span>}
              </div>
            </div>
            {heartButton('w-12 h-12 bg-[#f0ede9]')}
            {chatButton('flex-1')}
          </div>
        </div>
      )}
    </div>
  )
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
