'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Settings (change here only) ───────────────────────────────────────────
const WHATSAPP_NUMBER = '919914735738'
const WA_HELP_LINK = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, I need help listing a book on Pageplus')
const MAX_PHOTOS = 3                          // slots: Cover, MRP tag, Extra
const MAX_PHOTO_MB = 10
const PRICE_SUGGESTIONS = [0.4, 0.5, 0.6]     // shares of the MRP shown as suggestion buttons
const DRAFT_KEY = 'pageplus_sell_draft'

const categories = ['textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const conditions = ['New', 'Good', 'Fair']
const conditionDesc: Record<string, string> = {
  New: 'Unused, sealed or as good as new',
  Good: 'Minor wear only, nothing missing',
  Fair: 'Used but fully readable, may have marks',
}
const conditionTag: Record<string, string> = { New: 'Fastest sale', Good: 'Popular', Fair: '' }
const emojis: Record<string, string> = {
  textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙',
}
const catDesc: Record<string, string> = {
  textbook: 'School & college', novel: 'Fiction & lit',
  notebook: 'Ruled, plain', art: 'Supplies',
  stationery: 'Pens, files', competitive: 'JEE, NEET',
}
const SLOTS = [
  { label: 'Cover', hint: 'Front cover', required: true },
  { label: 'MRP tag', hint: 'Price tag visible', required: true },
  { label: 'Extra', hint: 'Optional', required: false },
]

const LOCATIONS = [
  'Sector 1, Chandigarh', 'Sector 2, Chandigarh', 'Sector 3, Chandigarh',
  'Sector 4, Chandigarh', 'Sector 5, Chandigarh', 'Sector 6, Chandigarh',
  'Sector 7, Chandigarh', 'Sector 8, Chandigarh', 'Sector 9, Chandigarh',
  'Sector 10, Chandigarh', 'Sector 11, Chandigarh', 'Sector 12, Chandigarh',
  'Sector 14, Chandigarh', 'Sector 15, Chandigarh', 'Sector 16, Chandigarh',
  'Sector 17, Chandigarh', 'Sector 18, Chandigarh', 'Sector 19, Chandigarh',
  'Sector 20, Chandigarh', 'Sector 21, Chandigarh', 'Sector 22, Chandigarh',
  'Sector 23, Chandigarh', 'Sector 24, Chandigarh', 'Sector 25, Chandigarh',
  'Sector 26, Chandigarh', 'Sector 27, Chandigarh', 'Sector 28, Chandigarh',
  'Sector 29, Chandigarh', 'Sector 30, Chandigarh', 'Sector 31, Chandigarh',
  'Sector 32, Chandigarh', 'Sector 33, Chandigarh', 'Sector 34, Chandigarh',
  'Sector 35, Chandigarh', 'Sector 36, Chandigarh', 'Sector 37, Chandigarh',
  'Sector 38, Chandigarh', 'Sector 39, Chandigarh', 'Sector 40, Chandigarh',
  'Sector 40-C, Chandigarh', 'Sector 41, Chandigarh', 'Sector 42, Chandigarh',
  'Sector 43, Chandigarh', 'Sector 44, Chandigarh', 'Sector 45, Chandigarh',
  'Sector 46, Chandigarh', 'Sector 47, Chandigarh', 'Sector 48, Chandigarh',
  'Sector 49, Chandigarh', 'Sector 50, Chandigarh', 'Sector 51, Chandigarh',
  'Sector 52, Chandigarh', 'Sector 53, Chandigarh', 'Sector 54, Chandigarh',
  'Sector 55, Chandigarh', 'Sector 56, Chandigarh',
  'Manimajra, Chandigarh', 'Burail, Chandigarh', 'Dhanas, Chandigarh',
  'Sector 1, Panchkula', 'Sector 2, Panchkula', 'Sector 4, Panchkula',
  'Sector 5, Panchkula', 'Sector 6, Panchkula', 'Sector 7, Panchkula',
  'Sector 8, Panchkula', 'Sector 9, Panchkula', 'Sector 10, Panchkula',
  'Sector 11, Panchkula', 'Sector 12, Panchkula', 'Sector 14, Panchkula',
  'Sector 15, Panchkula', 'Sector 20, Panchkula', 'Sector 21, Panchkula',
  'Sector 25, Panchkula', 'Kalka, Panchkula',
  'Phase 1, Mohali', 'Phase 2, Mohali', 'Phase 3B1, Mohali', 'Phase 3B2, Mohali',
  'Phase 4, Mohali', 'Phase 5, Mohali', 'Phase 6, Mohali', 'Phase 7, Mohali',
  'Phase 8, Mohali', 'Phase 9, Mohali', 'Phase 10, Mohali', 'Phase 11, Mohali',
  'Sector 58, Mohali', 'Sector 59, Mohali', 'Sector 60, Mohali',
  'Sector 61, Mohali', 'Sector 62, Mohali', 'Sector 63, Mohali',
  'Sector 64, Mohali', 'Sector 65, Mohali', 'Sector 66, Mohali',
  'Sector 67, Mohali', 'Sector 68, Mohali', 'Sector 70, Mohali',
  'Sector 71, Mohali', 'Sector 72, Mohali', 'Aerocity, Mohali',
  'Kharar, Mohali', 'Zirakpur', 'Derabassi', 'Dera Bassi',
]

const inputBase = 'w-full px-4 py-3 rounded-xl bg-white font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-[#E8632B]/20 focus:border-[#E8632B] border '
const inputOk = 'border-[#EADFCC]'
const inputBad = 'border-error'
const labelCls = 'font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

export default function SellPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  const [logoOk, setLogoOk] = useState(true)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [touched, setTouched] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [draftMsg, setDraftMsg] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  const [files, setFiles] = useState<(File | null)[]>(Array(MAX_PHOTOS).fill(null))
  const [previews, setPreviews] = useState<(string | null)[]>(Array(MAX_PHOTOS).fill(null))

  const [locationSearch, setLocationSearch] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationRef = useRef<HTMLDivElement>(null)

  // Phone — collected once and saved (no OTP check yet)
  const [phoneChecked, setPhoneChecked] = useState(false)
  const [hasPhone, setHasPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  const [form, setForm] = useState({
    title: '', subtitle: '', price: '',
    origPrice: '', condition: 'Good',
    category: 'textbook', location: '',
  })

  useEffect(() => {
    if (isSignedIn === false) router.push('/')
  }, [isSignedIn])

  // Restore a draft saved on this device (text only — photos are never stored)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      if (d && typeof d.form === 'object') {
        const f = d.form
        setForm(prev => ({
          title: typeof f.title === 'string' ? f.title : prev.title,
          subtitle: typeof f.subtitle === 'string' ? f.subtitle : prev.subtitle,
          price: typeof f.price === 'string' ? f.price : prev.price,
          origPrice: typeof f.origPrice === 'string' ? f.origPrice : prev.origPrice,
          condition: conditions.includes(f.condition) ? f.condition : prev.condition,
          category: categories.includes(f.category) ? f.category : prev.category,
          location: typeof f.location === 'string' ? f.location : prev.location,
        }))
        setLocationSearch(typeof f.location === 'string' ? f.location : '')
        setDraftMsg('Draft restored. Add your photos again.')
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch('/api/listings?admin=false')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mine = data.find((l: any) => l.sellerId === user.id)
          if (mine?.seller?.phone) { setHasPhone(true); setPhone(mine.seller.phone) }
        }
        setPhoneChecked(true)
      })
      .catch(() => setPhoneChecked(true))
  }, [isSignedIn, user])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!isSignedIn) return null

  // ── Helpers ──────────────────────────────────────────────────────────────
  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function pickPhoto(slot: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { alert('That photo is too large (max ' + MAX_PHOTO_MB + ' MB).'); return }
    setFiles(prev => { const n = [...prev]; n[slot] = file; return n })
    const reader = new FileReader()
    reader.onload = ev => setPreviews(prev => { const n = [...prev]; n[slot] = ev.target?.result as string; return n })
    reader.readAsDataURL(file)
  }

  function removePhoto(slot: number) {
    setFiles(prev => { const n = [...prev]; n[slot] = null; return n })
    setPreviews(prev => { const n = [...prev]; n[slot] = null; return n })
  }

  function selectLocation(loc: string) {
    setForm(prev => ({ ...prev, location: loc }))
    setLocationSearch(loc)
    setShowLocationDropdown(false)
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form }))
      setDraftMsg('Draft saved on this device (photos are not saved).')
    } catch {
      setDraftMsg('Could not save the draft on this device.')
    }
    setTimeout(() => setDraftMsg(''), 4000)
  }

  async function savePhone() {
    if (phone.length < 10) return
    setSavingPhone(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user?.id, phone: phone.trim() }),
    })
    setSavingPhone(false)
    setHasPhone(true)
  }

  async function uploadImages(): Promise<string[]> {
    const toUpload = files.filter((f): f is File => !!f)
    const urls: string[] = []
    for (let i = 0; i < toUpload.length; i++) {
      setUploadProgress('Uploading photo ' + (i + 1) + ' of ' + toUpload.length + '…')
      const file = toUpload[i]
      const ext = file.name.split('.').pop()
      const fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
      const { error } = await supabase.storage.from('Listings').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (error) throw new Error('Photo upload failed: ' + error.message)
      const { data } = supabase.storage.from('Listings').getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }
    setUploadProgress('')
    return urls
  }

  // ── Validation (shown inline once the seller tries to publish) ───────────
  const priceNum = parseInt(form.price) || 0
  const origNum = parseInt(form.origPrice) || 0
  const photoCount = files.filter(Boolean).length
  const photosOk = !!files[0] && !!files[1]
  const discount = priceNum > 0 && origNum > priceNum ? Math.round((1 - priceNum / origNum) * 100) : 0

  const errs = {
    photos: photosOk ? '' : 'Add the cover photo and a photo of the MRP tag.',
    title: form.title.trim() ? '' : 'Please enter a title.',
    price: !priceNum ? 'Enter your price.' : priceNum > 10000 ? 'Maximum price is ₹10,000.' : '',
    orig: origNum && origNum <= priceNum ? 'Original price must be higher than your price.' : origNum && discount > 90 ? 'Discount cannot exceed 90%.' : '',
    location: form.location.trim() ? '' : 'Choose where you can meet the buyer.',
  }
  const firstErrId = errs.title ? 'sec-title' : errs.photos ? 'sec-photos' : errs.price || errs.orig ? 'sec-price' : errs.location ? 'sec-location' : ''

  const doneCount = [photosOk, !errs.title, !errs.price, !errs.location].filter(Boolean).length
  const progress = Math.round((doneCount / 4) * 100)

  async function publish() {
    setTouched(true)
    if (firstErrId) { scrollToId(firstErrId); return }
    setLoading(true)
    try {
      const imageUrls = await uploadImages()
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, subtitle: form.subtitle,
          price: priceNum,
          origPrice: origNum || null,
          condition: form.condition, category: form.category,
          emoji: emojis[form.category], location: form.location,
          sellerId: user?.id!, images: imageUrls,
        }),
      })
      if (res.ok) {
        try { localStorage.removeItem(DRAFT_KEY) } catch {}
        setDone(true)
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'listing_rejected') alert('❌ Listing not approved\n\n' + data.reason)
        else alert('Something went wrong. Try again.')
      }
    } catch (err: any) { alert(err.message || 'Could not connect.') }
    setUploadProgress('')
    setLoading(false)
  }

  function resetForm() {
    setDone(false); setTouched(false)
    setForm({ title: '', subtitle: '', price: '', origPrice: '', condition: 'Good', category: 'textbook', location: '' })
    setFiles(Array(MAX_PHOTOS).fill(null)); setPreviews(Array(MAX_PHOTOS).fill(null)); setLocationSearch('')
  }

  const filteredLocations = locationSearch.length > 0
    ? LOCATIONS.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase())).slice(0, 8)
    : LOCATIONS.slice(0, 8)

  const suggestions = origNum > 0
    ? PRICE_SUGGESTIONS.map(p => ({ pct: Math.round(p * 100), value: Math.max(5, Math.round((origNum * p) / 5) * 5) })).filter(s => s.value < origNum)
    : []

  // ── Screens ──────────────────────────────────────────────────────────────
  const wrap = 'bg-surface text-on-surface font-body-md antialiased min-h-screen'

  if (!phoneChecked) {
    return (
      <div className={wrap + ' flex items-center justify-center'}>
        <span className="material-symbols-outlined text-[36px] text-primary animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!hasPhone) {
    return (
      <div className={wrap + ' flex flex-col'}>
        <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)]">
          <div className="h-16 px-margin flex items-center gap-space-sm max-w-md mx-auto">
            <button aria-label="Back" onClick={() => router.push('/marketplace')} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Add your number</h1>
          </div>
        </header>
        <main className="flex-1 w-full max-w-md mx-auto pt-20 pb-10 px-margin">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[28px]">call</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface text-center mb-1">Your WhatsApp number</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-5">Buyers message you inside Pageplus. We use your number to alert you on WhatsApp when a new message arrives. You only add it once.</p>
            <label className={labelCls}>WhatsApp number</label>
            <div className="flex gap-2 mb-2">
              <div className="flex items-center px-3 rounded-xl bg-surface-container-low border border-[#EADFCC] font-label-md text-label-md text-on-surface-variant shrink-0">+91</div>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" type="text" inputMode="numeric"
                className={inputBase + (phone.length === 10 ? 'border-[#2E8B57]' : inputOk)} />
            </div>
            {phone.length > 0 && phone.length < 10 && <p className="font-body-sm text-body-sm text-error mb-2">Enter a 10-digit number.</p>}
            <button onClick={savePhone} disabled={savingPhone || phone.length < 10}
              className="w-full mt-3 bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
              {savingPhone ? 'Saving…' : 'Save & continue'}
            </button>
            <button onClick={() => router.push('/marketplace')} className="w-full mt-2 py-3 text-on-surface-variant font-label-md text-label-md">Cancel</button>
          </div>
        </main>
      </div>
    )
  }

  if (done) {
    return (
      <div className={wrap + ' flex items-center justify-center p-5'}>
        <div className="bg-surface-container-lowest rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_8px_20px_-4px_rgba(45,30,18,0.10)] border border-[#EADFCC]">
          <div className="w-16 h-16 rounded-full bg-[#E0A100]/15 text-[#9A6B00] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[34px]">hourglass_top</span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Listing submitted!</h2>
          <div className="bg-surface-container-low rounded-xl p-3.5 mb-5 text-left">
            <p className="font-label-md text-label-md text-on-surface font-semibold mb-0.5">Under review</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Our team checks every listing. Yours goes live once it&apos;s approved, usually within a few hours.</p>
          </div>
          <button onClick={() => router.push('/marketplace')} className="w-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-transform mb-2.5">Browse marketplace</button>
          <button onClick={resetForm} className="w-full bg-surface-container-low text-on-surface font-label-lg text-label-lg font-semibold py-3.5 rounded-xl border border-[#EADFCC]">Post another listing</button>
        </div>
      </div>
    )
  }

  const publishLabel = loading ? (uploadProgress || 'Publishing…') : 'Publish'
  const publishDisabled = loading

  return (
    <div className={wrap + ' flex flex-col'}>

      {/* Grading guide */}
      {showGuide && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setShowGuide(false)}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Condition guide</h3>
            <div className="flex flex-col gap-2.5 mb-4">
              {conditions.map(c => (
                <div key={c} className="bg-surface-container-low rounded-xl p-3">
                  <p className="font-label-lg text-label-lg font-semibold text-on-surface">{c}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{conditionDesc[c]}</p>
                </div>
              ))}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Be honest. Photos must match, or the buyer may not buy when you meet.</p>
            <button onClick={() => setShowGuide(false)} className="w-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3 rounded-xl">Got it</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)]">
        <div className="h-16 px-margin md:px-margin-desktop flex items-center justify-between gap-space-sm max-w-md mx-auto md:max-w-[1100px]">
          <div className="flex items-center gap-space-xs min-w-0">
            <button aria-label="Back" onClick={() => router.push('/marketplace')} className="min-w-[44px] min-h-[44px] -ml-space-xs flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            {logoOk ? (
              <img alt="Pageplus" className="h-8 w-auto object-contain cursor-pointer" src="/pageplus-logo.png" onError={() => setLogoOk(false)} onClick={() => router.push('/')} />
            ) : (
              <span className="font-headline-sm text-headline-sm text-on-surface cursor-pointer" onClick={() => router.push('/')}>Page<span className="text-secondary-container">plus</span></span>
            )}
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate ml-1">Post a listing</h1>
          </div>
          <a aria-label="Get help" href={WA_HELP_LINK} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-primary rounded-full transition-colors">
            <span className="material-symbols-outlined text-[22px]">help_outline</span>
          </a>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-[1100px] pt-16 pb-40 lg:pb-12 px-margin md:px-margin-desktop">
        <div className="pt-space-md lg:pt-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

          {/* LEFT: the form */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">

            {/* Banner + progress */}
            <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm">
              <div className="flex items-center justify-between gap-space-xs mb-space-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-micro text-label-micro uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>0% Commission
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">{doneCount} of 4 done</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mt-1">List in 2 Minutes</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">Free to list, and you keep 100% of the price. Every listing is checked by our team before it goes live.</p>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: progress + '%' }}></div>
              </div>
              {draftMsg && <p className="font-label-md text-label-md text-primary mt-2">{draftMsg}</p>}
            </section>

            {/* Book details */}
            <section id="sec-title" className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Book details</h2>
              <div>
                <label className={labelCls}>Title *</label>
                <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. NCERT Physics Part 1 — Class 12" type="text" className={inputBase + (touched && errs.title ? inputBad : inputOk)} />
                {touched && errs.title && <p className="font-body-sm text-body-sm text-error mt-1">{errs.title}</p>}
              </div>
              <div>
                <label className={labelCls}>Subtitle <span className="normal-case tracking-normal font-normal">(optional)</span></label>
                <input value={form.subtitle} onChange={e => update('subtitle', e.target.value)} placeholder="e.g. 2023 edition, lightly used" type="text" className={inputBase + inputOk} />
              </div>
              <div>
                <label className={labelCls}>Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const on = form.category === cat
                    return (
                      <button key={cat} type="button" onClick={() => update('category', cat)}
                        className={'text-left p-3 rounded-xl transition-colors ' + (on ? 'bg-[#FDE7D8] border-[1.5px] border-[#E8632B]' : 'bg-white border border-[#EADFCC] hover:bg-surface-container-low')}>
                        <div className="text-[22px] leading-none mb-1">{emojis[cat]}</div>
                        <div className={'font-label-md text-label-md font-semibold capitalize ' + (on ? 'text-[#C4501A]' : 'text-on-surface')}>{cat}</div>
                        <div className="font-body-sm text-[11px] text-on-surface-variant">{catDesc[cat]}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Photos */}
            <section id="sec-photos" className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Upload book photos</h2>
                <span className="font-label-md text-label-md text-secondary font-semibold">{photoCount} of {MAX_PHOTOS} added</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">Add a clear cover photo and a photo of the MRP / price tag. Listings without price proof may be rejected.</p>
              <div className="grid grid-cols-3 gap-2.5">
                {SLOTS.slice(0, MAX_PHOTOS).map((slot, i) => (
                  previews[i] ? (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] bg-surface-container shadow-sm">
                      <img src={previews[i]!} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-container-lowest/90 text-primary font-label-micro text-[10px] uppercase font-bold">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>{slot.label}
                        </span>
                        <button type="button" aria-label={'Remove ' + slot.label + ' photo'} onClick={() => removePhoto(i)} className="w-6 h-6 rounded-full bg-inverse-surface/75 text-inverse-on-surface flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label key={i} className={'rounded-xl aspect-[4/3] flex flex-col items-center justify-center gap-1 p-2 text-center cursor-pointer transition-colors ' + (slot.required ? 'bg-surface-container-low hover:bg-surface-container-high' : 'bg-surface-container-low hover:bg-surface-container-high') + (touched && slot.required ? ' ring-1 ring-error' : '')}>
                      <span className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                      </span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">{slot.label}</span>
                      <span className="font-label-micro text-[10px] text-on-surface-variant uppercase tracking-wide">{slot.required ? 'Required' : 'Optional'}</span>
                      <input type="file" accept="image/*" onChange={e => pickPhoto(i, e)} className="hidden" />
                    </label>
                  )
                ))}
              </div>
              {touched && errs.photos && <p className="font-body-sm text-body-sm text-error mt-2">{errs.photos}</p>}
            </section>

            {/* Condition */}
            <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-xs">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Select book condition</h2>
                <button type="button" onClick={() => setShowGuide(true)} className="text-secondary font-label-md text-label-md flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[16px]">info</span>Guide
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {conditions.map(c => {
                  const on = form.condition === c
                  return (
                    <button key={c} type="button" onClick={() => update('condition', c)} role="radio" aria-checked={on}
                      className={'flex items-start gap-3 p-3.5 rounded-xl text-left transition-colors ' + (on ? 'bg-surface-container-low ring-1 ring-primary-container' : 'bg-surface hover:bg-surface-container-low')}>
                      <span className={'w-5 h-5 mt-0.5 rounded-full shrink-0 flex items-center justify-center ' + (on ? 'bg-primary-container text-on-primary' : 'border-2 border-outline-variant bg-white')}>
                        {on && <span className="material-symbols-outlined text-[14px]">check</span>}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold">{c}</span>
                          {conditionTag[c] && <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-micro text-[10px] uppercase font-bold">{conditionTag[c]}</span>}
                        </span>
                        <span className="block font-body-sm text-body-sm text-on-surface-variant mt-0.5">{conditionDesc[c]}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Price */}
            <section id="sec-price" className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Set selling price</h2>
                {origNum > 0 && <span className="font-label-md text-label-md text-on-surface-variant">MRP ₹{origNum}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Your price (₹) *</label>
                  <input type="text" inputMode="numeric" value={form.price} onChange={e => update('price', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="160"
                    className={inputBase + (touched && errs.price ? inputBad : inputOk)} />
                </div>
                <div>
                  <label className={labelCls}>Original price / MRP (₹)</label>
                  <input type="text" inputMode="numeric" value={form.origPrice} onChange={e => update('origPrice', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="450"
                    className={inputBase + (touched && errs.orig ? inputBad : inputOk)} />
                </div>
              </div>
              {touched && errs.price && <p className="font-body-sm text-body-sm text-error -mt-1">{errs.price}</p>}
              {touched && errs.orig && <p className="font-body-sm text-body-sm text-error -mt-1">{errs.orig}</p>}

              {suggestions.length > 0 && (
                <div>
                  <p className="font-label-micro text-label-micro uppercase text-on-surface-variant mb-1.5">Suggestions from your MRP</p>
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                    {suggestions.map(s => (
                      <button key={s.pct} type="button" onClick={() => update('price', String(s.value))}
                        className={'px-2.5 py-1 rounded-full font-label-md text-label-md whitespace-nowrap active:scale-95 ' + (priceNum === s.value ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface')}>
                        ₹{s.value} ({s.pct}% of MRP)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {discount > 0 && !errs.orig && (
                <div className="bg-[#2E8B57]/10 text-[#2E8B57] rounded-xl p-3 font-label-md text-label-md font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">sell</span>{discount}% off the MRP. Buyers love a good deal.
                </div>
              )}

              <div className="rounded-lg bg-surface-container-low/70 p-3 space-y-2">
                <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant">
                  <span>Buyer pays you</span><span className="font-medium text-on-surface">₹{priceNum || 0}</span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">Pageplus fee <span className="px-1.5 bg-primary-fixed text-on-primary-fixed rounded text-[10px] font-bold uppercase">0% free</span></span>
                  <span className="font-medium text-primary">₹0</span>
                </div>
                <div className="flex justify-between items-center pt-2 font-label-lg text-label-lg text-on-surface font-semibold">
                  <span>You receive</span><span className="font-headline-sm text-headline-sm text-primary font-bold">₹{priceNum || 0}</span>
                </div>
                <p className="font-label-micro text-[10px] text-outline text-right">You get the full price from the buyer when you meet.</p>
              </div>
            </section>

            {/* Meetup & location */}
            <section id="sec-location" className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Meetup area</h2>
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-secondary font-bold">Meet nearby</span>
              </div>
              <div ref={locationRef} className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-[20px] pointer-events-none">location_on</span>
                <input value={locationSearch}
                  onChange={e => { setLocationSearch(e.target.value); setForm(prev => ({ ...prev, location: e.target.value })); setShowLocationDropdown(true) }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="Type your sector or area…" type="text"
                  className={inputBase + 'pl-11 pr-10 ' + (touched && errs.location ? inputBad : form.location ? 'border-[#2E8B57]' : inputOk)} />
                {form.location && (
                  <button type="button" aria-label="Clear location" onClick={() => { setForm(prev => ({ ...prev, location: '' })); setLocationSearch(''); setShowLocationDropdown(true) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
                {showLocationDropdown && filteredLocations.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 top-12 bg-surface-container-lowest rounded-xl shadow-lg overflow-y-auto max-h-60 border border-outline-variant">
                    {filteredLocations.map(loc => (
                      <button key={loc} type="button" onClick={() => selectLocation(loc)} className="w-full flex items-center gap-2.5 px-4 py-3 text-left active:bg-surface-container border-b border-[#EADFCC]/70 last:border-0">
                        <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                        <span className="font-label-md text-label-md text-on-surface">
                          <b className="font-semibold">{loc.split(',')[0]}</b>
                          <span className="text-on-surface-variant">{loc.includes(',') ? ', ' + loc.split(',').slice(1).join(',').trim() : ''}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {showLocationDropdown && locationSearch.length > 0 && filteredLocations.length === 0 && (
                  <div className="absolute z-30 left-0 right-0 top-12 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-4 text-center font-body-sm text-body-sm text-on-surface-variant">
                    No matches. Try &quot;Sector 22&quot; or &quot;Mohali&quot;.
                  </div>
                )}
              </div>
              {touched && errs.location && <p className="font-body-sm text-body-sm text-error -mt-1">{errs.location}</p>}
              <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-lg">
                <span className="material-symbols-outlined text-[20px] text-primary mt-0.5 shrink-0">handshake</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Meet the buyer in a public place nearby. Agree the time and place in the Pageplus chat. The buyer checks the book, then pays you directly.</p>
              </div>
            </section>

            {/* Privacy note */}
            <section className="bg-surface-container-low rounded-xl p-3.5 flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">forum</span>
              <div>
                <h3 className="font-label-md text-label-md text-on-surface font-semibold">Buyers message you in Pageplus</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">Chats happen inside the app. We use your number to alert you on WhatsApp when a new message arrives.</p>
              </div>
            </section>
          </div>

          {/* RIGHT (desktop): preview and publish */}
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 self-start">
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Your listing</h3>
              <div className="flex gap-3 items-center mb-4">
                <div className="w-14 h-16 rounded-lg bg-primary-fixed/60 overflow-hidden flex items-center justify-center text-[26px] shrink-0">
                  {previews[0] ? <img src={previews[0]!} alt="" className="w-full h-full object-cover" /> : <span>{emojis[form.category]}</span>}
                </div>
                <div className="min-w-0">
                  <p className="font-label-lg text-label-lg font-semibold text-on-surface truncate">{form.title || 'Book title'}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate capitalize">{form.category} · {form.condition}</p>
                  <p className="font-headline-sm text-headline-sm text-primary font-bold">₹{priceNum || 0}{origNum > priceNum && priceNum > 0 && <span className="font-body-sm text-body-sm text-outline line-through ml-1.5">₹{origNum}</span>}</p>
                </div>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-1.5 mb-4">
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary">location_on</span>{form.location || 'Meetup area not set'}</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary">photo_camera</span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
              </div>
              <button onClick={publish} disabled={publishDisabled} className="w-full min-h-[48px] bg-primary-container text-on-primary font-label-lg text-label-lg font-bold rounded-xl shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                <span>{publishLabel}</span>{!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
              <button onClick={saveDraft} className="w-full mt-2 py-2.5 text-on-surface-variant font-label-md text-label-md hover:text-primary">Save draft</button>
              <p className="font-body-sm text-[12px] text-on-surface-variant text-center mt-1">Free to post · Usually approved within a few hours</p>
            </div>
          </aside>
        </div>
      </main>

      {/* Bottom action bar (phones and tablets) */}
      <aside aria-label="Listing action bar" className="lg:hidden fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto">
        <div className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-3 shadow-[0_16px_36px_-6px_rgba(31,29,27,0.32)] flex items-center justify-between gap-3">
          <div className="min-w-0 pl-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-inverse-on-surface/80 truncate capitalize">{form.category}</span>
            </div>
            <p className="font-headline-sm text-headline-sm text-inverse-on-surface leading-tight truncate">₹{priceNum || 0} Listing</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={saveDraft} className="h-11 px-3 rounded-xl text-inverse-on-surface/90 font-label-md text-label-md active:scale-95 transition-transform">Draft</button>
            <button onClick={publish} disabled={publishDisabled} className="h-11 px-4 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed">
              <span className="max-w-[120px] truncate">{publishLabel}</span>{!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}