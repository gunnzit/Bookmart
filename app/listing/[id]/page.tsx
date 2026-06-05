'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'

const conditions = ['New', 'Good', 'Fair']

const TIERS = [
  { tier: 'basic',    price: 19, days: 3,  label: 'Basic',    desc: '3 days at the top' },
  { tier: 'standard', price: 29, days: 7,  label: 'Standard', desc: '7 days — most popular', popular: true },
  { tier: 'premium',  price: 49, days: 15, label: 'Premium',  desc: '15 days max visibility' },
]

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#FFC83D' : '#D1D5DB' }}>★</span>
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
    const url = 'https://buddybooks.in/listing/' + id
    const text = listing ? ('Check out this listing on BuddyBooks: ' + listing.title + ' — ' + url) : url
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')
  }

  function reportListing() {
    const text = 'REPORT: Listing "' + (listing?.title || '') + '" (ID: ' + id + ') at https://buddybooks.in/listing/' + id + ' — Reason: '
    window.open('https://wa.me/919914735738?text=' + encodeURIComponent(text), '_blank')
    setReported(true)
  }

  async function handleFeaturePayment(tier: string, price: number) {
    if (!isSignedIn) { openSignIn(); return }
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
        name: 'BuddyBooks',
        description: 'Feature listing — ' + (TIERS.find(t => t.tier === tier)?.desc || ''),
        image: '/logo.png',
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
        theme: { color: '#00B86B' },
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

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FFF9F0; --bg-card: #fff; --bg-img: #FFF3E0; --bg-input: #FFF9F0;
      --bg-tag: #FFF3E0; --nav-bg: #fff; --border: #FFE2C2; --border-strong: #FFCB94;
      --text-primary: #1A1330; --text-secondary: #6B6280; --text-muted: #A89FC0; --text-label: #A89FC0;
      --shadow-nav: 0 2px 12px rgba(124,92,252,0.06);
      --shadow-card: 0 2px 16px rgba(124,92,252,0.08);
      --shadow-strong: 0 12px 40px rgba(124,92,252,0.16);
      --condition-bg: #fff; --condition-active: #DFFFEF;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #14101F; --bg-card: #221C3A; --bg-img: #2A2342; --bg-input: #1C1730;
        --bg-tag: #2A2342; --nav-bg: #1C1730; --border: #352C52; --border-strong: #463A6B;
        --text-primary: #F3EEFF; --text-secondary: #B0A8CC; --text-muted: #6E6590; --text-label: #6E6590;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
        --shadow-card: 0 2px 16px rgba(0,0,0,0.25);
        --shadow-strong: 0 12px 40px rgba(0,0,0,0.4);
        --condition-bg: #221C3A; --condition-active: #0A3A26;
      }
    }
    body { font-family: 'Poppins', sans-serif; background: var(--bg); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
    .kalam { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
    input, textarea { color: var(--text-primary) !important; font-weight: 500; font-family: 'Poppins', sans-serif; }
    input::placeholder, textarea::placeholder { color: var(--text-muted) !important; font-weight: 400; }
    input:focus, textarea:focus { outline: none !important; border-color: #00B86B !important; box-shadow: 0 0 0 3px rgba(0,184,107,0.12) !important; }
    .main-img { transition: transform 0.3s ease; cursor: zoom-in; }
    .main-img:hover { transform: scale(1.01); }
    .thumb { cursor: pointer; border-radius: 10px; transition: all 0.15s; }
    .thumb:hover { transform: scale(1.05); opacity: 1 !important; }
    .wa-btn { display: flex; align-items: center; justify-content: center; gap: 10px; background: #25D366; color: #fff; border-radius: 16px; padding: 16px; font-size: 16px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 0 #1da851, 0 8px 24px rgba(37,211,102,0.35); font-family: 'Poppins', sans-serif; transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; }
    .wa-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #1da851, 0 12px 32px rgba(37,211,102,0.48) !important; }
    .wa-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #1da851; }
    .sticky-cta { display: none; position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: var(--nav-bg); border-top: 2px solid var(--border); z-index: 60; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); }
    @media (max-width: 640px) { .sticky-cta { display: block; } .hide-mobile { display: none !important; } .breadcrumb { display: none !important; } .nav-actions { margin-left: 0 !important; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; flex: 1; justify-content: flex-end; } .nav-actions::-webkit-scrollbar { display: none; } .btn-label-hide { display: none !important; } }
    .icon-btn { background: var(--bg-card); border: 2px solid var(--border); border-radius: 10px; padding: 7px 13px; font-size: 12px; font-weight: 700; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
    .icon-btn:hover { background: var(--bg-img) !important; border-color: var(--border-strong); }
    .share-wa-btn { background: #DFFFEF; border: 2px solid #9DEAC4; border-radius: 10px; padding: 7px 13px; font-size: 12px; font-weight: 700; cursor: pointer; color: #00B86B; transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
    .share-wa-btn:hover { background: #B6F5D8 !important; }
    .report-btn { background: var(--bg-card); border: 2px solid var(--border); border-radius: 10px; padding: 7px 13px; font-size: 12px; font-weight: 700; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
    .report-btn:hover { background: #FEF2F2 !important; border-color: #FCA5A5 !important; color: #E24B4A !important; }
    .report-btn.reported { background: #FEF2F2; border-color: #FCA5A5; color: #E24B4A; }
    .tag { font-size: 12px; color: var(--text-secondary); background: var(--bg-tag); padding: 5px 12px; border-radius: 99px; display: inline-flex; align-items: center; gap: 5px; border: 2px solid var(--border); font-weight: 600; }
    .rel-card { background: var(--bg-card); border-radius: 16px; border: 2px solid var(--border); overflow: hidden; cursor: pointer; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, border-color 0.2s; box-shadow: var(--shadow-card); }
    .rel-card:hover { transform: translateY(-5px) rotate(-0.5deg); box-shadow: var(--shadow-strong) !important; border-color: #7C5CFC; }
    .rel-img { transition: transform 0.3s ease; }
    .rel-card:hover .rel-img { transform: scale(1.07); }
    .listing-layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 900px) { .listing-layout { grid-template-columns: 1fr 420px; align-items: start; } }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
    .img-fade { animation: fadeIn 0.2s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    .s1 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
    .s2 { animation: slideUp 0.4s 0.06s cubic-bezier(0.22,1,0.36,1) both; }
    .s3 { animation: slideUp 0.4s 0.12s cubic-bezier(0.22,1,0.36,1) both; }
    .s4 { animation: slideUp 0.4s 0.18s cubic-bezier(0.22,1,0.36,1) both; }
    .s5 { animation: slideUp 0.4s 0.24s cubic-bezier(0.22,1,0.36,1) both; }
    @keyframes heartPop { 0% { transform: scale(1); } 40% { transform: scale(1.4); } 100% { transform: scale(1); } }
    .heart-pop { animation: heartPop 0.32s ease; }
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 200; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
    .lightbox img { max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 8px; }
    .tier-btn { width: 100%; border-radius: 12px; padding: 13px 16px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1); border: 2px solid var(--border); background: var(--bg-card); }
    .tier-btn:hover { border-color: #FFC83D; transform: translateY(-2px); }
    .tier-btn.popular { background: linear-gradient(135deg, #FFC83D, #FF6B2C); border: none; box-shadow: 0 4px 0 #E0851F; }
    .tier-btn.popular:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #E0851F; }
    .tier-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .tiers-list { animation: slideDown 0.2s ease; }
    .star-btn { background: none; border: none; cursor: pointer; font-size: 28px; padding: 2px; transition: transform 0.1s; line-height: 1; }
    .star-btn:hover { transform: scale(1.2); }
    .review-card { background: var(--bg); border-radius: 14px; padding: 14px 16px; border: 2px solid var(--border); }
  `

  if (loading) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '52px', marginBottom: '14px' }}>📚</div>
          <div style={{ fontSize: '14px' }}>Loading…</div>
        </div>
      </div>
    </>
  )

  if (!listing || listing.error) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '14px' }}>📭</div>
          <div className="kalam" style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px' }}>Listing not found</div>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', fontFamily: 'Poppins, sans-serif', marginTop: '12px', boxShadow: '0 4px 0 #009957' }}>Browse marketplace</button>
        </div>
      </div>
    </>
  )

  const discount = listing.origPrice ? Math.round((1 - listing.price / listing.origPrice) * 100) : 0
  const waText = 'Hi, I am interested in your listing on BuddyBooks: ' + listing.title + ' for Rs.' + listing.price
  const phone = listing.seller?.phone?.replace(/\D/g, '') || ''
  const waLink = phone ? ('https://wa.me/91' + phone + '?text=' + encodeURIComponent(waText)) : ('https://wa.me/?text=' + encodeURIComponent(waText))
  const hasImages = listing.images?.length > 0

  const WaButton = () => (
    <a href={waLink} target="_blank" rel="noopener noreferrer" className="wa-btn">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Contact on WhatsApp
    </a>
  )

  return (
    <>
      <style>{css}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {lightbox && hasImages && (
        <div className="lightbox" onClick={() => setLightbox(false)}>
          <img src={listing.images[activeImg]} alt={listing.title} />
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '2px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button className="icon-btn" style={{ padding: '7px 10px' }} onClick={() => window.location.href = '/marketplace'}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', flex: 1, minWidth: 0 }}>
            <span style={{ cursor: 'pointer', color: '#00B86B', flexShrink: 0, fontWeight: '700' }} onClick={() => router.push('/marketplace')}>Marketplace</span>
            <span>›</span>
            <span style={{ textTransform: 'capitalize', flexShrink: 0 }}>{listing.category}</span>
            <span>›</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</span>
          </div>
          <div className="nav-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            {!isOwner && (
              <button onClick={toggleWishlist} disabled={savingWishlist}
                style={{ background: saved ? '#FEF2F2' : 'var(--bg-card)', border: '2px solid ' + (saved ? '#FCA5A5' : 'var(--border)'), borderRadius: '10px', padding: '7px 12px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
                <span className={saved ? 'heart-pop' : ''}>{saved ? '❤️' : '🤍'}</span>
                <span className="btn-label-hide" style={{ fontSize: '11px', color: saved ? '#E24B4A' : 'var(--text-secondary)', fontWeight: '700' }}>{saved ? 'Saved' : 'Save'}</span>
              </button>
            )}
            <button className="icon-btn" onClick={copyLink} style={{ background: copied ? '#DFFFEF' : 'var(--bg-card)', color: copied ? '#009957' : 'var(--text-secondary)', borderColor: copied ? '#9DEAC4' : 'var(--border)' }}>
              {copied ? '✅' : '🔗'} <span className="btn-label-hide">{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
            <button className="share-wa-btn" onClick={shareOnWhatsApp}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="btn-label-hide">Share</span>
            </button>
            {!isOwner && (
              <button className={'report-btn' + (reported ? ' reported' : '')} onClick={reportListing}>
                🚩 <span className="btn-label-hide">{reported ? 'Reported' : 'Report'}</span>
              </button>
            )}
            {isOwner && !editing && (
              <>
                <button className="icon-btn" onClick={() => setEditing(true)} style={{ background: '#E3F0FF', color: '#1D4ED8', border: 'none' }}>✏️ Edit</button>
                <button className="icon-btn" onClick={handleDelete} disabled={deleting} style={{ background: '#FEF2F2', color: '#E24B4A', border: 'none' }}>{deleting ? '…' : '🗑️'}</button>
              </>
            )}
          </div>
        </nav>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 80px' }}>

          {editing ? (
            <div style={{ maxWidth: '560px', margin: '0 auto' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '2px solid #00B86B', padding: '28px', boxShadow: 'var(--shadow-card)' }}>
                <div className="kalam" style={{ fontSize: '18px', color: '#00B86B', marginBottom: '20px' }}>✏️ Edit listing</div>
                {(['title', 'subtitle', 'price', 'origPrice', 'location'] as const).map(field => (
                  <div key={field} style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field === 'origPrice' ? 'Original Price' : field === 'price' ? 'Price' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    <input type={['price', 'origPrice'].includes(field) ? 'number' : 'text'} value={form[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '14px', fontFamily: 'Poppins, sans-serif', background: 'var(--bg-input)', transition: 'all 0.15s' }} />
                  </div>
                ))}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {conditions.map(c => (
                      <button key={c} onClick={() => setForm({ ...form, condition: c })} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: form.condition === c ? '2px solid #00B86B' : '2px solid var(--border)', background: form.condition === c ? 'var(--condition-active)' : 'var(--condition-bg)', cursor: 'pointer', fontSize: '13px', color: form.condition === c ? '#009957' : 'var(--text-secondary)', fontWeight: form.condition === c ? '700' : '500', transition: 'all 0.15s', fontFamily: 'Poppins, sans-serif' }}>{c}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>{saving ? 'Saving…' : '✅ Save changes'}</button>
                  <button onClick={() => setEditing(false)} style={{ flex: 1, background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '2px solid var(--border)', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="listing-layout">
                {/* LEFT — Images */}
                <div className="s1">
                  <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--bg-img)', boxShadow: 'var(--shadow-strong)', position: 'relative', marginBottom: '10px' }}>
                    <div style={{ paddingTop: '72%', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0 }}>
                        {hasImages
                          ? <img key={activeImg} className="img-fade main-img" src={listing.images[activeImg]} onClick={() => setLightbox(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '96px' }}>{listing.emoji}</div>}
                      </div>
                    </div>
                    <span style={{ position: 'absolute', top: '14px', left: '14px', fontSize: '12px', fontWeight: '800', background: listing.condition === 'New' ? 'rgba(223,255,239,0.96)' : listing.condition === 'Fair' ? 'rgba(255,246,221,0.96)' : 'rgba(227,240,255,0.96)', color: listing.condition === 'New' ? '#009957' : listing.condition === 'Fair' ? '#B8860B' : '#1D4ED8', padding: '5px 13px', borderRadius: '99px', backdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>{listing.condition}</span>
                    {discount >= 15 && !listing.sold && (
                      <span style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '12px', fontWeight: '800', background: 'linear-gradient(135deg, #FF6B2C, #FF3D81)', color: '#fff', padding: '5px 13px', borderRadius: '99px', boxShadow: '0 2px 8px rgba(255,61,129,0.3)' }}>-{discount}% OFF</span>
                    )}
                    {listing.featured && !listing.sold && (
                      <span style={{ position: 'absolute', bottom: '14px', left: '14px', fontSize: '11px', fontWeight: '900', background: 'linear-gradient(135deg, #FFC83D, #FF6B2C)', color: '#fff', padding: '5px 13px', borderRadius: '99px', boxShadow: '0 2px 8px rgba(255,107,44,0.4)' }}>⭐ FEATURED</span>
                    )}
                    {listing.sold && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,19,48,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                        <span className="kalam" style={{ color: '#fff', fontSize: '36px', letterSpacing: '8px', display: 'block' }}>SOLD</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginTop: '6px' }}>No longer available</span>
                      </div>
                    )}
                    {hasImages && <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '99px', backdropFilter: 'blur(4px)' }}>Tap to zoom</div>}
                  </div>
                  {hasImages && listing.images.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {listing.images.map((img: string, i: number) => (
                        <img key={i} className="thumb" src={img} onClick={() => setActiveImg(i)}
                          style={{ width: '72px', height: '72px', objectFit: 'cover', border: activeImg === i ? '3px solid #00B86B' : '2px solid var(--border)', opacity: activeImg === i ? 1 : 0.55, boxShadow: activeImg === i ? '0 4px 12px rgba(0,184,107,0.25)' : 'none' }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT */}
                <div>
                  {/* Title & Price */}
                  <div className="s2" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: listing.featured ? '2px solid #FFC83D' : '2px solid var(--border)', padding: '24px', marginBottom: '12px', boxShadow: listing.featured ? '0 4px 20px rgba(255,200,61,0.18)' : 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                      <h1 style={{ fontSize: '22px', fontWeight: '800', color: listing.sold ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.3, flex: 1, letterSpacing: '-0.02em' }}>{listing.title}</h1>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginTop: '4px' }}>
                        {listing.featured && <span style={{ background: 'linear-gradient(135deg, #FFC83D, #FF6B2C)', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px' }}>⭐ FEATURED</span>}
                        {listing.sold && <span style={{ background: '#E24B4A', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px', letterSpacing: '1px' }}>SOLD</span>}
                      </div>
                    </div>
                    {listing.subtitle && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6, fontWeight: '500' }}>{listing.subtitle}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                      <span className="kalam" style={{ fontSize: '40px', color: listing.sold ? 'var(--text-muted)' : '#00B86B', fontWeight: '900', lineHeight: 1 }}>₹{listing.price}</span>
                      {listing.origPrice && <span style={{ fontSize: '18px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{listing.origPrice}</span>}
                      {discount > 0 && !listing.sold && (
                        <span style={{ fontSize: '13px', color: '#fff', background: 'linear-gradient(135deg, #00B86B, #009957)', padding: '5px 14px', borderRadius: '99px', fontWeight: '800', boxShadow: '0 3px 10px rgba(0,184,107,0.25)' }}>Save ₹{listing.origPrice - listing.price}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="tag">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.34 1 3 2.34 3 4c0 2.5 3 7 3 7s3-4.5 3-7c0-1.66-1.34-3-3-3z" fill="var(--text-secondary)"/><circle cx="6" cy="4" r="1" fill="var(--bg-card)"/></svg>
                        {listing.location}
                      </span>
                      <span className="tag" style={{ textTransform: 'capitalize' }}>🏷️ {listing.category}</span>
                      <span className="tag">👁️ {listing.views || 0} views</span>
                      {reviewTotal > 0 && (
                        <span className="tag">
                          <Stars rating={reviewAvg} size={11} />
                          <span style={{ fontWeight: '700' }}>{reviewAvg}</span>
                          <span style={{ color: 'var(--text-muted)' }}>({reviewTotal})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seller + CTA */}
                  <div className="s3" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '2px solid var(--border)', padding: '22px', marginBottom: '12px', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Seller</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', background: 'var(--bg)', borderRadius: '14px', border: '2px solid var(--border)' }}>
                      <div className="kalam" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #00B86B, #2D7FF9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                        {listing.seller?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{listing.seller?.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {reviewTotal > 0 ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Stars rating={reviewAvg} size={12} />
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{reviewAvg}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({reviewTotal} review{reviewTotal !== 1 ? 's' : ''})</span>
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No reviews yet</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#00B86B', background: '#DFFFEF', padding: '4px 10px', borderRadius: '99px', fontWeight: '700' }}>Active seller</div>
                    </div>

                    {isOwner ? (
                      <div>
                        <div style={{ background: 'linear-gradient(135deg, #DFFFEF, #B6F5D8)', borderRadius: '14px', padding: '14px', fontSize: '14px', color: '#009957', textAlign: 'center', fontWeight: '800', fontFamily: 'Poppins, sans-serif', border: '2px solid rgba(0,184,107,0.2)', marginBottom: '10px' }}>
                          ✅ This is your listing
                        </div>
                        {listing.featured ? (
                          <div style={{ background: 'rgba(255,200,61,0.1)', border: '2px solid #FFC83D', borderRadius: '14px', padding: '13px 16px', textAlign: 'center', fontSize: '13px', color: '#B8860B', fontWeight: '800', fontFamily: 'Poppins, sans-serif' }}>
                            ⭐ Featured — showing at the top of marketplace!
                          </div>
                        ) : !listing.sold ? (
                          <div>
                            <button onClick={() => setShowTiers(!showTiers)}
                              style={{ width: '100%', background: showTiers ? 'var(--bg)' : 'linear-gradient(135deg, #FFC83D, #FF6B2C)', color: showTiers ? 'var(--text-primary)' : '#fff', border: showTiers ? '2px solid var(--border)' : 'none', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', boxShadow: showTiers ? 'none' : '0 4px 0 #E0851F' }}>
                              <span>⭐ Feature this listing</span>
                              <span style={{ fontSize: '18px', transform: showTiers ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>›</span>
                            </button>
                            {showTiers && (
                              <div className="tiers-list" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', paddingLeft: '2px' }}>Choose a plan — your listing appears at the top:</div>
                                {TIERS.map(t => (
                                  <button key={t.tier} className={'tier-btn' + (t.popular ? ' popular' : '')} onClick={() => handleFeaturePayment(t.tier, t.price)} disabled={paymentLoading}>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontSize: '13px', fontWeight: '800', color: t.popular ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {t.label}
                                        {t.popular && <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '2px 7px', borderRadius: '99px', fontWeight: '800' }}>POPULAR</span>}
                                      </div>
                                      <div style={{ fontSize: '11px', color: t.popular ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', marginTop: '2px' }}>{t.desc}</div>
                                    </div>
                                    <div className="kalam" style={{ fontSize: '20px', color: t.popular ? '#fff' : '#FF6B2C', flexShrink: 0 }}>₹{t.price}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                        <button onClick={() => window.location.href = '/marketplace'}
                          style={{ width: '100%', background: 'transparent', color: '#00B86B', border: '2px solid #00B86B', borderRadius: '14px', padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', transition: 'all 0.15s' }}>
                          ← Back to listings
                        </button>
                      </div>
                    ) : listing.sold ? (
                      <div>
                        <div style={{ background: 'var(--bg)', borderRadius: '14px', padding: '14px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', border: '2px solid var(--border)' }}>🔒 Item already sold</div>
                        <button onClick={() => window.location.href = '/marketplace'}
                          style={{ width: '100%', background: 'transparent', color: 'var(--text-secondary)', border: '2px solid var(--border)', borderRadius: '14px', padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
                          ← Back to listings
                        </button>
                      </div>
                    ) : isSignedIn ? (
                      <div>
                        <div className="hide-mobile"><WaButton /></div>
                        <button onClick={() => window.location.href = '/marketplace'}
                          style={{ width: '100%', background: 'transparent', color: 'var(--text-secondary)', border: '2px solid var(--border)', borderRadius: '14px', padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', transition: 'all 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = '#00B86B')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                          ← Back to listings
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button onClick={() => openSignIn()} style={{ width: '100%', background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>
                          Sign in to contact seller
                        </button>
                        <button onClick={() => window.location.href = '/marketplace'}
                          style={{ width: '100%', background: 'transparent', color: 'var(--text-secondary)', border: '2px solid var(--border)', borderRadius: '14px', padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
                          ← Back to listings
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Safety tip */}
                  <div className="s4" style={{ borderRadius: '16px', padding: '16px 18px', display: 'flex', gap: '14px', background: 'linear-gradient(135deg, #FFF6DD, #FFEDE2)', border: '2px solid #FFCB94', alignItems: 'flex-start' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFF6DD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🛡️</div>
                    <div>
                      <div className="kalam" style={{ fontSize: '13px', color: '#92400E', marginBottom: '4px' }}>Stay safe when buying</div>
                      <div style={{ fontSize: '12px', color: '#A16207', lineHeight: 1.7, fontWeight: '500' }}>
                        Meet in a <strong>public place</strong> · Inspect before paying · <strong>Never share OTP</strong> or bank details
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* REVIEWS SECTION */}
              <div className="s5" style={{ marginTop: '32px', background: 'var(--bg-card)', borderRadius: '20px', border: '2px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>Seller reviews</h2>
                    {reviewTotal > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Stars rating={reviewAvg} size={16} />
                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{reviewAvg}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>from {reviewTotal} review{reviewTotal !== 1 ? 's' : ''}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No reviews yet — be the first!</span>
                    )}
                  </div>
                  {!isOwner && isSignedIn && !reviewDone && (
                    <button onClick={() => setShowReviewForm(!showReviewForm)}
                      style={{ background: showReviewForm ? 'var(--bg)' : 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: showReviewForm ? 'var(--text-primary)' : '#fff', border: showReviewForm ? '2px solid var(--border)' : 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Poppins, sans-serif' }}>
                      {showReviewForm ? 'Cancel' : '✍️ Leave a review'}
                    </button>
                  )}
                  {!isOwner && !isSignedIn && (
                    <button onClick={() => openSignIn()} style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '2px solid var(--border)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      Sign in to review
                    </button>
                  )}
                </div>

                {reviewDone && (
                  <div style={{ background: '#DFFFEF', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#009957', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid rgba(0,184,107,0.2)' }}>
                    ✅ Thanks for your review! It helps other buyers.
                  </div>
                )}

                {showReviewForm && !reviewDone && (
                  <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '2px solid #00B86B' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Rate your experience with this seller:</div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                      {[1,2,3,4,5].map(i => (
                        <button key={i} className="star-btn"
                          onMouseEnter={() => setHoverRating(i)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewRating(i)}>
                          <span style={{ color: i <= (hoverRating || reviewRating) ? '#FFC83D' : '#D1D5DB' }}>★</span>
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', alignSelf: 'center', marginLeft: '6px' }}>
                          {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][reviewRating]}
                        </span>
                      )}
                    </div>
                    <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                      placeholder="Share your experience (optional)…" rows={3}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '13px', fontFamily: 'Poppins, sans-serif', background: 'var(--bg-input)', resize: 'none', marginBottom: '12px', transition: 'all 0.15s' }} />
                    <button onClick={submitReview} disabled={submittingReview || reviewRating === 0}
                      style={{ background: reviewRating > 0 ? 'linear-gradient(135deg,#00B86B,#2D7FF9)' : '#ccc', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 24px', fontSize: '14px', fontWeight: '800', cursor: reviewRating === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s', boxShadow: reviewRating > 0 ? '0 4px 0 #009957' : 'none' }}>
                      {submittingReview ? 'Submitting…' : 'Submit review'}
                    </button>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {reviews.map((r: any) => (
                      <div key={r.id} className="review-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="kalam" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #00B86B, #2D7FF9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                              {r.reviewer?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{r.reviewer?.name || 'Anonymous'}</div>
                              <Stars rating={r.rating} size={11} />
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {r.comment && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '6px', fontWeight: '500' }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  !showReviewForm && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                      No reviews yet for this seller
                    </div>
                  )
                )}
              </div>

              {/* Related listings */}
              {related.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 className="kalam" style={{ fontSize: '20px', color: 'var(--text-primary)' }}>More {listing.category}s you might like</h2>
                    <button onClick={() => router.push('/marketplace')} style={{ fontSize: '12px', color: '#00B86B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>See all →</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
                    {related.map(l => {
                      const d = l.origPrice ? Math.round((1 - l.price / l.origPrice) * 100) : 0
                      return (
                        <div key={l.id} className="rel-card" onClick={() => { window.location.href = '/listing/' + l.id }}>
                          <div style={{ height: '130px', background: 'var(--bg-img)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                            {l.images?.[0] ? <img className="rel-img" src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{l.emoji}</span>}
                            <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', background: l.condition === 'New' ? 'rgba(223,255,239,0.95)' : 'rgba(227,240,255,0.95)', color: l.condition === 'New' ? '#009957' : '#1D4ED8', padding: '2px 7px', borderRadius: '99px', fontWeight: '800' }}>{l.condition}</span>
                            {d >= 15 && <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', background: 'linear-gradient(135deg,#FF6B2C,#FF3D81)', color: '#fff', padding: '2px 7px', borderRadius: '99px', fontWeight: '800' }}>-{d}%</span>}
                          </div>
                          <div style={{ padding: '11px 13px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>{l.location}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                              <span className="kalam" style={{ fontSize: '17px', color: '#00B86B' }}>₹{l.price}</span>
                              {l.origPrice && <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky mobile WhatsApp CTA */}
        {!editing && !isOwner && !listing.sold && (
          <div className="sticky-cta">
            {isSignedIn
              ? <WaButton />
              : <button onClick={() => openSignIn()} style={{ width: '100%', background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Sign in to contact seller</button>
            }
          </div>
        )}
      </div>
    </>
  )
}