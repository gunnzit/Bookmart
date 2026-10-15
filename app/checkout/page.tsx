'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { DELIVERY_FEE } from '@/lib/kit-prices'

const SCHOOL = 'Shivalik Public School'
const ADMIN_WA = '919914735738'

function CheckoutInner() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  const [logoOk, setLogoOk] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [touched, setTouched] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full')
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

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

  if (!kits || kits.length === 0) return null

  const schoolOf = (k: any): string => k.school || SCHOOL
  const schoolLabel = Array.from(new Set(kits.map(schoolOf))).join(' + ')

  // Combine all kits
  const allItems: string[] = kits.flatMap((k: any) => k.items)
  const kitsSubtotal = kits.reduce((sum: number, k: any) => sum + k.kitSubtotal, 0)
  const isMultiKit = kits.length >= 2
  const siblingDiscount = isMultiKit ? Math.round(kitsSubtotal * 0.05) : 0
  const kitSubtotal = kitsSubtotal - siblingDiscount // after sibling discount

  const deliveryFee = deliveryMode === 'delivery' ? DELIVERY_FEE : 0
  const total = kitSubtotal + deliveryFee
  const upfront = Math.ceil(kitSubtotal * 0.3) + deliveryFee
  const payLater = kitSubtotal - Math.ceil(kitSubtotal * 0.3)
  const payNow = paymentMode === 'full' ? total : upfront
  const classLabel = kits.map((k: any) => k.selectedClass).join(', ')
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
    const numKits = kits!.length
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
        name: 'Pageplus',
        description: 'School Kit — Class ' + classLabel + ' (' + schoolLabel + ')',
        image: '/pageplus-logo.png',
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
            const msg = '📦 NEW KIT ORDER\n' + (isMultiKit ? numKits + ' KITS — Classes ' + classLabel : 'Class ' + classLabel) + ' — ' + schoolLabel
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
        theme: { color: '#C4501A' },
        modal: { ondismiss: () => setOrdering(false) },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch { alert('Something went wrong.') }
    setOrdering(false)
  }

  const inputBase = 'w-full px-4 py-3 rounded-xl bg-white font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-[#E8632B]/20 focus:border-[#E8632B] border '
  const inputOk = 'border-[#EADFCC]'
  const inputBad = 'border-error'

  // ── Order confirmed screen ───────────────────────────────────────────────
  if (ordered) {
    return (
      <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen flex items-center justify-center p-5">
        <div className="bg-surface-container-lowest rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_8px_20px_-4px_rgba(45,30,18,0.10)] border border-[#EADFCC]">
          <div className="w-16 h-16 rounded-full bg-[#2E8B57]/15 text-[#2E8B57] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">check_circle</span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Order Confirmed!</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            Your Class {classLabel} kit is confirmed. We&apos;ve opened WhatsApp to send the details to the store.
          </p>
          <div className="flex gap-2.5">
            <button onClick={() => router.push('/my-orders')} className="flex-1 bg-primary-container text-on-primary font-label-lg text-label-lg font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-transform">Track order</button>
            <button onClick={() => router.push('/school-sets')} className="flex-1 bg-surface-container-low text-on-surface font-label-lg text-label-lg font-bold py-3.5 rounded-xl border border-[#EADFCC] active:scale-[0.98] transition-transform">Order another</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Pay button (used in the phone bar and the desktop card) ─────────────
  const payButton = isSignedIn ? (
    <button onClick={startPayment} disabled={ordering}
      className="flex-1 min-h-[48px] px-space-lg rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-space-xs disabled:opacity-60 disabled:cursor-not-allowed w-full">
      <span>{ordering ? 'Opening payment…' : 'Pay Securely'}</span>
      {!ordering && <span className="material-symbols-outlined text-[20px]">lock</span>}
    </button>
  ) : (
    <SignInButton mode="modal">
      <button className="flex-1 min-h-[48px] px-space-lg rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-space-xs w-full">
        <span>Sign in to pay</span>
        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
      </button>
    </SignInButton>
  )

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)]">
        <div className="h-16 px-margin md:px-margin-desktop flex items-center justify-between max-w-md mx-auto md:max-w-[1100px]">
          <div className="flex items-center gap-space-sm">
            <button aria-label="Go back" onClick={() => router.push('/school-sets')} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="font-headline-sm text-headline-sm text-on-surface">Checkout</h1>
              <span className="font-label-micro text-label-micro text-tertiary uppercase tracking-wider">Secure Checkout</span>
            </div>
          </div>
          {logoOk ? (
            <img alt="Pageplus" className="h-9 w-auto object-contain cursor-pointer" src="/pageplus-logo.png" onError={() => setLogoOk(false)} onClick={() => router.push('/')} />
          ) : (
            <span className="font-headline-md text-headline-md text-on-surface cursor-pointer" onClick={() => router.push('/')}>Page<span className="text-secondary-container">plus</span></span>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-[1100px] pt-16 pb-32 lg:pb-12 px-margin md:px-margin-desktop">
        <div className="pt-space-sm lg:pt-6 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">

          {/* LEFT: delivery, details, kits, payment */}
          <div className="lg:col-span-7">

            {/* Delivery mode */}
            <section className="mb-space-md">
              <div className="bg-surface-container p-space-xs rounded-xl flex flex-col gap-space-xs shadow-sm">
                <div className="grid grid-cols-2 gap-space-xs">
                  <button onClick={() => setDeliveryMode('pickup')} className={'flex flex-col items-start p-space-sm rounded-lg text-left transition-all ' + (deliveryMode === 'pickup' ? 'bg-surface-container-lowest shadow-sm' : 'hover:bg-surface-container-low')}>
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={'flex items-center gap-1 font-label-md text-label-md font-semibold ' + (deliveryMode === 'pickup' ? 'text-primary' : 'text-tertiary')}>
                        <span className="material-symbols-outlined text-[18px]">storefront</span>
                        Store Pickup
                      </span>
                      <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold uppercase">Free</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">Sector 40-C store</span>
                  </button>
                  <button onClick={() => setDeliveryMode('delivery')} className={'flex flex-col items-start p-space-sm rounded-lg text-left transition-all ' + (deliveryMode === 'delivery' ? 'bg-surface-container-lowest shadow-sm' : 'hover:bg-surface-container-low')}>
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={'flex items-center gap-1 font-label-md text-label-md font-semibold ' + (deliveryMode === 'delivery' ? 'text-primary' : 'text-tertiary')}>
                        <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                        Home Delivery
                      </span>
                      <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold uppercase">₹{DELIVERY_FEE}</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">Within 24 hours • Tricity</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-primary-fixed/60 px-space-sm py-1.5 rounded-lg text-on-primary-fixed">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[17px] text-primary shrink-0">{deliveryMode === 'delivery' ? 'schedule' : 'store'}</span>
                    <span className="font-label-md text-label-md font-semibold truncate">
                      {deliveryMode === 'delivery' ? 'Delivered within 24 hours' : 'Collect from Booth 48, Sector 40-C'}
                    </span>
                  </div>
                  <span className="font-label-micro text-label-micro uppercase tracking-wider text-primary font-bold shrink-0 pl-2">
                    {deliveryMode === 'delivery' ? 'Tricity' : 'Mon–Sat 9–7'}
                  </span>
                </div>
              </div>
            </section>

            {/* Your details */}
            <section id="details-card" className="mb-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">Your details</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">We use these to confirm your order.</span>
                  </div>
                </div>

                <div>
                  <label className="font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5">Full name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" type="text" className={inputBase + (touched && !nameOk ? inputBad : inputOk)} />
                  {touched && !nameOk && <p className="font-body-sm text-body-sm text-error mt-1">Please enter your name.</p>}
                </div>

                <div>
                  <label className="font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5">WhatsApp number *</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-xl bg-surface-container-low border border-[#EADFCC] font-label-md text-label-md text-on-surface-variant shrink-0">+91</div>
                    <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" type="text" inputMode="numeric" className={inputBase + (phone.length === 10 ? 'border-[#2E8B57]' : (touched && !phoneOk ? inputBad : inputOk))} />
                  </div>
                  {((phone.length > 0 && phone.length < 10) || (touched && phone.length === 0)) && <p className="font-body-sm text-body-sm text-error mt-1">Enter a 10-digit number.</p>}
                </div>

                {deliveryMode === 'delivery' ? (
                  <div>
                    <label className="font-label-micro text-label-micro uppercase text-on-surface-variant block mb-1.5">Delivery address *</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House/flat no., street, sector, city…" rows={3} className={inputBase + 'resize-none ' + (touched && !addressOk ? inputBad : inputOk)} />
                    {touched && !addressOk && <p className="font-body-sm text-body-sm text-error mt-1">Please enter your delivery address.</p>}
                  </div>
                ) : (
                  <div className="flex items-start gap-space-sm bg-surface-container-low p-3 rounded-lg">
                    <span className="material-symbols-outlined text-[20px] text-primary mt-0.5 shrink-0">location_on</span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Bedi Book Store</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Booth No. 48, Sector-40C, Chandigarh • Mon–Sat, 9am–7pm</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Kits */}
            {kits.map((kit: any, ki: number) => (
              <section key={ki} className="mb-space-md">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">{schoolOf(kit)} · Class {kit.selectedClass}</span>
                      <span className="font-label-md text-label-md text-tertiary">{kit.items.length} items · ₹{kit.kitSubtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <button onClick={() => router.push('/school-sets')} className="font-label-md text-label-md text-primary font-semibold px-2 py-1 rounded-lg hover:bg-primary-fixed/40 transition-colors shrink-0">Edit</button>
                  </div>
                  <div className="flex flex-col max-h-72 overflow-y-auto">
                    {kit.items.map((item: string, i: number) => {
                      const cut = item.lastIndexOf(' ₹')
                      const itemName = cut > -1 ? item.slice(0, cut) : item
                      const itemPrice = cut > -1 ? item.slice(cut + 2) : ''
                      return (
                        <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-[#EADFCC]/70 last:border-0">
                          <span className="font-label-md text-label-md text-on-surface-variant flex-1 min-w-0">{itemName}</span>
                          {itemPrice && <span className="font-label-lg text-label-lg text-on-surface font-semibold shrink-0">₹{itemPrice}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            ))}

            {/* Payment option */}
            <section className="mb-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Payment Option</h2>
                  <span className="font-label-micro text-label-micro text-primary uppercase font-bold tracking-wider">Safe &amp; Secure</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <button onClick={() => setPaymentMode('full')} className={'w-full flex items-center justify-between gap-2 p-space-sm rounded-xl text-left transition-colors ' + (paymentMode === 'full' ? 'bg-surface-container-low' : 'hover:bg-surface-container-low')}>
                    <div className="flex items-center gap-space-sm min-w-0">
                      <span className={'w-5 h-5 rounded-full flex items-center justify-center shrink-0 ' + (paymentMode === 'full' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest')}>
                        {paymentMode === 'full' && <span className="material-symbols-outlined text-[14px]">done</span>}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold">Pay full amount</span>
                        <span className="font-body-sm text-body-sm text-tertiary">Nothing left to pay at {handoverWord}.</span>
                      </div>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold shrink-0">₹{total.toLocaleString('en-IN')}</span>
                  </button>

                  <button onClick={() => setPaymentMode('partial')} className={'w-full flex items-center justify-between gap-2 p-space-sm rounded-xl text-left transition-colors ' + (paymentMode === 'partial' ? 'bg-surface-container-low' : 'hover:bg-surface-container-low')}>
                    <div className="flex items-center gap-space-sm min-w-0">
                      <span className={'w-5 h-5 rounded-full flex items-center justify-center shrink-0 ' + (paymentMode === 'partial' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest')}>
                        {paymentMode === 'partial' && <span className="material-symbols-outlined text-[14px]">done</span>}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold">Pay 30% now</span>
                          <span className="bg-primary-fixed text-primary font-label-micro text-label-micro px-1.5 py-0.5 rounded-full font-bold">Popular</span>
                        </div>
                        <span className="font-body-sm text-body-sm text-tertiary">₹{payLater.toLocaleString('en-IN')} to pay at {handoverWord}.</span>
                      </div>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold shrink-0">₹{upfront.toLocaleString('en-IN')}</span>
                  </button>
                </div>
                <div className="flex items-start gap-2 bg-surface-container-low p-2.5 rounded-lg">
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0">lock</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Secure payment via Razorpay. UPI, cards and netbanking are available on the payment screen.</span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: price details, trust, policy, store */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start">
            <section className="mb-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">Price Details</h3>
                <div className="flex items-center justify-between py-1">
                  <span className="font-body-md text-body-md text-on-surface-variant">{isMultiKit ? kits.length + ' kits' : 'Kit'} ({allItems.length} items)</span>
                  <span className="font-body-md text-body-md text-on-surface">₹{kitsSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {siblingDiscount > 0 && (
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body-md text-body-md text-on-surface-variant">Sibling discount (5%)</span>
                    <span className="font-body-md text-body-md text-[#2E8B57] font-medium">−₹{siblingDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-1">
                  <span className="font-body-md text-body-md text-on-surface-variant">{deliveryMode === 'delivery' ? 'Home delivery' : 'Store pickup'}</span>
                  {deliveryFee > 0
                    ? <span className="font-body-md text-body-md text-on-surface">₹{deliveryFee}</span>
                    : <span className="font-label-md text-label-md text-primary font-bold">FREE</span>}
                </div>
                <div className="my-1.5 h-px bg-surface-container" />
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">Total</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">₹{total.toLocaleString('en-IN')}</span>
                </div>
                {paymentMode === 'partial' && (
                  <div className="mt-1 bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Pay now (30%)</span>
                      <span className="font-label-lg text-label-lg text-primary font-bold">₹{upfront.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Pay at {handoverWord}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">₹{payLater.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Desktop pay button */}
                <div className="hidden lg:flex mt-3">{payButton}</div>
              </div>
            </section>

            {/* Trust strip */}
            <section className="mb-space-md">
              <div className="grid grid-cols-3 gap-space-xs text-center">
                <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[20px] text-primary">verified</span>
                  <span className="font-label-micro text-label-micro text-on-surface leading-tight font-semibold">100% Correct Syllabus</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[20px] text-primary">published_with_changes</span>
                  <span className="font-label-micro text-label-micro text-on-surface leading-tight font-semibold">24h Exchange</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[20px] text-primary">support_agent</span>
                  <span className="font-label-micro text-label-micro text-on-surface leading-tight font-semibold">WhatsApp Support</span>
                </div>
              </div>
            </section>

            {/* Policy note */}
            <section className="mb-space-md">
              <div className="bg-surface-container-low p-3 rounded-xl flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-tertiary shrink-0 mt-0.5">info</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                  Once your kit has been picked up or delivered, there is no cancellation or refund. After that, exchange is available within 24 hours.
                </p>
              </div>
            </section>

            {/* Store card */}
            <section>
              <div className="bg-surface-container-lowest p-space-sm rounded-xl flex items-center justify-between gap-space-sm shadow-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[24px]">menu_book</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Bedi Book Store, Sec 40-C</span>
                    <span className="font-body-sm text-body-sm text-tertiary">Serving Chandigarh since 1994</span>
                  </div>
                </div>
                <a aria-label="Chat with the store on WhatsApp" className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shrink-0" href={'https://wa.me/' + ADMIN_WA} target="_blank" rel="noopener noreferrer">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* Bottom pay bar (phone and tablet) */}
      <aside className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-8px_24px_rgba(45,30,18,0.08)]">
        <div className="max-w-md mx-auto px-margin py-space-sm flex items-center justify-between gap-space-md">
          <div className="flex flex-col shrink-0">
            <span className="font-label-md text-label-md text-on-surface-variant">{paymentMode === 'full' ? 'Total Payable' : 'Pay Now (30%)'}</span>
            <span className="font-headline-md text-headline-md text-on-surface">₹{payNow.toLocaleString('en-IN')}</span>
          </div>
          {payButton}
        </div>
      </aside>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant font-body-md">Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  )
}