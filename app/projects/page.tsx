'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'

const CATEGORIES = [
  'Working model',
  'Static model',
  'Chart / poster',
  'Project file / report',
  'Display board',
  'Other',
]

type ProjectRequest = {
  id: string
  category: string
  topic: string
  classLevel: string
  deadline: string
  size: string | null
  description: string | null
  photoUrl: string | null
  status: string
  quotePrice: number | null
  advanceAmount: number | null
  quoteNote: string | null
  advancePaidPaise: number
  balancePaidPaise: number
  createdAt: string
}

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  quote_requested: { text: 'Waiting for quote', color: '#92400E', bg: '#FFFBEB' },
  quoted: { text: 'Quote ready', color: '#1D4ED8', bg: '#EFF6FF' },
  in_progress: { text: 'In progress', color: '#7C3AED', bg: '#F5F3FF' },
  ready: { text: 'Ready — pay balance', color: '#B45309', bg: '#FFF7ED' },
  delivered: { text: 'Delivered', color: '#047857', bg: '#ECFDF5' },
  cancelled: { text: 'Cancelled', color: '#B91C1C', bg: '#FEF2F2' },
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function ProjectsPage() {
  const { isSignedIn, user } = useUser()
  const [items, setItems] = useState<ProjectRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [category, setCategory] = useState(CATEGORIES[0])
  const [topic, setTopic] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [deadline, setDeadline] = useState('')
  const [size, setSize] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const refresh = useCallback(async () => {
    if (!isSignedIn) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects/list')
      if (res.ok) {
        const d = await res.json()
        setItems(d.items || [])
      }
    } catch {}
    setLoading(false)
  }, [isSignedIn])

  useEffect(() => { refresh() }, [refresh])

  async function submitRequest() {
    if (!topic.trim() || !classLevel.trim() || !deadline) { alert('Please fill topic, class and deadline.'); return }
    const ph = phone.replace(/\D/g, '').slice(0, 10)
    if (ph.length !== 10) { alert('Please enter a valid 10-digit phone number.'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('category', category)
      fd.append('topic', topic.trim())
      fd.append('classLevel', classLevel.trim())
      fd.append('deadline', deadline)
      fd.append('size', size.trim())
      fd.append('description', description.trim())
      fd.append('phone', ph)
      fd.append('buyerName', user?.fullName || '')
      if (photo) fd.append('photo', photo)
      const res = await fetch('/api/projects/request', { method: 'POST', body: fd })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setDone(true)
        setTopic(''); setClassLevel(''); setDeadline(''); setSize(''); setDescription(''); setPhoto(null)
        refresh()
        setTimeout(() => setDone(false), 4000)
      } else {
        alert(d.error || 'Could not submit. Please try again.')
      }
    } catch { alert('Something went wrong. Please try again.') }
    setSubmitting(false)
  }

  async function pay(item: ProjectRequest, phase: 'advance' | 'balance') {
    setBusyId(item.id)
    try {
      const ok = await loadRazorpay()
      if (!ok) { alert('Could not load payment. Check your connection.'); setBusyId(null); return }
      const res = await fetch('/api/projects/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, phase }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { alert(d.error || 'Could not start payment.'); setBusyId(null); return }

      const rz = new (window as any).Razorpay({
        key: d.keyId,
        order_id: d.orderId,
        amount: d.amount,
        currency: 'INR',
        name: 'BuddyBooks',
        description: (phase === 'advance' ? 'Advance' : 'Balance') + ' — ' + d.topic,
        prefill: { name: d.name || user?.fullName || '' },
        theme: { color: '#00B86B' },
        handler: async (resp: any) => {
          const v = await fetch('/api/projects/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: item.id, phase,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          })
          if (v.ok) { alert('Payment successful!'); refresh() }
          else { const e = await v.json().catch(() => ({})); alert(e.error || 'Payment could not be verified.') }
          setBusyId(null)
        },
        modal: { ondismiss: () => setBusyId(null) },
      })
      rz.open()
    } catch { alert('Something went wrong.'); setBusyId(null) }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    .pp { font-family: 'Poppins', sans-serif; color: #1A1330; max-width: 760px; margin: 0 auto; padding: 24px 18px 80px; }
    .pp h1 { font-size: 26px; font-weight: 800; margin: 0 0 4px; }
    .pp .sub { color: #6B6280; font-size: 14px; margin-bottom: 22px; }
    .card { background: #fff; border: 1.5px solid #FFE2C2; border-radius: 16px; padding: 18px; box-shadow: 0 2px 14px rgba(124,92,252,0.07); margin-bottom: 16px; }
    .pp label { display: block; font-size: 12px; font-weight: 700; color: #6B6280; margin: 10px 0 4px; }
    .pp input, .pp select, .pp textarea { width: 100%; border: 1.5px solid #FFE2C2; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-family: 'Poppins', sans-serif; color: #1A1330; outline: none; }
    .pp input:focus, .pp select:focus, .pp textarea:focus { border-color: #00B86B; }
    .btn { background: linear-gradient(135deg,#00B86B,#2D7FF9); color: #fff; border: none; border-radius: 12px; padding: 13px 20px; font-size: 15px; font-weight: 800; cursor: pointer; font-family: 'Poppins', sans-serif; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .pill { display: inline-block; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 99px; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 560px) { .row2 { grid-template-columns: 1fr; } }
    .muted { color: #6B6280; font-size: 13px; }
    .qbox { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 12px 14px; margin-top: 10px; }
  `

  if (isSignedIn === false) {
    return (
      <>
        <style>{css}</style>
        <div className="pp">
          <h1>Custom Projects & Models 🛠️</h1>
          <p className="sub">Get a working model, chart, project file or display board made for you. Sign in to request a quote.</p>
          <SignInButton mode="modal">
            <button className="btn">Sign in to start →</button>
          </SignInButton>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{css}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="pp">
        <h1>Custom Projects & Models 🛠️</h1>
        <p className="sub">Tell us what you need and by when. We&apos;ll send you a price; pay an advance to start, balance on handover.</p>

        {/* New request form */}
        <div className="card">
          <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Request a quote</div>
          <div className="row2">
            <div>
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Class / level</label>
              <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder="e.g. Class 10, B.Tech 2nd yr" />
            </div>
          </div>
          <label>Topic / subject</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Working model of an electric motor" />
          <div className="row2">
            <div>
              <label>Needed by (deadline)</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <label>Size / specs (optional)</label>
              <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. A2 chart, 1x1 ft base" />
            </div>
          </div>
          <label>Description / requirements (optional)</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any details, must-haves, reference notes…" />
          <div className="row2">
            <div>
              <label>WhatsApp number (10 digits)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" />
            </div>
            <div>
              <label>Reference photo (optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn" onClick={submitRequest} disabled={submitting}>{submitting ? 'Sending…' : 'Send request'}</button>
            {done && <span style={{ color: '#047857', fontWeight: 700, fontSize: '14px' }}>✓ Request sent! We&apos;ll quote you soon.</span>}
          </div>
        </div>

        {/* My requests */}
        <div style={{ fontSize: '16px', fontWeight: 800, margin: '24px 0 10px' }}>My requests</div>
        {loading && <p className="muted">Loading…</p>}
        {!loading && items.length === 0 && <p className="muted">No requests yet. Submit one above.</p>}

        {items.map((it) => {
          const st = STATUS_LABEL[it.status] || STATUS_LABEL.quote_requested
          const balance = (it.quotePrice != null && it.advanceAmount != null) ? Math.max(0, it.quotePrice - it.advanceAmount) : null
          return (
            <div className="card" key={it.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{it.topic}</div>
                  <div className="muted">{it.category} · Class {it.classLevel} · due {new Date(it.deadline).toLocaleDateString()}</div>
                </div>
                <span className="pill" style={{ color: st.color, background: st.bg, height: 'fit-content' }}>{st.text}</span>
              </div>

              {it.photoUrl && <img src={it.photoUrl} alt="reference" style={{ marginTop: '10px', maxHeight: '140px', borderRadius: '10px' }} />}
              {it.description && <p className="muted" style={{ marginTop: '8px' }}>{it.description}</p>}

              {it.quotePrice != null && (
                <div className="qbox">
                  <div style={{ fontWeight: 700 }}>Quote: ₹{it.quotePrice}</div>
                  <div className="muted">Advance ₹{it.advanceAmount} · Balance ₹{balance}</div>
                  {it.quoteNote && <div className="muted" style={{ marginTop: '4px' }}>Note: {it.quoteNote}</div>}
                </div>
              )}

              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {it.status === 'quoted' && (
                  <button className="btn" disabled={busyId === it.id} onClick={() => pay(it, 'advance')}>
                    {busyId === it.id ? 'Opening…' : 'Accept & pay advance ₹' + it.advanceAmount}
                  </button>
                )}
                {it.status === 'ready' && (
                  <button className="btn" disabled={busyId === it.id} onClick={() => pay(it, 'balance')}>
                    {busyId === it.id ? 'Opening…' : 'Pay balance ₹' + balance}
                  </button>
                )}
                {it.status === 'in_progress' && <span className="muted">Advance received — we&apos;re building it. 🛠️</span>}
                {it.status === 'delivered' && <span className="muted" style={{ color: '#047857', fontWeight: 700 }}>Fully paid &amp; delivered. 🎉</span>}
              </div>
            </div>
          )
        })}

        <p className="muted" style={{ marginTop: '20px', fontSize: '12px' }}>
          Note: the advance is non-refundable once we begin building, since materials and work start immediately.
        </p>
      </div>
    </>
  )
}