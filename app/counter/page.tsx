'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, BigButton, Busy, api, rupees } from '@/components/stock/ui'

// Counter billing for Bedi Book Store. Pick who is billing (name + PIN), then a school set in
// three taps (school → class → set) and/or loose items, then Cash or UPI. Stock comes off on the
// server; set items not in the shop are listed to hand over later.

type Staff = { id: string; name: string; role: string }
type SetLine = { name: string; qty: number; unitPrice: number; group: string; outOfPrint: boolean; inStock: number | null }
type Loose = { id: string; name: string; mrp: number | null; qty: number }
type CartLine =
  | { kind: 'set'; name: string; qty: number; unitPrice: number; group: string }
  | { kind: 'item'; itemId: string; name: string; qty: number; unitPrice: number }
  | { kind: 'custom'; name: string; qty: number; unitPrice: number }
type Done = { invoiceNo: number; token: string; total: number; lines: { name: string; pendingQty: number }[] }

const MSG: Record<string, string> = {
  wrong_pin: 'Wrong PIN. Try again.', wait: 'Too many tries. Wait a minute.', locked: 'Locked. Pick your name again.',
  bad_pin: 'PIN must be 4 digits.', bad_name: 'Type a name.', not_allowed: 'Only family can do this.', empty: 'The bill is empty.',
  need_price: 'This item has no MRP. Add it as "Other item" with a price.', offline: 'No internet. Try again.',
}
const say = (code?: string) => MSG[code || ''] || 'Something went wrong. Try again.'

// ── PIN pad ──────────────────────────────────────────────────────────────
const PinPad: React.FC<{ title: string; onDone: (pin: string) => void; error?: string; onBack?: () => void }> = ({ title, onDone, error, onBack }) => {
  const [pin, setPin] = useState('')
  useEffect(() => { if (pin.length === 4) { onDone(pin); setPin('') } }, [pin, onDone])
  return (
    <div className="flex flex-col items-center gap-5 pt-4">
      <p className="text-[20px] font-extrabold text-center">{title}</p>
      <div className="flex gap-4">{[0, 1, 2, 3].map(i => <span key={i} className={'w-5 h-5 rounded-full ' + (i < pin.length ? 'bg-[#1c1c19]' : 'bg-[#e5e2dd]')} />)}</div>
      {error && <p className="text-[15px] font-bold text-[#c2410c]">{error}</p>}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[320px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'del'].map(k => (
          <button key={k} onClick={() => k === 'del' ? setPin(p => p.slice(0, -1)) : k === 'back' ? onBack?.() : setPin(p => (p + k).slice(0, 4))}
            className={'h-16 rounded-[20px] text-[26px] font-bold active:scale-95 ' + (k === 'back' || k === 'del' ? 'bg-transparent text-[16px] text-[#4f4633]' : 'bg-white shadow-sm')}>
            {k === 'del' ? '⌫' : k === 'back' ? (onBack ? 'Back' : '') : k}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Counter() {
  const [staff, setStaff] = useState<Staff[] | null>(null)
  const [me, setMe] = useState<Staff | null>(null)
  const [picked, setPicked] = useState<Staff | null>(null)
  const [pinErr, setPinErr] = useState('')
  const [view, setView] = useState<'bill' | 'today' | 'team'>('bill')
  const [loadErr, setLoadErr] = useState('')

  const load = useCallback(async () => {
    const r = await api<{ staff: Staff[]; me: Staff | null }>('/api/counter/staff')
    if (r.ok) { setStaff(r.data.staff); setMe(r.data.me); setLoadErr('') }
    else setLoadErr(r.data.error === 'offline' ? 'No internet. Pull down to refresh.' : 'The counter is not set up yet (its database tables are missing). Tell the owner.')
  }, [])
  useEffect(() => { load() }, [load])

  async function unlock(pin: string) {
    if (!picked) return
    const r = await api('/api/counter/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffId: picked.id, pin }) })
    if (r.ok) { setPicked(null); setPinErr(''); load() } else setPinErr(say(r.data.error))
  }
  async function lock() {
    await api('/api/counter/logout', { method: 'POST' })
    setMe(null); setView('bill')
  }

  const shell = (children: React.ReactNode) => <div className="min-h-screen bg-[#fcf9f4] text-[#1c1c19] font-['Plus_Jakarta_Sans',sans-serif]"><div className="max-w-2xl mx-auto px-4 py-5">{children}</div></div>

  if (!staff) return shell(<p className={'text-[16px] ' + (loadErr ? 'font-bold text-[#c2410c]' : 'text-[#4f4633]')}>{loadErr || 'Loading…'}</p>)
  if (staff.length === 0) return shell(<FirstPerson onDone={load} />)

  if (!me) return shell(
    picked ? <PinPad title={`Hi ${picked.name}, enter your PIN`} onDone={unlock} error={pinErr} onBack={() => { setPicked(null); setPinErr('') }} /> : (
      <div className="flex flex-col gap-4">
        <h1 className="text-[24px] font-extrabold">Who&apos;s billing?</h1>
        <div className="grid grid-cols-2 gap-3">
          {staff.map(s => (
            <button key={s.id} onClick={() => setPicked(s)} className="h-28 rounded-[24px] bg-white shadow-[0_4px_20px_rgba(28,28,25,0.06)] flex flex-col items-center justify-center gap-2 active:scale-[0.98]">
              <span className="w-12 h-12 rounded-full bg-[#fbbf24] text-[#6c4f00] text-[22px] font-extrabold flex items-center justify-center">{s.name[0]}</span>
              <span className="text-[18px] font-bold">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    ),
  )

  const manager = me.role === 'owner' || me.role === 'family'
  return shell(
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-extrabold leading-tight">Counter</h1>
          <p className="text-[14px] text-[#4f4633]">Billing: <b>{me.name}</b></p>
        </div>
        {(['bill', 'today', ...(manager ? ['team'] : [])] as const).map(v => (
          <button key={v} onClick={() => setView(v as any)} className={'h-11 px-4 rounded-full text-[14px] font-bold ' + (view === v ? 'bg-[#1c1c19] text-white' : 'bg-white shadow-sm')}>
            {v === 'bill' ? 'Bill' : v === 'today' ? 'Today' : 'Team'}
          </button>
        ))}
        <button onClick={lock} aria-label="Lock" className="h-11 w-11 rounded-full bg-white shadow-sm flex items-center justify-center"><span className="material-symbols-outlined text-[22px]">lock</span></button>
      </header>
      {view === 'bill' && <Billing onLocked={lock} />}
      {view === 'today' && <Today />}
      {view === 'team' && manager && <Team me={me} onChange={load} />}
    </div>,
  )
}

// ── First person (setting the counter up) ───────────────────────────────
function FirstPerson({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  async function save() {
    const r = await api('/api/counter/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, pin }) })
    if (r.ok) onDone(); else setErr(say(r.data.error))
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[24px] font-extrabold">Set up the counter</h1>
      <p className="text-[15px] text-[#4f4633]">Add yourself first. You can add family and helpers after that.</p>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="h-14 rounded-[18px] bg-white px-4 text-[18px] shadow-sm outline-none focus:ring-2 focus:ring-[#fbbf24]" />
      <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="Choose a 4-digit PIN" className="h-14 rounded-[18px] bg-white px-4 text-[18px] tracking-[0.3em] shadow-sm outline-none focus:ring-2 focus:ring-[#fbbf24]" />
      {err && <p className="text-[15px] font-bold text-[#c2410c]">{err}</p>}
      <BigButton onClick={save} disabled={name.trim().length < 2 || pin.length !== 4}><span className="text-[18px] font-extrabold">Save</span></BigButton>
    </div>
  )
}

// ── Billing ─────────────────────────────────────────────────────────────
function Billing({ onLocked }: { onLocked: () => void }) {
  const [tab, setTab] = useState<'set' | 'loose'>('set')
  const [schools, setSchools] = useState<{ name: string; classes: number[] }[]>([])
  const [school, setSchool] = useState<string | null>(null)
  const [cls, setCls] = useState<number | null>(null)
  const [setLinesData, setSetLinesData] = useState<SetLine[] | null>(null)
  const [ticked, setTicked] = useState<Record<string, { on: boolean; qty: number }>>({})
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartSet, setCartSet] = useState<{ school: string; cls: number } | null>(null)
  const [q, setQ] = useState('')
  const [loose, setLoose] = useState<Loose[]>([])
  const [other, setOther] = useState({ name: '', price: '' })
  const [sheet, setSheet] = useState(false)
  const [discount, setDiscount] = useState('')
  const [cust, setCust] = useState({ name: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<Done | null>(null)

  useEffect(() => { api<{ schools: typeof schools }>('/api/counter/sets').then(r => { if (r.ok) setSchools(r.data.schools); else if (r.data.error === 'locked') onLocked() }) }, [onLocked])
  useEffect(() => {
    if (!school || !cls) { setSetLinesData(null); return }
    api<{ lines: SetLine[] }>(`/api/counter/sets?school=${encodeURIComponent(school)}&class=${cls}`).then(r => {
      if (!r.ok) return
      setSetLinesData(r.data.lines)
      setTicked(Object.fromEntries(r.data.lines.map(l => [l.name, { on: !l.outOfPrint, qty: l.qty }])))
    })
  }, [school, cls])
  useEffect(() => {
    if (tab !== 'loose') return
    const t = setTimeout(() => api<{ items: Loose[] }>('/api/counter/items?q=' + encodeURIComponent(q)).then(r => setLoose(r.ok ? r.data.items : [])), 250)
    return () => clearTimeout(t)
  }, [q, tab])

  const setTotal = useMemo(() => (setLinesData || []).reduce((s, l) => s + (ticked[l.name]?.on ? l.unitPrice * (ticked[l.name]?.qty || 0) : 0), 0), [setLinesData, ticked])
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const disc = Math.min(cartTotal, Math.max(0, Number(discount) || 0))

  function addSet() {
    if (!setLinesData || !school || !cls) return
    if (cartSet && (cartSet.school !== school || cartSet.cls !== cls)) { setErr('One school set per bill. Finish this bill first.'); return }
    const lines: CartLine[] = setLinesData.filter(l => ticked[l.name]?.on && (ticked[l.name]?.qty || 0) > 0).map(l => ({ kind: 'set', name: l.name, qty: ticked[l.name].qty, unitPrice: l.unitPrice, group: l.group }))
    setCart(c => [...c.filter(x => x.kind !== 'set'), ...lines])
    setCartSet({ school, cls }); setErr('')
    setSchool(null); setCls(null)
  }
  function addLoose(i: Loose) {
    if (i.mrp == null) { setErr(say('need_price')); return }
    setCart(c => {
      const at = c.findIndex(x => x.kind === 'item' && x.itemId === i.id)
      if (at >= 0) return c.map((x, k) => (k === at ? { ...x, qty: x.qty + 1 } : x))
      return [...c, { kind: 'item', itemId: i.id, name: i.name, qty: 1, unitPrice: i.mrp! }]
    })
    setErr('')
  }
  function addOther() {
    const price = Number(other.price)
    if (!other.name.trim() || !(price > 0)) return
    setCart(c => [...c, { kind: 'custom', name: other.name.trim(), qty: 1, unitPrice: price }])
    setOther({ name: '', price: '' })
  }
  const bump = (i: number, d: number) => setCart(c => c.map((x, k) => (k === i ? { ...x, qty: Math.max(1, x.qty + d) } : x)))
  const drop = (i: number) => setCart(c => { const n = c.filter((_, k) => k !== i); if (!n.some(x => x.kind === 'set')) setCartSet(null); return n })

  async function pay(mode: 'cash' | 'upi') {
    setBusy(true); setErr('')
    const r = await api<{ sale: Done }>('/api/counter/sales', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payMode: mode, discount: disc, customerName: cust.name, customerPhone: cust.phone,
        school: cartSet?.school, className: cartSet?.cls,
        lines: cart.map(l => (l.kind === 'set' ? { kind: 'set', name: l.name, qty: l.qty } : l.kind === 'item' ? { kind: 'item', itemId: l.itemId, qty: l.qty } : { kind: 'custom', name: l.name, qty: l.qty, price: l.unitPrice })),
      }),
    })
    setBusy(false)
    if (r.ok) { setDone(r.data.sale); setSheet(false) }
    else if (r.data.error === 'locked') onLocked()
    else setErr(say(r.data.error))
  }
  function newBill() {
    setCart([]); setCartSet(null); setDiscount(''); setCust({ name: '', phone: '' }); setDone(null); setErr('')
  }

  // ── Bill done ──
  if (done) {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/invoice/${done.token}` : ''
    const wa = `https://wa.me/${cust.phone.replace(/\D/g, '').length === 10 ? '91' + cust.phone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(`Thank you for shopping at Bedi Book Store. Your bill (${rupees(done.total)}): ${link}`)}`
    return (
      <div className="flex flex-col gap-4">
        <Card className="text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[48px] text-[#166534]">check_circle</span>
          <p className="text-[22px] font-extrabold">Bill saved</p>
          <p className="text-[32px] font-extrabold">{rupees(done.total)}</p>
          <p className="text-[14px] text-[#4f4633]">Invoice no. {done.invoiceNo}</p>
        </Card>
        {done.lines.length > 0 && (
          <Card className="bg-[#fff1e6]">
            <p className="text-[16px] font-extrabold text-[#c2410c]">Hand over later (not in the shop now)</p>
            <ul className="mt-2 flex flex-col gap-1">{done.lines.map(l => <li key={l.name} className="text-[15px]">{l.name} × {l.pendingQty}</li>)}</ul>
          </Card>
        )}
        <div className="grid grid-cols-2 gap-3">
          <a href={link} target="_blank" rel="noreferrer" className="h-14 rounded-[18px] bg-white shadow-sm flex items-center justify-center gap-2 text-[15px] font-bold"><span className="material-symbols-outlined text-[22px]">receipt_long</span>Invoice</a>
          <a href={wa} target="_blank" rel="noreferrer" className="h-14 rounded-[18px] bg-[#25D366] text-white flex items-center justify-center gap-2 text-[15px] font-bold"><span className="material-symbols-outlined text-[22px]">send</span>WhatsApp</a>
        </div>
        <BigButton onClick={newBill}><span className="text-[18px] font-extrabold">New bill</span></BigButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-28">
      {busy && <Busy en="Saving the bill…" hi="" />}
      <div className="grid grid-cols-2 gap-2 bg-[#f0ede9] p-1 rounded-full">
        {(['set', 'loose'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={'h-11 rounded-full text-[15px] font-bold ' + (tab === t ? 'bg-white shadow-sm' : 'text-[#4f4633]')}>{t === 'set' ? 'School set' : 'Loose items'}</button>
        ))}
      </div>
      {err && <p className="text-[15px] font-bold text-[#c2410c] bg-[#ffedd5] rounded-2xl px-4 py-3">{err}</p>}

      {tab === 'set' && !school && (
        <div className="flex flex-col gap-3">
          <p className="text-[16px] font-bold">1. School</p>
          {schools.map(s => <button key={s.name} onClick={() => setSchool(s.name)} className="h-16 rounded-[20px] bg-white shadow-sm text-[17px] font-bold text-left px-5 active:scale-[0.99]">{s.name}</button>)}
        </div>
      )}
      {tab === 'set' && school && !cls && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setSchool(null)} className="self-start text-[14px] font-bold text-[#795900]">← {school}</button>
          <p className="text-[16px] font-bold">2. Class</p>
          <div className="grid grid-cols-4 gap-3">
            {schools.find(s => s.name === school)?.classes.map(c => <button key={c} onClick={() => setCls(c)} className="h-16 rounded-[20px] bg-white shadow-sm text-[24px] font-extrabold active:scale-95">{c}</button>)}
          </div>
        </div>
      )}
      {tab === 'set' && school && cls && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setCls(null)} className="self-start text-[14px] font-bold text-[#795900]">← {school} · Class {cls}</button>
          <p className="text-[16px] font-bold">3. Untick anything the customer already has</p>
          {!setLinesData && <p className="text-[15px] text-[#4f4633]">Loading…</p>}
          {['NCERT', 'Books', 'Notebooks', 'Stationery'].map(g => {
            const rows = (setLinesData || []).filter(l => l.group === g)
            if (rows.length === 0) return null
            return (
              <div key={g} className="flex flex-col gap-2">
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#817661] mt-1">{g}</p>
                {rows.map(l => {
                  const t = ticked[l.name] || { on: false, qty: l.qty }
                  const short = l.inStock != null && l.inStock < t.qty
                  return (
                    <div key={l.name} className={'rounded-[18px] p-3 flex items-center gap-3 ' + (t.on ? 'bg-white shadow-sm' : 'bg-[#f0ede9] opacity-70')}>
                      <button onClick={() => setTicked(x => ({ ...x, [l.name]: { ...t, on: !t.on } }))} className={'w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ' + (t.on ? 'bg-[#1c1c19] text-white' : 'bg-white border-2 border-[#d6cfc2]')} aria-label={t.on ? 'Remove' : 'Add'}>
                        {t.on && <span className="material-symbols-outlined text-[22px]">check</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold leading-snug">{l.name}</p>
                        <p className="text-[13px] text-[#4f4633]">{rupees(l.unitPrice)}{l.qty > 1 || g === 'Notebooks' ? ' each' : ''}{l.outOfPrint ? ' · not available' : ''}{short ? ` · only ${l.inStock} in shop` : l.inStock != null ? ` · ${l.inStock} in shop` : ''}</p>
                      </div>
                      {g === 'Notebooks' && t.on && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setTicked(x => ({ ...x, [l.name]: { ...t, qty: Math.max(1, t.qty - 1) } }))} className="w-9 h-9 rounded-full bg-[#f0ede9] text-[20px] font-bold">−</button>
                          <span className="w-7 text-center text-[17px] font-extrabold">{t.qty}</span>
                          <button onClick={() => setTicked(x => ({ ...x, [l.name]: { ...t, qty: t.qty + 1 } }))} className="w-9 h-9 rounded-full bg-[#f0ede9] text-[20px] font-bold">+</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {setLinesData && <BigButton onClick={addSet}><span className="text-[17px] font-extrabold">Add set to bill · {rupees(setTotal)}</span></BigButton>}
        </div>
      )}

      {tab === 'loose' && (
        <div className="flex flex-col gap-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the shop stock" className="h-14 rounded-[18px] bg-white px-4 text-[17px] shadow-sm outline-none focus:ring-2 focus:ring-[#fbbf24]" />
          {loose.map(i => (
            <button key={i.id} onClick={() => addLoose(i)} className="rounded-[18px] bg-white shadow-sm p-3 flex items-center gap-3 text-left active:scale-[0.99]">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold leading-snug">{i.name}</p>
                <p className="text-[13px] text-[#4f4633]">{i.mrp != null ? rupees(i.mrp) : 'No MRP'} · {i.qty} in shop</p>
              </div>
              <span className="w-10 h-10 rounded-full bg-[#fbbf24] text-[#6c4f00] flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[24px]">add</span></span>
            </button>
          ))}
          {q && loose.length === 0 && <p className="text-[15px] text-[#4f4633]">Not in the stock list. Add it below as another item.</p>}
          <Card className="flex flex-col gap-2">
            <p className="text-[15px] font-bold">Other item</p>
            <div className="flex gap-2">
              <input value={other.name} onChange={e => setOther(o => ({ ...o, name: e.target.value }))} placeholder="Item name" className="flex-1 min-w-0 h-12 rounded-[14px] bg-[#f6f3ee] px-3 text-[15px] outline-none" />
              <input value={other.price} onChange={e => setOther(o => ({ ...o, price: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="decimal" placeholder="₹" className="w-20 h-12 rounded-[14px] bg-[#f6f3ee] px-3 text-[15px] outline-none" />
              <button onClick={addOther} className="h-12 px-4 rounded-[14px] bg-[#1c1c19] text-white text-[15px] font-bold">Add</button>
            </div>
          </Card>
        </div>
      )}

      {/* Bill bar */}
      {cart.length > 0 && !sheet && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-[#fcf9f4]/95 backdrop-blur-md border-t border-[#efe9df] px-4 pt-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button onClick={() => setSheet(true)} className="max-w-2xl mx-auto w-full h-14 rounded-[18px] bg-[#fbbf24] text-[#6c4f00] flex items-center justify-between px-5 shadow-[0_6px_18px_rgba(251,191,36,0.4)]">
            <span className="text-[16px] font-bold">{cart.reduce((s, l) => s + l.qty, 0)} items</span>
            <span className="text-[18px] font-extrabold">Bill {rupees(cartTotal)} →</span>
          </button>
        </div>
      )}

      {/* Bill sheet */}
      {sheet && (
        <div className="fixed inset-0 z-40 bg-black/45 flex items-end justify-center" onClick={() => setSheet(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-[#fcf9f4] rounded-t-[28px] p-4 flex flex-col gap-3 max-h-[92vh] overflow-y-auto" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <div className="w-12 h-1.5 rounded-full bg-[#e5e2dd] mx-auto" />
            <p className="text-[20px] font-extrabold">Bill{cartSet ? ` · ${cartSet.school}, Class ${cartSet.cls}` : ''}</p>
            <div className="flex flex-col gap-2">
              {cart.map((l, i) => (
                <div key={i} className="bg-white rounded-[16px] p-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0"><p className="text-[14px] font-bold leading-snug">{l.name}</p><p className="text-[13px] text-[#4f4633]">{rupees(l.unitPrice)} × {l.qty}</p></div>
                  <button onClick={() => bump(i, -1)} className="w-9 h-9 rounded-full bg-[#f0ede9] text-[18px] font-bold">−</button>
                  <button onClick={() => bump(i, 1)} className="w-9 h-9 rounded-full bg-[#f0ede9] text-[18px] font-bold">+</button>
                  <span className="w-16 text-right text-[15px] font-extrabold">{rupees(l.unitPrice * l.qty)}</span>
                  <button onClick={() => drop(i)} aria-label="Remove" className="w-8 h-8 flex items-center justify-center text-[#c2410c]"><span className="material-symbols-outlined text-[20px]">close</span></button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input value={discount} onChange={e => setDiscount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="Discount ₹" className="h-12 rounded-[14px] bg-white px-3 text-[15px] outline-none" />
              <input value={cust.name} onChange={e => setCust(c => ({ ...c, name: e.target.value }))} placeholder="Customer (optional)" className="h-12 rounded-[14px] bg-white px-3 text-[15px] outline-none" />
              <input value={cust.phone} onChange={e => setCust(c => ({ ...c, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} inputMode="numeric" placeholder="Phone (optional)" className="h-12 rounded-[14px] bg-white px-3 text-[15px] outline-none" />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[16px] font-bold">Total</span>
              <span className="text-[28px] font-extrabold">{rupees(cartTotal - disc)}</span>
            </div>
            {err && <p className="text-[15px] font-bold text-[#c2410c]">{err}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => pay('cash')} disabled={busy} className="h-16 rounded-[20px] bg-[#1c1c19] text-white text-[18px] font-extrabold flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[24px]">payments</span>Cash</button>
              <button onClick={() => pay('upi')} disabled={busy} className="h-16 rounded-[20px] bg-[#fbbf24] text-[#6c4f00] text-[18px] font-extrabold flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[24px]">qr_code_2</span>UPI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Today ───────────────────────────────────────────────────────────────
function Today() {
  const [d, setD] = useState<any>(null)
  useEffect(() => { api('/api/counter/sales').then(r => setD(r.ok ? r.data : { sales: [], totals: { count: 0, cash: 0, upi: 0 } })) }, [])
  if (!d) return <p className="text-[15px] text-[#4f4633]">Loading…</p>
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {[{ k: 'Bills', v: String(d.totals.count) }, { k: 'Cash', v: rupees(d.totals.cash) }, { k: 'UPI', v: rupees(d.totals.upi) }].map(t => (
          <Card key={t.k} className="!p-4"><p className="text-[22px] font-extrabold">{t.v}</p><p className="text-[14px] font-bold text-[#4f4633]">{t.k}</p></Card>
        ))}
      </div>
      {d.sales.length === 0 && <p className="text-[15px] text-[#4f4633]">No bills yet today.</p>}
      {d.sales.map((s: any) => (
        <a key={s.id} href={'/invoice/' + s.token} target="_blank" rel="noreferrer" className="bg-white rounded-[18px] p-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-[15px] font-bold truncate">{s.customerName || (s.school ? `${s.school} · Class ${s.className}` : 'Counter bill')}</p>
            <p className="text-[13px] text-[#4f4633]">#{s.invoiceNo} · {new Date(s.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · {s.staff.name} · {s.payMode.toUpperCase()}</p>
          </div>
          <span className="text-[17px] font-extrabold shrink-0">{rupees(s.total)}</span>
        </a>
      ))}
    </div>
  )
}

// ── Team (owner/family): add helpers, reset PINs, remove ────────────────
function Team({ me, onChange }: { me: Staff; onChange: () => void }) {
  const [list, setList] = useState<Staff[]>([])
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [role, setRole] = useState<'helper' | 'family'>('helper')
  const [msg, setMsg] = useState('')
  const load = useCallback(() => api<{ staff: Staff[] }>('/api/counter/staff').then(r => { if (r.ok) setList(r.data.staff) }), [])
  useEffect(() => { load() }, [load])

  async function add() {
    const r = await api('/api/counter/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, pin, role }) })
    if (r.ok) { setName(''); setPin(''); setMsg('Added.'); load(); onChange() } else setMsg(say(r.data.error))
  }
  async function change(id: string, body: object, ok: string) {
    const r = await api('/api/counter/staff/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setMsg(r.ok ? ok : say(r.data.error)); load(); onChange()
  }

  return (
    <div className="flex flex-col gap-3">
      {msg && <p className="text-[15px] font-bold bg-[#dcfce7] text-[#166534] rounded-2xl px-4 py-3">{msg}</p>}
      {list.map(s => (
        <div key={s.id} className="bg-white rounded-[18px] p-3 flex items-center gap-3 shadow-sm">
          <span className="w-10 h-10 rounded-full bg-[#fbbf24] text-[#6c4f00] font-extrabold flex items-center justify-center">{s.name[0]}</span>
          <div className="flex-1 min-w-0"><p className="text-[16px] font-bold">{s.name}</p><p className="text-[13px] text-[#4f4633] capitalize">{s.role}</p></div>
          <button onClick={() => { const p = prompt(`New 4-digit PIN for ${s.name}`); if (p) change(s.id, { pin: p }, 'PIN changed.') }} className="h-10 px-3 rounded-full bg-[#f0ede9] text-[13px] font-bold">New PIN</button>
          {s.id !== me.id && s.role !== 'owner' && <button onClick={() => { if (confirm(`Remove ${s.name}? Their past bills stay.`)) change(s.id, { active: false }, 'Removed.') }} className="h-10 px-3 rounded-full text-[13px] font-bold text-[#c2410c]">Remove</button>}
        </div>
      ))}
      <Card className="flex flex-col gap-2">
        <p className="text-[16px] font-extrabold">Add a person</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="h-12 rounded-[14px] bg-[#f6f3ee] px-3 text-[16px] outline-none" />
        <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="4-digit PIN" className="h-12 rounded-[14px] bg-[#f6f3ee] px-3 text-[16px] tracking-[0.3em] outline-none" />
        <div className="grid grid-cols-2 gap-2">
          {(['helper', 'family'] as const).map(r => <button key={r} onClick={() => setRole(r)} className={'h-11 rounded-full text-[14px] font-bold ' + (role === r ? 'bg-[#1c1c19] text-white' : 'bg-[#f0ede9]')}>{r === 'helper' ? 'Helper (billing only)' : 'Family (full access)'}</button>)}
        </div>
        <BigButton onClick={add} disabled={name.trim().length < 2 || pin.length !== 4}><span className="text-[17px] font-extrabold">Add</span></BigButton>
      </Card>
    </div>
  )
}
