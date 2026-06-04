'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

const SCHOOL = 'Shivalik Public School'
const ADMIN_WA = '919914735738'

const steps = ['Summary', 'Details', 'Delivery', 'Payment']

export default function CheckoutPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { isSignedIn, user } = useUser()

  const [step, setStep] = useState(0)
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full')
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

  // Kit data passed via sessionStorage (set by school-sets page)
  const [kitData, setKitData] = useState<any>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('buddybooks_kit_order')
    if (!raw) { router.push('/school-sets'); return }
    setKitData(JSON.parse(raw))
    if (user?.fullName) setName(user.fullName)
  }, [user])

  if (!kitData) return null

  const { selectedClass, items, kitSubtotal } = kitData
  const deliveryFee = deliveryMode === 'delivery' ? 99 : 0
  const total = kitSubtotal + deliveryFee
  const upfront = Math.ceil(kitSubtotal * 0.3) + deliveryFee
  const payLater = kitSubtotal - Math.ceil(kitSubtotal * 0.3)
  const payNow = paymentMode === 'full' ? total : upfront

  async function handleOrder() {
    setOrdering(true)
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payNow * 100, currency: 'INR', receipt: 'kit_class_' + selectedClass }),
      })
      const order = await res.json()
      if (order.error) { alert('Payment error: ' + JSON.stringify(order.error)); setOrdering(false); return }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'BuddyBooks',
        description: 'School Kit — Class ' + selectedClass + ' (' + SCHOOL + ')',
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
                school: SCHOOL, class: selectedClass, items,
                kitSubtotal, deliveryFee, totalAmount: total,
                paidNow: payNow, payLater: paymentMode === 'full' ? 0 : payLater,
                paymentMode, deliveryMode,
                address: address || null,
                buyerName: name, buyerEmail: user?.primaryEmailAddress?.emailAddress || '',
                buyerPhone: phone, buyerClerkId: user?.id || '',
              }
            }),
          })
          const msg = '📦 NEW KIT ORDER\nClass ' + selectedClass + ' — ' + SCHOOL
            + '\nName: ' + name + '\nPhone: ' + phone
            + '\nDelivery: ' + deliveryMode + (deliveryMode === 'delivery' ? '\nAddress: ' + address : '')
            + '\nPayment: ' + (paymentMode === 'full' ? 'Full ₹' + total : '30% upfront ₹' + upfront + ', ₹' + payLater + ' at delivery')
            + '\nItems:\n' + items.join('\n')
            + '\nPayment ID: ' + response.razorpay_payment_id
          window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(msg), '_blank')
          sessionStorage.removeItem('buddybooks_kit_order')
          setOrdered(true)
        },
        prefill: { name, email: user?.primaryEmailAddress?.emailAddress, contact: phone },
        theme: { color: '#1D9E75' },
        modal: { ondismiss: () => setOrdering(false) },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch { alert('Something went wrong.') }
    setOrdering(false)
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #F7F6F3; --white: #fff; --card: #fff; --border: #E5E2DA;
      --text: #1B2A4A; --text-2: #666; --text-3: #999;
      --green: #1D9E75; --green-dark: #157A5A; --green-bg: #E8F7F2; --green-border: #C0E8D8;
      --shadow: 0 2px 12px rgba(27,42,74,0.07); --shadow-lg: 0 8px 32px rgba(27,42,74,0.12); --r: 16px;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0F1117; --white: #1A1D27; --card: #1E2130; --border: #2A2D3E; --text: #E8E6F0; --text-2: #A0A0B0; --text-3: #666880; --shadow: 0 2px 12px rgba(0,0,0,0.3); }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
    .k { font-family: 'Kalam', cursive; }
    input, textarea { color: var(--text) !important; background: var(--bg) !important; border: 1.5px solid var(--border); border-radius: 10px; padding: 11px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border 0.15s; }
    input:focus, textarea:focus { border-color: var(--green) !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1); }
    .step-bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; transition: all 0.3s; }
    .step-line { flex: 1; height: 2px; border-radius: 99px; }
    .pay-card { width: 100%; border-radius: 14px; padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.15s; border: 2px solid var(--border); background: var(--card); text-align: left; font-family: 'DM Sans', sans-serif; margin-bottom: 10px; }
    .pay-card:hover { transform: translateY(-2px); }
    .pay-card.active-full { border-color: #1D9E75; background: #E8F7F2; box-shadow: 0 4px 16px rgba(29,158,117,0.15); }
    .pay-card.active-partial { border-color: #3B82F6; background: #EFF6FF; box-shadow: 0 4px 16px rgba(59,130,246,0.15); }
    .delivery-btn { flex: 1; padding: 12px; border-radius: 12px; border: 2px solid var(--border); background: var(--card); color: var(--text-2); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
    .delivery-btn.active { border-color: var(--green); background: var(--green-bg); color: var(--green); }
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
        <div className="pop" style={{ background: 'var(--card)', borderRadius: '24px', padding: '40px 32px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '2px solid #1D9E75', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
          <h2 className="k" style={{ fontSize: '26px', color: '#1D9E75', marginBottom: '8px' }}>Order Confirmed!</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '24px' }}>
            Your Class {selectedClass} kit is confirmed. We've opened WhatsApp to send the details to the store.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => router.push('/my-orders')} style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive' }}>
              Track order →
            </button>
            <button onClick={() => router.push('/school-sets')} style={{ flex: 1, background: 'var(--green-bg)', color: '#1D9E75', border: '1.5px solid var(--green-border)', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
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
      <nav style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow)' }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : router.push('/school-sets')}
          style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="k" style={{ fontSize: '17px', color: 'var(--text)' }}>Checkout · Class {selectedClass}</span>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)', fontWeight: '600' }}>🏫 {SCHOOL}</div>
      </nav>

      {/* Progress stepper */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '14px 20px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div className="step-bar-item" style={{ flex: 'none' }}>
                <div className="step-dot" style={{
                  background: i < step ? '#1D9E75' : i === step ? '#1D9E75' : 'var(--border)',
                  color: i <= step ? '#fff' : 'var(--text-3)',
                  boxShadow: i === step ? '0 0 0 3px rgba(29,158,117,0.2)' : 'none',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '10px', fontWeight: i === step ? '700' : '400', color: i === step ? 'var(--green)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>{s}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="step-line" style={{ background: i < step ? '#1D9E75' : 'var(--border)', margin: '0 6px', marginBottom: '16px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* STEP 0 — Summary */}
        {step === 0 && (
          <div className="slide-in">
            <h2 className="k" style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '16px' }}>Order Summary</h2>

            {/* Kit badge */}
            <div style={{ background: 'linear-gradient(135deg, #1B2A4A, #1D9E75)', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🎒</div>
              <div style={{ flex: 1 }}>
                <div className="k" style={{ fontSize: '18px', color: '#fff' }}>Class {selectedClass} School Kit</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{SCHOOL} · {items.length} items</div>
              </div>
              <div className="k" style={{ fontSize: '24px', color: '#fff' }}>₹{kitSubtotal.toLocaleString()}</div>
            </div>

            {/* Items list */}
            <div style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '1.5px solid var(--border)', overflow: 'hidden', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Items in your kit
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {items.map((item: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', gap: '8px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', flex: 1 }}>{item.split(' ₹')[0]}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', flexShrink: 0 }}>₹{item.split(' ₹')[1]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price summary */}
            <div style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '1.5px solid var(--border)', padding: '16px', marginBottom: '20px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>Kit subtotal</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>₹{kitSubtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span className="k" style={{ fontSize: '18px' }}>Total</span>
                <span className="k" style={{ fontSize: '24px', color: '#1D9E75' }}>₹{kitSubtotal.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>+ delivery fee added at next step</div>
            </div>

            <button onClick={() => setStep(1)}
              style={{ width: '100%', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
              Continue → Add details
            </button>
          </div>
        )}

        {/* STEP 1 — Details */}
        {step === 1 && (
          <div className="slide-in">
            <h2 className="k" style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '6px' }}>Your details</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' }}>We'll use this to confirm your order and contact you.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Full name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>WhatsApp number *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 12px', fontSize: '13px', color: 'var(--text-3)', flexShrink: 0, gap: '4px' }}>🇮🇳 +91</div>
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" style={{ border: `1.5px solid ${phone.length === 10 ? '#1D9E75' : 'var(--border)'}` }} />
                </div>
                {phone.length > 0 && phone.length < 10 && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '4px' }}>⚠️ Enter 10-digit number</div>}
              </div>
            </div>

            <button onClick={() => { if (!name.trim()) { alert('Please enter your name'); return } if (phone.length < 10) { alert('Please enter a valid WhatsApp number'); return } setStep(2) }}
              style={{ width: '100%', background: name && phone.length === 10 ? '#1D9E75' : '#ccc', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '16px', fontWeight: '700', cursor: name && phone.length === 10 ? 'pointer' : 'not-allowed', fontFamily: 'Kalam, cursive', boxShadow: name && phone.length === 10 ? '0 4px 16px rgba(29,158,117,0.3)' : 'none' }}>
              Continue → Delivery
            </button>
          </div>
        )}

        {/* STEP 2 — Delivery */}
        {step === 2 && (
          <div className="slide-in">
            <h2 className="k" style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '6px' }}>Delivery option</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' }}>Choose how you want to receive your kit.</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button className={'delivery-btn' + (deliveryMode === 'pickup' ? ' active' : '')} onClick={() => setDeliveryMode('pickup')}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>🏪</div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>Pickup</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>Free · Sec-40C store</div>
              </button>
              <button className={'delivery-btn' + (deliveryMode === 'delivery' ? ' active' : '')} onClick={() => setDeliveryMode('delivery')}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>🚚</div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>Home delivery</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>+₹99 · Chandigarh tricity</div>
              </button>
            </div>

            {deliveryMode === 'pickup' && (
              <div style={{ background: '#E8F7F2', border: '1.5px solid #C0E8D8', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>📍</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75', marginBottom: '2px' }}>Bedi Book Store</div>
                  <div style={{ fontSize: '12px', color: '#065F46', lineHeight: 1.6 }}>Booth No. 48, Sector-40C, Chandigarh<br />Mon–Sat · 9am–7pm</div>
                </div>
              </div>
            )}

            {deliveryMode === 'delivery' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Delivery address *</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House/flat no., street, sector, city…" rows={3} style={{ resize: 'none' }} />
              </div>
            )}

            {/* Order total preview */}
            <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1.5px solid var(--border)', padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Kit ₹{kitSubtotal.toLocaleString()} {deliveryMode === 'delivery' ? '+ delivery ₹99' : '+ free pickup'}</div>
                <div className="k" style={{ fontSize: '20px', color: '#1D9E75', marginTop: '2px' }}>Total ₹{total.toLocaleString()}</div>
              </div>
              <span style={{ fontSize: '20px' }}>{deliveryMode === 'pickup' ? '🏪' : '🚚'}</span>
            </div>

            <button onClick={() => { if (deliveryMode === 'delivery' && !address.trim()) { alert('Please enter delivery address'); return } setStep(3) }}
              style={{ width: '100%', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
              Continue → Payment
            </button>
          </div>
        )}

        {/* STEP 3 — Payment */}
        {step === 3 && (
          <div className="slide-in">
            <h2 className="k" style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '6px' }}>Choose payment</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' }}>Secure payment via Razorpay.</p>

            {/* Full payment */}
            <button className={'pay-card' + (paymentMode === 'full' ? ' active-full' : '')} onClick={() => setPaymentMode('full')}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: paymentMode === 'full' ? '#1D9E75' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, transition: 'background 0.15s' }}>💳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: paymentMode === 'full' ? '#1D9E75' : 'var(--text)', marginBottom: '3px' }}>Pay full amount</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Pay ₹{total.toLocaleString()} now. Kit assembled immediately.</div>
              </div>
              <div className="k" style={{ fontSize: '20px', color: paymentMode === 'full' ? '#1D9E75' : 'var(--text-3)', flexShrink: 0 }}>₹{total.toLocaleString()}</div>
            </button>

            {/* 30% upfront */}
            <button className={'pay-card' + (paymentMode === 'partial' ? ' active-partial' : '')} onClick={() => setPaymentMode('partial')} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-8px', right: '12px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '99px' }}>POPULAR</div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: paymentMode === 'partial' ? '#3B82F6' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, transition: 'background 0.15s' }}>🤝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: paymentMode === 'partial' ? '#3B82F6' : 'var(--text)', marginBottom: '3px' }}>Pay 30% now</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>Pay ₹{upfront.toLocaleString()} now. ₹{payLater.toLocaleString()} at {deliveryMode === 'pickup' ? 'pickup' : 'delivery'}.</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div className="k" style={{ fontSize: '18px', color: paymentMode === 'partial' ? '#3B82F6' : 'var(--text-3)' }}>₹{upfront.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>now</div>
              </div>
            </button>

            {/* Summary box */}
            <div style={{ background: paymentMode === 'full' ? '#E8F7F2' : '#EFF6FF', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', border: '1.5px solid ' + (paymentMode === 'full' ? '#C0E8D8' : '#BFDBFE') }}>
              <div style={{ fontSize: '12px', color: paymentMode === 'full' ? '#065F46' : '#1E40AF', lineHeight: 1.6 }}>
                {paymentMode === 'full'
                  ? '✅ You pay ₹' + total.toLocaleString() + ' now. Kit assembled right away.'
                  : '🤝 Pay ₹' + upfront.toLocaleString() + ' now to confirm. Remaining ₹' + payLater.toLocaleString() + ' at ' + (deliveryMode === 'pickup' ? 'pickup' : 'delivery') + '.'}
              </div>
            </div>

            {/* Order recap */}
            <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
              <div>👤 {name} · 📱 +91 {phone}</div>
              <div>{deliveryMode === 'pickup' ? '🏪 Pickup — Sector-40C, Chandigarh' : '🚚 Delivery — ' + address}</div>
              <div>📦 Class {selectedClass} Kit · {items.length} items</div>
            </div>

            {isSignedIn ? (
              <button onClick={handleOrder} disabled={ordering}
                style={{ width: '100%', background: paymentMode === 'full' ? 'linear-gradient(135deg,#1D9E75,#157A5A)' : 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: ordering ? 'not-allowed' : 'pointer', fontFamily: 'Kalam, cursive', boxShadow: paymentMode === 'full' ? '0 6px 24px rgba(29,158,117,0.35)' : '0 6px 24px rgba(59,130,246,0.35)', opacity: ordering ? 0.7 : 1 }}>
                {ordering ? 'Opening payment…' : paymentMode === 'full' ? '✅ Pay ₹' + total.toLocaleString() + ' & Confirm' : '🤝 Pay ₹' + upfront.toLocaleString() + ' to Book Kit'}
              </button>
            ) : (
              <SignInButton mode="modal">
                <button style={{ width: '100%', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive' }}>Sign in to pay →</button>
              </SignInButton>
            )}

            <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', marginTop: '10px', lineHeight: 1.5 }}>
              Secure payment via Razorpay · Exchange within 10 days with bill
            </p>
          </div>
        )}

      </div>
    </>
  )
}