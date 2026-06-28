'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

const CATEGORIES: { name: string; emoji: string }[] = [
  { name: 'Working model', emoji: '⚙️' },
  { name: 'Static model', emoji: '🏛️' },
  { name: 'Chart / poster', emoji: '📊' },
  { name: 'Project file / report', emoji: '📁' },
  { name: 'Display board', emoji: '🪧' },
  { name: 'Other', emoji: '✨' },
]

// ── Past projects gallery ─────────────────────────────────────────────────
// When you have real photos, paste the Supabase image URL into `url`.
// Leave url: null to show a nice placeholder tile.
const PAST_PROJECTS: { title: string; category: string; emoji: string; c: string; url: string | null }[] = [
  { title: 'Working volcano model', category: 'Working model', emoji: '🌋', c: '#FF6B2C', url: null },
  { title: 'Solar system display', category: 'Display board', emoji: '🪐', c: '#7C5CFC', url: null },
  { title: 'Electric motor model', category: 'Working model', emoji: '⚙️', c: '#2D7FF9', url: null },
  { title: 'Human digestive system chart', category: 'Chart / poster', emoji: '📊', c: '#00B86B', url: null },
  { title: 'Hydraulic lift model', category: 'Working model', emoji: '🏗️', c: '#E0A800', url: null },
  { title: 'Physics practical file', category: 'Project file / report', emoji: '📁', c: '#FF3D81', url: null },
]

// ── Reviews ───────────────────────────────────────────────────────────────
// Replace these with your real customer testimonials any time.
const PROJECT_REVIEWS: { name: string; role: string; text: string; avatar: string; c: string; tag: string }[] = [
  { name: 'Manav S.', role: 'Class 10 · DPS', text: 'They built my working electric motor model — worked perfectly and looked so neat. Won best project in the exhibition!', avatar: 'M', c: '#2D7FF9', tag: '⚙️ Working model' },
  { name: 'Ritika P.', role: 'Class 8 · Shivalik', text: 'Needed a solar system display board in 3 days. Delivered right on time and my teacher loved it. 🌟', avatar: 'R', c: '#7C5CFC', tag: '🪧 Display board' },
  { name: 'Aman K.', role: 'B.Tech · Mohali', text: 'Got my whole physics practical file made and bound. Saved me a week of work — totally worth it.', avatar: 'A', c: '#00B86B', tag: '📁 Project file' },
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

const STATUS_META: Record<string, { text: string; emoji: string; color: string; bg: string; border: string }> = {
  quote_requested: { text: 'Waiting for quote', emoji: '⏳', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  quoted:          { text: 'Quote ready',       emoji: '💬', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  in_progress:     { text: 'In progress',       emoji: '🛠️', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  ready:           { text: 'Ready — pay balance',emoji: '📦', color: '#B45309', bg: '#FFF7ED', border: '#FED7AA' },
  delivered:       { text: 'Delivered',         emoji: '🎉', color: '#047857', bg: '#ECFDF5', border: '#9DEAC4' },
  cancelled:       { text: 'Cancelled',         emoji: '✕',  color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5' },
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
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [items, setItems] = useState<ProjectRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [category, setCategory] = useState(CATEGORIES[0].name)
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
      if (res.ok) { const d = await res.json(); setItems(d.items || []) }
    } catch {}
    setLoading(false)
  }, [isSignedIn])

  useEffect(() => { refresh() }, [refresh])

  async function submitRequest() {
    if (!topic.trim() || !classLevel.trim() || !deadline) { alert('Please fill topic, class and deadline.'); return }
    const ph = phone.replace(/\D/g, '').slice(0, 10)
    if (ph.length !== 10) { alert('Please enter a valid 10-digit number.'); return }
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
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => setDone(false), 4500)
      } else alert(d.error || 'Could not submit. Please try again.')
    } catch { alert('Something went wrong. Please try again.') }
    setSubmitting(false)
  }

  async function pay(item: ProjectRequest, phase: 'advance' | 'balance') {
    setBusyId(item.id)
    try {
      const ok = await loadRazorpay()
      if (!ok) { alert('Could not load payment. Check your connection.'); setBusyId(null); return }
      const res = await fetch('/api/projects/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, phase }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { alert(d.error || 'Could not start payment.'); setBusyId(null); return }
      const rz = new (window as any).Razorpay({
        key: d.keyId, order_id: d.orderId, amount: d.amount, currency: 'INR',
        name: 'BuddyBooks', description: (phase === 'advance' ? 'Advance' : 'Balance') + ' — ' + d.topic,
        prefill: { name: d.name || user?.fullName || '' }, theme: { color: '#00B86B' },
        handler: async (resp: any) => {
          const v = await fetch('/api/projects/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, phase, razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature }),
          })
          if (v.ok) { alert('Payment successful! 🎉'); refresh() }
          else { const e = await v.json().catch(() => ({})); alert(e.error || 'Payment could not be verified.') }
          setBusyId(null)
        },
        modal: { ondismiss: () => setBusyId(null) },
      })
      rz.open()
    } catch { alert('Something went wrong.'); setBusyId(null) }
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
      :root { --bg: #14101F; --white: #1C1730; --card: #221C3A; --border: #352C52; --border-strong: #463A6B;
        --text: #F3EEFF; --text-2: #B0A8CC; --text-3: #6E6590; --green-bg: #0A3A26; --green-border: #155C3C;
        --shadow: 0 2px 14px rgba(0,0,0,0.4); --shadow-lg: 0 12px 40px rgba(0,0,0,0.5); }
    }
    body { background: var(--bg); font-family: 'Poppins', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
    .k { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
    @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
    .floaty-hero { animation: floaty 4s ease-in-out infinite; }
    @keyframes gradientMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    .hero-grad { animation: gradientMove 12s ease infinite; }
    .nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 100; box-shadow: var(--shadow); }
    .card { background: var(--card); border: 1.5px solid var(--border); border-radius: var(--r); box-shadow: var(--shadow); overflow: hidden; }
    .lbl { display: block; font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 6px; }
    .inp { color: var(--text) !important; background: var(--bg) !important; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 14px; font-family: 'Poppins', sans-serif; width: 100%; outline: none; transition: border 0.15s, box-shadow 0.15s; }
    .inp:focus { border-color: var(--green) !important; box-shadow: 0 0 0 3px rgba(0,184,107,0.1); }
    textarea.inp { resize: vertical; min-height: 64px; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 560px) { .row2 { grid-template-columns: 1fr; } }
    .cat-chip { display: flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 12px; border: 2px solid var(--border); background: var(--bg); color: var(--text-2); font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif; transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1), background 0.15s, border-color 0.15s, color 0.15s; }
    .cat-chip:hover:not(.on) { border-color: var(--green); color: var(--green); transform: translateY(-2px); }
    .cat-chip.on { background: linear-gradient(135deg,#00B86B,#2D7FF9); color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(0,184,107,0.35); }
    .cat-chip:active { transform: scale(0.95); }
    .order-btn { background: linear-gradient(135deg,#00B86B,#2D7FF9); color: #fff; border: none; border-radius: 14px; padding: 15px 24px; font-size: 15px; font-weight: 800; cursor: pointer; font-family: 'Poppins', sans-serif; transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; box-shadow: 0 4px 0 #009957, 0 8px 20px rgba(0,184,107,0.3); }
    .order-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #009957, 0 12px 28px rgba(0,184,107,0.4); }
    .order-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #009957; }
    .order-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 800; padding: 5px 11px; border-radius: 99px; }
    .file-drop { border: 1.5px dashed var(--border-strong); border-radius: 10px; padding: 10px 14px; background: var(--bg); font-size: 13px; color: var(--text-2); cursor: pointer; display: flex; align-items: center; gap: 8px; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .slide-down { animation: slideDown 0.25s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s ease; }
    .qbox { background: linear-gradient(135deg, #DFFFEF, #EFF6FF); border: 1.5px solid #9DEAC4; border-radius: 14px; padding: 14px 16px; margin-top: 12px; }
    .gal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .gal-grid { grid-template-columns: repeat(3, 1fr); } }
    .gal-tile { border-radius: 14px; overflow: hidden; border: 1.5px solid var(--border); background: var(--card); box-shadow: var(--shadow); transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s; }
    .gal-tile:hover { transform: translateY(-4px) rotate(-0.4deg); box-shadow: var(--shadow-lg); }
    .gal-photo { aspect-ratio: 4/3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
    .rev-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 640px) { .rev-grid { grid-template-columns: repeat(3, 1fr); } }
  `

  if (isSignedIn === false) {
    return (
      <>
        <style>{css}</style>
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          <Hero topic="" />
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 20px' }}>
            <div className="card fade-in" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>🛠️</div>
              <h2 className="k" style={{ fontSize: '20px', marginBottom: '8px' }}>Get your project made by us</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>
                Working models, charts, project files, display boards — tell us what you need and we&apos;ll send you a price. Sign in to start.
              </p>
              <SignInButton mode="modal">
                <button className="order-btn">Sign in to start →</button>
              </SignInButton>
            </div>
            <PastProjects />
            <Reviews />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{css}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        <nav className="nav">
          <button onClick={() => router.push('/')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '28px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="k" style={{ fontSize: '19px', background: 'linear-gradient(135deg,#FF6B2C,#FF3D81)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BuddyBooks</span>
          </div>
          <button onClick={() => router.push('/my-orders')} style={{ marginLeft: 'auto', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'Poppins, sans-serif' }}>📦 My Orders</button>
        </nav>

        <Hero topic="" />

        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px 80px' }}>

          {done && (
            <div className="slide-down" style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: '14px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>✅</span>
              <div style={{ fontSize: '13px', color: 'var(--green-dark)', fontWeight: '600', lineHeight: 1.5 }}>
                Request sent! We&apos;ll review it and send you a price soon — you&apos;ll see it under “My requests” below.
              </div>
            </div>
          )}

          {/* Request form */}
          <div className="card fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>📝</span>
              <h2 className="k" style={{ fontSize: '18px' }}>Request a quote</h2>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span className="lbl">What do you need?</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CATEGORIES.map((c) => (
                  <button key={c.name} className={'cat-chip' + (category === c.name ? ' on' : '')} onClick={() => setCategory(c.name)}>
                    <span>{c.emoji}</span>{c.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span className="lbl">Topic / subject</span>
              <input className="inp" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Working model of an electric motor" />
            </div>

            <div className="row2" style={{ marginBottom: '12px' }}>
              <div>
                <span className="lbl">Class / level</span>
                <input className="inp" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder="e.g. Class 10, B.Tech 2nd yr" />
              </div>
              <div>
                <span className="lbl">Needed by</span>
                <input className="inp" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>

            <div className="row2" style={{ marginBottom: '12px' }}>
              <div>
                <span className="lbl">Size / specs (optional)</span>
                <input className="inp" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. A2 chart, 1×1 ft base" />
              </div>
              <div>
                <span className="lbl">WhatsApp number</span>
                <input className="inp" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" />
              </div>
            </div>

            <div className="row2" style={{ marginBottom: '16px', alignItems: 'start' }}>
              <div>
                <span className="lbl">Details (optional)</span>
                <textarea className="inp" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any must-haves, colours, reference notes…" />
              </div>
              <div>
                <span className="lbl">Reference photo (optional)</span>
                <label className="file-drop">
                  <span style={{ fontSize: '16px' }}>📎</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo ? photo.name : 'Attach an image'}</span>
                  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <button className="order-btn" style={{ width: '100%' }} onClick={submitRequest} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send request →'}
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', marginTop: '10px', lineHeight: 1.5 }}>
              No payment now. We&apos;ll send a price; you pay a 50% advance to start and the balance on handover. Advance is non-refundable once we begin.
            </p>
          </div>

          {/* My requests */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '26px 0 12px' }}>
            <span style={{ fontSize: '18px' }}>📦</span>
            <h2 className="k" style={{ fontSize: '17px' }}>My requests</h2>
          </div>

          {loading && <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Loading…</p>}
          {!loading && items.length === 0 && (
            <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '34px', marginBottom: '6px', opacity: 0.7 }}>🗂️</div>
              <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>No requests yet — submit one above to get started.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((it) => {
              const st = STATUS_META[it.status] || STATUS_META.quote_requested
              const cat = CATEGORIES.find((c) => c.name === it.category)
              const balance = (it.quotePrice != null && it.advanceAmount != null) ? Math.max(0, it.quotePrice - it.advanceAmount) : null
              return (
                <div className="card fade-in" key={it.id} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px' }}>{cat?.emoji || '✨'}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="k" style={{ fontSize: '15px', lineHeight: 1.3 }}>{it.topic}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{it.category} · Class {it.classLevel} · due {new Date(it.deadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className="pill" style={{ color: st.color, background: st.bg, border: '1px solid ' + st.border, height: 'fit-content' }}>{st.emoji} {st.text}</span>
                  </div>

                  {it.photoUrl && <img src={it.photoUrl} alt="reference" style={{ marginTop: '12px', maxHeight: '150px', borderRadius: '10px', border: '1px solid var(--border)' }} />}
                  {it.description && <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '10px', lineHeight: 1.5 }}>{it.description}</p>}

                  {it.quotePrice != null && (
                    <div className="qbox">
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div className="k" style={{ fontSize: '20px', color: 'var(--green-dark)' }}>Quote: ₹{it.quotePrice.toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Advance ₹{it.advanceAmount?.toLocaleString()} · Balance ₹{balance?.toLocaleString()}</div>
                      </div>
                      {it.quoteNote && <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '6px' }}>📝 {it.quoteNote}</div>}
                    </div>
                  )}

                  <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {it.status === 'quoted' && (
                      <button className="order-btn" disabled={busyId === it.id} onClick={() => pay(it, 'advance')}>
                        {busyId === it.id ? 'Opening…' : '✓ Accept & pay advance ₹' + it.advanceAmount}
                      </button>
                    )}
                    {it.status === 'ready' && (
                      <button className="order-btn" disabled={busyId === it.id} onClick={() => pay(it, 'balance')}>
                        {busyId === it.id ? 'Opening…' : 'Pay balance ₹' + balance}
                      </button>
                    )}
                    {it.status === 'in_progress' && <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>🛠️ Advance received — we&apos;re building it.</span>}
                    {it.status === 'delivered' && <span style={{ fontSize: '13px', color: 'var(--green-dark)', fontWeight: '700' }}>🎉 Fully paid &amp; delivered. Thank you!</span>}
                    {it.status === 'cancelled' && <span style={{ fontSize: '13px', color: '#B91C1C' }}>This request was cancelled.</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <PastProjects />
          <Reviews />
        </div>
      </div>
    </>
  )
}

function PastProjects() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '30px 0 4px' }}>
        <span style={{ fontSize: '18px' }}>🏆</span>
        <h2 className="k" style={{ fontSize: '17px' }}>Recently built by us</h2>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px' }}>A few projects we&apos;ve made for students across the tricity</p>
      <div className="gal-grid">
        {PAST_PROJECTS.map((p, i) => (
          <div className="gal-tile fade-in" key={i}>
            <div className="gal-photo" style={{ background: p.url ? 'transparent' : p.c + '14' }}>
              {p.url ? (
                <img src={p.url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <span style={{ fontSize: '40px' }}>{p.emoji}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 600 }}>📸 Photo soon</span>
                </>
              )}
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ fontSize: '11px', color: p.c, fontWeight: 700, marginTop: '2px' }}>{p.category}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Reviews() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '30px 0 4px' }}>
        <span style={{ fontSize: '18px' }}>💛</span>
        <h2 className="k" style={{ fontSize: '17px' }}>What students say</h2>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px' }}>Real feedback from projects we&apos;ve delivered</p>
      <div className="rev-grid">
        {PROJECT_REVIEWS.map((t, i) => (
          <div className="card fade-in" key={i} style={{ padding: '18px', borderTop: '4px solid ' + t.c }}>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>{[0,1,2,3,4].map((j) => <span key={j} style={{ color: '#FFC83D', fontSize: '14px' }}>★</span>)}</div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '14px', fontWeight: 500 }}>&quot;{t.text}&quot;</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: t.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, flexShrink: 0 }}>{t.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>{t.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>{t.role}</div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: t.c, background: t.c + '18', padding: '4px 10px', borderRadius: '99px', whiteSpace: 'nowrap' }}>{t.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Hero({ topic }: { topic: string }) {
  return (
    <div className="hero-grad" style={{ background: 'linear-gradient(135deg, #1A1330 0%, #FF6B2C 60%, #FFC83D 100%)', backgroundSize: '200% 200%', padding: '30px 20px 34px', position: 'relative', overflow: 'hidden' }}>
      <div className="floaty-hero" style={{ position: 'absolute', top: '12%', right: '8%', fontSize: '42px', opacity: 0.3 }}>🛠️</div>
      <div className="floaty-hero" style={{ position: 'absolute', bottom: '8%', right: '24%', fontSize: '30px', opacity: 0.25, animationDelay: '1s' }}>📐</div>
      <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.18)', borderRadius: '99px', padding: '5px 14px', marginBottom: '12px', backdropFilter: 'blur(8px)' }}>
          <span style={{ fontSize: '11px', color: '#fff', fontWeight: '700' }}>🛠️ Made by us · Pay 50% to start, 50% on handover</span>
        </div>
        <h1 className="k" style={{ fontSize: 'clamp(26px, 5vw, 40px)', color: '#fff', marginBottom: '8px', lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}>Custom Projects 🛠️</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, maxWidth: '480px', fontWeight: '500' }}>
          Working models, charts, project files & display boards — built for you. Tell us what you need and we&apos;ll send a price.
        </p>
      </div>
    </div>
  )
}