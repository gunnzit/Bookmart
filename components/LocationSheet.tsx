'use client'
import { useEffect, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { LOCATIONS, QUICK_SECTORS } from '@/lib/locations'

export type Saved = { id: string; label: string; line1: string; area: string; pin?: string | null }
export type Place = { kind: 'pickup' } | ({ kind: 'address' } & Saved)

const KEY = 'pageplus_delivery_place'
const LABELS = ['Home', 'Office', "Parents' Home", 'Other']
const LABEL_ICON: Record<string, string> = { Home: 'home', Office: 'business', "Parents' Home": 'family_restroom', Other: 'location_on' }

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

const inputCls = 'w-full px-4 py-3 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-outline border border-transparent focus:outline-none focus:bg-white focus:border-[#E8632B] focus:ring-2 focus:ring-[#E8632B]/20'

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
  const [form, setForm] = useState({ label: 'Home', line1: '', area: '', pin: '' })

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
    if (!open) { setAdding(false); setErr(''); setQuery('') }
  }, [open])

  if (!open) return null

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
    onClose()
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

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-inverse-surface/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-[28px] md:rounded-[28px] shadow-[0_-10px_35px_rgba(29,27,25,0.22)] flex flex-col overflow-hidden max-h-[90vh]">
        <div className="w-full flex items-center justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 rounded-full bg-surface-variant" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 md:pt-5 pb-3 flex items-start justify-between border-b border-surface-container">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Select Delivery Location</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Choose where your orders are delivered</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">search</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search sector or area…" type="text" className={inputCls + ' pl-11'} />
            {matches.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-12 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant overflow-hidden">
                {matches.map(m => (
                  <button key={m} onClick={() => isSignedIn ? chooseArea(m) : undefined} className="w-full flex items-center gap-2.5 px-4 py-3 text-left border-b border-[#EADFCC]/70 last:border-0 active:bg-surface-container">
                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                    <span className="font-label-md text-label-md text-on-surface">{m}</span>
                  </button>
                ))}
                {!isSignedIn && <p className="px-4 py-2.5 font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low">Sign in to save an address.</p>}
              </div>
            )}
          </div>

          {/* Saved addresses */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline">Saved addresses</span>
              {isSignedIn && <span className="font-label-micro text-label-micro text-primary">{saved.length} of 3 saved</span>}
            </div>

            {!isSignedIn ? (
              <div className="rounded-xl bg-surface-container-low p-4 text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">Sign in to save your addresses and use them at checkout.</p>
                <SignInButton mode="modal">
                  <button className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-5 py-2.5 rounded-xl shadow-sm">Sign in</button>
                </SignInButton>
              </div>
            ) : loading ? (
              <div className="h-20 rounded-xl bg-surface-container animate-pulse" />
            ) : saved.length === 0 && !adding ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No saved addresses yet.</p>
            ) : (
              saved.map(a => {
                const on = place?.kind === 'address' && place.id === a.id
                return (
                  <div key={a.id} className={'rounded-xl p-3.5 transition-colors ' + (on ? 'border-2 border-primary bg-primary-fixed/20' : 'border border-outline-variant/40 bg-surface-container-low')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={'inline-flex items-center gap-1 font-label-micro text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full ' + (on ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant')}>
                          <span className="material-symbols-outlined text-[13px]">{LABEL_ICON[a.label] || 'location_on'}</span>{a.label}
                        </span>
                        {on && <span className="font-label-micro text-[11px] text-primary uppercase bg-primary-fixed px-2 py-0.5 rounded-full">Selected</span>}
                      </div>
                      {on
                        ? <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        : <button onClick={() => pick({ kind: 'address', ...a })} className="font-label-micro text-label-micro uppercase tracking-wider text-primary font-bold px-2 py-1 rounded hover:bg-primary-fixed/30">Deliver here</button>}
                    </div>
                    <p className="font-label-lg text-label-lg text-on-surface mt-2 leading-snug">{a.line1}, {a.area}{a.pin ? ' - ' + a.pin : ''}</p>
                    <button onClick={() => remove(a)} className="mt-2 font-label-md text-label-md text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">delete</span>Delete
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Quick sectors */}
          {isSignedIn && !adding && saved.length < 3 && (
            <div className="flex flex-col gap-2">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline">Quick sectors</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SECTORS.map(q => (
                  <button key={q} onClick={() => chooseArea(q)} className="px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-container text-on-surface hover:bg-surface-container-high">{q.split(',')[0]}</button>
                ))}
              </div>
            </div>
          )}

          {/* Add address form */}
          {isSignedIn && adding && (
            <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-3">
              <h3 className="font-label-lg text-label-lg font-semibold text-on-surface">New address</h3>
              <div className="flex flex-wrap gap-1.5">
                {LABELS.map(l => (
                  <button key={l} onClick={() => setForm(f => ({ ...f, label: l }))} className={'px-3 py-1.5 rounded-full font-label-md text-label-md ' + (form.label === l ? 'bg-[#FDE7D8] border-[1.5px] border-[#E8632B] text-[#C4501A] font-semibold' : 'bg-white border border-[#EADFCC] text-[#6B6560]')}>{l}</button>
                ))}
              </div>
              <div>
                <label className="font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5">House / flat, street *</label>
                <input value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value.slice(0, 120) }))} placeholder="e.g. Flat 402, Tower B, Jal Vayu Vihar" type="text" className={inputCls + ' !bg-white'} />
              </div>
              <div>
                <label className="font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5">Area *</label>
                {form.area ? (
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#2E8B57]">
                    <span className="font-body-md text-body-md text-on-surface">{form.area}</span>
                    <button onClick={() => setForm(f => ({ ...f, area: '' }))} className="font-label-md text-label-md text-primary font-semibold">Change</button>
                  </div>
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Search your sector in the box at the top, or tap a quick sector.</p>
                )}
              </div>
              <div>
                <label className="font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5">PIN code (optional)</label>
                <input value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="160040" type="text" inputMode="numeric" className={inputCls + ' !bg-white'} />
              </div>
              {err && <p className="font-body-sm text-body-sm text-error">{err}</p>}
              <div className="flex gap-2.5">
                <button onClick={save} disabled={saving} className="flex-1 bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3 rounded-xl shadow-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save address'}</button>
                <button onClick={() => { setAdding(false); setErr('') }} className="flex-1 bg-white text-on-surface font-label-lg text-label-lg font-semibold py-3 rounded-xl border border-[#EADFCC]">Cancel</button>
              </div>
            </div>
          )}

          {/* Add button */}
          {isSignedIn && !adding && (
            saved.length < 3 ? (
              <button onClick={() => { setAdding(true); setErr('') }} className="w-full py-3 px-4 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-transform">
                <span className="material-symbols-outlined text-[19px]">add_location_alt</span>Add New Address
              </button>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">You&apos;ve saved 3 addresses. Delete one to add another.</p>
            )
          )}

          {/* Store pickup */}
          <button onClick={() => pick({ kind: 'pickup' })} className={'w-full p-3 rounded-xl flex items-center justify-between text-left ' + (pickupOn ? 'border-2 border-primary bg-primary-fixed/20' : 'bg-surface-container border border-outline-variant/30')}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">storefront</span>
              </div>
              <div className="min-w-0">
                <div className="font-label-md text-label-md font-semibold text-on-surface truncate">Pickup from Booth 48, Sector 40-C</div>
                <div className="font-body-sm text-[12px] text-on-surface-variant truncate">Bedi Book Store • Mon–Sat, 9am–7pm</div>
              </div>
            </div>
            <span className="ml-2 font-label-micro text-[11px] uppercase tracking-wider text-primary bg-primary-fixed px-2 py-0.5 rounded shrink-0">Free</span>
          </button>
        </div>
      </div>
    </div>
  )
}