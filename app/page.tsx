'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { schools, isRegister } from '@/lib/kit-prices'

// ── Contact (change here only) ────────────────────────────────────────────
const WHATSAPP_NUMBER = '918872235738'
const WHATSAPP_DISPLAY = '+91 88722 35738'
const WA_HELP_LINK = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, I need help with a school book set on Pageplus')

const SCHOOL_META: Record<string, { title: string; sub: string; icon: string }> = {
  'Delhi Public School': { title: 'DPS, Sector 40-C', sub: 'CBSE Affiliated', icon: 'account_balance' },
  'Shivalik Public School': { title: 'Shivalik Public School', sub: 'Phase 6, Mohali', icon: 'history_edu' },
}

const partnerSchools = [
  { name: 'DPS Chandigarh', place: 'Sec 40-C', tag: 'All Grades', icon: 'school' },
  { name: 'Shivalik Public', place: 'Phase 6 Mohali', tag: 'All Grades', icon: 'history_edu' },
  { name: 'Vivek High', place: 'Sec 38 Chd', tag: 'Pre-order', icon: 'auto_stories' },
  { name: 'St. Kabir', place: 'Sec 26 Chd', tag: 'All Grades', icon: 'cast_for_education' },
  { name: 'Bhavan Vidyalaya', place: 'Sec 27 Chd', tag: 'All Grades', icon: 'menu_book' },
]

const essentials = [
  { name: 'Classmate 6-Pack Long Notebooks', desc: 'Single line • 172 Pages each • Pack of 6', price: 320, icon: 'edit_note' },
  { name: 'Camlin Precision Geometry Box', desc: 'Self-centering compass, divider & stencils', price: 145, icon: 'architecture' },
  { name: 'Faber-Castell 24-Color Pencil Set', desc: 'Triangular grip with bonus sharpener', price: 190, icon: 'palette' },
]

const faqs = [
  { q: 'Edition change after buying?', a: 'Free replacement within 7 days at Sector 40-C store or next sector delivery.' },
  { q: 'How are used books verified?', a: 'Physically inspected for torn pages, scribble-free condition, and correct curriculum.' },
  { q: 'Can I remove books I already have?', a: 'Yes! Simply uncheck any items you own in the set screen before checkout.' },
]

// Same default selection rules as the School Sets page (so the price matches)
function kitSummary(school: string, cls: number) {
  const kit = schools[school]?.[cls]
  if (!kit) return { total: 0, books: 0, notebooks: 0, stationery: 0 }
  let total = 0
  let books = 0
  let notebooks = 0
  let stationery = 0
  for (const sec of ['ncert', 'pvt'] as const) {
    for (const it of kit[sec]) {
      if (!it.oos && !it.optional) { total += it.price; books++ }
    }
  }
  for (const it of kit.stationery) {
    if (!it.oos) { total += it.price; stationery++ }
  }
  for (const n of kit.notebooks) {
    if (!n.oos) { total += (isRegister(n.name) ? 68 : 50) * n.qty; notebooks += n.qty }
  }
  return { total, books, notebooks, stationery }
}

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)

  const [logoOk, setLogoOk] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'kits' | 'preloved'>('kits')
  const [school, setSchool] = useState('Shivalik Public School')
  const [schoolOpen, setSchoolOpen] = useState(false)
  const [cls, setCls] = useState(5)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [listings, setListings] = useState<any[]>([])
  const [cart, setCart] = useState<{ selectedClass: number; items: string[]; kitSubtotal: number }[]>([])

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setListings(d.filter((l: any) => (!l.status || l.status === 'active') && !l.sold))
      })
      .catch(() => {})
    try {
      const raw = sessionStorage.getItem('buddybooks_cart')
      if (raw) setCart(JSON.parse(raw))
    } catch {}
  }, [])

  const schoolNames = Object.keys(schools)
  const classes = Object.keys(schools[school]).map(Number).sort((a, b) => a - b)
  const summary = kitSummary(school, cls)
  const meta = SCHOOL_META[school] || { title: school, sub: '', icon: 'school' }
  const listingCount = listings.length
  const cartTotal = cart.reduce((sum, k) => sum + (k.kitSubtotal || 0), 0)

  function pickSchool(name: string) {
    setSchool(name)
    setSchoolOpen(false)
    const cl = Object.keys(schools[name]).map(Number).sort((a, b) => a - b)
    if (!cl.includes(cls)) setCls(cl[0])
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(search.trim() ? '/marketplace?q=' + encodeURIComponent(search.trim()) : '/marketplace')
  }

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { inputRef.current?.focus(); return }
    try {
      const rec = new SR()
      rec.lang = 'en-IN'
      rec.onresult = (e: any) => {
        const t = e.results?.[0]?.[0]?.transcript || ''
        if (t) { setSearch(t); router.push('/marketplace?q=' + encodeURIComponent(t)) }
      }
      rec.start()
    } catch { inputRef.current?.focus() }
  }

  function focusSearch() {
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    inputRef.current?.focus()
  }

  function whatsappSeller(l: any, e: React.MouseEvent) {
    e.stopPropagation()
    const phone = String(l.seller?.phone || '').replace(/\D/g, '').slice(-10)
    if (phone.length === 10) {
      window.open('https://wa.me/91' + phone + '?text=' + encodeURIComponent('Hi, I am interested in your listing "' + l.title + '" on Pageplus'), '_blank')
    } else {
      router.push('/listing/' + l.id)
    }
  }

  function discount(l: any) {
    const p = Number(l.price)
    const o = Number(l.origPrice)
    if (o > p && p > 0) return Math.round((1 - p / o) * 100)
    return 0
  }

  const sellButton = (className: string, children: React.ReactNode) =>
    isSignedIn
      ? <button className={className} onClick={() => router.push('/sell')}>{children}</button>
      : <SignInButton mode="modal"><button className={className}>{children}</button></SignInButton>

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)] pt-safe">
        <div className="h-20 px-margin flex items-center justify-between gap-space-sm max-w-md mx-auto">
          <div className="flex items-center gap-space-sm flex-1 min-w-0">
            {logoOk ? (
              <img alt="Pageplus" className="h-10 w-auto object-contain shrink-0 cursor-pointer" src="/pageplus-logo.png" onError={() => setLogoOk(false)} onClick={() => router.push('/')} />
            ) : (
              <span className="font-headline-md text-headline-md text-on-surface shrink-0 cursor-pointer" onClick={() => router.push('/')}>Page<span className="text-secondary-container">plus</span></span>
            )}
            <button className="flex items-center gap-1 bg-surface-container-low px-space-sm py-1 rounded-full text-left transition-colors active:bg-surface-container min-w-0">
              <span className="material-symbols-outlined text-[16px] text-primary shrink-0">location_on</span>
              <span className="font-label-micro text-label-micro text-on-surface-variant font-bold truncate max-w-[130px] sm:max-w-[200px]">Sector 40-C • Chandigarh</span>
              <span className="material-symbols-outlined text-[16px] text-outline shrink-0">keyboard_arrow_down</span>
            </button>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button aria-label="Search" onClick={focusSearch} className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>
            <a aria-label="WhatsApp Support" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container relative" href={WA_HELP_LINK} rel="noopener noreferrer" target="_blank">
              <span className="material-symbols-outlined text-[22px] text-tertiary">chat</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface"></span>
            </a>
            {isSignedIn ? (
              <button aria-label="My orders" onClick={() => router.push('/my-orders')} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ml-1 shadow-[0_2px_8px_-2px_rgba(45,30,18,0.06)]">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button aria-label="Sign in" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ml-1 shadow-[0_2px_8px_-2px_rgba(45,30,18,0.06)]">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto pt-20 pb-40 bg-surface px-margin">
        <div className="flex flex-col w-full pb-8">

          {/* 1. Delivery strip */}
          <div className="bg-surface-container-high text-on-surface rounded-xl p-3 mb-space-md shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">electric_bolt</span>
              </div>
              <div>
                <p className="font-label-lg text-label-lg font-bold text-on-surface">3-Hour Express Delivery</p>
                <p className="font-body-sm text-[13px] text-on-surface-variant font-medium">Chandigarh • Mohali • Panchkula</p>
              </div>
            </div>
            <span className="bg-primary text-on-primary text-[11px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0">Fast</span>
          </div>

          {/* 2. Search */}
          <form onSubmit={handleSearch} className="relative w-full mb-space-md">
            <div className="flex items-center bg-surface-container-lowest rounded-full px-space-md py-2.5 shadow-sm">
              <span className="material-symbols-outlined text-outline text-[22px] shrink-0 mr-2">search</span>
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none min-w-0" placeholder="Search school sets (DPS, Carmel, Shivalik), syllabus, books..." type="text" />
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <button type="button" onClick={startVoice} aria-label="Voice Search" className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[19px]">mic</span>
                </button>
              </div>
            </div>
          </form>

          {/* 3. Hero card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md relative">
            <div className="flex items-center gap-2 mb-3 bg-surface-container-low p-1.5 rounded-xl">
              <button onClick={() => setTab('kits')} className={'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 transition-colors ' + (tab === 'kits' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}>
                <span className="material-symbols-outlined text-[20px]">backpack</span>
                <span>School Kits</span>
              </button>
              <button onClick={() => setTab('preloved')} className={'flex-1 py-2.5 px-3 rounded-lg font-label-lg text-label-lg font-bold flex items-center justify-center gap-1.5 transition-colors ' + (tab === 'preloved' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface')}>
                <span className="material-symbols-outlined text-[20px] text-primary">sync_alt</span>
                <span>Pre-Loved</span>
                <span className="bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">-60%</span>
              </button>
            </div>

            {tab === 'kits' ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-primary-fixed text-on-primary-fixed-variant font-label-micro text-xs px-2.5 py-1 rounded-full uppercase font-bold">CBSE • ICSE Kits</span>
                  <span className="font-label-micro text-xs text-primary flex items-center gap-1 font-bold"><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>2026–27 Sync</span>
                </div>
                <h2 className="font-headline-lg-mobile text-[26px] leading-tight font-bold text-on-surface mb-3">Select Child&apos;s Book Set</h2>

                <div className="mb-3 relative">
                  <button onClick={() => setSchoolOpen(o => !o)} className="w-full bg-surface-container-low text-left px-4 py-3.5 rounded-xl flex items-center justify-between shadow-sm active:bg-surface-container transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[22px]">{meta.icon}</span>
                      </div>
                      <div className="truncate">
                        <span className="font-label-lg text-[16px] text-on-surface font-bold block truncate">{meta.title}</span>
                        <span className="font-body-sm text-[12px] text-on-surface-variant">{meta.sub}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[22px] shrink-0">unfold_more</span>
                  </button>
                  {schoolOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden border border-outline-variant">
                      {schoolNames.map(n => (
                        <button key={n} onClick={() => pickSchool(n)} className={'w-full text-left px-4 py-3 font-label-lg text-label-lg active:bg-surface-container ' + (n === school ? 'text-primary font-bold bg-primary-fixed/40' : 'text-on-surface')}>
                          {SCHOOL_META[n]?.title || n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-label-micro text-xs uppercase text-on-surface-variant font-bold">Select Class</label>
                    <span className="font-label-micro text-xs text-primary font-bold">{classes.length} Classes</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-space-md px-space-md scrollbar-none">
                    {classes.map(c => (
                      c === cls ? (
                        <button key={c} className="px-5 py-2 rounded-xl font-label-lg text-[16px] whitespace-nowrap bg-primary-container text-on-primary font-bold shadow-md shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white"></span>Class {c}
                        </button>
                      ) : (
                        <button key={c} onClick={() => setCls(c)} className="px-4 py-2 rounded-xl font-label-lg text-label-lg font-semibold whitespace-nowrap bg-surface-container-low text-on-surface-variant active:bg-surface-container shrink-0">Class {c}</button>
                      )
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-3.5 mb-3.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-label-lg text-[16px] font-bold text-on-surface block truncate">{SCHOOL_META[school]?.title.split(',')[0] || school} Class {cls} Set</span>
                    <span className="font-body-sm text-[13px] text-on-surface-variant">
                      {summary.books} Books + {summary.notebooks} Notebooks{summary.stationery > 0 ? ' + Stationery Kit' : ''}
                    </span>
                  </div>
                  <span className="font-headline-sm text-[24px] font-bold text-primary shrink-0">₹{summary.total.toLocaleString('en-IN')}</span>
                </div>

                <button onClick={() => router.push('/school-sets')} className="w-full bg-primary-container text-on-primary font-label-lg text-[16px] py-4 px-space-md rounded-xl shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 font-bold">
                  <span>View Curated Set ({summary.books} Books)</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-primary-fixed text-on-primary-fixed-variant font-label-micro text-xs px-2.5 py-1 rounded-full uppercase font-bold">Used Books</span>
                  <span className="font-label-micro text-xs text-primary font-bold">0% Fee</span>
                </div>
                <h2 className="font-headline-lg-mobile text-[26px] leading-tight font-bold text-on-surface mb-2">Save up to 60% on old books</h2>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-4">Buy from students near you, or list your old books in two minutes.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => router.push('/marketplace')} className="w-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform">
                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                    <span>Browse Books</span>
                  </button>
                  {sellButton('w-full bg-surface-container-low text-on-surface font-label-lg text-label-lg font-bold py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform', (<><span className="material-symbols-outlined text-[20px] text-primary">add_circle</span><span>Sell Books</span></>))}
                </div>
              </>
            )}
          </div>

          {/* 4. Buy & sell banner */}
          <div className="bg-surface-container-lowest border-2 border-primary/20 rounded-xl p-3.5 mb-space-md shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">currency_rupee</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Used Books</span>
                    <span className="text-primary font-label-micro text-xs font-bold">0% Fee</span>
                  </div>
                  <h3 className="font-headline-sm text-[19px] font-bold text-on-surface">Buy &amp; Sell at 60% Off</h3>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {sellButton('w-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform', (<><span className="material-symbols-outlined text-[20px]">add_circle</span><span>Sell Books</span></>))}
              <button onClick={() => router.push('/marketplace')} className="w-full bg-surface-container-low text-on-surface hover:bg-surface-container font-label-lg text-label-lg font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[20px] text-primary">storefront</span>
                <span>{listingCount > 0 ? 'Browse ' + listingCount : 'Browse Books'}</span>
              </button>
            </div>
          </div>

          {/* Free gifts banner */}
          <div className="bg-secondary-fixed text-on-secondary-fixed rounded-xl p-3 mb-space-md shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">redeem</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-label-lg text-label-lg font-bold text-on-secondary-fixed-variant">Free Gifts This Week</span>
                <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Rush</span>
              </div>
              <p className="font-body-sm text-[13px] text-on-secondary-fixed font-medium truncate">Name stickers + waterproof covers free with every kit!</p>
            </div>
          </div>

          {/* 5. Category cards */}
          <div className="mb-space-lg">
            <div className="flex items-center justify-between mb-space-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Explore by Category</h3>
              <span className="font-label-micro text-label-micro text-primary uppercase font-bold tracking-wider">Fast Services</span>
            </div>
            <div className="flex flex-col gap-space-sm">
              <div onClick={() => router.push('/school-sets')} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm active:bg-surface-container-low transition-colors cursor-pointer">
                <div className="flex items-start gap-space-md">
                  <div className="w-16 h-16 rounded-lg bg-primary-fixed overflow-hidden shrink-0 relative flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-primary">backpack</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-label-lg text-label-lg text-on-surface font-semibold">Full School Bundles</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-2">NCERT textbooks, school-specific registers with monograms, syllabus diaries &amp; art folios.</p>
                    <span className="font-label-md text-label-md text-primary font-semibold inline-flex items-center gap-1">Explore 18 Schools <span className="material-symbols-outlined text-[16px]">chevron_right</span></span>
                  </div>
                </div>
              </div>

              <div onClick={() => router.push('/marketplace')} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm active:bg-surface-container-low transition-colors cursor-pointer">
                <div className="flex items-start gap-space-md">
                  <div className="w-16 h-16 rounded-lg bg-primary-fixed overflow-hidden shrink-0 relative flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-primary">sync_alt</span>
                    <span className="absolute bottom-1 right-1 bg-primary text-on-primary text-[9px] font-bold px-1 rounded-sm">60% OFF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-label-lg text-label-lg text-on-surface font-semibold">Buy &amp; Sell Old Books</span>
                      <span className="bg-surface-container-high text-on-surface-variant font-label-micro text-[10px] px-1.5 py-0.5 rounded-full font-bold">Verified</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-2">Save up to 60% or list your old session books in 2 minutes with zero seller commission.</p>
                    <span className="font-label-md text-label-md text-primary font-semibold inline-flex items-center gap-1">{listingCount > 0 ? 'Browse ' + listingCount + ' Books' : 'Browse Books'} <span className="material-symbols-outlined text-[16px]">chevron_right</span></span>
                  </div>
                </div>
              </div>

              <div onClick={() => router.push('/school-sets')} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm active:bg-surface-container-low transition-colors cursor-pointer">
                <div className="flex items-start gap-space-md">
                  <div className="w-16 h-16 rounded-lg bg-primary-fixed overflow-hidden shrink-0 relative flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px] text-primary">draw</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Stationery &amp; Supplies</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-2">Classmate spiral notebooks, Camlin geometry tools, Faber-Castell art supplies, chart papers.</p>
                    <span className="font-label-md text-label-md text-primary font-semibold inline-flex items-center gap-1">Order Supplies <span className="material-symbols-outlined text-[16px]">chevron_right</span></span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md font-semibold text-on-surface truncate">Custom School Science Models &amp; Projects?</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Working DIY kits for exhibitions &amp; holiday homework</p>
                </div>
                <button onClick={() => router.push('/projects')} className="bg-surface-container-lowest text-primary font-label-micro text-label-micro uppercase font-bold px-3 py-1.5 rounded-full shrink-0 shadow-sm">Get Kit Quote →</button>
              </div>
            </div>
          </div>

          {/* 6. Partner schools */}
          <div className="mb-space-lg">
            <div className="flex items-center justify-between mb-space-xs">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Tricity Partner Schools</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Aligned syllabus &amp; approved bundle sets</p>
              </div>
              <span className="bg-surface-container-high text-on-surface-variant font-label-micro text-[10px] px-2 py-0.5 rounded-full font-bold">100% Verified</span>
            </div>
            <div className="flex items-center gap-space-sm overflow-x-auto py-2 -mx-space-md px-space-md scrollbar-none">
              {partnerSchools.map(s => (
                <div key={s.name} onClick={() => router.push('/school-sets')} className="w-36 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col items-center text-center shrink-0 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-1 text-primary">
                    <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
                  </div>
                  <span className="font-label-md text-label-md font-semibold text-on-surface line-clamp-1">{s.name}</span>
                  <span className="font-label-micro text-[10px] text-on-surface-variant">{s.place}</span>
                  <span className="mt-2 font-label-micro text-[10px] bg-primary-fixed text-on-primary-fixed px-1.5 py-0.5 rounded">{s.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Pre-loved listings (live) */}
          <div className="mb-space-lg">
            <div className="flex items-center justify-between mb-space-sm">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Pre-Loved Books Nearby</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Cleaned, inspected &amp; page-verified</p>
              </div>
              <button onClick={() => router.push('/marketplace')} className="font-label-md text-label-md text-primary font-semibold">View All</button>
            </div>
            {listings.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">No listings yet. Be the first to sell your old books!</p>
                {sellButton('bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-2.5 px-5 rounded-xl shadow-sm active:scale-95 transition-transform', 'Sell Books')}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {listings.slice(0, 4).map(l => {
                  const off = discount(l)
                  return (
                    <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className="bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between cursor-pointer">
                      <div>
                        <div className="w-full aspect-[4/3] rounded-lg bg-surface-container-high overflow-hidden relative mb-2 flex items-center justify-center text-[34px]">
                          {l.images?.[0] ? <img className="w-full h-full object-cover" src={l.images[0]} alt={l.title} /> : <span>{l.emoji || '📚'}</span>}
                          {l.condition && <span className="absolute top-1.5 left-1.5 bg-surface-container-lowest/90 font-label-micro text-[10px] text-on-surface px-1.5 py-0.5 rounded">{l.condition}</span>}
                          {off > 0 && <span className="absolute top-1.5 right-1.5 bg-primary text-on-primary font-label-micro text-[9px] px-1 py-0.5 rounded font-bold">-{off}%</span>}
                        </div>
                        <span className="font-label-micro text-[10px] text-primary font-semibold uppercase block truncate">{l.subtitle || l.category || 'Pre-loved'}</span>
                        <h4 className="font-label-md text-label-md font-semibold text-on-surface line-clamp-2 leading-tight">{l.title}</h4>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">₹{l.price}</span>
                          {Number(l.origPrice) > Number(l.price) && <span className="font-body-sm text-[12px] text-outline line-through">₹{l.origPrice}</span>}
                        </div>
                        {l.location && (
                          <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                            <span className="material-symbols-outlined text-[13px] text-tertiary">location_on</span>
                            <span className="font-body-sm text-[11px] truncate">{l.location}</span>
                          </div>
                        )}
                      </div>
                      <button onClick={e => whatsappSeller(l, e)} className="w-full mt-3 bg-surface-container-low text-on-surface hover:bg-primary/10 font-label-micro text-label-micro py-2 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-[15px] text-[#25D366]">chat</span>
                        <span>WhatsApp Seller</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 8. School essentials */}
          <div className="mb-space-lg">
            <div className="flex items-center justify-between mb-space-sm">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">School Essentials</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Classmate, Camlin &amp; Faber-Castell original</p>
              </div>
              <span className="font-label-micro text-label-micro text-primary uppercase font-bold">Quick Add</span>
            </div>
            <div className="flex flex-col gap-2">
              {essentials.map(it => (
                <div key={it.name} className="bg-surface-container-lowest rounded-xl p-space-sm flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-low overflow-hidden shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[26px] text-primary">{it.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-label-md text-label-md font-semibold text-on-surface truncate">{it.name}</h4>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">{it.desc}</p>
                      <span className="font-label-md text-label-md font-bold text-on-surface">₹{it.price}</span>
                    </div>
                  </div>
                  <button onClick={() => router.push('/school-sets')} aria-label={'Add ' + it.name} className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 9. Trust strip */}
          <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm mb-space-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-[18px] font-bold text-on-surface">Bedi Book Store, Sec 40-C</h4>
                <p className="font-body-sm text-[13px] text-on-surface-variant">Trusted by parents since 1994</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-[24px] mb-1">verified_user</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">100% Original</span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">Prints</span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-[24px] mb-1">check_circle</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">Zero Error</span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">Booklist</span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-[24px] mb-1">swap_horiz</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">Easy 24h</span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">Swap</span>
              </div>
            </div>
          </div>

          {/* 10. FAQ */}
          <div className="mb-space-lg">
            <div className="mb-3"><h3 className="font-headline-sm text-[20px] font-bold text-on-surface">Parent FAQs</h3></div>
            <div className="flex flex-col gap-2">
              {faqs.map((f, i) => (
                <div key={f.q} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between text-left gap-2 font-label-lg text-label-lg font-bold text-on-surface py-1">
                    <span>{f.q}</span>
                    <span className="material-symbols-outlined text-outline text-[22px] transition-transform duration-200 shrink-0" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                  </button>
                  {openFaq === i && <div className="pt-2 font-body-sm text-[14px] text-on-surface-variant leading-snug">{f.a}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* 11. Support footer */}
          <div className="bg-surface-container-low rounded-xl p-4 mb-24 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[28px]">chat</span>
            </div>
            <h4 className="font-headline-sm text-[19px] font-bold text-on-surface mb-1">Need Help with Editions?</h4>
            <p className="font-body-sm text-[14px] text-on-surface-variant mb-3">Uncle ji is ready on WhatsApp</p>
            <a className="w-full bg-[#25D366] text-white font-label-lg text-[16px] font-bold py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 mb-3 active:scale-[0.98] transition-transform" href={WA_HELP_LINK} rel="noopener noreferrer" target="_blank">
              <span className="material-symbols-outlined text-[22px]">chat</span>
              <span>WhatsApp Uncle ji</span>
            </a>
            <div className="flex items-center justify-center gap-3 text-on-surface-variant font-label-md text-xs font-semibold flex-wrap">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">call</span> {WHATSAPP_DISPLAY}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">store</span> Booth 48, Sec 40-C</span>
            </div>
          </div>
        </div>

        {/* 12. Floating cart bar (only when the cart has kits) */}
        {cart.length > 0 && (
          <div className="fixed bottom-20 inset-x-0 z-40 px-margin flex justify-center pointer-events-none">
            <div className="w-full max-w-md bg-inverse-surface text-inverse-on-surface rounded-full py-2.5 px-4 shadow-xl flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center">{cart.length}</div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-semibold text-inverse-on-surface leading-tight">₹{cartTotal.toLocaleString('en-IN')} total</span>
                  <span className="font-label-micro text-[10px] text-surface-dim">{cart.length} {cart.length > 1 ? 'kits' : 'kit'} in bag</span>
                </div>
              </div>
              <button onClick={() => router.push('/school-sets')} className="bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2 rounded-full font-semibold flex items-center gap-1.5 active:scale-95 transition-transform">
                <span>View Cart</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(45,30,18,0.06)]">
        <div className="flex justify-around items-center h-16 px-space-xs relative max-w-md mx-auto">
          <button onClick={() => router.push('/')} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-primary-container font-semibold transition-colors relative">
            <span className="material-symbols-outlined text-[22px]">storefront</span>
            <span className="font-label-micro text-label-micro uppercase tracking-wider">Home</span>
          </button>
          <button onClick={() => router.push('/school-sets')} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-on-surface-variant transition-colors relative">
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">local_library</span>
              <span className="absolute -top-1 -right-2 px-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-[9px] font-bold leading-tight uppercase">Kit</span>
            </div>
            <span className="font-label-micro text-label-micro uppercase tracking-wider">Sets</span>
          </button>
          {isSignedIn ? (
            <button onClick={() => router.push('/sell')} className="flex flex-col items-center justify-center -mt-6 group">
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-[0_4px_14px_rgba(196,80,26,0.35)] flex items-center justify-center transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[28px]">add</span>
              </div>
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant mt-1 font-semibold">Sell</span>
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="flex flex-col items-center justify-center -mt-6 group">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-[0_4px_14px_rgba(196,80,26,0.35)] flex items-center justify-center transition-transform active:scale-95">
                  <span className="material-symbols-outlined text-[28px]">add</span>
                </div>
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant mt-1 font-semibold">Sell</span>
              </button>
            </SignInButton>
          )}
          <button onClick={() => router.push('/marketplace')} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[22px]">sell</span>
            <span className="font-label-micro text-label-micro uppercase tracking-wider">Market</span>
          </button>
          <button onClick={() => router.push('/school-sets')} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[22px]">draw</span>
            <span className="font-label-micro text-label-micro uppercase tracking-wider">Stationery</span>
          </button>
        </div>
      </nav>
    </div>
  )
}