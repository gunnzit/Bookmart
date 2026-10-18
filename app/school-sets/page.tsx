'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { schools, isRegister, BINDING_CHARGE, DELIVERY_FEE } from '@/lib/kit-prices'
import LocationSheet, { useDeliveryPlace } from '@/components/LocationSheet'

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

// Frosted glass, the same look as the bottom bar
const GLASS: CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.7)',
  boxShadow: '0 6px 20px rgba(120,70,40,0.12)',
}

type Kit = (typeof schools)[string][number]
type Section = 'ncert' | 'pvt' | 'notebooks' | 'stationery'
type LooseLine = { id: string; name: string; section: string; price: number; qty: number; brand?: string }
type CartKit = { school?: string; selectedClass: number; items: string[]; kitSubtotal: number; loose?: boolean; lines?: LooseLine[] }
const LOOSE = 'Books and stationery'

// Item strings the server checks, built from the loose lines added on the Books page
function looseItems(lines: LooseLine[]): string[] {
  const out: string[] = []
  for (const l of lines) {
    if (l.section === 'notebook') out.push(l.name + ' [' + (l.brand || 'Buddy') + '] x' + l.qty + ' ₹' + (l.price * l.qty))
    else for (let i = 0; i < l.qty; i++) out.push(l.name + ' ₹' + l.price)
  }
  return out
}

const SHORT_NAME: Record<string, string> = {
  'Delhi Public School': 'DPS Sector 40-C',
  'Shivalik Public School': 'Shivalik Public',
}
const SCHOOL_SUB: Record<string, string> = {
  'Delhi Public School': 'CBSE · Sector 40-C, Chandigarh',
  'Shivalik Public School': 'Phase 6, Mohali',
}

const SECTIONS: Section[] = ['ncert', 'pvt', 'notebooks', 'stationery']
const FLAT_SECTIONS = ['ncert', 'pvt', 'stationery'] as const

const SECTION_META: Record<Section, { label: string; icon: string; caption: string }> = {
  ncert: { label: 'NCERT textbooks', icon: 'menu_book', caption: 'NCERT' },
  pvt: { label: 'Private books', icon: 'auto_stories', caption: 'Prescribed' },
  notebooks: { label: 'Notebooks and registers', icon: 'edit_note', caption: '' },
  stationery: { label: 'Stationery and art', icon: 'edit', caption: 'Stationery' },
}

// Cover photo file name from an item name: "Joyful Maths - 1" -> joyful-maths-1
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function Tick({ on }: { on: boolean }) {
  return (
    <span className={'w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-colors ' + (on ? 'bg-[#E8632B] text-white' : 'border-2 border-[#E0D2CA] bg-white')}>
      {on && <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span>}
    </span>
  )
}

// A real photo of the item, with a soft tile if the photo does not exist yet
function CoverTile({ src, icon, square, dim, onOpen }: { src: string; icon: string; square?: boolean; dim?: boolean; onOpen: (s: string) => void }) {
  const [state, setState] = useState<'loading' | 'ok' | 'bad'>('loading')
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setState('loading')
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth > 0) setState('ok')
  }, [src])

  return (
    <div
      onClick={e => { if (state === 'ok') { e.stopPropagation(); onOpen(src) } }}
      className={'relative shrink-0 overflow-hidden rounded-[18px] bg-[#FFF1EA] flex items-center justify-center ' + (square ? 'w-16 h-16' : 'w-16 h-20') + (dim ? ' opacity-50 grayscale' : '') + (state === 'ok' ? ' cursor-zoom-in' : '')}
    >
      {state !== 'bad' && (
        <img
          ref={imgRef}
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: state === 'ok' ? 1 : 0, transition: 'opacity 250ms ease' }}
          onLoad={() => setState('ok')}
          onError={() => setState('bad')}
        />
      )}
      {state !== 'ok' && <span className="material-symbols-outlined text-[26px] text-[#C4501A]/60">{icon}</span>}
    </div>
  )
}

export default function SchoolSetsPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  const [selectedSchool, setSelectedSchool] = useState<string>('Shivalik Public School')
  const [selectedClass, setSelectedClass] = useState<number>(1)
  const [checked, setChecked] = useState<Record<Section, boolean[]>>({ ncert: [], pvt: [], notebooks: [], stationery: [] })
  const [nbQty, setNbQty] = useState<number[]>([])
  const [nbBrand, setNbBrand] = useState<('buddy' | 'classmate')[]>([])
  const [nbRegType, setNbRegType] = useState<('slim' | 'thick')[]>([])
  const [warnModal, setWarnModal] = useState<{ section: Section; idx: number } | null>(null)
  const [cart, setCart] = useState<CartKit[]>([])
  const [listingCount, setListingCount] = useState(0)
  const [q, setQ] = useState('')
  const [viewer, setViewer] = useState<string | null>(null)
  const [customize, setCustomize] = useState<'notebooks' | 'stationery' | null>(null)
  const [bagOpen, setBagOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [place, setPlace] = useDeliveryPlace()

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
  const shortName = SHORT_NAME[selectedSchool] || selectedSchool

  // Items marked out of stock in the data itself
  const dataOos = new Set<string>()
  FLAT_SECTIONS.forEach(s => kit[s].forEach(it => { if (it.oos) dataOos.add(it.name) }))
  kit.notebooks.forEach(it => { if (it.oos) dataOos.add(it.name) })
  function isOOS(name: string) { return oosItems.has(name) || dataOos.has(name) }

  // ── Load bag, stock, listing count, and optional ?school=&class=&bag=1 ──
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('buddybooks_cart')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setCart(parsed.filter((k: any) => k && Array.isArray(k.items)))
      }
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
      if (p.get('bag') === '1') setBagOpen(true)
    } catch {}
  }, [])

  // A class that does not exist for this school falls back to its first class
  useEffect(() => {
    if (!schools[selectedSchool][selectedClass]) {
      const first = Object.keys(schools[selectedSchool]).map(Number).sort((a, b) => a - b)[0]
      if (first) setSelectedClass(first)
    }
  }, [selectedSchool, selectedClass])

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

  // Toast hides by itself
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3800)
    return () => clearTimeout(t)
  }, [toast])

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

  // ── Customize actions ──────────────────────────────────────────────────
  function setAllBrand(b: 'buddy' | 'classmate') { setNbBrand(kit.notebooks.map(() => b)) }
  function setAllReg(r: 'slim' | 'thick') { setNbRegType(kit.notebooks.map(() => r)) }
  function resetQty() { setNbQty(kit.notebooks.map(n => n.qty)) }
  function stationerySelectAll() {
    setChecked(prev => ({ ...prev, stationery: kit.stationery.map(it => !isOOS(it.name)) }))
  }
  function stationeryClear() {
    if (!window.confirm('Remove all stationery from this kit?')) return
    setChecked(prev => ({ ...prev, stationery: kit.stationery.map(() => false) }))
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

  const selectableCount = FLAT_SECTIONS.reduce((n, s) => n + kit[s].filter(it => !isOOS(it.name)).length, 0) + kit.notebooks.filter(it => !isOOS(it.name)).length
  const selectedCount = FLAT_SECTIONS.reduce((n, s) => n + kit[s].filter((it, i) => checked[s]?.[i] && !isOOS(it.name)).length, 0) + kit.notebooks.filter((it, i) => checked.notebooks?.[i] && !isOOS(it.name)).length
  const totalListed = FLAT_SECTIONS.reduce((n, s) => n + kit[s].length, 0) + kit.notebooks.length

  function toggleAll() {
    const anyOff = selectedCount < selectableCount
    if (!anyOff && !window.confirm('This removes every item from the ' + shortName + ' Class ' + selectedClass + ' kit. These are on the official book list. Are you sure?')) return
    setChecked({
      ncert: kit.ncert.map(it => anyOff && !isOOS(it.name)),
      pvt: kit.pvt.map(it => anyOff && !isOOS(it.name)),
      notebooks: kit.notebooks.map(it => anyOff && !isOOS(it.name)),
      stationery: kit.stationery.map(it => anyOff && !isOOS(it.name)),
    })
  }

  // ── Bag ────────────────────────────────────────────────────────────────
  function persist(next: CartKit[]) {
    setCart(next)
    try { sessionStorage.setItem('buddybooks_cart', JSON.stringify(next)) } catch {}
  }

  function currentKit(): CartKit {
    return { school: selectedSchool, selectedClass, items: getSelectedItems(), kitSubtotal }
  }

  function handleAddToBag() {
    if (kitSubtotal <= 0) return
    const mine = currentKit()
    const exists = cart.some(k => k.school === mine.school && k.selectedClass === mine.selectedClass)
    const rest = cart.filter(k => !(k.school === mine.school && k.selectedClass === mine.selectedClass))
    persist([...rest, mine])
    setToast(exists ? 'Class ' + selectedClass + ' kit updated in your bag' : 'Class ' + selectedClass + ' kit is in your bag')
  }

  function removeFromBag(idx: number) {
    persist(cart.filter((_, i) => i !== idx))
  }

  // Change a quantity inside the "Books and stationery" entry of the bag
  function changeLooseQty(idx: number, lineId: string, delta: number) {
    const entry = cart[idx]
    if (!entry || !entry.loose || !entry.lines) return
    const lines = entry.lines.flatMap(l => l.id !== lineId ? [l] : (l.qty + delta <= 0 ? [] : [{ ...l, qty: Math.min(l.qty + delta, 20) }]))
    if (lines.length === 0) { removeFromBag(idx); return }
    const next = cart.map((k, i) => i === idx ? { ...k, lines, items: looseItems(lines), kitSubtotal: lines.reduce((n, l) => n + l.qty * l.price, 0) } : k)
    persist(next)
  }

  function handleCheckout() {
    if (cart.length === 0) return
    try {
      sessionStorage.setItem('buddybooks_kit_order', JSON.stringify(cart))
      sessionStorage.removeItem('buddybooks_cart')
    } catch {}
    router.push('/checkout')
  }

  const bagSubtotal = cart.reduce((sum, k) => sum + (k.kitSubtotal || 0), 0)
  const hasLoose = cart.some(k => k.loose)
  // Sibling discount: 2 or more school kits, and no loose books in the bag
  const siblingDiscount = cart.length >= 2 && !hasLoose ? Math.round(bagSubtotal * 0.05) : 0
  const looseCount = cart.filter(k => k.loose).reduce((n, k) => n + (k.lines || []).reduce((m, l) => m + l.qty, 0), 0)
  const kitCount = cart.filter(k => !k.loose).length
  const bagCount = kitCount + looseCount
  const bagWords = [kitCount > 0 ? kitCount + (kitCount === 1 ? ' kit' : ' kits') : '', looseCount > 0 ? looseCount + (looseCount === 1 ? ' book item' : ' book items') : ''].filter(Boolean).join(' · ')
  const bagTotal = bagSubtotal - siblingDiscount
  const canAdd = kitSubtotal > 0

  function pickSchool(name: string) {
    if (name === selectedSchool) return
    const cl = Object.keys(schools[name]).map(Number).sort((a, b) => a - b)
    setSelectedSchool(name)
    if (!cl.includes(selectedClass)) setSelectedClass(cl[0])
  }

  function warnItemName() {
    if (!warnModal) return ''
    return itemName(warnModal.section, warnModal.idx) || ''
  }

  const placeLine = !place
    ? 'Choose your delivery area'
    : place.kind === 'pickup'
      ? 'Pickup from Sector 40-C'
      : 'Deliver to ' + place.area.split(',')[0]

  const query = q.trim().toLowerCase()
  const matches = (name: string) => !query || name.toLowerCase().includes(query)
  const noMatches = !!query && SECTIONS.every(s => (kit[s] as { name: string }[]).every(it => !matches(it.name)))

  const iconBtn = 'relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E1B19] active:scale-90 transition-transform ' + SHADOW
  const sheetInput = 'w-full px-4 py-3 rounded-2xl bg-[#FFF1EA] text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] border border-transparent focus:outline-none focus:bg-white focus:border-[#E8632B] focus:ring-2 focus:ring-[#E8632B]/20'
  const pill = (on: boolean) => 'px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors active:scale-95 ' + (on ? 'bg-[#E8632B] text-white font-semibold' : 'bg-[#FFF1EA] text-[#1E1B19] font-medium')

  // The main checkout button inside the bag
  const bagCheckout = isSignedIn ? (
    <button onClick={handleCheckout} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">
      Checkout · ₹{bagTotal.toLocaleString('en-IN')}
    </button>
  ) : (
    <SignInButton mode="modal">
      <button className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">
        Sign in to order
      </button>
    </SignInButton>
  )

  // ── One section of the list ────────────────────────────────────────────
  function renderSection(s: Section) {
    const meta = SECTION_META[s]
    const items = kit[s] as any[]
    if (items.length === 0) return null
    const visible = items.map((it, i) => ({ it, i })).filter(({ it }) => matches(it.name))
    if (visible.length === 0) return null
    const note = s === 'ncert'
      ? 'Prices include a ₹' + BINDING_CHARGE + ' binding charge. Every NCERT book is delivered hardbound.'
      : s === 'notebooks'
        ? 'Buddy is our own notebook brand, 20% below MRP. Classmate is sold at its printed price.'
        : ''

    return (
      <section key={s} className="mb-7">
        <div className="flex items-start justify-between gap-3 mb-3 px-1">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold">{meta.label}</h2>
            {note && <p className="text-[12px] text-[#9A908A] mt-0.5 leading-snug">{note}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-[#9A908A]">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            {(s === 'notebooks' || s === 'stationery') && (
              <button onClick={() => setCustomize(s as 'notebooks' | 'stationery')} className="px-3 py-1 rounded-full bg-[#FFF1EA] text-[#C4501A] text-[12px] font-semibold active:scale-95 transition-transform">
                Customize
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {visible.map(({ it, i }) => {
            const oos = isOOS(it.name)
            const on = !!checked[s]?.[i] && !oos

            const leading = oos
              ? <span className="w-6 h-6 rounded-full bg-[#F0E2DA] flex items-center justify-center shrink-0 text-[#9A908A]"><span className="material-symbols-outlined text-[16px]">hourglass_empty</span></span>
              : <Tick on={on} />

            const notifyBtn = oos ? (
              <button onClick={e => { e.stopPropagation(); openNotify(it.name) }} className={'px-3 py-1.5 rounded-full bg-white text-[12px] font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition-transform ' + SHADOW}>
                <span className="material-symbols-outlined text-[14px] text-[#E8632B]">notifications</span>Notify me
              </button>
            ) : null

            if (s !== 'notebooks') {
              return (
                <div
                  key={i}
                  role={oos ? undefined : 'checkbox'} aria-checked={oos ? undefined : on} tabIndex={oos ? -1 : 0}
                  onClick={() => !oos && handleCheckClick(s, i)}
                  onKeyDown={e => { if (!oos && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); handleCheckClick(s, i) } }}
                  className={'bg-white rounded-[22px] p-3.5 flex items-center gap-3 select-none transition-opacity ' + SHADOW + (oos ? '' : ' cursor-pointer') + (!on && !oos ? ' opacity-60' : '')}
                >
                  {leading}
                  <CoverTile src={'/covers/' + slug(it.name) + '.jpg'} icon={meta.icon} square={s === 'stationery'} dim={oos} onOpen={setViewer} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold leading-tight line-clamp-2">{it.name}</h3>
                    <p className="text-[12px] text-[#9A908A] mt-0.5">{oos ? 'Out of stock' : it.optional ? 'Optional' : meta.caption}</p>
                    <div className="text-[16px] font-bold mt-1">{it.price > 0 ? '₹' + it.price : '—'}</div>
                  </div>
                  {notifyBtn}
                </div>
              )
            }

            // Notebook / register row
            const qty = nbQty[i] || 0
            const recommended = it.qty
            const brand = nbBrand[i] || 'buddy'
            const regType = nbRegType[i] || 'slim'
            const unit = nbUnitPrice(i)
            const reg = isRegister(it.name)
            const pages = registerPages(brand, regType)

            return (
              <div key={i} className={'bg-white rounded-[22px] p-3.5 transition-opacity ' + SHADOW + (!on && !oos ? ' opacity-60' : '')}>
                <div
                  role={oos ? undefined : 'checkbox'} aria-checked={oos ? undefined : on} tabIndex={oos ? -1 : 0}
                  onClick={() => !oos && handleCheckClick('notebooks', i)}
                  onKeyDown={e => { if (!oos && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); handleCheckClick('notebooks', i) } }}
                  className={'flex items-center gap-3 select-none ' + (oos ? '' : 'cursor-pointer')}
                >
                  {leading}
                  <CoverTile src={'/covers/' + slug(it.name) + '-' + brand + '.jpg'} icon={reg ? 'import_contacts' : 'edit_note'} dim={oos} onOpen={setViewer} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold leading-tight line-clamp-2">{it.name}</h3>
                    <p className="text-[12px] text-[#9A908A] mt-0.5">
                      {oos ? 'Out of stock' : (reg ? 'Register · ' + pages + ' pages' : 'Notebook') + ' · ' + (brand === 'buddy' ? 'Buddy' : 'Classmate')}
                    </p>
                    {!oos && (
                      <div className="text-[16px] font-bold mt-1">
                        {on && qty > 0 ? '₹' + (unit * qty).toLocaleString('en-IN') : '₹' + unit}
                        <span className="text-[12px] font-normal text-[#9A908A]"> {on && qty > 0 ? 'for ' + qty : 'each'}</span>
                      </div>
                    )}
                  </div>
                  {notifyBtn}
                </div>

                {on && (
                  <div className="mt-3 pt-3 border-t border-[#F0E2DA] flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(['buddy', 'classmate'] as const).map(b => {
                        const price = reg ? (b === 'buddy' ? (regType === 'slim' ? 68 : 88) : (regType === 'slim' ? 85 : 105)) : (b === 'buddy' ? 50 : 55)
                        return (
                          <button key={b} onClick={() => { const arr = [...nbBrand]; arr[i] = b; setNbBrand(arr) }} className={pill(brand === b)}>
                            {b === 'buddy' ? 'Buddy' : 'Classmate'} ₹{price}
                          </button>
                        )
                      })}
                    </div>
                    {reg && (
                      <div className="flex flex-wrap gap-2">
                        {(['slim', 'thick'] as const).map(rt => (
                          <button key={rt} onClick={() => { const arr = [...nbRegType]; arr[i] = rt; setNbRegType(arr) }} className={pill(regType === rt)}>
                            {registerPages(brand, rt)} pages
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold">Quantity</p>
                        <p className="text-[12px] text-[#9A908A]">of {recommended} listed</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#FFF1EA] p-1 rounded-full">
                        <button aria-label="Decrease quantity" disabled={qty <= 0} onClick={() => setQty(i, qty - 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform disabled:opacity-40">
                          <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="w-6 text-center text-[14px] font-semibold tabular-nums">{qty}</span>
                        <button aria-label="Increase quantity" disabled={qty >= recommended * 2} onClick={() => setQty(i, qty + 1)} className="w-8 h-8 rounded-full bg-[#E8632B] text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40">
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // ── Summary (desktop right column) ─────────────────────────────────────
  const summaryCard = (
    <div className={'bg-white rounded-[22px] p-5 ' + SHADOW}>
      <h3 className="text-[18px] font-bold">Your set</h3>
      <p className="text-[13px] text-[#9A908A] mb-4">{shortName} · Class {selectedClass}</p>
      <div className="flex flex-col gap-2.5 text-[14px]">
        <div className="flex justify-between"><span className="text-[#5E5650]">Items selected</span><span className="font-semibold">{selectedCount} of {totalListed}</span></div>
        {youSave > 0 && <div className="flex justify-between"><span className="text-[#5E5650]">Bought separately</span><span className="text-[#9A908A] line-through">₹{market.toLocaleString('en-IN')}</span></div>}
        {youSave > 0 && <div className="flex justify-between"><span className="text-[#C4501A] font-semibold">You save</span><span className="text-[#C4501A] font-bold">₹{youSave.toLocaleString('en-IN')}</span></div>}
        <div className="flex justify-between items-baseline border-t border-[#F0E2DA] pt-3 mt-1">
          <span className="font-semibold">This kit</span>
          <span className="text-[22px] font-bold">₹{kitSubtotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <button onClick={handleAddToBag} disabled={!canAdd} className="w-full h-[52px] mt-4 bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
        Add to bag
      </button>
      <button onClick={() => setBagOpen(true)} className={'w-full h-11 mt-2.5 bg-white text-[14px] font-semibold rounded-full active:scale-[0.98] transition-transform ' + SHADOW}>
        {bagCount > 0 ? 'View bag · ' + bagWords : 'View bag'}
      </button>
      <p className="text-[12px] text-[#9A908A] text-center mt-3">Pickup is free. Home delivery adds ₹{DELIVERY_FEE}.</p>
    </div>
  )

  return (
    <div
      className="min-h-screen text-[#1E1B19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
      style={{ background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }}
    >
      <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} place={place} onSelect={setPlace} />

      {/* Photo viewer */}
      {viewer && (
        <div className="fixed inset-0 z-[400] bg-black/85 flex items-center justify-center p-5" onClick={() => setViewer(null)}>
          <img src={viewer} alt="" className="max-w-full max-h-[85vh] object-contain rounded-[22px]" />
          <button aria-label="Close" onClick={() => setViewer(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Remove dialog */}
      {warnModal && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-center justify-center p-5" onClick={() => setWarnModal(null)}>
          <div className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-[0_10px_30px_rgba(120,70,40,0.2)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-center mb-2">Remove from kit?</h3>
            <p className="text-[14px] text-[#5E5650] text-center mb-5">
              <strong className="text-[#1E1B19]">{warnItemName()}</strong> is on the official {shortName} book list.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setWarnModal(null)} className="flex-1 h-12 rounded-full bg-white border border-[#F0E2DA] text-[15px] font-semibold active:scale-95 transition-transform">Keep it</button>
              <button onClick={confirmUncheck} className="flex-1 h-12 rounded-full border-2 border-[#E8632B] text-[#C4501A] text-[15px] font-semibold active:scale-95 transition-transform">Yes, remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Notify-me sheet */}
      {notifyFor && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={() => setNotifyFor(null)}>
          <div className="bg-white rounded-t-[28px] md:rounded-[28px] p-6 w-full max-w-md shadow-[0_-10px_35px_rgba(30,27,25,0.2)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[#F0E2DA] mx-auto mb-4 md:hidden" />
            {notifyDone ? (
              <>
                <div className="w-12 h-12 rounded-full bg-[#2E8B57]/12 text-[#2E8B57] flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <h3 className="text-[18px] font-bold text-center mb-1">You are on the list</h3>
                <p className="text-[14px] text-[#5E5650] text-center mb-5">We will WhatsApp you when <strong className="text-[#1E1B19]">{notifyFor}</strong> is back.</p>
                <button onClick={() => setNotifyFor(null)} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Done</button>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-bold">Tell me when it is back</h3>
                    <p className="text-[13px] text-[#9A908A] mt-0.5 truncate">{notifyFor}</p>
                  </div>
                  <button aria-label="Close" onClick={() => setNotifyFor(null)} className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="flex flex-col gap-2.5 my-4">
                  <input value={notifyName} onChange={e => setNotifyName(e.target.value)} placeholder="Your name" type="text" className={sheetInput} />
                  <div className="flex gap-2">
                    <div className="flex items-center px-4 rounded-2xl bg-[#FFF1EA] text-[14px] font-medium text-[#5E5650] shrink-0">+91</div>
                    <input value={notifyPhone} onChange={e => setNotifyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="WhatsApp number" type="text" inputMode="numeric" className={sheetInput} />
                  </div>
                </div>
                <button onClick={submitNotify} disabled={notifyBusy} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform disabled:opacity-60">
                  {notifyBusy ? 'Saving…' : 'Notify me'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Customize sheet */}
      {customize && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={() => setCustomize(null)}>
          <div className="bg-white rounded-t-[28px] md:rounded-[28px] p-6 w-full max-w-md shadow-[0_-10px_35px_rgba(30,27,25,0.2)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[#F0E2DA] mx-auto mb-4 md:hidden" />
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[18px] font-bold">Customize {customize === 'notebooks' ? 'notebooks' : 'stationery'}</h3>
                <p className="text-[13px] text-[#9A908A] mt-0.5">Changes apply to the whole list</p>
              </div>
              <button aria-label="Close" onClick={() => setCustomize(null)} className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {customize === 'notebooks' ? (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[13px] font-semibold mb-2">Brand for every notebook</p>
                  <div className="flex gap-2">
                    <button onClick={() => setAllBrand('buddy')} className={pill(nbBrand.length > 0 && nbBrand.every(b => b === 'buddy'))}>Buddy</button>
                    <button onClick={() => setAllBrand('classmate')} className={pill(nbBrand.length > 0 && nbBrand.every(b => b === 'classmate'))}>Classmate</button>
                  </div>
                </div>
                {kit.notebooks.some(n => isRegister(n.name)) && (
                  <div>
                    <p className="text-[13px] font-semibold mb-2">Registers</p>
                    <div className="flex gap-2">
                      <button onClick={() => setAllReg('slim')} className={pill(nbRegType.length > 0 && nbRegType.every(r => r === 'slim'))}>Slim</button>
                      <button onClick={() => setAllReg('thick')} className={pill(nbRegType.length > 0 && nbRegType.every(r => r === 'thick'))}>Thick</button>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[13px] font-semibold mb-2">Quantities</p>
                  <button onClick={resetQty} className="px-4 py-2 rounded-full bg-[#FFF1EA] text-[13px] font-medium active:scale-95 transition-transform">Reset to the listed numbers</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button onClick={stationerySelectAll} className="w-full h-12 rounded-full bg-[#FFF1EA] text-[14px] font-semibold active:scale-[0.98] transition-transform">Select all stationery</button>
                <button onClick={stationeryClear} className="w-full h-12 rounded-full bg-white border border-[#F0E2DA] text-[14px] font-semibold active:scale-[0.98] transition-transform">Clear stationery</button>
              </div>
            )}

            <button onClick={() => setCustomize(null)} className="w-full h-[52px] mt-6 bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Done</button>
          </div>
        </div>
      )}

      {/* Bag sheet */}
      {bagOpen && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={() => setBagOpen(false)}>
          <div className="bg-white rounded-t-[28px] md:rounded-[28px] p-6 w-full max-w-md max-h-[88vh] overflow-y-auto shadow-[0_-10px_35px_rgba(30,27,25,0.2)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[#F0E2DA] mx-auto mb-4 md:hidden" />
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[20px] font-bold">Your bag</h3>
                <p className="text-[13px] text-[#9A908A] mt-0.5">{cart.length === 0 ? 'Nothing here yet' : bagWords}</p>
              </div>
              <button aria-label="Close" onClick={() => setBagOpen(false)} className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[14px] text-[#5E5650] mb-4">Pick a class, tick what you need and tap Add to bag.</p>
                <button onClick={() => setBagOpen(false)} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Choose a kit</button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 mb-4">
                  {cart.map((k, idx) => k.loose ? (
                    <div key={idx} className="bg-[#FFF7F2] rounded-[18px] p-3.5">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold truncate">{LOOSE}</p>
                          <p className="text-[12px] text-[#9A908A] mt-0.5">{(k.lines || []).reduce((n, l) => n + l.qty, 0)} items</p>
                        </div>
                        <span className="text-[16px] font-bold shrink-0">₹{(k.kitSubtotal || 0).toLocaleString('en-IN')}</span>
                        <button aria-label="Remove these items from the bag" onClick={() => removeFromBag(idx)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#9A908A] shrink-0 active:scale-90 transition-transform shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <div className="flex flex-col divide-y divide-[#F0E2DA]">
                        {(k.lines || []).map(l => (
                          <div key={l.id} className="flex items-center gap-2.5 py-2">
                            <p className="flex-1 min-w-0 text-[13px] font-medium leading-snug line-clamp-2">{l.name}{l.brand ? ' · ' + l.brand : ''}</p>
                            <div className="h-8 rounded-full bg-white flex items-center shrink-0 shadow-sm">
                              <button aria-label="Remove one" onClick={() => changeLooseQty(idx, l.id, -1)} className="w-8 h-8 flex items-center justify-center active:scale-90">
                                <span className="material-symbols-outlined text-[16px]">{l.qty === 1 ? 'delete' : 'remove'}</span>
                              </button>
                              <span className="min-w-[14px] text-center text-[13px] font-semibold">{l.qty}</span>
                              <button aria-label="Add one more" onClick={() => changeLooseQty(idx, l.id, 1)} className="w-8 h-8 flex items-center justify-center active:scale-90">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            </div>
                            <span className="w-14 text-right text-[13px] font-bold shrink-0">₹{(l.price * l.qty).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex items-center gap-3 bg-[#FFF7F2] rounded-[18px] p-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold truncate">{SHORT_NAME[k.school || ''] || k.school || shortName}</p>
                        <p className="text-[12px] text-[#9A908A] mt-0.5">Class {k.selectedClass} · {k.items.length} items</p>
                      </div>
                      <span className="text-[16px] font-bold shrink-0">₹{(k.kitSubtotal || 0).toLocaleString('en-IN')}</span>
                      <button aria-label="Remove this kit from the bag" onClick={() => removeFromBag(idx)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#9A908A] shrink-0 active:scale-90 transition-transform shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 text-[14px] mb-4">
                  <div className="flex justify-between"><span className="text-[#5E5650]">Sub total</span><span className="font-semibold">₹{bagSubtotal.toLocaleString('en-IN')}</span></div>
                  {siblingDiscount > 0 && (
                    <div className="flex justify-between"><span className="text-[#5E5650]">Sibling discount (5%)</span><span className="font-semibold text-[#2E8B57]">−₹{siblingDiscount.toLocaleString('en-IN')}</span></div>
                  )}
                  <div className="flex justify-between items-baseline border-t border-[#F0E2DA] pt-3 mt-1">
                    <span className="font-semibold">Total</span>
                    <span className="text-[22px] font-bold">₹{bagTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[12px] text-[#9A908A] mb-4">Pickup is free from Booth 48, Sector 40-C. Home delivery is ₹{DELIVERY_FEE} within 24 hours. You choose at checkout.</p>

                {bagCheckout}
                <button onClick={() => setBagOpen(false)} className="w-full h-11 mt-2.5 text-[14px] font-semibold text-[#5E5650] active:opacity-70">Keep shopping</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast after adding to the bag */}
      {toast && (
        <div className="fixed inset-x-0 flex justify-center pointer-events-none px-5" style={{ zIndex: 350, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 150px)' }}>
          <div className="pointer-events-auto bg-[#1E1B19] text-white rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-3 shadow-[0_10px_28px_rgba(30,27,25,0.28)]">
            <span className="text-[13px]">{toast}</span>
            <button onClick={() => { setToast(''); setBagOpen(true) }} className="px-3.5 py-1.5 rounded-full bg-white text-[#1E1B19] text-[13px] font-semibold active:scale-95 transition-transform">View bag</button>
          </div>
        </div>
      )}

      <main
        className="w-full max-w-md md:max-w-5xl mx-auto px-5 pb-[170px] lg:pb-16"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        {/* App bar */}
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-[26px] font-extrabold tracking-tight leading-none active:scale-95 transition-transform">
              Page<span className="text-[#E8632B]">plus</span>
            </a>
            <div className="flex items-center gap-2.5">
              <nav className="hidden md:flex items-center gap-1 mr-2">
                <a href="/" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Home</a>
                <a href="/marketplace" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Market</a>
                <a href="/books" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Books</a>
                <a href="/profile" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Profile</a>
              </nav>
              <button aria-label={bagCount > 0 ? 'Bag, ' + bagCount + ' items' : 'Bag'} onClick={() => setBagOpen(true)} className={iconBtn}>
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                {bagCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E8632B] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#FFF7F2]">{bagCount}</span>
                )}
              </button>
              {isSignedIn ? (
                <button aria-label="Profile" onClick={() => router.push('/profile')} className={iconBtn}>
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button aria-label="Sign in" className={iconBtn}>
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
          <button onClick={() => setSheetOpen(true)} className="flex items-center gap-1 text-[13px] font-medium text-[#5E5650] mt-1.5 active:opacity-70">
            <span>{placeLine}</span>
            <span className="material-symbols-outlined text-[16px] text-[#9A908A]">expand_more</span>
          </button>
        </header>

        {/* Search */}
        <div className={'flex items-center w-full h-12 bg-white rounded-full pl-4 pr-2 gap-2.5 mb-5 ' + SHADOW}>
          <span className="material-symbols-outlined text-[20px] text-[#9A908A] shrink-0">search</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search in this kit…"
            type="text"
            className="flex-1 min-w-0 bg-transparent text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] focus:outline-none"
          />
          {q && (
            <button aria-label="Clear search" onClick={() => setQ('')} className="w-8 h-8 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="lg:col-span-8">

            {/* Title */}
            <div className="mb-4">
              <h1 className="text-[22px] font-bold tracking-tight">{shortName} Class {selectedClass} kit</h1>
              <p className="text-[14px] text-[#5E5650] mt-0.5">{[SCHOOL_SUB[selectedSchool], 'Official book list'].filter(Boolean).join(' · ')}</p>
            </div>

            {/* School + class */}
            <div className="flex flex-col gap-2.5 mb-5">
              <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
                {schoolNames.map(n => {
                  const on = n === selectedSchool
                  return (
                    <button key={n} onClick={() => pickSchool(n)}
                      className={'px-4 py-2 rounded-full text-[13px] whitespace-nowrap shrink-0 active:scale-95 transition-transform ' + (on ? 'bg-[#E8632B] text-white font-semibold ' : 'bg-white text-[#1E1B19] font-medium ') + SHADOW}>
                      {SHORT_NAME[n] || n}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
                {availableClasses.map(c => {
                  const on = c === selectedClass
                  return (
                    <button key={c} onClick={() => setSelectedClass(c)}
                      className={'px-3.5 py-1.5 rounded-full text-[12px] whitespace-nowrap shrink-0 transition-colors ' + (on ? 'bg-[#E8632B] text-white font-semibold ' : 'bg-white text-[#1E1B19] font-medium ') + SHADOW}>
                      Class {c}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Kit summary */}
            <div className={'bg-white rounded-[22px] p-4 mb-7 ' + SHADOW}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold">{selectedCount} of {totalListed} items selected</span>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  {youSave > 0 && <span className="text-[12px] text-[#9A908A] line-through">₹{market.toLocaleString('en-IN')}</span>}
                  <span className="text-[18px] font-bold">₹{kitSubtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#F0E2DA] flex items-center justify-between gap-3">
                <button onClick={toggleAll} className="text-[13px] font-semibold text-[#C4501A] active:opacity-70">
                  {selectedCount < selectableCount ? 'Select all available' : 'Deselect all'}
                </button>
                {youSave > 0 && <span className="text-[12px] font-semibold text-[#C4501A] bg-[#FFF1EA] px-2.5 py-1 rounded-full">Save ₹{youSave.toLocaleString('en-IN')}</span>}
              </div>
            </div>

            {/* Item sections */}
            {SECTIONS.map(s => renderSection(s))}

            {noMatches && (
              <div className={'bg-white rounded-[22px] p-6 text-center mb-7 ' + SHADOW}>
                <p className="text-[14px] text-[#5E5650]">Nothing in this kit matches &ldquo;{q}&rdquo;.</p>
                <button onClick={() => setQ('')} className="mt-3 text-[13px] font-semibold text-[#C4501A]">Clear search</button>
              </div>
            )}

            {/* Pre-loved shortcut */}
            <button onClick={() => router.push('/marketplace')} className="w-full flex items-center justify-between gap-3 text-left mb-4 px-1 active:opacity-70">
              <span className="text-[14px] text-[#5E5650]">
                Want pre-loved copies?{listingCount > 0 ? ' ' + listingCount + ' available' : ''}
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#9A908A]">chevron_right</span>
            </button>

            <p className="text-[12px] text-[#9A908A] px-1">
              Pick up free from Booth 48, Sector 40-C, or home delivery for ₹{DELIVERY_FEE} within 24 hours.
            </p>
          </div>

          {/* Desktop summary */}
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-6 self-start">{summaryCard}</aside>
        </div>
      </main>

      {/* Small glass Add to bag pill (phones and tablets), just above the navigation */}
      <div className="lg:hidden fixed inset-x-0 flex justify-center pointer-events-none px-5" style={{ zIndex: 40, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 78px)' }}>
        <div className="pointer-events-auto flex items-center gap-3 rounded-full pl-4 pr-1.5 py-1.5" style={GLASS}>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-semibold text-[#3D3530]">{selectedCount} items</span>
            <span className="text-[16px] font-bold">₹{kitSubtotal.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={handleAddToBag}
            disabled={!canAdd}
            className="h-10 px-5 rounded-full bg-[#E8632B] text-white text-[14px] font-semibold flex items-center justify-center shadow-[0_4px_12px_rgba(232,99,43,0.35)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to bag
          </button>
        </div>
      </div>
    </div>
  )
}