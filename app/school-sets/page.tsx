'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { schools, isRegister, BINDING_CHARGE, DELIVERY_FEE } from '@/lib/kit-prices'
import BottomNav from '@/components/BottomNav'

// ── Contact (change here only) ────────────────────────────────────────────
const WHATSAPP_NUMBER = '918872235738'
const WA_HELP_LINK = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, I need help with a school book set on Pageplus')

type Kit = (typeof schools)[string][number]
type Section = 'ncert' | 'pvt' | 'notebooks' | 'stationery'
type CartKit = { selectedClass: number; items: string[]; kitSubtotal: number }

const SCHOOL_TITLE: Record<string, { title: string; sub: string; icon: string }> = {
  'Shivalik Public School': { title: 'Shivalik Public School', sub: 'Phase 6, Mohali', icon: 'history_edu' },
  'Delhi Public School': { title: 'DPS, Sector 40-C', sub: 'CBSE Affiliated', icon: 'account_balance' },
}

const SECTION_META: Record<Section, { label: string; icon: string; unit: string }> = {
  ncert: { label: 'NCERT Textbooks', icon: 'menu_book', unit: 'Books' },
  pvt: { label: 'Private Books', icon: 'auto_stories', unit: 'Books' },
  notebooks: { label: 'Notebooks & Registers', icon: 'edit_note', unit: 'Types' },
  stationery: { label: 'Stationery & Art', icon: 'palette', unit: 'Items' },
}

const FLAT_SECTIONS = ['ncert', 'pvt', 'stationery'] as const
const NOTEBOOK_BRAND_LABEL = { buddy: 'Buddy', classmate: 'Classmate' } as const

function Tick({ on }: { on: boolean }) {
  return (
    <span className={'w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-colors ' + (on ? 'bg-primary-container text-on-primary' : 'border-2 border-outline-variant bg-surface-container-lowest')}>
      {on && <span className="material-symbols-outlined text-[16px]">check</span>}
    </span>
  )
}

export default function SchoolSetsPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  const [logoOk, setLogoOk] = useState(true)
  const [selectedSchool, setSelectedSchool] = useState<string>('Shivalik Public School')
  const [schoolOpen, setSchoolOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<number>(1)
  const [checked, setChecked] = useState<Record<Section, boolean[]>>({ ncert: [], pvt: [], notebooks: [], stationery: [] })
  const [nbQty, setNbQty] = useState<number[]>([])
  const [nbBrand, setNbBrand] = useState<('buddy' | 'classmate')[]>([])
  const [nbRegType, setNbRegType] = useState<('slim' | 'thick')[]>([])
  const [warnModal, setWarnModal] = useState<{ section: Section; idx: number } | null>(null)
  const [cart, setCart] = useState<CartKit[]>([])
  const [listingCount, setListingCount] = useState(0)

  // Out of stock + Notify me
  const [oosItems, setOosItems] = useState<Set<string>>(new Set())
  const [notifyFor, setNotifyFor] = useState<string | null>(null)
  const [notifyName, setNotifyName] = useState('')
  const [notifyPhone, setNotifyPhone] = useState('')
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyDone, setNotifyDone] = useState(false)

  const schoolNames = Object.keys(schools)
  const schoolKits = schools[selectedSchool]
  const availableClasses = Object.keys(schoolKits).map(Number).sort((a, b) => a - b)
  const kit: Kit = schoolKits[selectedClass] || schoolKits[availableClasses[0]]
  const meta = SCHOOL_TITLE[selectedSchool] || { title: selectedSchool, sub: '', icon: 'school' }

  // Items marked out of stock in the data itself
  const dataOos = new Set<string>()
  FLAT_SECTIONS.forEach(s => kit[s].forEach(it => { if (it.oos) dataOos.add(it.name) }))
  kit.notebooks.forEach(it => { if (it.oos) dataOos.add(it.name) })
  function isOOS(name: string) { return oosItems.has(name) || dataOos.has(name) }

  // ── Load cart, stock, listing count, and optional ?school=&class= ───────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('buddybooks_cart')
      if (raw) setCart(JSON.parse(raw))
    } catch {}
    fetch('/api/stock')
      .then(r => r.json())
      .then(d => { if (d?.outOfStock) setOosItems(new Set(d.outOfStock)) })
      .catch(() => {})
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setListingCount(d.filter((l: any) => (!l.status || l.status === 'active') && !l.sold).length)
      })
      .catch(() => {})
    try {
      const p = new URLSearchParams(window.location.search)
      const sc = p.get('school')
      const cl = Number(p.get('class'))
      if (sc && schools[sc]) {
        setSelectedSchool(sc)
        if (cl && schools[sc][cl]) setSelectedClass(cl)
        else setSelectedClass(Object.keys(schools[sc]).map(Number).sort((a, b) => a - b)[0])
      }
    } catch {}
  }, [])

  // ── Reset selections whenever school / class / stock changes ───────────
  useEffect(() => {
    const k = schools[selectedSchool][selectedClass]
    if (!k) return
    setChecked({
      ncert: k.ncert.map(it => !oosItems.has(it.name) && !it.optional && !it.oos),
      pvt: k.pvt.map(it => !oosItems.has(it.name) && !it.optional && !it.oos),
      notebooks: k.notebooks.map(it => !oosItems.has(it.name) && !it.oos),
      stationery: k.stationery.map(it => !oosItems.has(it.name) && !it.optional && !it.oos),
    })
    setNbQty(k.notebooks.map(n => n.qty))
    setNbBrand(k.notebooks.map(() => 'buddy'))
    setNbRegType(k.notebooks.map(() => 'slim'))
  }, [selectedClass, selectedSchool, oosItems])

  // ── Notify me ──────────────────────────────────────────────────────────
  function openNotify(name: string) {
    setNotifyFor(name)
    setNotifyDone(false)
    setNotifyPhone('')
    setNotifyName(user?.fullName || '')
  }

  async function submitNotify() {
    if (!notifyFor) return
    const phone = notifyPhone.replace(/\D/g, '').slice(0, 10)
    if (phone.length !== 10) { alert('Please enter a valid 10-digit number'); return }
    setNotifyBusy(true)
    try {
      const res = await fetch('/api/stock/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName: notifyFor, phone, buyerName: notifyName || (user?.fullName ?? '') }),
      })
      if (res.ok) { setNotifyDone(true) }
      else { const d = await res.json().catch(() => ({})); alert(d.error || 'Could not save. Please try again.') }
    } catch { alert('Something went wrong. Please try again.') }
    setNotifyBusy(false)
  }

  // ── Selection handlers ─────────────────────────────────────────────────
  function itemName(s: Section, i: number): string {
    return s === 'notebooks' ? kit.notebooks[i]?.name : (kit[s] as { name: string }[])[i]?.name
  }

  function handleCheckClick(s: Section, i: number) {
    const name = itemName(s, i)
    if (name && isOOS(name)) { openNotify(name); return }
    if (checked[s]?.[i]) {
      setWarnModal({ section: s, idx: i })
    } else {
      setChecked(prev => {
        const arr = [...prev[s]]
        arr[i] = true
        return { ...prev, [s]: arr }
      })
    }
  }

  function confirmUncheck() {
    if (!warnModal) return
    const { section, idx } = warnModal
    setChecked(prev => {
      const arr = [...prev[section]]
      arr[idx] = false
      return { ...prev, [section]: arr }
    })
    setWarnModal(null)
  }

  // ── Notebook pricing (must match lib/kit-prices.ts validation) ─────────
  function nbUnitPrice(i: number) {
    const name = kit.notebooks[i]?.name || ''
    const brand = nbBrand[i] || 'buddy'
    const regType = nbRegType[i] || 'slim'
    if (isRegister(name)) {
      if (brand === 'buddy') return regType === 'slim' ? 68 : 88
      return regType === 'slim' ? 85 : 105
    }
    return brand === 'buddy' ? 50 : 55
  }

  function registerPages(brand: 'buddy' | 'classmate', regType: 'slim' | 'thick') {
    if (regType === 'slim') return 196
    return brand === 'buddy' ? 210 : 240
  }

  function setQty(i: number, val: number) {
    if (val < 0) return
    if (val > kit.notebooks[i].qty * 2) return
    const next = [...nbQty]
    next[i] = val
    setNbQty(next)
  }

  // ── Totals ─────────────────────────────────────────────────────────────
  function calcTotal() {
    let total = 0
    FLAT_SECTIONS.forEach(s => {
      kit[s].forEach((item, i) => {
        if (checked[s]?.[i] && !isOOS(item.name)) total += item.price
      })
    })
    kit.notebooks.forEach((item, i) => {
      if (checked.notebooks?.[i] && !isOOS(item.name)) total += nbUnitPrice(i) * (nbQty[i] || 0)
    })
    return total
  }

  function marketTotal() {
    let total = 0
    FLAT_SECTIONS.forEach(s => {
      kit[s].forEach((item, i) => {
        if (checked[s]?.[i] && !isOOS(item.name)) total += item.price
      })
    })
    kit.notebooks.forEach((item, i) => {
      if (checked.notebooks?.[i] && !isOOS(item.name)) {
        const mrp = isRegister(item.name) ? ((nbRegType[i] || 'slim') === 'slim' ? 85 : 105) : 55
        total += mrp * (nbQty[i] || 0)
      }
    })
    return total
  }

  function getSelectedItems() {
    const items: string[] = []
    FLAT_SECTIONS.forEach(s => {
      kit[s].forEach((item, i) => {
        if (checked[s]?.[i] && !isOOS(item.name)) items.push(item.name + ' ₹' + item.price)
      })
    })
    kit.notebooks.forEach((item, i) => {
      if (checked.notebooks?.[i] && !isOOS(item.name) && (nbQty[i] || 0) > 0) {
        const brand = nbBrand[i] === 'classmate' ? 'Classmate' : 'Buddy'
        const regType = isRegister(item.name) ? ' (' + registerPages(nbBrand[i] || 'buddy', nbRegType[i] || 'slim') + 'pg)' : ''
        items.push(item.name + ' [' + brand + regType + '] x' + nbQty[i] + ' ₹' + (nbUnitPrice(i) * nbQty[i]))
      }
    })
    return items
  }

  const kitSubtotal = calcTotal()
  const market = marketTotal()
  const youSave = market - kitSubtotal
  const savePct = market > 0 ? Math.round((youSave / market) * 100) : 0

  const selectableCount = FLAT_SECTIONS.reduce((n, s) => n + kit[s].filter(it => !isOOS(it.name)).length, 0) + kit.notebooks.filter(it => !isOOS(it.name)).length
  const selectedCount = FLAT_SECTIONS.reduce((n, s) => n + kit[s].filter((it, i) => checked[s]?.[i] && !isOOS(it.name)).length, 0) + kit.notebooks.filter((it, i) => checked.notebooks?.[i] && !isOOS(it.name)).length
  const totalListed = FLAT_SECTIONS.reduce((n, s) => n + kit[s].length, 0) + kit.notebooks.length

  function toggleAll() {
    const anyOff = selectedCount < selectableCount
    if (!anyOff && !window.confirm('This removes every item from the ' + meta.title + ' Class ' + selectedClass + ' kit. These are on the official book list. Are you sure?')) return
    setChecked({
      ncert: kit.ncert.map(it => anyOff && !isOOS(it.name)),
      pvt: kit.pvt.map(it => anyOff && !isOOS(it.name)),
      notebooks: kit.notebooks.map(it => anyOff && !isOOS(it.name)),
      stationery: kit.stationery.map(it => anyOff && !isOOS(it.name)),
    })
  }

  // ── Cart / checkout ────────────────────────────────────────────────────
  function currentKit(): CartKit {
    return { selectedClass, items: getSelectedItems(), kitSubtotal }
  }

  function handleAddAnotherKit() {
    const newCart = [...cart, currentKit()]
    setCart(newCart)
    sessionStorage.setItem('buddybooks_cart', JSON.stringify(newCart))
    const used = newCart.map(k => k.selectedClass)
    const next = availableClasses.find(c => !used.includes(c)) || availableClasses[0]
    setSelectedClass(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleProceedToCheckout() {
    const allKits = [...cart, currentKit()]
    sessionStorage.setItem('buddybooks_kit_order', JSON.stringify(allKits))
    sessionStorage.removeItem('buddybooks_cart')
    router.push('/checkout')
  }

  const cartOthers = cart.reduce((sum, k) => sum + k.kitSubtotal, 0)
  const cartTotal = cartOthers + kitSubtotal
  const totalKits = cart.length + 1
  const siblingDiscount = totalKits >= 2 ? Math.round(cartTotal * 0.05) : 0
  const cartAfterDiscount = cartTotal - siblingDiscount
  const grandTotal = cart.length > 0 ? cartAfterDiscount : kitSubtotal
  const canAddChild = kitSubtotal > 0
  const canCheckout = !(kitSubtotal === 0 && cart.length === 0)

  function pickSchool(name: string) {
    setSchoolOpen(false)
    if (name === selectedSchool) return
    const cl = Object.keys(schools[name]).map(Number).sort((a, b) => a - b)
    setSelectedSchool(name)
    if (!cl.includes(selectedClass)) setSelectedClass(cl[0])
  }

  function warnItemName() {
    if (!warnModal) return ''
    return itemName(warnModal.section, warnModal.idx) || ''
  }

  const navLink = 'font-label-lg text-label-lg text-on-surface-variant hover:text-primary-container transition-colors px-3 py-2 rounded-full hover:bg-surface-container-low whitespace-nowrap'

  const actionButtons = (
    <div className="flex items-center gap-2 shrink-0">
      {isSignedIn ? (
        <>
          <button onClick={handleAddAnotherKit} disabled={!canAddChild} title="Add another child's kit and save 5%" aria-label="Add another child's kit"
            className="h-12 px-3 rounded-xl bg-white/10 lg:bg-surface-container-low text-inverse-on-surface lg:text-on-surface font-label-md text-label-md font-bold flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span className="hidden sm:inline">Child</span>
          </button>
          <button onClick={handleProceedToCheckout} disabled={!canCheckout}
            className="h-12 px-4 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
            <span>Checkout</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </>
      ) : (
        <SignInButton mode="modal">
          <button className="h-12 px-4 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform">
            <span>Sign in to order</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </SignInButton>
      )}
    </div>
  )

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">

      {/* Warn modal */}
      {warnModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setWarnModal(null)}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface text-center mb-2">Remove from kit?</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-5">
              <strong className="text-on-surface">{warnItemName()}</strong> is on the official {meta.title} book list. Remove it?
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setWarnModal(null)} className="flex-1 py-3 rounded-xl border border-[#EADFCC] bg-[#FCF4E8] font-label-lg text-label-lg text-on-surface">Keep it</button>
              <button onClick={confirmUncheck} className="flex-1 py-3 rounded-xl bg-error-container text-on-error-container font-label-lg text-label-lg font-bold">Yes, remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Notify-me modal */}
      {notifyFor && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setNotifyFor(null)}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {notifyDone ? (
              <>
                <div className="w-12 h-12 rounded-full bg-[#2E8B57]/15 text-[#2E8B57] flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface text-center mb-2">You&apos;re on the list!</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-5">
                  We&apos;ll WhatsApp you as soon as <strong className="text-on-surface">{notifyFor}</strong> is back in stock.
                </p>
                <button onClick={() => setNotifyFor(null)} className="w-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3.5 rounded-xl">Done</button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[26px]">notifications</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface text-center mb-1">Notify me when it&apos;s back</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-4">
                  <strong className="text-on-surface">{notifyFor}</strong> is out of stock. Leave your number and we&apos;ll WhatsApp you.
                </p>
                <input value={notifyName} onChange={e => setNotifyName(e.target.value)} placeholder="Your name" type="text"
                  className="w-full mb-2.5 px-4 py-3 rounded-xl border border-[#EADFCC] bg-white font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-[#E8632B] focus:ring-2 focus:ring-[#E8632B]/20" />
                <input value={notifyPhone} onChange={e => setNotifyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="WhatsApp number (10 digits)" type="text" inputMode="numeric"
                  className="w-full mb-4 px-4 py-3 rounded-xl border border-[#EADFCC] bg-white font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-[#E8632B] focus:ring-2 focus:ring-[#E8632B]/20" />
                <button onClick={submitNotify} disabled={notifyBusy} className="w-full bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3.5 rounded-xl disabled:opacity-60">
                  {notifyBusy ? 'Saving…' : 'Notify me'}
                </button>
                <button onClick={() => setNotifyFor(null)} className="w-full mt-2 py-2 text-on-surface-variant font-label-md text-label-md">Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)] pt-safe">
        <div className="h-20 px-margin md:px-margin-desktop flex items-center justify-between gap-space-sm md:gap-6 max-w-md mx-auto md:max-w-[1200px]">
          <div className="flex items-center gap-space-sm md:gap-4 min-w-0">
            <button aria-label="Back" onClick={() => router.push('/')} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant active:bg-surface-container shrink-0">
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            {logoOk ? (
              <img alt="Pageplus" className="h-10 w-auto object-contain shrink-0 cursor-pointer" src="/pageplus-logo.png" onError={() => setLogoOk(false)} onClick={() => router.push('/')} />
            ) : (
              <span className="font-headline-md text-headline-md text-on-surface shrink-0 cursor-pointer" onClick={() => router.push('/')}>Page<span className="text-secondary-container">plus</span></span>
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <button className={navLink + ' !text-primary-container font-bold'} onClick={() => router.push('/school-sets')}>School Sets</button>
            <button className={navLink} onClick={() => router.push('/marketplace')}>Marketplace</button>
            <button className={navLink} onClick={() => router.push('/my-orders')}>My Orders</button>
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => router.push('/my-orders')} className="flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-full font-label-md text-label-md text-on-surface-variant lg:hidden">
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              <span>My Orders</span>
            </button>
            <a aria-label="WhatsApp Support" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container relative" href={WA_HELP_LINK} rel="noopener noreferrer" target="_blank">
              <span className="material-symbols-outlined text-[22px] text-tertiary">chat</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface"></span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-[1200px] pt-20 pb-44 md:pb-28 lg:pb-12 px-margin md:px-margin-desktop">
        <div className="pt-4 md:pt-6 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">

          {/* LEFT: selector + kit list */}
          <div className="lg:col-span-8">

            {/* School + class selector */}
            <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md relative">
              <div className="flex items-center justify-between gap-space-sm mb-space-sm">
                <div className="relative min-w-0">
                  <button onClick={() => setSchoolOpen(o => !o)} className="flex items-center gap-1.5 text-left min-w-0 focus:outline-none">
                    <span className="material-symbols-outlined text-primary text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">{meta.title}</span>
                    <span className="material-symbols-outlined text-[20px] text-primary shrink-0">expand_more</span>
                  </button>
                  {schoolOpen && (
                    <div className="absolute z-20 left-0 mt-2 min-w-[220px] bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden border border-outline-variant">
                      {schoolNames.map(n => (
                        <button key={n} onClick={() => pickSchool(n)} className={'w-full text-left px-4 py-3 font-label-lg text-label-lg active:bg-surface-container ' + (n === selectedSchool ? 'text-primary font-bold bg-primary-fixed/40' : 'text-on-surface')}>
                          {SCHOOL_TITLE[n]?.title || n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="bg-primary-fixed text-on-primary-fixed-variant font-label-micro text-label-micro uppercase px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[12px]">verified</span> 2026–27 Sync
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 mb-space-md">
                <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0">location_on</span>
                {meta.sub} • Official book list
              </p>

              <div className="w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant">Select Grade</span>
                  <span className="font-label-micro text-label-micro text-primary font-bold">{availableClasses.length} Classes</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 scrollbar-none md:flex-wrap md:overflow-visible">
                  {availableClasses.map(c => {
                    const active = c === selectedClass
                    return (
                      <button key={c} onClick={() => setSelectedClass(c)}
                        className={'px-4 py-2.5 rounded-xl font-label-md text-label-md shrink-0 flex items-center gap-1.5 transition-all ' + (active ? 'bg-primary-container text-on-primary font-semibold shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container')}>
                        <span className={'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ' + (active ? 'bg-white/20 text-on-primary' : 'bg-surface-container')}>{c}</span>
                        Class {c}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Savings + pre-loved shortcut */}
            <section className="mb-space-md flex flex-col gap-2">
              {youSave > 0 && (
                <div className="bg-primary-fixed rounded-xl p-3 flex items-center justify-between text-on-primary-fixed-variant shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-bold leading-tight">Set Discount: ₹{youSave.toLocaleString('en-IN')} OFF</span>
                      <span className="font-label-micro text-label-micro opacity-85">Save {savePct}% compared to buying separately</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                </div>
              )}
              <button onClick={() => router.push('/marketplace')} className="bg-surface-container-low active:bg-surface-container rounded-xl p-3 flex items-center justify-between transition-colors text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Want Pre-Loved copies?</span>
                      {listingCount > 0 && <span className="bg-surface-container-highest text-on-surface-variant font-label-micro text-label-micro px-1.5 py-0.5 rounded font-bold">{listingCount} Available</span>}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Buy from students nearby • Save up to 60%</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">arrow_forward</span>
              </button>
            </section>

            {/* Selection controls */}
            <section className="flex items-center justify-between mb-space-sm px-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">checklist</span>
                <span className="font-label-md text-label-md font-semibold text-on-surface">{selectedCount} of {totalListed} items in set</span>
              </div>
              <button onClick={toggleAll} className="text-primary font-label-md text-label-md font-semibold active:opacity-75">
                {selectedCount < selectableCount ? 'Select all available' : 'Deselect all items'}
              </button>
            </section>

            {/* Flat sections: NCERT, private, stationery */}
            {FLAT_SECTIONS.map(s => {
              const items = kit[s]
              if (items.length === 0) return null
              const sec = SECTION_META[s]
              return (
                <section key={s} className="mb-space-md">
                  <div className="flex items-center justify-between bg-surface-container-high px-space-md py-2.5 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{sec.icon}</span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{sec.label}</h2>
                    </div>
                    <span className="font-label-micro text-label-micro bg-surface-container-lowest text-on-surface-variant px-2 py-0.5 rounded-full font-bold">{items.length} {sec.unit}</span>
                  </div>
                  {s === 'ncert' && (
                    <div className="bg-primary-fixed/50 px-space-md py-2 flex items-center gap-2 font-body-sm text-body-sm text-on-primary-fixed-variant">
                      <span className="material-symbols-outlined text-[16px] shrink-0">menu_book</span>
                      <span>Prices include a ₹{BINDING_CHARGE} binding charge. Every NCERT book is delivered hardbound.</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 p-2 bg-surface-container-lowest rounded-b-xl shadow-sm">
                    {items.map((item, i) => {
                      const oos = isOOS(item.name)
                      const on = !!checked[s]?.[i] && !oos
                      return (
                        <div key={i}
                          role={oos ? undefined : 'checkbox'} aria-checked={oos ? undefined : on} tabIndex={oos ? -1 : 0}
                          onClick={() => !oos && handleCheckClick(s, i)}
                          onKeyDown={e => { if (!oos && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); handleCheckClick(s, i) } }}
                          className={'flex items-center justify-between gap-2 p-2 rounded-lg transition-colors select-none ' + (oos ? 'bg-surface-container-low opacity-90' : 'bg-surface active:bg-surface-container-low cursor-pointer')}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {oos ? (
                              <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[16px] text-outline">block</span>
                              </div>
                            ) : <Tick on={on} />}
                            <div className={'w-12 h-16 rounded bg-primary-fixed/60 flex items-center justify-center shrink-0 ' + (oos ? 'grayscale opacity-60' : '')}>
                              <span className="material-symbols-outlined text-[24px] text-primary">{sec.icon}</span>
                            </div>
                            <div className="flex flex-col min-w-0 pr-1">
                              <span className="font-label-lg text-label-lg text-on-surface font-semibold leading-snug line-clamp-2">{item.name}</span>
                              <div className="flex items-center gap-1.5 my-0.5 flex-wrap">
                                {oos ? (
                                  <span className="font-label-micro text-label-micro bg-error-container text-on-error-container px-1.5 py-0.5 rounded font-bold uppercase">Out of Stock</span>
                                ) : item.optional ? (
                                  <span className="font-label-micro text-label-micro bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded font-bold uppercase">Optional</span>
                                ) : s === 'ncert' ? (
                                  <span className="font-label-micro text-label-micro bg-primary-fixed text-on-primary-fixed-variant px-1.5 py-0.5 rounded font-bold uppercase">Official NCERT</span>
                                ) : s === 'pvt' ? (
                                  <span className="font-label-micro text-label-micro bg-secondary-fixed text-on-secondary-fixed-variant px-1.5 py-0.5 rounded font-bold uppercase">Prescribed</span>
                                ) : (
                                  <span className="font-label-micro text-label-micro bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded font-bold uppercase">Stationery</span>
                                )}
                              </div>
                              {oos && (
                                <button onClick={e => { e.stopPropagation(); openNotify(item.name) }} className="text-left font-label-micro text-label-micro text-primary font-bold flex items-center gap-1 pt-0.5">
                                  <span className="material-symbols-outlined text-[14px]">notifications</span> Notify Me
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <span className={'font-headline-sm text-headline-sm font-bold ' + (oos ? 'text-on-surface-variant font-medium' : 'text-on-surface')}>{item.price > 0 ? '₹' + item.price : '—'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            {/* Notebooks */}
            {kit.notebooks.length > 0 && (
              <section className="mb-space-md">
                <div className="flex items-center justify-between bg-surface-container-high px-space-md py-2.5 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{SECTION_META.notebooks.icon}</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{SECTION_META.notebooks.label}</h2>
                  </div>
                  <span className="font-label-micro text-label-micro bg-surface-container-lowest text-on-surface-variant px-2 py-0.5 rounded-full font-bold">{kit.notebooks.length} Types</span>
                </div>
                <div className="bg-primary-fixed/50 px-space-md py-2 flex items-center gap-2 font-body-sm text-body-sm text-on-primary-fixed-variant">
                  <span className="material-symbols-outlined text-[16px] shrink-0">sell</span>
                  <span>Buddy is our own notebook brand at 20% off MRP. Classmate is sold at its printed price.</span>
                </div>
                <div className="flex flex-col gap-2 p-2 bg-surface-container-lowest rounded-b-xl shadow-sm">
                  {kit.notebooks.map((item, i) => {
                    const oos = isOOS(item.name)
                    const on = !!checked.notebooks?.[i] && !oos
                    const qty = nbQty[i] || 0
                    const recommended = item.qty
                    const brand = nbBrand[i] || 'buddy'
                    const regType = nbRegType[i] || 'slim'
                    const unit = nbUnitPrice(i)
                    const isReg = isRegister(item.name)
                    return (
                      <div key={i} className={'rounded-lg p-2 ' + (oos ? 'bg-surface-container-low opacity-90' : 'bg-surface')}>
                        <div
                          role={oos ? undefined : 'checkbox'} aria-checked={oos ? undefined : on} tabIndex={oos ? -1 : 0}
                          onClick={() => !oos && handleCheckClick('notebooks', i)}
                          onKeyDown={e => { if (!oos && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); handleCheckClick('notebooks', i) } }}
                          className={'flex items-center justify-between gap-2 select-none ' + (oos ? '' : 'cursor-pointer')}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {oos ? (
                              <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[16px] text-outline">block</span>
                              </div>
                            ) : <Tick on={on} />}
                            <div className={'w-12 h-14 rounded bg-primary-fixed/60 flex items-center justify-center shrink-0 ' + (oos ? 'grayscale opacity-60' : '')}>
                              <span className="material-symbols-outlined text-[24px] text-primary">{isReg ? 'import_contacts' : 'edit_note'}</span>
                            </div>
                            <div className="flex flex-col min-w-0 pr-1">
                              <span className={'font-label-lg text-label-lg font-semibold leading-snug line-clamp-2 ' + (on || oos ? 'text-on-surface' : 'text-on-surface-variant')}>{item.name}</span>
                              {oos ? (
                                <>
                                  <span className="font-label-micro text-label-micro bg-error-container text-on-error-container px-1.5 py-0.5 rounded font-bold uppercase self-start my-0.5">Out of Stock</span>
                                  <button onClick={e => { e.stopPropagation(); openNotify(item.name) }} className="text-left font-label-micro text-label-micro text-primary font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">notifications</span> Notify Me
                                  </button>
                                </>
                              ) : (
                                <span className="font-label-micro text-label-micro text-on-surface-variant">
                                  {isReg ? 'Register · ' + registerPages(brand, regType) + ' pages' : 'Notebook'} · ₹{unit} each
                                  {brand === 'buddy' && <span className="text-[#2E8B57] font-bold"> · 20% off</span>}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            {!oos && (
                              <>
                                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{on && qty > 0 ? '₹' + (unit * qty) : '—'}</span>
                                {on && qty > 0 && <span className="block font-label-micro text-label-micro text-on-surface-variant">{qty} pcs</span>}
                              </>
                            )}
                          </div>
                        </div>

                        {on && (
                          <div className="flex flex-wrap items-center gap-2 mt-2.5 pl-9">
                            <div className="flex gap-1.5">
                              {(['buddy', 'classmate'] as const).map(b => {
                                const active = brand === b
                                const price = isReg ? (b === 'buddy' ? (regType === 'slim' ? 68 : 88) : (regType === 'slim' ? 85 : 105)) : (b === 'buddy' ? 50 : 55)
                                return (
                                  <button key={b} onClick={() => { const arr = [...nbBrand]; arr[i] = b; setNbBrand(arr) }}
                                    className={'px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors ' + (active ? 'bg-[#FDE7D8] border-[1.5px] border-[#E8632B] text-[#C4501A] font-semibold' : 'bg-white border border-[#EADFCC] text-[#6B6560]')}>
                                    {NOTEBOOK_BRAND_LABEL[b]} · ₹{price}
                                  </button>
                                )
                              })}
                            </div>
                            {isReg && (
                              <div className="flex gap-1.5">
                                {(['slim', 'thick'] as const).map(rt => {
                                  const active = regType === rt
                                  return (
                                    <button key={rt} onClick={() => { const arr = [...nbRegType]; arr[i] = rt; setNbRegType(arr) }}
                                      className={'px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors ' + (active ? 'bg-[#FDE7D8] border-[1.5px] border-[#E8632B] text-[#C4501A] font-semibold' : 'bg-white border border-[#EADFCC] text-[#6B6560]')}>
                                      {registerPages(brand, rt)} pages
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                            <div className="flex flex-col items-center gap-0.5 ml-auto">
                              <div className="flex items-center rounded-full border border-[#EADFCC] bg-[#FCF4E8] h-9">
                                <button aria-label="Decrease quantity" disabled={qty <= 0} onClick={() => setQty(i, qty - 1)} className="w-8 h-8 rounded-full text-on-surface font-bold text-[18px] leading-none disabled:opacity-30">−</button>
                                <span className="w-7 text-center font-label-md text-label-md font-bold tabular-nums text-on-surface">{qty}</span>
                                <button aria-label="Increase quantity" disabled={qty >= recommended * 2} onClick={() => setQty(i, qty + 1)} className="w-8 h-8 rounded-full text-on-surface font-bold text-[18px] leading-none disabled:opacity-30">+</button>
                              </div>
                              <span className="font-label-micro text-[10px] text-on-surface-variant">of {recommended} listed</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Delivery strip */}
            <section className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex items-center justify-between gap-2 mb-space-md">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[18px]">local_shipping</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-bold">Pickup from Sector 40-C or home delivery (₹{DELIVERY_FEE})</span>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">Every book on the official list • Bedi Book Store</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">verified_user</span>
            </section>
          </div>

          {/* RIGHT (desktop): sticky summary */}
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 self-start">
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">Your set</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{meta.title} · Class {selectedClass}</p>
              <div className="flex flex-col gap-2.5 font-body-md text-body-md">
                <div className="flex justify-between"><span className="text-on-surface-variant">Items selected</span><span className="font-semibold">{selectedCount} of {totalListed}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">This kit</span><span className="font-semibold">₹{kitSubtotal.toLocaleString('en-IN')}</span></div>
                {youSave > 0 && (
                  <>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Buying separately</span><span className="text-outline line-through">₹{market.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-[#2E8B57] font-semibold">You save</span><span className="text-[#2E8B57] font-bold">₹{youSave.toLocaleString('en-IN')}</span></div>
                  </>
                )}
                {cart.length > 0 && (
                  <>
                    <div className="flex justify-between"><span className="text-on-surface-variant">{cart.length} other {cart.length > 1 ? 'kits' : 'kit'}</span><span className="font-semibold">₹{cartOthers.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-[#2E8B57] font-semibold">Sibling discount (5%)</span><span className="text-[#2E8B57] font-bold">−₹{siblingDiscount.toLocaleString('en-IN')}</span></div>
                  </>
                )}
                <div className="flex justify-between items-baseline border-t border-[#EADFCC] pt-3 mt-1">
                  <span className="font-label-lg text-label-lg font-bold">{cart.length > 0 ? totalKits + ' kits total' : 'Total'}</span>
                  <span className="font-headline-md text-headline-md font-bold text-primary">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="mt-4 [&>div]:w-full [&>div]:flex-col [&_button]:w-full [&_button]:justify-center">{actionButtons}</div>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-3 text-center">Pickup is free. Home delivery adds ₹{DELIVERY_FEE}.</p>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating cart bar (phone and tablet) */}
      <div className="lg:hidden fixed bottom-20 md:bottom-6 inset-x-0 z-40 px-margin flex justify-center pointer-events-none">
        <div className="w-full max-w-md bg-inverse-surface text-inverse-on-surface rounded-2xl p-3 pl-4 shadow-[0_16px_36px_-6px_rgba(31,29,27,0.3)] flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#E8632B] text-white flex items-center justify-center font-bold font-label-md text-label-md shrink-0">{selectedCount}</div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-headline-md text-headline-md text-inverse-on-surface font-bold">₹{grandTotal.toLocaleString('en-IN')}</span>
                {youSave > 0 && cart.length === 0 && <span className="font-body-sm text-body-sm line-through opacity-60">₹{market.toLocaleString('en-IN')}</span>}
              </div>
              <span className="font-label-micro text-label-micro text-secondary-fixed mt-0.5 truncate">
                {cart.length > 0 ? totalKits + ' kits · 5% sibling discount' : 'Pickup free · Delivery ₹' + DELIVERY_FEE}
              </span>
            </div>
          </div>
          {actionButtons}
        </div>
      </div>

      {/* Shared bottom bar (phone only) */}
      <BottomNav />
    </div>
  )
}