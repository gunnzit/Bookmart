'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'
import { useDeliveryPlace, type Saved } from '@/components/LocationSheet'
import { LOCATIONS, QUICK_SECTORS } from '@/lib/locations'

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'
const ADMIN_WA = '919914735738'
const conditions = ['New', 'Good', 'Fair']
const ADDR_LABELS = ['Home', 'Office', "Parents' Home", 'Other']
const ADDR_ICON: Record<string, string> = { Home: 'home', Office: 'business', "Parents' Home": 'family_restroom', Other: 'location_on' }
const MAX_ADDR = 3

const STATUS_NOTE: Record<string, string> = {
  pending: 'Waiting for approval',
  rejected: 'Not approved',
}

export default function ProfilePage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()

  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active')

  // Saved delivery addresses (kept in the account, up to 3)
  const [place, setPlace] = useDeliveryPlace()
  const [addresses, setAddresses] = useState<Saved[]>([])
  const [addrLoading, setAddrLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addErr, setAddErr] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [addForm, setAddForm] = useState({ label: 'Home', line1: '', area: '', pin: '' })

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mine = data.filter((l: any) => l.sellerId === user?.id)
          setListings(mine)
          if (mine.length > 0 && mine[0].seller?.phone) setPhone(mine[0].seller.phone)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isSignedIn, user])

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/addresses', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && Array.isArray(d.addresses)) setAddresses(d.addresses) })
      .catch(() => {})
      .finally(() => setAddrLoading(false))
  }, [isSignedIn])

  function openAdd() {
    setAddForm({ label: 'Home', line1: '', area: '', pin: '' })
    setAreaQuery('')
    setAddErr('')
    setAddOpen(true)
  }

  async function saveAddress() {
    setAddErr('')
    if (addForm.line1.trim().length < 5) { setAddErr('Enter your house or flat details.'); return }
    if (!LOCATIONS.includes(addForm.area)) { setAddErr('Pick your area from the list.'); return }
    if (addForm.pin && addForm.pin.length !== 6) { setAddErr('PIN code must be 6 digits.'); return }
    setAddSaving(true)
    try {
      const res = await fetch('/api/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setAddErr(d.error || 'Could not save. Please try again.'); setAddSaving(false); return }
      setAddresses(prev => [...prev, d.address])
      if (!place || place.kind !== 'address') setPlace({ kind: 'address', ...d.address })
      setAddOpen(false)
    } catch {
      setAddErr('Could not connect. Please try again.')
    }
    setAddSaving(false)
  }

  async function removeAddress(a: Saved) {
    if (!confirm('Delete this saved address?')) return
    await fetch('/api/addresses/' + a.id, { method: 'DELETE' }).catch(() => {})
    setAddresses(prev => prev.filter(x => x.id !== a.id))
    if (place && place.kind === 'address' && place.id === a.id) setPlace(null)
  }

  async function savePhone() {
    if (!phone.trim()) return
    setSavingPhone(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user?.id, phone: phone.trim() }),
    })
    setSavingPhone(false)
    setPhoneSaved(true)
    setTimeout(() => setPhoneSaved(false), 2000)
  }

  function startEdit(l: any) {
    setEditingId(l.id)
    setForm({ title: l.title, subtitle: l.subtitle || '', price: l.price, origPrice: l.origPrice || '', condition: l.condition, location: l.location })
  }

  async function handleSave(id: string) {
    setSaving(true)
    const body = {
      ...form,
      price: Number(form.price),
      origPrice: form.origPrice === '' || form.origPrice === null ? null : Number(form.origPrice),
    }
    const res = await fetch('/api/listings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const updated = await res.json().catch(() => ({}))
    if (res.ok) setListings(listings.map(l => l.id === id ? { ...l, ...updated } : l))
    else alert(updated?.error || 'Could not save. Please try again.')
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
  const totalEarnings = soldListings.reduce((sum, l) => sum + (l.price || 0), 0)
  const tabListings = activeTab === 'active' ? activeListings : soldListings

  const initials = ((user?.firstName?.charAt(0) || '') + (user?.lastName?.charAt(0) || '')).toUpperCase() || (user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() ?? 'P')
  const iconBtn = 'w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#5E5650] active:scale-95 transition-transform shrink-0 ' + SHADOW
  const sheetInput = 'w-full px-4 py-3 rounded-2xl bg-[#FFF1EA] text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] border border-transparent focus:outline-none focus:bg-white focus:border-[#E8632B] focus:ring-2 focus:ring-[#E8632B]/20'
  const smallPill = 'h-8 px-3.5 rounded-full text-[12px] font-semibold active:scale-95 transition-transform '

  const pageStyle = { background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }
  const pageCls = "min-h-screen text-[#1E1B19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"

  // ── Signed out ──────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className={pageCls + ' flex items-center justify-center p-5'} style={pageStyle}>
        <div className={'bg-white rounded-[28px] p-7 max-w-sm w-full text-center ' + SHADOW}>
          <h1 className="text-[20px] font-bold mb-1">Sign in to see your profile</h1>
          <p className="text-[14px] text-[#5E5650] mb-6">Your orders, listings and wishlist are kept here.</p>
          <SignInButton mode="modal">
            <button className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Sign in</button>
          </SignInButton>
          <button onClick={() => router.push('/')} className={'w-full h-11 mt-2.5 bg-white text-[14px] font-semibold rounded-full active:scale-[0.98] transition-transform ' + SHADOW}>Back to home</button>
        </div>
      </div>
    )
  }

  const menu = [
    { icon: 'receipt_long', title: 'My orders', sub: 'Track kits and book orders', href: '/my-orders' },
    { icon: 'favorite', title: 'Wishlist', sub: 'Books you saved', href: '/wishlist' },
    { icon: 'chat_bubble', title: 'Book requests', sub: 'Ask the shop for a title', href: '/requests' },
    { icon: 'sell', title: 'Sell a book', sub: 'List a used book or give it away', href: '/sell' },
  ]

  const editing = editingId ? listings.find(l => l.id === editingId) : null

  return (
    <div className={pageCls} style={pageStyle}>

      {/* Edit listing sheet */}
      {editing && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-t-[28px] md:rounded-[28px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_-10px_35px_rgba(30,27,25,0.2)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[#F0E2DA] mx-auto mb-4 md:hidden" />
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="text-[18px] font-bold">Edit listing</h3>
                <p className="text-[13px] text-[#9A908A] mt-0.5 truncate">{editing.title}</p>
              </div>
              <button aria-label="Close" onClick={() => setEditingId(null)} className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2.5 mb-4">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" type="text" className={sheetInput} />
              <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Short description" type="text" className={sheetInput} />
              <div className="grid grid-cols-2 gap-2.5">
                <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price (₹)" type="number" inputMode="numeric" className={sheetInput} />
                <input value={form.origPrice} onChange={e => setForm({ ...form, origPrice: e.target.value })} placeholder="Original price (₹)" type="number" inputMode="numeric" className={sheetInput} />
              </div>
              <div className="flex gap-2 pt-1">
                {conditions.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, condition: c })}
                    className={'flex-1 h-10 rounded-full text-[13px] active:scale-95 transition-transform ' + (form.condition === c ? 'bg-[#E8632B] text-white font-semibold' : 'bg-[#FFF1EA] text-[#1E1B19] font-medium')}>
                    {c}
                  </button>
                ))}
              </div>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location" type="text" className={sheetInput} />
            </div>
            <button onClick={() => handleSave(editing.id)} disabled={saving} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={() => setEditingId(null)} className="w-full h-11 mt-2.5 text-[14px] font-semibold text-[#5E5650] active:opacity-70">Cancel</button>
          </div>
        </div>
      )}

      {/* Add address sheet */}
      {addOpen && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-t-[28px] md:rounded-[28px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_-10px_35px_rgba(30,27,25,0.2)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[#F0E2DA] mx-auto mb-4 md:hidden" />
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[18px] font-bold">New address</h3>
                <p className="text-[13px] text-[#9A908A] mt-0.5">We deliver within the tricity</p>
              </div>
              <button aria-label="Close" onClick={() => setAddOpen(false)} className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {ADDR_LABELS.map(l => (
                <button key={l} onClick={() => setAddForm(f => ({ ...f, label: l }))}
                  className={'px-3.5 py-2 rounded-full text-[13px] active:scale-95 transition-transform ' + (addForm.label === l ? 'bg-[#E8632B] text-white font-semibold' : 'bg-[#FFF1EA] text-[#1E1B19] font-medium')}>{l}</button>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 mb-4">
              <input value={addForm.line1} onChange={e => setAddForm(f => ({ ...f, line1: e.target.value.slice(0, 120) }))} placeholder="House or flat, street" type="text" className={sheetInput} />

              {addForm.area ? (
                <div className="flex items-center justify-between bg-[#FFF1EA] rounded-2xl px-4 py-3">
                  <span className="text-[14px]">{addForm.area}</span>
                  <button onClick={() => setAddForm(f => ({ ...f, area: '' }))} className="text-[13px] font-semibold text-[#C4501A]">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <input value={areaQuery} onChange={e => setAreaQuery(e.target.value)} placeholder="Search your sector or area" type="text" className={sheetInput} />
                  {areaQuery.trim().length > 0 && (
                    <div className="absolute z-10 left-0 right-0 top-[52px] bg-white rounded-2xl shadow-[0_6px_20px_rgba(120,70,40,0.18)] overflow-hidden">
                      {LOCATIONS.filter(l => l.toLowerCase().includes(areaQuery.trim().toLowerCase())).slice(0, 6).map(m => (
                        <button key={m} onClick={() => { setAddForm(f => ({ ...f, area: m })); setAreaQuery('') }} className="w-full px-4 py-3 text-left text-[14px] border-b border-[#F0E2DA] last:border-0 active:bg-[#FFF1EA]">{m}</button>
                      ))}
                    </div>
                  )}
                  {areaQuery.trim().length === 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {QUICK_SECTORS.map(q => (
                        <button key={q} onClick={() => setAddForm(f => ({ ...f, area: q }))} className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-white shadow-[0_6px_20px_rgba(120,70,40,0.08)] active:scale-95 transition-transform">{q.split(',')[0]}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <input value={addForm.pin} onChange={e => setAddForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="PIN code (optional)" type="text" inputMode="numeric" className={sheetInput} />
              {addErr && <p className="text-[12px] text-[#D64545]">{addErr}</p>}
            </div>

            <button onClick={saveAddress} disabled={addSaving} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform disabled:opacity-60">
              {addSaving ? 'Saving…' : 'Save address'}
            </button>
            <button onClick={() => setAddOpen(false)} className="w-full h-11 mt-2.5 text-[14px] font-semibold text-[#5E5650] active:opacity-70">Cancel</button>
          </div>
        </div>
      )}

      <main className="w-full max-w-md md:max-w-2xl mx-auto px-5 pb-[130px] lg:pb-16" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>

        {/* Title row */}
        <header className="flex items-center justify-between mb-7 h-12">
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold tracking-tight">My profile</h1>
            <p className="text-[12px] text-[#5E5650] mt-0.5 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <a aria-label="Chat with the store on WhatsApp" href={'https://wa.me/' + ADMIN_WA} target="_blank" rel="noopener noreferrer" className={iconBtn}>
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </a>
        </header>

        {/* Identity card */}
        <section className={'bg-white rounded-[22px] p-[18px] mb-7 ' + SHADOW}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FFF1EA] flex items-center justify-center text-[20px] font-bold text-[#E8632B] shrink-0">{initials}</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold truncate">{user?.fullName || 'Your name'}</h2>
              <p className="text-[12px] text-[#5E5650] mt-0.5">{phone ? '+91 ' + phone : 'Add your WhatsApp number below'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 bg-[#FFF1EA]/60 rounded-[16px] p-2.5">
            {[
              { v: activeListings.length, l: 'Selling' },
              { v: soldListings.length, l: 'Sold' },
              { v: totalViews, l: 'Views' },
            ].map(s => (
              <div key={s.l} className="flex flex-col items-center py-1 text-center">
                <span className="text-[15px] font-bold">{s.v}</span>
                <span className="text-[12px] text-[#5E5650] mt-0.5">{s.l}</span>
              </div>
            ))}
          </div>
          {soldListings.length > 0 && (
            <p className="text-[12px] text-[#5E5650] mt-3 px-1">Sold items add up to <span className="font-semibold text-[#1E1B19]">₹{totalEarnings.toLocaleString('en-IN')}</span>.</p>
          )}
        </section>

        {/* WhatsApp number */}
        <section className={'bg-white rounded-[22px] p-[18px] mb-7 ' + SHADOW}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[15px] font-semibold">WhatsApp number</h3>
            {phone.length === 10 && <span className="text-[12px] text-[#2E8B57] flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span>Saved</span>}
          </div>
          <p className="text-[12px] text-[#5E5650] mb-3">Buyers contact you on this number.</p>
          <div className="flex gap-2">
            <div className="flex items-center px-4 rounded-2xl bg-[#FFF1EA] text-[14px] font-medium text-[#5E5650] shrink-0">+91</div>
            <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" type="text" inputMode="numeric" className={sheetInput} />
            <button onClick={savePhone} disabled={savingPhone || phone.length < 10}
              className={'shrink-0 h-[46px] px-4 rounded-full text-[14px] font-semibold bg-white active:scale-95 transition-transform disabled:opacity-50 ' + SHADOW + (phoneSaved ? ' text-[#2E8B57]' : ' text-[#C4501A]')}>
              {phoneSaved ? 'Saved' : savingPhone ? '…' : 'Save'}
            </button>
          </div>
          {phone.length > 0 && phone.length < 10 && <p className="text-[12px] text-[#D64545] mt-1.5">Enter a 10-digit number.</p>}
        </section>

        {/* Saved delivery addresses */}
        <section className="mb-7">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold">Saved addresses</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF1EA] text-[12px] font-medium">{addresses.length} of {MAX_ADDR}</span>
            </div>
            {addresses.length < MAX_ADDR && (
              <button onClick={openAdd} className="text-[12px] font-semibold text-[#C4501A] flex items-center gap-0.5 active:opacity-70">
                <span className="material-symbols-outlined text-[15px]">add</span>Add address
              </button>
            )}
          </div>

          {addrLoading ? (
            <div className="h-[84px] rounded-[22px] bg-white/70 animate-pulse" />
          ) : addresses.length === 0 ? (
            <div className={'bg-white rounded-[22px] p-5 text-center ' + SHADOW}>
              <p className="text-[14px] text-[#5E5650] mb-3">No saved addresses yet. Save one and checkout fills it in for you.</p>
              <button onClick={openAdd} className={'h-11 px-5 rounded-full bg-white text-[14px] font-semibold text-[#C4501A] active:scale-95 transition-transform ' + SHADOW}>Add an address</button>
            </div>
          ) : (
            <div className={'bg-white rounded-[22px] p-2 ' + SHADOW}>
              {addresses.map(a => {
                const on = place?.kind === 'address' && place.id === a.id
                return (
                  <div key={a.id} className="flex items-center gap-4 p-3 rounded-[16px]">
                    <div className="w-10 h-10 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{ADDR_ICON[a.label] || 'location_on'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-semibold">{a.label}</p>
                        {on && <span className="text-[12px] text-[#2E8B57] flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px]">check_circle</span>Delivering here</span>}
                      </div>
                      <p className="text-[12px] text-[#5E5650] leading-snug">{a.line1}, {a.area}{a.pin ? ' - ' + a.pin : ''}</p>
                      {!on && (
                        <button onClick={() => setPlace({ kind: 'address', ...a })} className="text-[12px] font-semibold text-[#C4501A] mt-1 active:opacity-70">Deliver here</button>
                      )}
                    </div>
                    <button aria-label="Delete this address" onClick={() => removeAddress(a)} className="w-9 h-9 rounded-full flex items-center justify-center text-[#9A908A] shrink-0 active:scale-90 transition-transform">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* My book listings */}
        <section className="mb-7">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold">My book listings</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF1EA] text-[12px] font-medium">{activeListings.length} live</span>
            </div>
            <button onClick={() => router.push('/sell')} className="text-[12px] font-semibold text-[#C4501A] flex items-center gap-0.5 active:opacity-70">
              <span className="material-symbols-outlined text-[15px]">add</span>Sell another
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            {(['active', 'sold'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={'px-4 py-2 rounded-full text-[13px] active:scale-95 transition-transform ' + (activeTab === tab ? 'bg-[#E8632B] text-white font-semibold shadow-[0_4px_14px_rgba(232,99,43,0.3)]' : 'bg-white text-[#1E1B19] font-medium ' + SHADOW)}>
                {tab === 'active' ? 'Active (' + activeListings.length + ')' : 'Sold (' + soldListings.length + ')'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1].map(i => <div key={i} className="h-[132px] rounded-[22px] bg-white/70 animate-pulse" />)}
            </div>
          ) : tabListings.length === 0 ? (
            <div className={'bg-white rounded-[22px] p-6 text-center ' + SHADOW}>
              <p className="text-[15px] font-semibold">{activeTab === 'active' ? 'No active listings' : 'Nothing sold yet'}</p>
              <p className="text-[13px] text-[#5E5650] mt-1 mb-4">{activeTab === 'active' ? 'Post your first book and it shows up here.' : 'Mark a book as sold when it is gone.'}</p>
              {activeTab === 'active' && (
                <button onClick={() => router.push('/sell')} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Sell a book</button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tabListings.map(l => {
                const note = l.status && l.status !== 'active' ? STATUS_NOTE[l.status] : ''
                return (
                  <article key={l.id} className={'bg-white rounded-[22px] p-[18px] ' + SHADOW}>
                    <div className="flex items-start gap-4 cursor-pointer" onClick={() => router.push('/listing/' + l.id)}>
                      <div className="relative w-16 h-20 rounded-[18px] overflow-hidden bg-[#FFF1EA] shrink-0 flex items-center justify-center">
                        {l.images?.[0]
                          ? <img src={l.images[0]} alt="" className={'w-full h-full object-cover ' + (l.sold ? 'opacity-60 grayscale-[25%]' : '')} />
                          : <span className="material-symbols-outlined text-[28px] text-[#C4501A]/50">menu_book</span>}
                        {l.sold && <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#1E1B19] bg-white/40">Sold</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={'text-[15px] font-semibold leading-snug line-clamp-2 ' + (l.sold ? 'text-[#9A908A]' : '')}>{l.title}</h4>
                          <span className="text-[16px] font-bold shrink-0">{l.price === 0 ? 'Free' : '₹' + (l.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-[12px] text-[#5E5650] mt-0.5">{[l.condition, l.location].filter(Boolean).join(' · ')}</p>
                        {note ? (
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-2 h-2 rounded-full inline-block bg-[#F5B82E]" />
                            <span className="text-[12px] font-medium">{note}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 mt-2 text-[12px] font-medium">
                            <span className="flex items-center gap-1" title="Views"><span className="material-symbols-outlined text-[15px] text-[#E8632B]">visibility</span>{l.views || 0}{l.views === 1 ? ' view' : ' views'}</span>
                            <span className="flex items-center gap-1" title="Chats"><span className="material-symbols-outlined text-[15px] text-[#E8632B]">forum</span>{l.stats?.chats || 0}{l.stats?.chats === 1 ? ' chat' : ' chats'}</span>
                            <span className="flex items-center gap-1" title="Saves"><span className="material-symbols-outlined text-[15px] text-[#E8632B]">favorite</span>{l.stats?.saves || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3.5 flex items-center gap-2">
                      <button onClick={() => toggleSold(l.id, l.sold)} className={smallPill + 'bg-[#FFF1EA] text-[#1E1B19]'}>{l.sold ? 'Relist' : 'Mark sold'}</button>
                      <button onClick={() => startEdit(l)} className={smallPill + 'bg-[#FFF1EA] text-[#1E1B19]'}>Edit</button>
                      <button onClick={() => handleDelete(l.id)} className={smallPill + 'ml-auto text-[#D64545] bg-transparent'}>Delete</button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Store */}
        <section className="mb-7">
          <div className={'bg-white rounded-[22px] p-[18px] flex items-center gap-4 ' + SHADOW}>
            <div className="min-w-0 flex-1">
              <h4 className="text-[15px] font-bold truncate">Bedi Book Store</h4>
              <p className="text-[12px] text-[#5E5650] mt-0.5">Booth 48, Sector 40-C, Chandigarh</p>
            </div>
            <a aria-label="Chat with the store on WhatsApp" href={'https://wa.me/' + ADMIN_WA} target="_blank" rel="noopener noreferrer" className={'w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#25D366] shrink-0 active:scale-95 transition-transform ' + SHADOW}>
              <span className="material-symbols-outlined text-[22px]">chat</span>
            </a>
          </div>
        </section>

        {/* Menu */}
        <section className={'bg-white rounded-[22px] p-2 mb-7 ' + SHADOW}>
          {menu.map(m => (
            <a key={m.href} href={m.href} className="flex items-center gap-4 p-3 rounded-[16px] hover:bg-[#FFF1EA]/60 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold">{m.title}</p>
                <p className="text-[12px] text-[#5E5650] truncate">{m.sub}</p>
              </div>
              <span className="material-symbols-outlined text-[20px] text-[#9A908A]">chevron_right</span>
            </a>
          ))}
          <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full flex items-center gap-4 p-3 rounded-[16px] hover:bg-[#FFF1EA]/60 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0 text-[#9A908A]">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </div>
            <p className="flex-1 text-[14px] text-[#5E5650]">Log out</p>
          </button>
        </section>
      </main>
    </div>
  )
}