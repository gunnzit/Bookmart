'use client'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { LOCATIONS, QUICK_SECTORS } from '@/lib/locations'

export type Saved = { id: string; label: string; line1: string; area: string; pin?: string | null }
export type Place = { kind: 'pickup' } | ({ kind: 'address' } & Saved)

const KEY = 'pageplus_delivery_place'
const LABELS = ['Home', 'Office', "Parents' Home", 'Other']
const LABEL_ICON: Record<string, string> = { Home: 'fa-house', Office: 'fa-building', "Parents' Home": 'fa-house-user', Other: 'fa-location-dot' }

// Which place is selected on this phone (the addresses themselves live in the account).
export function useDeliveryPlace() {
  const [place, setPlaceState] = useState<Place | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (p && (p.kind === 'pickup' || (p.kind === 'address' && p.id))) setPlaceState(p)
      }
    } catch {}
  }, [])
  function setPlace(p: Place | null) {
    setPlaceState(p)
    try { if (p) localStorage.setItem(KEY, JSON.stringify(p)); else localStorage.removeItem(KEY) } catch {}
  }
  return [place, setPlace] as const
}

export function placeShortLabel(p: Place | null): string {
  if (!p) return 'Sector 40-C • Chandigarh'
  if (p.kind === 'pickup') return 'Pickup • Sector 40-C'
  return p.label + ' • ' + p.area.split(',')[0]
}

export function placeFullText(p: Place | null): string {
  if (!p || p.kind !== 'address') return ''
  return p.line1 + ', ' + p.area + (p.pin ? ' - ' + p.pin : '')
}

// All the motion of this sheet
const CSS = `
@keyframes wrLsUp{0%{transform:translateY(100%)}100%{transform:none}}
@keyframes wrLsDown{0%{transform:none}100%{transform:translateY(100%)}}
@keyframes wrLsIn{0%{opacity:0}100%{opacity:1}}
@keyframes wrLsOut{0%{opacity:1}100%{opacity:0}}
@keyframes wrLsPop{0%{opacity:0;transform:translateY(18px) scale(.94)}60%{opacity:1;transform:translateY(-2px) scale(1.01)}100%{opacity:1;transform:none}}
@keyframes wrLsTick{0%{transform:scale(0) rotate(-40deg)}60%{transform:scale(1.25) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
@keyframes wrLsPin{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes wrLsShine{0%{transform:translateX(-130%)}45%,100%{transform:translateX(130%)}}
@keyframes wrLsDrop{0%{opacity:0;transform:translateY(-6px)}100%{opacity:1;transform:none}}
@keyframes wrLsSk{0%{background-position:100% 0}100%{background-position:-100% 0}}
.wrls-sheet{animation:wrLsUp .38s cubic-bezier(.22,1,.36,1) both}
.wrls-sheet.out{animation:wrLsDown .26s cubic-bezier(.4,0,1,1) both}
.wrls-back{animation:wrLsIn .3s ease both}
.wrls-back.out{animation:wrLsOut .26s ease both}
.wrls-pop{animation:wrLsPop .5s cubic-bezier(.22,1,.36,1) var(--d,0ms) backwards}
.wrls-tick{animation:wrLsTick .45s cubic-bezier(.34,1.56,.64,1) both}
.wrls-pin{display:inline-block;animation:wrLsPin 2.2s ease-in-out infinite}
.wrls-drop{animation:wrLsDrop .2s ease both}
.wrls-btn{position:relative;overflow:hidden;isolation:isolate}
.wrls-btn::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.3) 50%,transparent 65%);transform:translateX(-130%);animation:wrLsShine 4s ease-in-out infinite}
.wrls-sk{background:linear-gradient(90deg,#f1ede6 25%,#fbf8f1 40%,#f1ede6 60%);background-size:300% 100%;animation:wrLsSk 1.4s ease-in-out infinite}
.wrls-card{transition:transform .18s ease,background-color .2s ease,border-color .2s ease,box-shadow .2s ease}
.wrls-card:active{transform:scale(.985)}
@media (hover:hover){.wrls-card:hover{box-shadow:0 8px 20px rgba(120,70,40,.1)}}
@media (prefers-reduced-motion:reduce){
.wrls-sheet,.wrls-sheet.out,.wrls-back,.wrls-back.out,.wrls-pop,.wrls-tick,.wrls-pin,.wrls-drop,.wrls-btn::after,.wrls-sk{animation:none!important}
}
`

const fieldCls = 'w-full px-4 py-2.5 rounded-2xl bg-white text-[13px] text-stone-900 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:border-[#F7CF65] focus:ring-2 focus:ring-[#F7CF65]'

export default function LocationSheet({ open, onClose, place, onSelect }: {
  open: boolean
  onClose: () => void
  place: Place | null
  onSelect: (p: Place | null) => void
}) {
  const { isSignedIn } = useUser()
  const [saved, setSaved] = useState<Saved[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [query, setQuery] = useState('')
  const [closing, setClosing] = useState(false)
  const [form, setForm] = useState({ label: 'Home', line1: '', area: '', pin: '' })
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open || !isSignedIn) return
    setLoading(true)
    fetch('/api/addresses', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && Array.isArray(d.addresses)) setSaved(d.addresses) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, isSignedIn])

  useEffect(() => {
    if (!open) { setAdding(false); setErr(''); setQuery(''); setClosing(false) }
  }, [open])

  // Page behind does not scroll while the sheet is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  // Slide down first, then tell the page to close
  function requestClose() {
    if (closing) return
    setClosing(true)
    closeTimer.current = setTimeout(() => { onClose() }, 260)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null

  // Sign-in is a real page (/sign-in). After signing in, the person comes back here.
  function goSignIn() {
    window.location.assign('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname + window.location.search))
  }

  const matches = query.trim().length > 0
    ? LOCATIONS.filter(l => l.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : []

  function chooseArea(area: string) {
    setForm(f => ({ ...f, area }))
    setQuery('')
    setAdding(true)
    setErr('')
  }

  function pick(p: Place) {
    onSelect(p)
    requestClose()
  }

  async function save() {
    setErr('')
    if (form.line1.trim().length < 5) { setErr('Enter your house or flat details.'); return }
    if (!LOCATIONS.includes(form.area)) { setErr('Pick your area from the list.'); return }
    if (form.pin && form.pin.length !== 6) { setErr('PIN code must be 6 digits.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(d.error || 'Could not save. Please try again.'); setSaving(false); return }
      setSaved(prev => [...prev, d.address])
      setForm({ label: 'Home', line1: '', area: '', pin: '' })
      setAdding(false)
      pick({ kind: 'address', ...d.address })
    } catch {
      setErr('Could not connect. Please try again.')
    }
    setSaving(false)
  }

  async function remove(a: Saved) {
    if (!confirm('Delete this saved address?')) return
    await fetch('/api/addresses/' + a.id, { method: 'DELETE' }).catch(() => {})
    setSaved(prev => prev.filter(x => x.id !== a.id))
    if (place && place.kind === 'address' && place.id === a.id) onSelect(null)
  }

  const pickupOn = place?.kind === 'pickup'
  const delay = (i: number) => ({ ['--d' as any]: 120 + i * 70 + 'ms' })

  return (
    <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{CSS}</style>
      <div className={'wrls-back absolute inset-0 bg-[#31302d]/45 backdrop-blur-[3px] ' + (closing ? 'out' : '')} onClick={requestClose} />
      <div
        className={'wrls-sheet relative w-full max-w-[430px] bg-white rounded-t-[28px] md:rounded-[28px] shadow-[0_-10px_35px_rgba(29,27,25,0.22)] flex flex-col overflow-hidden max-h-[88vh] ' + (closing ? 'out' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="Select delivery location"
      >
        <div className="w-full flex items-center justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 rounded-full bg-[#d3c5ac]/60" />
        </div>

        {/* Header */}
        <div className="px-4 pt-2 md:pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <i className="wrls-pin fa-solid fa-location-dot text-[#EA580C] text-[20px]" />
              <h2 className="text-stone-900 font-extrabold text-lg tracking-tight truncate">Select Delivery Location</h2>
            </div>
            <p className="text-stone-500 text-xs mt-1 leading-snug">Pick where your orders are delivered, or collect them free from our store</p>
          </div>
          <button type="button" aria-label="Close" onClick={requestClose} className="w-9 h-9 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-stone-500 hover:text-stone-900 active:scale-90 transition-all shrink-0">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6 pt-1 flex flex-col gap-4" style={{ scrollbarWidth: 'none', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>

          {/* Search */}
          <div className="relative wrls-pop" style={delay(0)}>
            <div className="w-full bg-[#f6f3ee] rounded-full px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F7CF65] transition-all">
              <i className="fa-solid fa-magnifying-glass text-stone-400 text-[13px] shrink-0" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search sector, society or area…" type="text" aria-label="Search sector or area" className="w-full bg-transparent border-0 p-0 text-stone-900 text-xs placeholder:text-stone-400 focus:ring-0 focus:outline-none" />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="text-stone-400 hover:text-stone-900 shrink-0">
                  <i className="fa-solid fa-circle-xmark text-sm" />
                </button>
              )}
            </div>
            {matches.length > 0 && (
              <div className="wrls-drop absolute z-10 left-0 right-0 top-12 bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
                {matches.map(m => (
                  <button type="button" key={m} onClick={() => isSignedIn ? chooseArea(m) : undefined} className="w-full flex items-center gap-2.5 px-4 py-3 text-left border-b border-stone-100 last:border-0 active:bg-[#f6f3ee]">
                    <i className="fa-solid fa-location-dot text-[13px] text-[#EA580C]" />
                    <span className="text-xs font-semibold text-stone-900">{m}</span>
                  </button>
                ))}
                {!isSignedIn && <p className="px-4 py-2.5 text-xs text-stone-500 bg-[#f6f3ee]">Sign in to save an address.</p>}
              </div>
            )}
          </div>

          {/* Store pickup (the quick option) */}
          <button
            type="button"
            onClick={() => pick({ kind: 'pickup' })}
            style={delay(1)}
            className={'wrls-pop wrls-card w-full p-3 rounded-2xl flex items-center justify-between text-left border ' + (pickupOn ? 'bg-[#FEEBC8]/50 border-amber-300 shadow-sm' : 'bg-[#FEEBC8]/60 hover:bg-[#FEEBC8] border-amber-100')}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F7CF65] text-stone-900 flex items-center justify-center shrink-0 shadow-sm">
                <i className="fa-solid fa-store text-[15px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-900 font-bold text-sm truncate">Pickup from Sector 40-C</span>
                </div>
                <span className="block text-stone-500 text-xs truncate mt-0.5">Booth 48, Bedi Book Store • Mon–Sat, 9am–7pm</span>
              </div>
            </div>
            {pickupOn
              ? <span className="wrls-tick w-5 h-5 rounded-full bg-[#EA580C] flex items-center justify-center text-white shrink-0 ml-2"><i className="fa-solid fa-check text-[10px]" /></span>
              : <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#795900] bg-[#ffdf9f] px-2 py-0.5 rounded-full shrink-0">Free</span>}
          </button>

          {/* Quick sectors */}
          {isSignedIn && !adding && saved.length < 3 && (
            <div className="flex flex-col wrls-pop" style={delay(2)}>
              <span className="text-stone-500 font-semibold text-xs uppercase tracking-wider mb-2">Quick sectors</span>
              <div className="flex items-center gap-2 overflow-x-auto py-0.5" style={{ scrollbarWidth: 'none' }}>
                {QUICK_SECTORS.map(q => (
                  <button type="button" key={q} onClick={() => chooseArea(q)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#f0ede9] text-stone-800 hover:bg-[#F7CF65] shrink-0 active:scale-95 transition-all">{q.split(',')[0]}</button>
                ))}
              </div>
            </div>
          )}

          {/* Saved addresses */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-900 font-bold text-sm">Saved Addresses</span>
              {isSignedIn && <span className="text-xs font-semibold bg-[#f0ede9] text-stone-500 px-2.5 py-0.5 rounded-full">{saved.length} of 3 saved</span>}
            </div>

            {!isSignedIn ? (
              <div className="wrls-pop rounded-2xl bg-[#f6f3ee] border border-stone-200 p-4 text-center" style={delay(3)}>
                <p className="text-xs text-stone-600 mb-3">Sign in to save your addresses and use them at checkout.</p>
                <button type="button" onClick={goSignIn} className="wrls-btn bg-stone-900 text-amber-300 text-xs font-bold px-5 py-2.5 rounded-full shadow active:scale-95 transition-transform">Sign in</button>
              </div>
            ) : loading ? (
              <div className="flex flex-col gap-2.5">
                <div className="wrls-sk h-24 rounded-2xl" />
                <div className="wrls-sk h-24 rounded-2xl" />
              </div>
            ) : saved.length === 0 && !adding ? (
              <div className="wrls-pop rounded-2xl bg-[#f6f3ee] border border-stone-200 p-4 flex items-center gap-3" style={delay(3)}>
                <div className="w-9 h-9 rounded-full bg-[#FDE68A] flex items-center justify-center shrink-0"><i className="fa-solid fa-map-pin text-stone-900 text-sm" /></div>
                <p className="text-xs text-stone-600">No saved addresses yet. Add one below and it will be ready for checkout.</p>
              </div>
            ) : (
              saved.map((a, i) => {
                const on = place?.kind === 'address' && place.id === a.id
                return (
                  <div
                    key={a.id}
                    style={delay(3 + i)}
                    onClick={() => { if (!on) pick({ kind: 'address', ...a }) }}
                    className={'wrls-pop wrls-card p-3.5 rounded-2xl relative cursor-pointer border ' + (on ? 'bg-[#FEEBC8]/50 border-amber-300 shadow-sm' : 'bg-[#f6f3ee] hover:bg-[#f0ede9] border-stone-200')}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={'font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase ' + (on ? 'bg-[#F7CF65] text-stone-900' : 'bg-[#e5e2dd] text-stone-800 font-semibold')}>
                          <i className={'fa-solid ' + (LABEL_ICON[a.label] || 'fa-location-dot') + ' text-[11px]'} />{a.label}
                        </span>
                        {on && <span className="bg-stone-900 text-amber-300 font-semibold text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><i className="fa-solid fa-check text-[9px]" />SELECTED</span>}
                      </div>
                      {on
                        ? <span className="wrls-tick w-5 h-5 rounded-full bg-[#EA580C] flex items-center justify-center text-white shadow-sm shrink-0"><i className="fa-solid fa-check text-[10px]" /></span>
                        : <button type="button" onClick={e => { e.stopPropagation(); pick({ kind: 'address', ...a }) }} className="font-semibold text-xs bg-[#e5e2dd] text-stone-800 px-3 py-1 rounded-full hover:bg-[#F7CF65] hover:text-stone-900 active:scale-95 transition-all shrink-0">Deliver Here</button>}
                    </div>
                    <p className="text-stone-900 font-bold text-sm leading-snug">{a.line1}</p>
                    <p className="text-stone-500 text-xs mt-0.5">{a.area}{a.pin ? ' - ' + a.pin : ''}</p>
                    <button type="button" onClick={e => { e.stopPropagation(); remove(a) }} className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1 active:scale-95 transition-transform">
                      <i className="fa-regular fa-trash-can text-[11px]" />Delete
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Add address form */}
          {isSignedIn && adding && (
            <div className="wrls-pop rounded-2xl bg-[#f6f3ee] border border-stone-200 p-3.5 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-stone-900">New address</h3>
              <div className="flex flex-wrap gap-1.5">
                {LABELS.map(l => (
                  <button type="button" key={l} onClick={() => setForm(f => ({ ...f, label: l }))} className={'px-3 py-1.5 rounded-full text-xs active:scale-95 transition-all ' + (form.label === l ? 'bg-[#F7CF65] text-stone-900 font-bold shadow-sm' : 'bg-white border border-stone-200 text-stone-600 font-semibold')}>{l}</button>
                ))}
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">House / flat, street *</label>
                <input value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value.slice(0, 120) }))} placeholder="e.g. Flat 402, Tower B, Jal Vayu Vihar" type="text" className={fieldCls} />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">Area *</label>
                {form.area ? (
                  <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-2.5 border border-emerald-600">
                    <span className="text-[13px] text-stone-900">{form.area}</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, area: '' }))} className="text-xs text-[#795900] font-bold">Change</button>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">Search your sector in the box at the top, or tap a quick sector.</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">PIN code (optional)</label>
                <input value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="160040" type="text" inputMode="numeric" className={fieldCls} />
              </div>
              {err && <p className="text-xs text-red-600 font-semibold">{err}</p>}
              <div className="flex gap-2.5">
                <button type="button" onClick={save} disabled={saving} className="wrls-btn flex-1 bg-[#fbbf24] text-stone-900 text-sm font-bold py-3 rounded-full shadow-sm active:scale-95 transition-transform disabled:opacity-60">{saving ? 'Saving…' : 'Save address'}</button>
                <button type="button" onClick={() => { setAdding(false); setErr('') }} className="flex-1 bg-white text-stone-900 text-sm font-semibold py-3 rounded-full border border-stone-200 active:scale-95 transition-transform">Cancel</button>
              </div>
            </div>
          )}

          {/* Add button */}
          {isSignedIn && !adding && (
            saved.length < 3 ? (
              <button type="button" onClick={() => { setAdding(true); setErr('') }} style={delay(3 + saved.length)} className="wrls-pop wrls-btn w-full bg-stone-900 hover:bg-black text-amber-300 py-3.5 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                <i className="fa-solid fa-circle-plus text-[#F7CF65] text-lg" />
                <span>Add New Delivery Address</span>
              </button>
            ) : (
              <p className="text-xs text-stone-500 text-center">You&apos;ve saved 3 addresses. Delete one to add another.</p>
            )
          )}
        </div>
      </div>
    </div>
  )
}