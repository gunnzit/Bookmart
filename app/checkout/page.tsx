'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

const SCHOOL = 'Shivalik Public School'
const ADMIN_WA = '919914735738'

const steps = ['Summary', 'Details', 'Delivery', 'Payment']

function CheckoutInner() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  const [step, setStep] = useState(0)
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
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
    const parsed = JSON.parse(raw)
    // Support both old single-object format and new array format
    setKits(Array.isArray(parsed) ? parsed : [parsed])
    if (user?.fullName) setName(user.fullName)
  }, [user])

  if (!kits || kits.length === 0) return null

  // Combine all kits
  const allItems = kits.flatMap((k: any) => k.items)
  const kitsSubtotal = kits.reduce((sum: number, k: any) => sum + k.kitSubtotal, 0)
  const isMultiKit = kits.length >= 2
  const siblingDiscount = isMultiKit ? Math.round(kitsSubtotal * 0.05) : 0
  const kitSubtotal = kitsSubtotal - siblingDiscount  // after sibling discount

  const deliveryFee = deliveryMode === 'delivery' ? 99 : 0
  const total = kitSubtotal + deliveryFee
  const upfront = Math.ceil(kitSubtotal * 0.3) + deliveryFee
  const payLater = kitSubtotal - Math.ceil(kitSubtotal * 0.3)
  const payNow = paymentMode === 'full' ? total : upfront
  const classLabel = kits.map((k: any) => k.selectedClass).join(', ')

  async function handleOrder() {
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
        name: 'BuddyBooks',
        description: 'School Kit — Class ' + classLabel + ' (' + SCHOOL + ')',
        image: '/logo.png',
        order_id: order.id,
        handler: async (response: any) => {
          await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              kitData: {
                school: SCHOOL, class: classLabel, items: allItems,
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
          const msg = '📦 NEW KIT ORDER\n' + (isMultiKit ? numKits + ' KITS — Classes ' + classLabel : 'Class ' + classLabel) + ' — ' + SCHOOL
            + '\nName: ' + name + '\nPhone: ' + phone
            + '\nDelivery: ' + deliveryMode + (deliveryMode === 'delivery' ? '\nAddress: ' + address : '')
            + (siblingDiscount > 0 ? '\nSibling discount: −₹' + siblingDiscount : '')
            + '\nPayment: ' + (paymentMode === 'full' ? 'Full ₹' + total : '30% upfront ₹' + upfront + ', ₹' + payLater + ' at delivery')
            + '\nItems:\n' + allItems.join('\n')
            + '\nPayment ID: ' + response.razorpay_payment_id
          window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(msg), '_blank')
          sessionStorage.removeItem('buddybooks_kit_order')
          setOrdered(true)
        },
        prefill: { name, email: user?.primaryEmailAddress?.emailAddress, contact: phone },
        theme: { color: '#00B86B' },
        modal: { ondismiss: () => setOrdering(false) },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch { alert('Something went wrong.') }
    setOrdering(false)
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FFF9F0; --white: #fff; --card: #fff; --border: #FFE2C2; --border-strong: #FFCB94;
      --text: #1A1330; --text-2: #6B6280; --text-3: #A89FC0;
      --green: #00B86B; --green-dark: #009957; --green-bg: #DFFFEF; --green-border: #9DEAC4;
      --shadow: 0 2px 14px rgba(124,92,252,0.08); --shadow-lg: 0 12px 40px rgba(124,92,252,0.16); --r: 18px;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #14101F; --white: #1C1730; --card: #221C3A; --border: #352C52; --border-strong: #463A6B; --text: #F3EEFF; --text-2: #B0A8CC; --text-3: #6E6590; --green-bg: #0A3A26; --green-border: #0F5538; --shadow: 0 2px 14px rgba(0,0,0,0.4); --shadow-lg: 0 12px 40px rgba(0,0,0,0.5); }
    }
    body { background: var(--bg); font-family: 'Poppins', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
    .k { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
    input, textarea { color: var(--text) !important; background: var(--bg) !important; border: 2px solid var(--border); border-radius: 10px; padding: 12px 14px; font-size: 14px; font-family: 'Poppins', sans-serif; width: 100%; outline: none; transition: border 0.15s; }
    input:focus, textarea:focus { border-color: var(--green) !important; box-shadow: 0 0 0 3px rgba(0,184,107,0.12); }
    .step-bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; transition: all 0.3s; }
    .step-line { flex: 1; height: 2px; border-radius: 99px; }
    .pay-card { width: 100%; border-radius: 14px; padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 14px; transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), border-color 0.15s, background 0.15s, box-shadow 0.15s; border: 2px solid var(--border); background: var(--card); text-align: left; font-family: 'Poppins', sans-serif; margin-bottom: 10px; }
    .pay-card:hover { transform: translateY(-3px); }
    .pay-card.active-full { border-color: #00B86B; background: #DFFFEF; box-shadow: 0 6px 20px rgba(0,184,107,0.18); }
    .pay-card.active-partial { border-color: #2D7FF9; background: #E3F0FF; box-shadow: 0 6px 20px rgba(45,127,249,0.18); }
    .delivery-btn { flex: 1; padding: 14px; border-radius: 14px; border: 2px solid var(--border); background: var(--card); color: var(--text-2); font-size: 14px; font-weight: 700; cursor: pointer; transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), border-color 0.15s, background 0.15s; font-family: 'Poppins', sans-serif; }
    .delivery-btn:hover { transform: translateY(-2px); }
    .delivery-btn:active { transform: scale(0.97); }
    .delivery-btn.active { border-color: var(--green); background: var(--green-bg); color: var(--green-dark); }
    .btn-3d { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; }
    .btn-3d:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 6px 0 var(--green-dark) !important; }
    .btn-3d:not(:disabled):active { transform: translateY(2px); box-shadow: 0 1px 0 var(--green-dark) !important; }
    @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
    .slide-in { animation: slideIn 0.25s ease both; }
    @keyframes pop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: none; } }
    .pop { animation: pop 0.3s ease both; }
  `

  if (ordered) return (
    <>
      <style>{css}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="pop" style={{ background: 'var(--card)', borderRadius: '24px', padding: '40px 32px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '2px solid #00B86B', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
          <h2 className="k" style={{ fontSize: '26px', color: '#00B86B', marginBottom: '8px' }}>Order Confirmed!</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '24px', fontWeight: '500' }}>
            Your Class {classLabel} kit is confirmed. We've opened WhatsApp to send the details to the store.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => router.push('/my-orders')} className="btn-3d" style={{ flex: 1, background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>
              Track order →
            </button>
            <button onClick={() => router.push('/school-sets')} style={{ flex: 1, background: 'var(--green-bg)', color: '#009957', border: '2px solid var(--green-border)', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
              Order another
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{css}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {/* Nav */}
      <nav style={{ background: 'var(--white)', borderBottom: '2px solid var(--border)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow)' }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : router.push('/school-sets')}
          style={{ background: 'none', border: '2px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="k" style={{ fontSize: '17px', color: 'var(--text)' }}>Checkout · Class {classLabel}</span>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)', fontWeight: '700' }}>🏫 {SCHOOL}</div>
      </nav>

      {/* Progress stepper */}
      <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--border)', padding: '14px 20px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div className="step-bar-item" style={{ flex: 'none' }}>
                <div className="step-dot" style={{
                  background: i <= step ? '#00B86B' : 'var(--border)',
                  color: i <= step ? '#fff' : 'var(--text-3)',
                  boxShadow: i === step ? '0 0 0 4px rgba(0,184,107,0.2)' : 'none',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '10px', fontWeight: i === step ? '800' : '500', color: i === step ? 'var(--green)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>{s}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="step-line" style={{ background: i < step ? '#00B86B' : 'var(--border)', margin: '0 6px', marginBottom: '16px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* STEP 0 — Summary */}
        {step === 0 && (
          <div className="slide-in">
            <h2 className="k" style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '16px' }}>Order Summary</h2>

            {/* Kit badge */}
            <div style={{ background: 'linear-gradient(135deg, #00B86B, #2D7FF9)', borderRadius: '18px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🎒</div>
              <div style={{ flex: 1 }}>
                <div className="k" style={{ fontSize: '18px', color: '#fff' }}>{isMultiKit ? kits.length + " Kits · Classes " + classLabel : "Class " + classLabel + " School Kit"}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '2px', fontWeight: '500' }}>{SCHOOL} · {allItems.length} items</div>
              </div>
              <div className="k" style={{ fontSize: '24px', color: '#fff' }}>₹{kitSubtotal.toLocaleString()}</div>
            </div>

            {/* Items list — grouped by kit */}
            <div style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '2px solid var(--border)', overflow: 'hidden', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '2px solid var(--border)', fontSize: '12px', fontWeight: '800', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isMultiKit ? 'Items in your kits' : 'Items in your kit'}
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {kits.map((kit: any, ki: number) => (
                  <div key={ki}>
                    {isMultiKit && (
                      <div style={{ padding: '8px 16px', background: 'var(--bg)', fontSize: '12px', fontWeight: '800', color: '#00B86B', borderBottom: '2px solid var(--border)' }}>
                        🎒 Class {kit.selectedClass} · ₹{kit.kitSubtotal.toLocaleString()}
                      </div>
                    )}
                    {kit.items.map((item: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--border)', gap: '8px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)', flex: 1, fontWeight: '500' }}>{item.split(' ₹')[0]}</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', flexShrink: 0 }}>₹{item.split(' ₹')[1]}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Price summary */}
            <div style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '2px solid var(--border)', padding: '16px', marginBottom: '20px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: '500' }}>{isMultiKit ? kits.length + ' kits subtotal' : 'Kit subtotal'}</span>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>₹{kitsSubtotal.toLocaleString()}</span>
              </div>
              {siblingDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#7C5CFC', fontWeight: '700' }}>🎉 Sibling discount (5%)</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#7C5CFC' }}>−₹{siblingDiscount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid var(--border)' }}>
                <span className="k" style={{ fontSize: '18px' }}>Total</span>
                <span className="k" style={{ fontSize: '24px', color: '#00B86B' }}>₹{kitSubtotal.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', fontWeight: '500' }}>+ delivery fee added at next step</div>
            </div>

            <button onClick={() => setStep(1)} className="btn-3d"
              style={{ width: '100%', background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>
              Continue → Add details
            </button>
          </div>
        )}

        {/* STEP 1 — Details */}
        {step === 1 && (
          <div className="slide-in">
            <h2 className="k" style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '6px' }}>Your details</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px', fontWeight: '500' }}>We'll use this to confirm your order and contact you.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Full name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>WhatsApp number *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '2px solid var(--border)', borderRadius: '10px', padding: '0 12px', fontSize: '13px', color: 'var(--text-3)', flexShrink: 0, gap: '4px', fontWeight: '600' }}>🇮🇳 +91</div>
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" style={{ border: `2px solid ${phone.length === 10 ? '#00B86B' : 'var(--border)'}` }} />
                </div>
                {phone.length > 0 && phone.length < 10 && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '4px', fontWeight: '600' }}>⚠️ Enter 10-digit number</div>}
              </div>
            </div>

            <button onClick={() => { if (!name.trim()) { alert('Please enter your name'); return } if (phone.length < 10) { alert('Please enter a valid WhatsApp number'); return } setStep(2) }} className="btn-3d"
              style={{ width: '100%', background: name && phone.length === 10 ? 'linear-gradient(135deg,#00B86B,#2D7FF9)' : '#ccc', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '800', cursor: name && phone.length === 10 ? 'pointer' : 'not-allowed', fontFamily: 'Poppins, sans-serif', boxShadow: name && phone.length === 10 ? '0 4px 0 #009957' : 'none' }}>
              Continue → Delivery
            </button>
          </div>
        )}

        {/* STEP 2 — Delivery */}
        {step === 2 && (
          <div className="slide-in">
            <h2 className="k" style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '6px' }}>Delivery option</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px', fontWeight: '500' }}>Choose how you want to receive your kit.</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button className={'delivery-btn' + (deliveryMode === 'pickup' ? ' active' : '')} onClick={() => setDeliveryMode('pickup')}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>🏪</div>
                <div style={{ fontSize: '14px', fontWeight: '800' }}>Pickup</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px', fontWeight: '500' }}>Free · Sec-40C store</div>
              </button>
              <button className={'delivery-btn' + (deliveryMode === 'delivery' ? ' active' : '')} onClick={() => setDeliveryMode('delivery')}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>🚚</div>
                <div style={{ fontSize: '14px', fontWeight: '800' }}>Home delivery</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px', fontWeight: '500' }}>+₹99 · Chandigarh tricity</div>
              </button>
            </div>

            {deliveryMode === 'pickup' && (
              <div style={{ background: '#DFFFEF', border: '2px solid #9DEAC4', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>📍</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#009957', marginBottom: '2px' }}>Bedi Book Store</div>
                  <div style={{ fontSize: '12px', color: '#065F46', lineHeight: 1.6, fontWeight: '500' }}>Booth No. 48, Sector-40C, Chandigarh<br />Mon–Sat · 9am–7pm</div>
                </div>
              </div>
            )}

            {deliveryMode === 'delivery' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Delivery address *</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House/flat no., street, sector, city…" rows={3} style={{ resize: 'none' }} />
              </div>
            )}

            {/* Order total preview */}
            <div style={{ background: 'var(--card)', borderRadius: '14px', border: '2px solid var(--border)', padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '500' }}>Kit ₹{kitSubtotal.toLocaleString()} {deliveryMode === 'delivery' ? '+ delivery ₹99' : '+ free pickup'}</div>
                <div className="k" style={{ fontSize: '20px', color: '#00B86B', marginTop: '2px' }}>Total ₹{total.toLocaleString()}</div>
              </div>
              <span style={{ fontSize: '20px' }}>{deliveryMode === 'pickup' ? '🏪' : '🚚'}</span>
            </div>

            <button onClick={() => { if (deliveryMode === 'delivery' && !address.trim()) { alert('Please enter delivery address'); return } setStep(3) }} className="btn-3d"
              style={{ width: '100%', background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>
              Continue → Payment
            </button>
          </div>
        )}

        {/* STEP 3 — Payment */}
        {step === 3 && (
          <div className="slide-in">
            <h2 className="k" style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '6px' }}>Choose payment</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px', fontWeight: '500' }}>Secure payment via Razorpay.</p>

            {/* Full payment */}
            <button className={'pay-card' + (paymentMode === 'full' ? ' active-full' : '')} onClick={() => setPaymentMode('full')}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: paymentMode === 'full' ? '#00B86B' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, transition: 'background 0.15s' }}>💳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: paymentMode === 'full' ? '#009957' : 'var(--text)', marginBottom: '3px' }}>Pay full amount</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '500' }}>Pay ₹{total.toLocaleString()} now. Kit assembled immediately.</div>
              </div>
              <div className="k" style={{ fontSize: '20px', color: paymentMode === 'full' ? '#00B86B' : 'var(--text-3)', flexShrink: 0 }}>₹{total.toLocaleString()}</div>
            </button>

            {/* 30% upfront */}
            <button className={'pay-card' + (paymentMode === 'partial' ? ' active-partial' : '')} onClick={() => setPaymentMode('partial')} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-8px', right: '12px', background: 'linear-gradient(135deg, #2D7FF9, #7C5CFC)', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '3px 10px', borderRadius: '99px' }}>POPULAR</div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: paymentMode === 'partial' ? '#2D7FF9' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, transition: 'background 0.15s' }}>🤝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: paymentMode === 'partial' ? '#2D7FF9' : 'var(--text)', marginBottom: '3px' }}>Pay 30% now</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, fontWeight: '500' }}>Pay ₹{upfront.toLocaleString()} now. ₹{payLater.toLocaleString()} at {deliveryMode === 'pickup' ? 'pickup' : 'delivery'}.</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div className="k" style={{ fontSize: '18px', color: paymentMode === 'partial' ? '#2D7FF9' : 'var(--text-3)' }}>₹{upfront.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: '500' }}>now</div>
              </div>
            </button>

            {/* Summary box */}
            <div style={{ background: paymentMode === 'full' ? '#DFFFEF' : '#E3F0FF', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', border: '2px solid ' + (paymentMode === 'full' ? '#9DEAC4' : '#BFDBFE') }}>
              <div style={{ fontSize: '12px', color: paymentMode === 'full' ? '#065F46' : '#1E40AF', lineHeight: 1.6, fontWeight: '500' }}>
                {paymentMode === 'full'
                  ? '✅ You pay ₹' + total.toLocaleString() + ' now. Kit assembled right away.'
                  : '🤝 Pay ₹' + upfront.toLocaleString() + ' now to confirm. Remaining ₹' + payLater.toLocaleString() + ' at ' + (deliveryMode === 'pickup' ? 'pickup' : 'delivery') + '.'}
              </div>
            </div>

            {/* Order recap */}
            <div style={{ background: 'var(--card)', borderRadius: '14px', border: '2px solid var(--border)', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8, fontWeight: '500' }}>
              <div>👤 {name} · 📱 +91 {phone}</div>
              <div>{deliveryMode === 'pickup' ? '🏪 Pickup — Sector-40C, Chandigarh' : '🚚 Delivery — ' + address}</div>
              <div>📦 Class {classLabel} · {allItems.length} items</div>
            </div>

            {isSignedIn ? (
              <button onClick={handleOrder} disabled={ordering}
                style={{ width: '100%', background: paymentMode === 'full' ? 'linear-gradient(135deg,#00B86B,#009957)' : 'linear-gradient(135deg,#2D7FF9,#1D4ED8)', color: '#fff', border: 'none', borderRadius: '14px', padding: '17px', fontSize: '16px', fontWeight: '800', cursor: ordering ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: paymentMode === 'full' ? '0 4px 0 #009957' : '0 4px 0 #1D4ED8', opacity: ordering ? 0.7 : 1 }}>
                {ordering ? 'Opening payment…' : paymentMode === 'full' ? '✅ Pay ₹' + total.toLocaleString() + ' & Confirm' : '🤝 Pay ₹' + upfront.toLocaleString() + ' to Book Kit'}
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-3d" style={{ width: '100%', background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '17px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>Sign in to pay →</button>
              </SignInButton>
            )}

            <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', marginTop: '10px', lineHeight: 1.5, fontWeight: '500' }}>
              Secure payment via Razorpay · Exchange within 10 days with bill
            </p>
          </div>
        )}

      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif', color: '#6B6280' }}>Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  )
}