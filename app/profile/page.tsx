'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk, SignInButton } from '@clerk/nextjs'
import BottomNav from '@/components/BottomNav'

// ── Contact (change here only) ────────────────────────────────────────────
const WHATSAPP_NUMBER = '919914735738'
const WA_HELP_LINK = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, I need help on Pageplus')

const conditions = ['New', 'Good', 'Fair']

type Tab = 'active' | 'sold' | 'reviews' | 'saved'

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#E0A100' : '#D9CFC2' }}>★</span>
      ))}
    </span>
  )
}

const inputCls = 'w-full px-4 py-3 rounded-xl bg-white font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-[#E8632B]/20 focus:border-[#E8632B] border border-[#EADFCC]'
const labelCls = 'font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5'

export default function ProfilePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()

  const [logoOk, setLogoOk] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [showPhoneEdit, setShowPhoneEdit] = useState(false)
  const [tab, setTab] = useState<Tab>('active')

  const [reviews, setReviews] = useState<any[]>([])
  const [reviewAvg, setReviewAvg] = useState(0)
  const [reviewTotal, setReviewTotal] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({})
  const [unread, setUnread] = useState(0)

  const uid = user?.id

  // My listings (and the saved phone number, as before)
  useEffect(() => {
    if (!isSignedIn || !uid) return
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mine = data.filter((l: any) => l.sellerId === uid)
          setListings(mine)
          if (mine.length > 0 && mine[0].seller?.phone) setPhone(mine[0].seller.phone)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isSignedIn, uid])

  // Reviews about me
  useEffect(() => {
    if (!isSignedIn || !uid) return
    fetch('/api/reviews?sellerId=' + uid)
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.reviews)) { setReviews(d.reviews); setReviewAvg(Number(d.avg) || 0); setReviewTotal(Number(d.total) || 0) }
      })
      .catch(() => {})
  }, [isSignedIn, uid])

  // Saved books count
  useEffect(() => {
    if (!isSignedIn || !uid) return
    fetch('/api/wishlist?userId=' + uid)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSavedCount(d.length) })
      .catch(() => {})
  }, [isSignedIn, uid])

  // Chats on my books
  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/chat/conversations', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !Array.isArray(d.conversations)) return
        const counts: Record<string, number> = {}
        d.conversations.forEach((c: any) => {
          if (c.role === 'selling' && c.listing?.id) counts[c.listing.id] = (counts[c.listing.id] || 0) + 1
        })
        setChatCounts(counts)
        setUnread(Number(d.unreadCount) || 0)
      })
      .catch(() => {})
  }, [isSignedIn])

  async function savePhone() {
    if (phone.trim().length < 10) return
    setSavingPhone(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user?.id, phone: phone.trim() }),
    })
    setSavingPhone(false)
    setPhoneSaved(true)
    setTimeout(() => { setPhoneSaved(false); setShowPhoneEdit(false) }, 1500)
  }

  function startEdit(l: any) {
    setEditingId(l.id)
    setForm({ title: l.title, subtitle: l.subtitle || '', price: l.price, origPrice: l.origPrice || '', condition: l.condition, location: l.location })
  }

  async function handleSave(id: string) {
    setSaving(true)
    const res = await fetch('/api/listings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const updated = await res.json()
    setListings(listings.map(l => l.id === id ? { ...l, ...updated } : l))
    setEditingId(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing?')) return
    await fetch('/api/listings/' + id, { method: 'DELETE' })
    setListings(listings.filter(l => l.id !== id))
  }

  async function toggleSold(id: string, currentSold: boolean) {
    await fetch('/api/listings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sold: !currentSold }) })
    setListings(listings.map(l => l.id === id ? { ...l, sold: !currentSold } : l))
  }

  const activeListings = listings.filter(l => !l.sold)
  const soldListings = listings.filter(l => l.sold)
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0)
  const soldValue = soldListings.reduce((sum, l) => sum + (Number(l.price) || 0), 0)
  const tabListings = tab === 'active' ? activeListings : soldListings
  const hasLiveListing = listings.some(l => (!l.status || l.status === 'active') && !l.sold)
  const isVerifiedSeller = phone.length === 10 && hasLiveListing

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : ''

  const navLink = 'font-label-lg text-label-lg text-on-surface-variant hover:text-primary-container transition-colors px-3 py-2 rounded-full hover:bg-surface-container-low whitespace-nowrap'
  const tabBtn = (active: boolean) => 'px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shrink-0 transition-colors ' + (active ? 'bg-primary-container text-on-primary font-semibold shadow-sm' : 'bg-surface-container-lowest text-on-surface font-medium hover:bg-surface-container')
  const smallBtn = 'h-9 rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-1 transition-colors'

  // ── Loading / signed out ─────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-[36px] text-primary animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-5">
        <div className="text-center">
          <span className="material-symbols-outlined text-[44px] text-primary">lock</span>
          <h1 className="font-headline-md text-headline-md mt-2 mb-1">Sign in to view your profile</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">See your listings, reviews and saved books.</p>
          <SignInButton mode="modal">
            <button className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Sign in</button>
          </SignInButton>
          <button onClick={() => router.push('/marketplace')} className="block mx-auto mt-3 text-on-surface-variant font-label-md text-label-md">Back to marketplace</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)]">
        <div className="h-16 px-margin md:px-margin-desktop flex items-center justify-between gap-space-sm md:gap-6 max-w-md mx-auto md:max-w-[1100px]">
          <div className="flex items-center gap-space-sm min-w-0">
            <button aria-label="Back" onClick={() => router.push('/marketplace')} className="min-w-[44px] min-h-[44px] -ml-space-xs flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            {logoOk ? (
              <img alt="Pageplus" className="h-8 w-auto object-contain cursor-pointer" src="/pageplus-logo.png" onError={() => setLogoOk(false)} onClick={() => router.push('/')} />
            ) : (
              <span className="font-headline-md text-headline-md text-primary cursor-pointer" onClick={() => router.push('/')}>Pageplus</span>
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <button className={navLink} onClick={() => router.push('/school-sets')}>School Sets</button>
            <button className={navLink} onClick={() => router.push('/marketplace')}>Marketplace</button>
            <button className={navLink} onClick={() => router.push('/my-orders')}>My Orders</button>
            <button className={navLink + ' !text-primary-container font-bold'} onClick={() => router.push('/profile')}>Profile</button>
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <button aria-label="My orders" onClick={() => router.push('/my-orders')} className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </button>
            <button aria-label={unread > 0 ? 'Messages, ' + unread + ' unread' : 'Messages'} onClick={() => router.push('/messages')} className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container relative">
              <span className="material-symbols-outlined text-[22px]">forum</span>
              {unread > 0 && <span className="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-container text-on-primary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <button aria-label="Saved books" onClick={() => router.push('/wishlist')} className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container">
              <span className="material-symbols-outlined text-[22px]">favorite</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-[1100px] pt-16 pb-28 md:pb-12 px-margin md:px-margin-desktop">
        <div className="pt-space-md lg:pt-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

          {/* LEFT: profile summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-space-md">

            {/* Profile card */}
            <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex gap-space-md">
                <div className="relative shrink-0">
                  {user?.imageUrl
                    ? <img className="w-16 h-16 rounded-full object-cover" src={user.imageUrl} alt="" />
                    : <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-headline-md text-headline-md">{user?.firstName?.charAt(0).toUpperCase()}</div>}
                  {isVerifiedSeller && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="font-headline-md text-headline-md text-on-surface leading-tight truncate">{user?.fullName || 'Your profile'}</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    {reviewTotal > 0 ? (
                      <>
                        <span className="material-symbols-outlined text-[15px] text-[#E0A100]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">{reviewAvg}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">({reviewTotal} review{reviewTotal !== 1 ? 's' : ''})</span>
                      </>
                    ) : (
                      <span className="font-body-sm text-body-sm text-on-surface-variant">No reviews yet</span>
                    )}
                  </div>
                  {memberSince && <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Member since {memberSince}</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-space-xs mt-space-md">
                {isVerifiedSeller && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2E8B57]/10 text-[#2E8B57] font-label-micro text-label-micro font-semibold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>Verified seller
                  </span>
                )}
                {phone.length === 10 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro">
                    <span className="material-symbols-outlined text-[13px] text-primary">call</span>+91 {phone}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-space-sm mt-space-md">
                <button onClick={() => setShowPhoneEdit(s => !s)} className="w-full h-10 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span>Edit number
                </button>
                <button onClick={() => router.push('/my-orders')} className="w-full h-10 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[16px]">inventory_2</span>My orders
                </button>
              </div>

              {(showPhoneEdit || phone.length < 10) && (
                <div className="mt-space-md bg-surface-container-low rounded-lg p-3">
                  <label className={labelCls}>WhatsApp number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-xl bg-white border border-[#EADFCC] font-label-md text-label-md text-on-surface-variant shrink-0">+91</div>
                    <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" type="text" inputMode="numeric"
                      className={inputCls + (phone.length === 10 ? ' !border-[#2E8B57]' : '')} />
                    <button onClick={savePhone} disabled={savingPhone || phone.length < 10}
                      className="px-4 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                      {phoneSaved ? 'Saved' : savingPhone ? '…' : 'Save'}
                    </button>
                  </div>
                  {phone.length > 0 && phone.length < 10 && <p className="font-body-sm text-body-sm text-error mt-1.5">Enter a 10-digit number.</p>}
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1.5">We use this to alert you on WhatsApp about new messages.</p>
                </div>
              )}
            </section>

            {/* Stats */}
            <section className="bg-surface-container rounded-xl p-space-md">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-micro text-label-micro uppercase font-bold text-tertiary tracking-wider">Your selling</span>
                <span className="inline-flex items-center gap-1 text-[#2E8B57] font-label-micro text-label-micro font-semibold bg-surface-container-lowest px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">eco</span>0% Commission
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center text-center">
                  <span className="font-headline-md text-headline-md text-primary font-bold">{soldListings.length}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight mt-0.5">Books sold</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center text-center">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">₹{soldValue.toLocaleString('en-IN')}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight mt-0.5">Sold value</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center text-center">
                  <span className="font-headline-md text-headline-md text-[#2E8B57] font-bold">{totalViews}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight mt-0.5">Total views</span>
                </div>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-2">Sold value adds up the prices of the books you marked sold. Buyers pay you directly.</p>
            </section>

            {/* Trust card (desktop sidebar keeps it close) */}
            <section className="bg-surface-container-low rounded-xl p-space-md hidden lg:block">
              <TrustCard phoneSet={phone.length === 10} />
            </section>
          </div>

          {/* RIGHT: tabs and content */}
          <div className="lg:col-span-8 mt-space-lg lg:mt-0 flex flex-col gap-space-md">

            <div className="flex gap-space-xs overflow-x-auto pb-1 scrollbar-none">
              <button onClick={() => setTab('active')} className={tabBtn(tab === 'active')}>Active Listings ({activeListings.length})</button>
              <button onClick={() => setTab('sold')} className={tabBtn(tab === 'sold')}>Sold ({soldListings.length})</button>
              <button onClick={() => setTab('reviews')} className={tabBtn(tab === 'reviews')}>Reviews ({reviewTotal})</button>
              <button onClick={() => setTab('saved')} className={tabBtn(tab === 'saved')}>Saved ({savedCount})</button>
            </div>

            {/* Listings (active / sold) */}
            {(tab === 'active' || tab === 'sold') && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">{tab === 'active' ? 'Your books on sale' : 'Books you sold'}</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{tabListings.length} item{tabListings.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-surface-container animate-pulse" />)}
                  </div>
                ) : tabListings.length === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-sm">
                    <span className="material-symbols-outlined text-[40px] text-primary">{tab === 'active' ? 'inbox' : 'sell'}</span>
                    <h3 className="font-headline-sm text-headline-sm mt-2 mb-1">{tab === 'active' ? 'No active listings' : 'No sold books yet'}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{tab === 'active' ? 'Post your first book and start selling.' : 'Mark a book as sold when it is gone.'}</p>
                    {tab === 'active' && <button onClick={() => router.push('/sell')} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Post a listing</button>}
                  </div>
                ) : (
                  tabListings.map(l => {
                    const off = Number(l.origPrice) > Number(l.price) ? Math.round((1 - l.price / l.origPrice) * 100) : 0
                    const chats = chatCounts[l.id] || 0
                    const pending = l.status && l.status !== 'active'
                    return (
                      <div key={l.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
                        {editingId === l.id ? (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">edit</span></div>
                              <h3 className="font-headline-sm text-headline-sm text-on-surface">Edit listing</h3>
                            </div>
                            {(['title', 'subtitle'] as const).map(field => (
                              <div key={field} className="mb-2.5">
                                <label className={labelCls}>{field}</label>
                                <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className={inputCls} />
                              </div>
                            ))}
                            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                              {(['price', 'origPrice'] as const).map(field => (
                                <div key={field}>
                                  <label className={labelCls}>{field === 'origPrice' ? 'Original (₹)' : 'Price (₹)'}</label>
                                  <input type="number" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className={inputCls} />
                                </div>
                              ))}
                            </div>
                            <div className="mb-2.5">
                              <label className={labelCls}>Condition</label>
                              <div className="flex gap-2">
                                {conditions.map(c => (
                                  <button key={c} onClick={() => setForm({ ...form, condition: c })}
                                    className={'flex-1 py-2.5 rounded-xl font-label-md text-label-md transition-colors ' + (form.condition === c ? 'bg-[#FDE7D8] border-[1.5px] border-[#E8632B] text-[#C4501A] font-semibold' : 'bg-white border border-[#EADFCC] text-[#6B6560]')}>{c}</button>
                                ))}
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className={labelCls}>Location</label>
                              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} />
                            </div>
                            <div className="flex gap-2.5">
                              <button onClick={() => handleSave(l.id)} disabled={saving} className="flex-1 bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3 rounded-xl shadow-md disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
                              <button onClick={() => setEditingId(null)} className="flex-1 bg-surface-container-low text-on-surface font-label-lg text-label-lg font-semibold py-3 rounded-xl border border-[#EADFCC]">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-space-md cursor-pointer" onClick={() => router.push('/listing/' + l.id)}>
                              <div className="relative w-20 h-24 rounded-lg overflow-hidden shrink-0 bg-primary-fixed/50 flex items-center justify-center text-[30px]">
                                {l.images?.[0] ? <img className="w-full h-full object-cover" src={l.images[0]} alt={l.title} /> : <span>{l.emoji || '📚'}</span>}
                                {l.condition && <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-micro text-[10px] font-bold">{l.condition}</span>}
                                {l.sold && <div className="absolute inset-0 bg-inverse-surface/55 flex items-center justify-center"><span className="text-white font-label-micro text-[10px] tracking-widest font-bold">SOLD</span></div>}
                              </div>
                              <div className="flex flex-col justify-between flex-1 min-w-0">
                                <div>
                                  <span className="font-label-micro text-label-micro uppercase font-bold text-primary tracking-wider capitalize">{l.category}</span>
                                  <h3 className={'font-headline-sm text-headline-sm line-clamp-1 mt-0.5 ' + (l.sold ? 'text-outline' : 'text-on-surface')}>{l.title}</h3>
                                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                                    <span className={'font-headline-sm text-headline-sm font-bold ' + (l.sold ? 'text-outline' : 'text-primary')}>₹{l.price}</span>
                                    {Number(l.origPrice) > Number(l.price) && <span className="font-body-sm text-body-sm text-on-surface-variant line-through">MRP ₹{l.origPrice}</span>}
                                    {off > 0 && !l.sold && <span className="font-label-micro text-label-micro text-[#2E8B57] font-semibold">{off}% OFF</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm flex-wrap">
                                  {chats > 0 && <><span className="material-symbols-outlined text-[15px] text-secondary-container">forum</span><span className="font-medium text-on-surface">{chats} chat{chats !== 1 ? 's' : ''}</span><span>•</span></>}
                                  <span>{l.views || 0} views</span>
                                  {l.location && <><span>•</span><span className="truncate max-w-[140px]">{l.location}</span></>}
                                </div>
                                {pending && (
                                  <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-micro text-[10px] font-bold w-fit mt-1 ' + (l.status === 'rejected' ? 'bg-error-container text-on-error-container' : 'bg-[#E0A100]/15 text-[#9A6B00]')}>
                                    {l.status === 'rejected' ? 'Not approved' : 'Waiting for approval'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                              <button onClick={() => startEdit(l)} className={smallBtn + ' bg-surface-container text-on-surface hover:bg-surface-variant'}>
                                <span className="material-symbols-outlined text-[15px]">edit_note</span>Edit
                              </button>
                              <button onClick={() => toggleSold(l.id, l.sold)} className={smallBtn + (l.sold ? ' bg-[#E0A100]/15 text-[#9A6B00]' : ' bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary-fixed-dim')}>
                                <span className="material-symbols-outlined text-[15px]">{l.sold ? 'replay' : 'check'}</span>{l.sold ? 'Relist' : 'Mark as sold'}
                              </button>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              {chats > 0 && <button onClick={() => router.push('/messages')} className="font-label-md text-label-md text-primary font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">forum</span>Open chats</button>}
                              {!l.sold && !l.featured && !pending && <button onClick={() => router.push('/listing/' + l.id)} className="font-label-md text-label-md text-primary font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">star</span>Feature this listing</button>}
                              {l.featured && !l.sold && <span className="font-label-md text-label-md text-[#9A6B00] font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>Featured</span>}
                              <button onClick={() => handleDelete(l.id)} className="font-label-md text-label-md text-error font-semibold flex items-center gap-1 ml-auto"><span className="material-symbols-outlined text-[15px]">delete</span>Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                )}

                {tab === 'active' && (
                  <button onClick={() => router.push('/sell')} className="w-full h-12 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-transform">
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>List another book
                  </button>
                )}
              </>
            )}

            {/* Reviews */}
            {tab === 'reviews' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Reviews about you</h2>
                    {reviewTotal > 0 && <div className="flex items-center gap-1.5 mt-0.5"><Stars rating={reviewAvg} size={14} /><span className="font-label-md text-label-md font-semibold">{reviewAvg}</span><span className="font-body-sm text-body-sm text-on-surface-variant">from {reviewTotal}</span></div>}
                  </div>
                </div>
                {reviews.length === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-sm">
                    <span className="material-symbols-outlined text-[40px] text-primary">star</span>
                    <h3 className="font-headline-sm text-headline-sm mt-2 mb-1">No reviews yet</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Buyers can leave a review on your listings after you meet.</p>
                  </div>
                ) : (
                  reviews.map((r: any) => (
                    <div key={r.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-space-sm min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold font-label-md text-label-md flex items-center justify-center shrink-0">{r.reviewer?.name?.charAt(0).toUpperCase() || '?'}</div>
                          <div className="min-w-0">
                            <p className="font-label-md text-label-md text-on-surface font-semibold truncate">{r.reviewer?.name || 'Anonymous'}</p>
                            <p className="font-body-sm text-[12px] text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <Stars rating={r.rating} size={14} />
                      </div>
                      {r.comment && <p className="font-body-md text-body-md text-on-surface mt-space-sm italic">&ldquo;{r.comment}&rdquo;</p>}
                    </div>
                  ))
                )}
              </>
            )}

            {/* Saved */}
            {tab === 'saved' && (
              <div className="bg-surface-container-lowest rounded-xl p-8 text-center shadow-sm">
                <span className="material-symbols-outlined text-[40px] text-primary">favorite</span>
                <h3 className="font-headline-sm text-headline-sm mt-2 mb-1">{savedCount} saved book{savedCount !== 1 ? 's' : ''}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Books you hearted are kept in your wishlist.</p>
                <button onClick={() => router.push('/wishlist')} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Open wishlist</button>
              </div>
            )}

            {/* Trust (phones) */}
            <section className="bg-surface-container-low rounded-xl p-space-md lg:hidden">
              <TrustCard phoneSet={phone.length === 10} />
            </section>

            {/* Help */}
            <section className="bg-surface-container p-space-md rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="material-symbols-outlined text-primary text-[22px] shrink-0">support_agent</span>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface font-semibold">Need help?</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Chat with Pageplus support on WhatsApp</p>
                </div>
              </div>
              <a href={WA_HELP_LINK} target="_blank" rel="noopener noreferrer" className="h-8 px-3 rounded-full bg-[#25D366] text-white font-label-micro text-label-micro font-bold flex items-center shadow-sm shrink-0">Chat</a>
            </section>

            <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full py-3 rounded-xl border border-[#EADFCC] text-on-surface-variant font-label-lg text-label-lg font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[18px]">logout</span>Sign out
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

function TrustCard({ phoneSet }: { phoneSet: boolean }) {
  const rows = [
    { ok: phoneSet, t: 'Phone number added', s: phoneSet ? 'Used for WhatsApp alerts about new messages' : 'Add your number to get message alerts' },
    { ok: true, t: 'Listings approved by Pageplus', s: 'Every listing is checked before it goes live' },
    { ok: true, t: 'Buyers message you inside Pageplus', s: 'Chats show first names only' },
  ]
  return (
    <>
      <div className="flex items-center gap-2 mb-space-sm">
        <span className="material-symbols-outlined text-[#2E8B57] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">How Pageplus protects you</h3>
      </div>
      <div className="flex flex-col gap-space-sm">
        {rows.map(r => (
          <div key={r.t} className="flex items-start gap-space-sm">
            <div className={'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ' + (r.ok ? 'bg-[#2E8B57]/15 text-[#2E8B57]' : 'bg-surface-container-high text-outline')}>
              <span className="material-symbols-outlined text-[13px] font-bold">{r.ok ? 'check' : 'remove'}</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface font-semibold">{r.t}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{r.s}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}