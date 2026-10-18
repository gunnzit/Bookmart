'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import LocationSheet, { useDeliveryPlace } from '@/components/LocationSheet'
import { catalog, catalogClasses, classLabel, type CatalogItem } from '@/lib/catalog'

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

type Cat = 'all' | 'textbook' | 'notebook' | 'stationery'
const CATS: { key: Cat; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'textbook', label: 'Textbooks' },
  { key: 'notebook', label: 'Notebooks' },
  { key: 'stationery', label: 'Stationery' },
]

// How many cards each section shows on the "All" view before "See all"
const PREVIEW_COUNT = 8

// A real photo of the item, with a soft tile if the photo does not exist yet
function Cover({ item, dim }: { item: CatalogItem; dim?: boolean }) {
  const src = '/covers/' + item.slug + (item.section === 'notebook' ? '-buddy' : '') + '.jpg'
  const [state, setState] = useState<'loading' | 'ok' | 'bad'>('loading')
  const imgRef = useRef<HTMLImageElement>(null)
  const icon = item.section === 'stationery' ? 'edit' : item.section === 'notebook' ? (item.kind === 'Register' ? 'import_contacts' : 'edit_note') : 'menu_book'

  useEffect(() => {
    setState('loading')
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth > 0) setState('ok')
  }, [src])

  return (
    <>
      {state !== 'bad' && (
        <img
          ref={imgRef}
          key={src}
          src={src}
          alt=""
          className={'absolute inset-0 w-full h-full object-cover ' + (dim ? 'opacity-60 grayscale-[25%]' : '')}
          style={{ opacity: state === 'ok' ? (dim ? 0.6 : 1) : 0, transition: 'opacity 250ms ease' }}
          onLoad={() => setState('ok')}
          onError={() => setState('bad')}
        />
      )}
      {state !== 'ok' && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-[44px] text-[#C4501A]/50">{icon}</span>
        </span>
      )}
    </>
  )
}

export default function BooksPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  const [cat, setCat] = useState<Cat>('all')
  const [cls, setCls] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [bagCount, setBagCount] = useState(0)
  const [oosNames, setOosNames] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [place, setPlace] = useDeliveryPlace()

  // Notify me
  const [notifyFor, setNotifyFor] = useState<string[] | null>(null)
  const [notifyLabel, setNotifyLabel] = useState('')
  const [notifyName, setNotifyName] = useState('')
  const [notifyPhone, setNotifyPhone] = useState('')
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyDone, setNotifyDone] = useState(false)
  const [notifyError, setNotifyError] = useState('')

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('buddybooks_cart')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setBagCount(parsed.filter((k: any) => k && Array.isArray(k.items)).length)
      }
    } catch {}
    fetch('/api/stock')
      .then(r => r.json())
      .then(d => { if (d?.outOfStock) setOosNames(new Set(d.outOfStock)) })
      .catch(() => {})
  }, [])

  const isOOS = (it: CatalogItem) => it.dataOos || (it.names.length > 0 && it.names.every(n => oosNames.has(n)))

  const query = q.trim().toLowerCase()
  const filtered = useMemo(() => {
    return catalog.filter(it => {
      if (cat !== 'all' && it.section !== cat) return false
      if (cls !== null && !it.classes.includes(cls)) return false
      if (query && !it.name.toLowerCase().includes(query)) return false
      return true
    })
  }, [cat, cls, query])

  const bySection = (s: CatalogItem['section']) =>
    filtered
      .filter(it => it.section === s)
      .sort((a, b) => Number(isOOS(a)) - Number(isOOS(b)) || (a.classes[0] ?? 0) - (b.classes[0] ?? 0) || a.name.localeCompare(b.name))

  const textbooks = bySection('textbook')
  const notebooks = bySection('notebook')
  const stationery = bySection('stationery')
  const showClassChips = cat === 'all' || cat === 'textbook'

  const placeLine = !place
    ? 'Choose your delivery area'
    : place.kind === 'pickup'
      ? 'Pickup from Sector 40-C'
      : 'Deliver to ' + place.area.split(',')[0]

  const iconBtn = 'relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E1B19] active:scale-90 transition-transform ' + SHADOW
  const sheetInput = 'w-full px-4 py-3 rounded-2xl bg-[#FFF1EA] text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] border border-transparent focus:outline-none focus:bg-white focus:border-[#E8632B] focus:ring-2 focus:ring-[#E8632B]/20'

  function openKit(it: CatalogItem) {
    router.push('/school-sets?school=' + encodeURIComponent(it.firstSchool) + '&class=' + it.firstClass)
  }

  function openNotify(it: CatalogItem) {
    setNotifyFor(it.names)
    setNotifyLabel(it.name)
    setNotifyDone(false)
    setNotifyError('')
    setNotifyPhone('')
    setNotifyName(user?.fullName || '')
  }

  async function submitNotify() {
    if (!notifyFor) return
    const phone = notifyPhone.replace(/\D/g, '').slice(0, 10)
    if (phone.length !== 10) { setNotifyError('Enter a 10-digit number.'); return }
    setNotifyBusy(true)
    setNotifyError('')
    try {
      // One request for the spelling the Sets page uses (the first one)
      const res = await fetch('/api/stock/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName: notifyFor[0], phone, buyerName: notifyName || (user?.fullName ?? '') }),
      })
      if (res.ok) setNotifyDone(true)
      else { const d = await res.json().catch(() => ({})); setNotifyError(d.error || 'Could not save. Please try again.') }
    } catch { setNotifyError('Something went wrong. Please try again.') }
    setNotifyBusy(false)
  }

  function renderCard(it: CatalogItem) {
    const oos = isOOS(it)
    const grey = [it.kind === 'Register' ? 'Register' : it.kind, classLabel(it.classes)].filter(Boolean).join(' · ')
    return (
      <article key={it.id} className={'bg-white rounded-[22px] p-2.5 flex flex-col justify-between ' + SHADOW}>
        <div className="relative w-full aspect-[4/5] rounded-[18px] overflow-hidden bg-[#F8EDE6]">
          <Cover item={it} dim={oos} />
          {oos ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center p-2 bg-[#1E1B19]/10">
                <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#5E5650]">Out of stock</span>
              </div>
              <button onClick={() => openNotify(it)} className="absolute bottom-2 right-2 h-8 px-2.5 rounded-full bg-white/95 text-[#1E1B19] text-[11px] font-semibold shadow-[0_2px_8px_rgba(120,70,40,0.12)] flex items-center gap-1.5 active:scale-95 transition-transform">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] shrink-0" />
                Notify me
              </button>
            </>
          ) : (
            <button aria-label={'See ' + it.name + ' in its kit'} onClick={() => openKit(it)} className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#E8632B] text-white shadow-[0_4px_10px_rgba(232,99,43,0.35)] flex items-center justify-center active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[19px]">add</span>
            </button>
          )}
        </div>
        <div className="pt-2.5 pb-1 px-1 flex flex-col gap-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-[#1E1B19] leading-snug line-clamp-2">{it.name}</h3>
          <p className="text-[13px] text-[#5E5650]">{grey}</p>
          {it.price !== null && (
            <div className="text-[16px] font-bold text-[#1E1B19] pt-0.5">
              {it.priceFrom && <span className="text-[12px] font-medium text-[#5E5650] mr-1">From</span>}₹{it.price.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </article>
    )
  }

  function renderSection(title: string, items: CatalogItem[], goto: Cat) {
    if (items.length === 0) return null
    const preview = cat === 'all'
    const shown = preview ? items.slice(0, PREVIEW_COUNT) : items
    return (
      <section key={title} className="mt-7 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
          {preview && items.length > PREVIEW_COUNT && (
            <button onClick={() => setCat(goto)} className="text-[13px] font-medium text-[#9A908A] active:opacity-70">See all</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {shown.map(renderCard)}
        </div>
      </section>
    )
  }

  const nothing = filtered.length === 0

  return (
    <div
      className="min-h-screen text-[#1E1B19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
      style={{ background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }}
    >
      <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} place={place} onSelect={setPlace} />

      {/* Notify me sheet */}
      {notifyFor && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={() => setNotifyFor(null)}>
          <div className="bg-white rounded-t-[28px] md:rounded-[28px] p-6 w-full max-w-md shadow-[0_-10px_35px_rgba(30,27,25,0.2)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[#F0E2DA] mx-auto mb-4 md:hidden" />
            {notifyDone ? (
              <>
                <div className="w-12 h-12 rounded-full bg-[#2E8B57]/10 text-[#2E8B57] flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <h3 className="text-[18px] font-bold text-center mb-1">You are on the list</h3>
                <p className="text-[14px] text-[#5E5650] text-center mb-5">We will WhatsApp you when <strong className="text-[#1E1B19]">{notifyLabel}</strong> is back.</p>
                <button onClick={() => setNotifyFor(null)} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Done</button>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-bold">Tell me when it is back</h3>
                    <p className="text-[13px] text-[#9A908A] mt-0.5 truncate">{notifyLabel}</p>
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
                  {notifyError && <p className="text-[12px] text-[#D64545]">{notifyError}</p>}
                </div>
                <button onClick={submitNotify} disabled={notifyBusy} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform disabled:opacity-60">
                  {notifyBusy ? 'Saving…' : 'Notify me'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <main
        className="w-full max-w-md md:max-w-5xl mx-auto px-5 pb-[130px] lg:pb-16"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        {/* App bar (same as Home, Sets and Market) */}
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-[26px] font-extrabold tracking-tight leading-none active:scale-95 transition-transform">
              Page<span className="text-[#E8632B]">plus</span>
            </a>
            <div className="flex items-center gap-2.5">
              <nav className="hidden md:flex items-center gap-1 mr-2">
                <a href="/" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Home</a>
                <a href="/school-sets" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Sets</a>
                <a href="/marketplace" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Market</a>
                <a href="/profile" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Profile</a>
              </nav>
              <button aria-label={bagCount > 0 ? 'Bag, ' + bagCount + ' kits' : 'Bag'} onClick={() => router.push('/school-sets?bag=1')} className={iconBtn}>
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
        <div className={'flex items-center w-full h-12 bg-white rounded-full pl-4 pr-2 gap-2.5 mb-4 ' + SHADOW}>
          <span className="material-symbols-outlined text-[20px] text-[#9A908A] shrink-0">search</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search books, notebooks, stationery…"
            type="text"
            className="flex-1 min-w-0 bg-transparent text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] focus:outline-none"
          />
          {q && (
            <button aria-label="Clear search" onClick={() => setQ('')} className="w-8 h-8 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATS.map(c => {
            const on = cat === c.key
            return (
              <button key={c.key} onClick={() => setCat(c.key)}
                className={'shrink-0 px-4 py-2 rounded-full text-[13px] active:scale-95 transition-transform ' + (on ? 'bg-[#E8632B] text-white font-semibold shadow-[0_4px_14px_rgba(232,99,43,0.3)]' : 'bg-white text-[#1E1B19] font-medium ' + SHADOW)}>
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Class chips */}
        {showClassChips && (
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-5 px-5 pt-2 pb-1" style={{ scrollbarWidth: 'none' }}>
            {catalogClasses.map(c => {
              const on = cls === c
              return (
                <button key={c} onClick={() => setCls(on ? null : c)}
                  className={'shrink-0 px-3 py-1.5 rounded-full text-[12px] active:scale-95 transition-colors ' + (on ? 'bg-[#FCE3D6] text-[#C4501A] font-semibold' : 'bg-white/70 text-[#5E5650] font-medium')}>
                  Class {c}
                </button>
              )
            })}
          </div>
        )}

        {/* Sections */}
        {(cat === 'all' || cat === 'textbook') && renderSection('Textbooks', textbooks, 'textbook')}
        {(cat === 'all' || cat === 'notebook') && renderSection(cat === 'all' ? 'Notebooks' : 'Notebooks and registers', notebooks, 'notebook')}
        {(cat === 'all' || cat === 'stationery') && renderSection('Stationery', stationery, 'stationery')}

        {nothing && (
          <div className="mt-10 text-center">
            <p className="text-[15px] font-semibold">We do not stock that yet</p>
            <p className="text-[13px] text-[#5E5650] mt-1">Tell us what you need and we will try to get it.</p>
          </div>
        )}

        {/* Ask the shop */}
        <div className={'mt-8 bg-white rounded-[22px] p-5 flex items-center justify-between gap-4 ' + SHADOW}>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug">Need a specific edition?</p>
            <p className="text-[13px] text-[#5E5650] leading-snug mt-1">Tell us the subject or publication and we will source it for you.</p>
          </div>
          <button onClick={() => router.push('/requests')} className="shrink-0 px-4 py-2.5 rounded-full bg-[#F8EDE6] text-[#1E1B19] text-[14px] font-semibold flex items-center gap-1.5 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[16px] text-[#E8632B]">chat_bubble</span>
            Ask the shop
          </button>
        </div>
      </main>
    </div>
  )
}