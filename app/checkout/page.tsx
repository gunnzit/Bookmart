'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { DELIVERY_FEE } from '@/lib/kit-prices'
import { useDeliveryPlace, type Saved } from '@/components/LocationSheet'

const SCHOOL = 'Shivalik Public School'
const ADMIN_WA = '918872235738'
const LOOSE = 'Books and stationery'
const SHADOW = 'shadow-[0_6px_20px_rgba(28,28,25,0.08)]'
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Turn an item string ("Name ₹165", "Name [Buddy (196pg)] x2 ₹100") into something to show
function fullAddress(a: Saved) {
  return a.line1 + ', ' + a.area + (a.pin ? ' - ' + a.pin : '')
}

function parseItem(raw: string) {
  const cut = raw.lastIndexOf(' ₹')
  const base = cut > -1 ? raw.slice(0, cut) : raw
  const price = cut > -1 ? Number(raw.slice(cut + 2).replace(/,/g, '')) || 0 : 0
  const m = base.match(/^(.*?) \[([^\]]*)\](?: x(\d+))?$/)
  if (m) {
    const brand = m[2].split(' ')[0].toLowerCase()
    return { name: m[1], sub: m[2] + (m[3] ? ' · ' + m[3] + ' pieces' : ''), price, cover: '/covers/' + slug(m[1]) + '-' + brand + '.jpg', icon: 'edit_note' }
  }
  return { name: base, sub: '', price, cover: '/covers/' + slug(base) + '.jpg', icon: 'menu_book' }
}

// A real photo of the item, with a soft tile if the photo does not exist yet
function Thumb({ src, icon }: { src: string; icon: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'bad'>('loading')
  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    setState('loading')
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth > 0) setState('ok')
  }, [src])
  return (
    <div className="relative w-16 h-20 rounded-[1rem] overflow-hidden shrink-0 bg-[#f0ede9] flex items-center justify-center">
      {state !== 'bad' && (
        <img ref={imgRef} key={src} src={src} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: state === 'ok' ? 1 : 0, transition: 'opacity 250ms ease' }}
          onLoad={() => setState('ok')} onError={() => setState('bad')} />
      )}
      {state !== 'ok' && <span className="material-symbols-outlined text-[26px] text-[#795900]/50">{icon}</span>}
    </div>
  )
}

function CheckoutInner() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [touched, setTouched] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full')
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [place] = useDeliveryPlace()
  const [savedAddrs, setSavedAddrs] = useState<Saved[]>([])
  const [addrId, setAddrId] = useState<string | null>(null)

  // Kits passed via sessionStorage (array — supports multiple children)
  const [kits, setKits] = useState<any[] | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('buddybooks_kit_order')
    if (!raw) { router.push('/school-sets'); return }
    try {
      const parsed = JSON.parse(raw)
      // Support both old single-object format and new array format
      setKits(Array.isArray(parsed) ? parsed : [parsed])
    } catch {
      router.push('/school-sets')
      return
    }
    if (user?.fullName) setName(user.fullName)
  }, [user])

  // Saved addresses: fetched when signed in; the address picked in the delivery sheet is filled in first
  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/addresses', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !Array.isArray(d.addresses)) return
        setSavedAddrs(d.addresses)
        const pick = (place && place.kind === 'address' && d.addresses.find((a: Saved) => a.id === place.id)) || null
        if (pick) { setAddrId(pick.id); setAddress(fullAddress(pick)) }
      })
      .catch(() => {})
  }, [isSignedIn, place])

  if (!kits || kits.length === 0) return null

  const schoolOf = (k: any): string => k.school || SCHOOL
  const schoolLabel = Array.from(new Set(kits.map(schoolOf))).join(' + ')

  // Combine all kits
  const allItems: string[] = kits.flatMap((k: any) => k.items)
  const kitsSubtotal = kits.reduce((sum: number, k: any) => sum + k.kitSubtotal, 0)
  const hasLoose = kits.some((k: any) => k.loose || k.school === LOOSE)
  // Sibling discount: 2+ school kits and no loose books in the bag
  const isMultiKit = kits.length >= 2 && !hasLoose
  const siblingDiscount = isMultiKit ? Math.round(kitsSubtotal * 0.05) : 0
  const kitSubtotal = kitsSubtotal - siblingDiscount // after sibling discount

  const deliveryFee = deliveryMode === 'delivery' ? DELIVERY_FEE : 0
  const total = kitSubtotal + deliveryFee
  const upfront = Math.ceil(kitSubtotal * 0.3) + deliveryFee
  const payLater = kitSubtotal - Math.ceil(kitSubtotal * 0.3)
  const payNow = paymentMode === 'full' ? total : upfront
  const isLoose = kits.length === 1 && hasLoose
  const classLabel = kits.map((k: any) => (k.loose || k.school === LOOSE) ? 'Books' : k.selectedClass).join(', ')
  const orderWord = isLoose ? 'Books and stationery order' : hasLoose ? 'order' : 'Class ' + classLabel + ' kit'
  const backPath = isLoose ? '/books' : '/school-sets?bag=1'
  const handoverWord = deliveryMode === 'pickup' ? 'pickup' : 'delivery'

  // Form checks
  const nameOk = name.trim().length > 0
  const phoneOk = phone.length === 10
  const addressOk = deliveryMode === 'pickup' || address.trim().length > 0
  const formOk = nameOk && phoneOk && addressOk

  function startPayment() {
    if (!formOk) {
      setTouched(true)
      document.getElementById('details-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    handleOrder()
  }

  async function handleOrder() {
    if (!(window as any).Razorpay) {
      alert('Payment is still loading. Please try again in a moment.')
      return
    }
    setOrdering(true)
    const numKits = isMultiKit ? kits!.length : 1
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payNow * 100,
          currency: 'INR',
          receipt: 'kit_class_' + classLabel.replace(/, /g, '_'),
          items: allItems,
          numKits,
          deliveryMode,
          paymentMode,
        }),
      })
      const order = await res.json()
      if (order.error) { alert('Payment error: ' + JSON.stringify(order.error)); setOrdering(false); return }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'wrap&read',
        description: isLoose || hasLoose ? 'wrap&read order' : 'School Kit — Class ' + classLabel + ' (' + schoolLabel + ')',
        image: '/pwa-icon/192?v=2',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                kitData: {
                  school: schoolLabel, class: classLabel, items: allItems,
                  kitSubtotal, deliveryFee, totalAmount: total,
                  siblingDiscount, numKits,
                  paidNow: payNow, payLater: paymentMode === 'full' ? 0 : payLater,
                  paymentMode, deliveryMode,
                  address: address || null,
                  buyerName: name, buyerEmail: user?.primaryEmailAddress?.emailAddress || '',
                  buyerPhone: phone, buyerClerkId: user?.id || '',
                }
              }),
            })
            const result = await verifyRes.json().catch(() => ({}))

            // Payment already succeeded at Razorpay. If verify did NOT confirm,
            // do not fake success — give the customer their Payment ID to follow up.
            if (!verifyRes.ok || !result.success) {
              alert(
                '⚠️ Your payment went through, but we could not auto-confirm the order.\n\n'
                + 'Please send this Payment ID to the store on WhatsApp and we will confirm it manually:\n'
                + response.razorpay_payment_id
                + (result?.error ? '\n\n(' + result.error + ')' : '')
              )
              setOrdering(false)
              return
            }

            // Verified + saved — now it's safe to notify the store and show success.
            const msg = (isLoose || hasLoose ? '📦 NEW ORDER' + (hasLoose && !isLoose ? ' (kits + books)\nClasses ' + classLabel + ' — ' + schoolLabel : '\nBooks & stationery') : '📦 NEW KIT ORDER\n' + (isMultiKit ? numKits + ' KITS — Classes ' + classLabel : 'Class ' + classLabel) + ' — ' + schoolLabel)
              + '\nName: ' + name + '\nPhone: ' + phone
              + '\nDelivery: ' + deliveryMode + (deliveryMode === 'delivery' ? '\nAddress: ' + address : '')
              + (siblingDiscount > 0 ? '\nSibling discount: −₹' + siblingDiscount : '')
              + '\nPayment: ' + (paymentMode === 'full' ? 'Full ₹' + total : '30% upfront ₹' + upfront + ', ₹' + payLater + ' at delivery')
              + '\nItems:\n' + allItems.join('\n')
              + '\nPayment ID: ' + response.razorpay_payment_id
            window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(msg), '_blank')
            sessionStorage.removeItem('buddybooks_kit_order')
            setOrdered(true)
          } catch {
            // Network/server unreachable AFTER payment — same customer-protective message.
            alert(
              '⚠️ Your payment went through, but we could not reach the server to confirm.\n\n'
              + 'Please send this Payment ID to the store and we will confirm manually:\n'
              + response.razorpay_payment_id
            )
            setOrdering(false)
          }
        },
        prefill: { name, email: user?.primaryEmailAddress?.emailAddress, contact: phone },
        theme: { color: '#795900' },
        modal: { ondismiss: () => setOrdering(false) },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch { alert('Something went wrong.') }
    setOrdering(false)
  }

  const inputBase = 'w-full px-4 py-3 rounded-2xl bg-[#f6f3ee] text-[14px] text-[#1c1c19] placeholder:text-[#817661] border focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#fbbf24]/20 '
  const inputOk = 'border-transparent focus:border-[#fbbf24]'
  const inputBad = 'border-[#ba1a1a]'

  const page = 'min-h-screen text-[#1c1c19] antialiased font-[\'Plus_Jakarta_Sans\',sans-serif]'
  const pageBg = { background: '#fcf9f4' }
  const iconBtn = 'w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#1c1c19] active:scale-95 transition-transform shrink-0'

  // ── Order confirmed screen ───────────────────────────────────────────────
  if (ordered) {
    return (
      <div className={page + ' flex items-center justify-center p-5'} style={pageBg}>
        <div className={'bg-white rounded-[2rem] p-7 max-w-sm w-full text-center ' + SHADOW}>
          <div className="w-14 h-14 rounded-full bg-[#2E8B57]/10 text-[#2E8B57] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h2 className="text-[20px] font-bold mb-2">Order confirmed</h2>
          <p className="text-[14px] text-[#4f4633] mb-6">
            Your {orderWord} is confirmed. We have opened WhatsApp to send the details to the store.
          </p>
          <button onClick={() => router.push('/my-orders')} className="w-full h-[52px] bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] rounded-full active:scale-[0.98] transition-transform">Track order</button>
          <button onClick={() => router.push(backPath)} className={'w-full h-11 mt-2.5 bg-white text-[14px] font-semibold rounded-full active:scale-[0.98] transition-transform ' + SHADOW}>Order another</button>
        </div>
      </div>
    )
  }

  // ── Pay button (used in the phone bar and the desktop card) ─────────────
  const payButton = isSignedIn ? (
    <button onClick={startPayment} disabled={ordering}
      className="w-full h-[52px] rounded-full bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(251,191,36,0.25)] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed">
      <span>{ordering ? 'Opening payment…' : 'Pay securely'}</span>
      {!ordering && <span className="material-symbols-outlined text-[20px]">lock</span>}
    </button>
  ) : (
    <SignInButton mode="modal">
      <button className="w-full h-[52px] rounded-full bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(251,191,36,0.25)] active:scale-[0.99] transition-transform">
        Sign in to pay
      </button>
    </SignInButton>
  )

  const itemCount = allItems.length
  const radio = (on: boolean) => on
    ? <span className="w-5 h-5 rounded-full bg-[#fbbf24] flex items-center justify-center shrink-0"><span className="w-2 h-2 rounded-full bg-white" /></span>
    : <span className="w-5 h-5 rounded-full bg-[#f0ede9] shrink-0" />

  return (
    <div className={page} style={pageBg}>

      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f4]/80 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-16 px-5 flex items-center justify-between gap-4 max-w-md mx-auto md:max-w-5xl">
          <button aria-label="Go back" onClick={() => router.push(backPath)} className={iconBtn}>
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="text-[20px] font-bold text-center flex-1 truncate">Checkout</h1>
          <a aria-label="Chat with the store on WhatsApp" href={'https://wa.me/' + ADMIN_WA} target="_blank" rel="noopener noreferrer" className={iconBtn}>
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </a>
        </div>
      </header>

      <main className="w-full max-w-md md:max-w-5xl mx-auto px-5 pb-[170px] lg:pb-16" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

          {/* LEFT: delivery, details, items, payment */}
          <div className="lg:col-span-7">

            {/* Delivery mode */}
            <section className="mb-7">
              <div role="radiogroup" aria-label="Delivery option" className={'bg-white rounded-[2rem] p-1 flex gap-1 ' + SHADOW}>
                {([
                  { k: 'delivery', title: 'Home delivery', sub: '₹' + DELIVERY_FEE + ' · within 24 hours' },
                  { k: 'pickup', title: 'Store pickup', sub: 'Free · Sector 40-C' },
                ] as const).map(o => {
                  const on = deliveryMode === o.k
                  return (
                    <button key={o.k} role="radio" aria-checked={on} onClick={() => setDeliveryMode(o.k)}
                      className={'flex-1 rounded-[1rem] py-2 px-4 text-left active:scale-[0.99] transition-all ' + (on ? 'bg-[#ffdf9f]/60' : 'bg-transparent')}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={'w-2 h-2 rounded-full shrink-0 ' + (on ? 'bg-[#fbbf24]' : 'bg-[#e5e2dd]')} />
                        <span className={'text-[15px] font-semibold ' + (on ? 'text-[#1c1c19]' : 'text-[#4f4633]')}>{o.title}</span>
                      </div>
                      <p className={'text-[12px] ' + (on ? 'text-[#4f4633]' : 'text-[#817661]')}>{o.sub}</p>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Your details */}
            <section id="details-card" className="mb-7">
              <div className={'bg-white rounded-[2rem] p-5 flex flex-col gap-3 ' + SHADOW}>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#4f4633]">{deliveryMode === 'delivery' ? 'home_pin' : 'storefront'}</span>
                  <h2 className="text-[15px] font-semibold">{deliveryMode === 'delivery' ? 'Delivery details' : 'Pickup details'}</h2>
                </div>

                <div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" type="text" className={inputBase + (touched && !nameOk ? inputBad : inputOk)} />
                  {touched && !nameOk && <p className="text-[12px] text-[#ba1a1a] mt-1">Please enter your name.</p>}
                </div>

                <div>
                  <div className="flex gap-2">
                    <div className="flex items-center px-4 rounded-2xl bg-[#f6f3ee] text-[14px] font-medium text-[#4f4633] shrink-0">+91</div>
                    <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="WhatsApp number" type="text" inputMode="numeric" className={inputBase + (touched && !phoneOk ? inputBad : inputOk)} />
                  </div>
                  {((phone.length > 0 && phone.length < 10) || (touched && phone.length === 0)) && <p className="text-[12px] text-[#ba1a1a] mt-1">Enter a 10-digit number.</p>}
                </div>

                {deliveryMode === 'delivery' ? (
                  <div className="flex flex-col gap-2.5">
                    {savedAddrs.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {savedAddrs.map(a => {
                          const on = addrId === a.id
                          return (
                            <button key={a.id} onClick={() => { setAddrId(a.id); setAddress(fullAddress(a)) }}
                              className={'w-full rounded-[1rem] p-3 text-left flex items-center justify-between gap-3 active:scale-[0.99] transition-all ' + (on ? 'bg-[#ffdf9f]/60' : 'bg-[#f6f3ee]')}>
                              <div className="min-w-0">
                                <p className="text-[14px] font-semibold">{a.label}</p>
                                <p className="text-[12px] text-[#4f4633] leading-snug">{fullAddress(a)}</p>
                              </div>
                              {on
                                ? <span className="w-5 h-5 rounded-full bg-[#fbbf24] flex items-center justify-center shrink-0"><span className="w-2 h-2 rounded-full bg-white" /></span>
                                : <span className="w-5 h-5 rounded-full bg-[#f0ede9] shrink-0" />}
                            </button>
                          )
                        })}
                        <button onClick={() => { setAddrId(null); setAddress('') }} className="text-[13px] font-semibold text-[#795900] text-left px-1 active:opacity-70">Use a different address</button>
                      </div>
                    )}
                    <textarea value={address} onChange={e => { setAddress(e.target.value); setAddrId(null) }} placeholder="House or flat no., street, sector, city" rows={3} className={inputBase + 'resize-none ' + (touched && !addressOk ? inputBad : inputOk)} />
                    {touched && !addressOk && <p className="text-[12px] text-[#ba1a1a] mt-1">Please enter your delivery address.</p>}
                  </div>
                ) : (
                  <div className="bg-[#f6f3ee] rounded-[1rem] p-3">
                    <p className="text-[14px] font-semibold">Bedi Book Store</p>
                    <p className="text-[12px] text-[#4f4633] mt-0.5">Booth 48, Sector 40-C, Chandigarh · Mon to Sat, 9am to 7pm</p>
                  </div>
                )}
              </div>
            </section>

            {/* Items in bag */}
            <section className="mb-7">
              <div className={'bg-white rounded-[2rem] p-5 ' + SHADOW}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <h2 className="text-[20px] font-bold">Items in bag</h2>
                    <span className="text-[12px] text-[#817661]">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  </div>
                  <button onClick={() => router.push(backPath)} className="text-[12px] font-semibold text-[#795900] active:opacity-70">Edit</button>
                </div>

                {kits.map((kit: any, ki: number) => {
                  const loose = !!(kit.loose || kit.school === LOOSE)
                  const label = loose ? LOOSE : schoolOf(kit) + ' · Class ' + kit.selectedClass
                  // Same item listed several times becomes one row with a count
                  const rows: { raw: string; n: number }[] = []
                  kit.items.forEach((raw: string) => {
                    const f = rows.find(r => r.raw === raw)
                    if (f) f.n += 1
                    else rows.push({ raw, n: 1 })
                  })
                  return (
                    <div key={ki}>
                      <p className="text-[12px] text-[#4f4633] mt-2 mb-1">{label}</p>
                      {rows.map((r, i) => {
                        const it = parseItem(r.raw)
                        const sub = [it.sub, r.n > 1 ? 'Qty ' + r.n : ''].filter(Boolean).join(' · ')
                        return (
                          <div key={i}>
                            {i > 0 && <div className="h-px bg-[#e5e2dd]" />}
                            <div className="flex gap-4 py-3">
                              <Thumb src={it.cover} icon={it.icon} />
                              <div className="flex-1 min-w-0 flex justify-between items-start gap-1">
                                <div className="min-w-0">
                                  <h3 className="text-[15px] font-semibold leading-snug line-clamp-2">{it.name}</h3>
                                  {sub && <p className="text-[12px] text-[#4f4633] mt-0.5">{sub}</p>}
                                </div>
                                {it.price > 0 && <span className="text-[16px] font-bold shrink-0">₹{(it.price * r.n).toLocaleString('en-IN')}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {ki < kits.length - 1 && <div className="h-px bg-[#e5e2dd] my-1" />}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Payment option */}
            <section className="mb-7 lg:mb-0">
              <div className={'bg-white rounded-[2rem] p-5 flex flex-col gap-4 ' + SHADOW}>
                <div className="flex items-center justify-between">
                  <h2 className="text-[20px] font-bold">Payment</h2>
                  <span className="text-[12px] text-[#2E8B57] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified_user</span>Safe and secure
                  </span>
                </div>
                <div role="radiogroup" aria-label="Payment option" className="flex flex-col gap-2">
                  <button role="radio" aria-checked={paymentMode === 'full'} onClick={() => setPaymentMode('full')}
                    className={'w-full rounded-[1rem] p-4 text-left flex items-center justify-between gap-3 transition-all ' + (paymentMode === 'full' ? 'bg-[#f6f3ee]' : 'bg-white')}>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold">Pay full amount</p>
                      <p className={'text-[12px] ' + (paymentMode === 'full' ? 'text-[#4f4633]' : 'text-[#817661]')}>Nothing left to pay at {handoverWord}.</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[16px] font-bold">₹{total.toLocaleString('en-IN')}</span>
                      {radio(paymentMode === 'full')}
                    </div>
                  </button>
                  <button role="radio" aria-checked={paymentMode === 'partial'} onClick={() => setPaymentMode('partial')}
                    className={'w-full rounded-[1rem] p-4 text-left flex items-center justify-between gap-3 transition-all ' + (paymentMode === 'partial' ? 'bg-[#f6f3ee]' : 'bg-white')}>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold">Pay 30% now</p>
                      <p className={'text-[12px] ' + (paymentMode === 'partial' ? 'text-[#4f4633]' : 'text-[#817661]')}>₹{payLater.toLocaleString('en-IN')} to pay at {handoverWord}.</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[16px] font-bold">₹{upfront.toLocaleString('en-IN')}</span>
                      {radio(paymentMode === 'partial')}
                    </div>
                  </button>
                </div>
                <p className="text-[12px] text-[#817661]">UPI, cards and netbanking are on the next screen, through Razorpay.</p>
              </div>
            </section>
          </div>

          {/* RIGHT: bill, pay, notes */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start">
            <section className="mb-7">
              <div className={'bg-white rounded-[2rem] p-5 flex flex-col gap-2 ' + SHADOW}>
                <h2 className="text-[20px] font-bold mb-1">Bill details</h2>
                <div className="flex justify-between items-center text-[14px] text-[#4f4633]">
                  <span>{isLoose ? 'Items' : hasLoose ? 'Bag' : isMultiKit ? kits.length + ' kits' : 'Kit'} ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="text-[#1c1c19]">₹{kitsSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {siblingDiscount > 0 && (
                  <div className="flex justify-between items-center text-[14px] text-[#2E8B57]">
                    <span>Sibling discount (5%)</span>
                    <span>−₹{siblingDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[14px] text-[#4f4633]">
                  <span>{deliveryMode === 'delivery' ? 'Home delivery' : 'Store pickup'}</span>
                  {deliveryFee > 0
                    ? <span className="text-[#1c1c19]">₹{deliveryFee}</span>
                    : <span className="text-[#2E8B57] font-semibold">Free</span>}
                </div>
                <div className="h-px bg-[#e5e2dd] my-1" />
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <span className="text-[20px] font-bold">{paymentMode === 'full' ? 'To pay' : 'To pay now'}</span>
                    {siblingDiscount > 0 && <p className="text-[12px] font-semibold text-[#795900]">You saved ₹{siblingDiscount.toLocaleString('en-IN')} on this order</p>}
                    {paymentMode === 'partial' && <p className="text-[12px] text-[#4f4633]">₹{payLater.toLocaleString('en-IN')} at {handoverWord}</p>}
                  </div>
                  <span className="text-[28px] leading-[34px] font-bold tracking-[-0.02em]">₹{payNow.toLocaleString('en-IN')}</span>
                </div>

                {/* Desktop pay button */}
                <div className="hidden lg:block mt-3">{payButton}</div>
              </div>
            </section>

            <p className="text-[12px] text-[#817661] text-center px-2 mb-3">
              Once your order has been picked up or delivered, there is no cancellation or refund. Exchange is available within 24 hours.
            </p>
            <div className="flex items-center justify-center gap-1 text-center text-[#4f4633]">
              <span className="material-symbols-outlined text-[16px] text-[#817661]">storefront</span>
              <p className="text-[12px]">Fulfilled with care by <span className="font-semibold text-[#1c1c19]">Bedi Book Store</span>, Sec 40-C</p>
            </div>
          </aside>
        </div>
      </main>

      {/* Bottom pay bar (phone and tablet) */}
      <footer className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl shadow-[0_-6px_20px_rgba(28,28,25,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="px-5 py-4 flex flex-col gap-2 max-w-md mx-auto">
          <div className="flex items-center justify-between px-1">
            <span className="text-[14px] text-[#4f4633]">{paymentMode === 'full' ? 'Total payable' : 'Pay now (30%)'}</span>
            <span className="text-[16px] font-bold">₹{payNow.toLocaleString('en-IN')}</span>
          </div>
          {payButton}
        </div>
      </footer>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[14px] text-[#4f4633] font-['Plus_Jakarta_Sans',sans-serif]" style={{ background: '#fcf9f4' }}>Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  )
}