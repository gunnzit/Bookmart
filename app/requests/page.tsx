'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

const categories = ['textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const emojis: Record<string, string> = {
  textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙'
}

const LOCATIONS = [
  'Sector 17, Chandigarh', 'Sector 22, Chandigarh', 'Sector 34, Chandigarh',
  'Sector 35, Chandigarh', 'Sector 40, Chandigarh', 'Sector 40-C, Chandigarh',
  'Sector 43, Chandigarh', 'Manimajra, Chandigarh', 'Phase 1, Mohali',
  'Phase 2, Mohali', 'Phase 3B2, Mohali', 'Phase 7, Mohali', 'Phase 11, Mohali',
  'Sector 1, Panchkula', 'Sector 7, Panchkula', 'Sector 10, Panchkula',
  'Kharar, Mohali', 'Zirakpur', 'Aerocity, Mohali',
]

export default function RequestsPage() {
  const router = useRouter()
  const { isSignedIn, user, isLoaded } = useUser()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    title: '', author: '', category: 'textbook',
    maxPrice: '', location: '', note: ''
  })

  useEffect(() => {
    fetch('/api/requests')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRequests(data) })
      .finally(() => setLoading(false))
  }, [])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit() {
    if (!form.title || !form.location) return
    if (!isLoaded || !user?.id) {
      alert('Please wait a moment and try again.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  ...form,
  clerkId: user.id,
  name: user.fullName || user.firstName || 'User',
  email: user.primaryEmailAddress?.emailAddress,
}),
      })
      if (res.ok) {
        const newReq = await res.json()
        setRequests(prev => [newReq, ...prev])
        setDone(true)
        setShowForm(false)
        setForm({ title: '', author: '', category: 'textbook', maxPrice: '', location: '', note: '' })
      } else {
        const err = await res.json()
        alert(err.error || 'Something went wrong. Try again.')
      }
    } catch (e) {
      alert('Could not connect. Please try again.')
    }
    setSubmitting(false)
  }

  async function closeRequest(id: string) {
    await fetch(`/api/requests/${id}`, { method: 'DELETE' })
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FFF9F0; --bg-card: #fff; --bg-input: #FFF9F0;
      --nav-bg: #fff; --border: #FFE2C2; --border-strong: #FFCB94;
      --text-primary: #1A1330; --text-secondary: #6B6280;
      --text-muted: #A89FC0; --text-label: #A89FC0;
      --shadow-card: 0 2px 16px rgba(124,92,252,0.08);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #14101F; --bg-card: #221C3A; --bg-input: #1C1730;
        --nav-bg: #1C1730; --border: #352C52; --border-strong: #463A6B;
        --text-primary: #F3EEFF; --text-secondary: #B0A8CC;
        --text-muted: #6E6590; --text-label: #6E6590;
        --shadow-card: 0 2px 16px rgba(0,0,0,0.25);
      }
    }
    body { font-family: 'Poppins', sans-serif; background: var(--bg); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
    .kalam { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
    input, textarea, select { color: var(--text-primary) !important; background: var(--bg-input) !important; font-family: 'Poppins', sans-serif; }
    input::placeholder, textarea::placeholder { color: var(--text-muted) !important; }
    input:focus, textarea:focus, select:focus { outline: none !important; border-color: #00B86B !important; box-shadow: 0 0 0 3px rgba(0,184,107,0.12) !important; }
    .card { background: var(--bg-card); border-radius: 16px; border: 2px solid var(--border); padding: 20px; box-shadow: var(--shadow-card); }
    .card-pop { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s, border-color 0.18s; }
    .card-pop:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(124,92,252,0.14); border-color: #7C5CFC; }
    .input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 2px solid var(--border); font-size: 14px; transition: all 0.15s; }
    .label { font-size: 11px; color: var(--text-label); display: block; margin-bottom: 6px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; }
    .cat-btn { padding: 8px 14px; border-radius: 99px; border: 2px solid var(--border); background: var(--bg-card); cursor: pointer; font-size: 12px; font-weight: 700; color: var(--text-secondary); font-family: 'Poppins', sans-serif; transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1); white-space: nowrap; }
    .cat-btn.active { border-color: #00B86B; background: #DFFFEF; color: #00B86B; }
    .cat-btn:hover { transform: translateY(-2px); }
    .cat-btn:active { transform: scale(0.95); }
    .btn-3d { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; }
    .btn-3d:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 6px 0 #009957 !important; }
    .btn-3d:not(:disabled):active { transform: translateY(2px); box-shadow: 0 1px 0 #009957 !important; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '2px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>←</button>
          <span className="kalam" style={{ fontSize: '18px', color: '#00B86B' }}>📋 Book Requests</span>
          <div style={{ marginLeft: 'auto' }}>
            {isSignedIn
              ? <button onClick={() => setShowForm(true)} className="btn-3d" style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>+ Request a book</button>
              : <SignInButton mode="modal"><button className="btn-3d" style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>+ Request a book</button></SignInButton>
            }
          </div>
        </nav>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px 48px' }}>

          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 className="kalam" style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Looking for a book? 🔍</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: '500' }}>
              Post what you're looking for. Sellers who have it will contact you directly on WhatsApp.
            </p>
          </div>

          {/* Success toast */}
          {done && (
            <div className="fade-in" style={{ background: '#DFFFEF', border: '2px solid #00B86B', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: '#009957', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✅ Request posted! Sellers will WhatsApp you if they have it.
              <button onClick={() => setDone(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#009957', fontSize: '18px' }}>×</button>
            </div>
          )}

          {/* Post request form */}
          {showForm && (
            <div className="card fade-in" style={{ marginBottom: '24px', border: '2px solid #00B86B' }}>
              <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '20px' }}>📋 What are you looking for?</div>

              <div style={{ marginBottom: '14px' }}>
                <label className="label">Book title *</label>
                <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. NCERT Physics Class 12" className="input" />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="label">Author <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <input value={form.author} onChange={e => update('author', e.target.value)} placeholder="e.g. H.C. Verma" className="input" />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="label">Category *</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => update('category', cat)} className={`cat-btn${form.category === cat ? ' active' : ''}`}>
                      {emojis[cat]} {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="label">Max price (₹) <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <input type="number" value={form.maxPrice} onChange={e => update('maxPrice', e.target.value)} placeholder="300" className="input" />
                </div>
                <div>
                  <label className="label">Your area *</label>
                  <select value={form.location} onChange={e => update('location', e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: `2px solid ${form.location ? '#00B86B' : 'var(--border)'}`, fontSize: '14px', transition: 'all 0.15s' }}>
                    <option value="">Select area…</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="label">Note <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="e.g. Need 2023 edition, good condition only" rows={2}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '14px', resize: 'none', transition: 'all 0.15s' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={submit}
                  disabled={submitting || !form.title || !form.location || !isLoaded}
                  className="btn-3d"
                  style={{ background: form.title && form.location && isLoaded ? 'linear-gradient(135deg,#00B86B,#2D7FF9)' : '#ccc', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 20px', fontSize: '14px', fontWeight: '800', cursor: form.title && form.location && isLoaded ? 'pointer' : 'not-allowed', fontFamily: 'Poppins, sans-serif', flex: 1, boxShadow: form.title && form.location && isLoaded ? '0 4px 0 #009957' : 'none' }}>
                  {submitting ? 'Posting…' : 'Post request →'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: '2px solid var(--border)', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Requests list */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <div style={{ width: '24px', height: '24px', border: '3px solid #00B86B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '6px' }}>No requests yet</div>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>Be the first to post what you're looking for.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map(r => (
                <div key={r.id} className="card card-pop fade-in">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#DFFFEF', border: '2px solid #9DEAC4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                      {emojis[r.category] || '📚'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{r.title}</span>
                        {r.maxPrice && (
                          <span style={{ fontSize: '11px', background: '#DFFFEF', color: '#00B86B', padding: '2px 8px', borderRadius: '99px', fontWeight: '800' }}>under ₹{r.maxPrice}</span>
                        )}
                      </div>
                      {r.author && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>by {r.author}</div>}
                      {r.note && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5, fontWeight: '500' }}>"{r.note}"</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>📍 {r.location}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>👤 {r.user?.name || 'Anonymous'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>🕐 {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                      {r.user?.phone && (
                        <a href={`https://wa.me/91${r.user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I saw your request for "${r.title}" on BuddyBooks. I have it — interested?`)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', boxShadow: '0 3px 0 #1da851' }}>
                          💬 I have it!
                        </a>
                      )}
                      {isSignedIn && user?.id && r.user?.clerkId === user.id && (
                        <button onClick={() => closeRequest(r.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}