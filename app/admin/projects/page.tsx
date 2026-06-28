'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

type ProjectRequest = {
  id: string
  buyerName: string
  phone: string
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

const CAT_EMOJI: Record<string, string> = {
  'Working model': '⚙️', 'Static model': '🏛️', 'Chart / poster': '📊',
  'Project file / report': '📁', 'Display board': '🪧', 'Other': '✨',
}

const STATUS_META: Record<string, { text: string; emoji: string; color: string; bg: string; border: string }> = {
  quote_requested: { text: 'Needs quote', emoji: '⏳', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  quoted:          { text: 'Quoted',      emoji: '💬', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  in_progress:     { text: 'In progress', emoji: '🛠️', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  ready:           { text: 'Ready',       emoji: '📦', color: '#B45309', bg: '#FFF7ED', border: '#FED7AA' },
  delivered:       { text: 'Delivered',   emoji: '🎉', color: '#047857', bg: '#ECFDF5', border: '#9DEAC4' },
  cancelled:       { text: 'Cancelled',   emoji: '✕',  color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5' },
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [items, setItems] = useState<ProjectRequest[]>([])
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, { price: string; advance: string; note: string }>>({})
  const [filter, setFilter] = useState<string>('all')

  const refresh = useCallback(async () => {
    if (!isSignedIn) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects/list')
      if (res.ok) { const d = await res.json(); setItems(d.items || []); setAdmin(!!d.admin) }
      else setAdmin(false)
    } catch { setAdmin(false) }
    setLoading(false)
  }, [isSignedIn])

  useEffect(() => { refresh() }, [refresh])

  function setDraftField(id: string, k: 'price' | 'advance' | 'note', v: string) {
    setDraft((prev) => {
      const cur = prev[id] || { price: '', advance: '', note: '' }
      return { ...prev, [id]: { ...cur, [k]: v } }
    })
  }

  async function sendQuote(it: ProjectRequest) {
    const d = draft[it.id] || { price: '', advance: '', note: '' }
    const quotePrice = Math.round(Number(d.price))
    const advanceAmount = Math.round(Number(d.advance))
    if (!(quotePrice > 0) || !(advanceAmount >= 0) || advanceAmount > quotePrice) { alert('Enter a valid total and an advance between 0 and the total.'); return }
    setBusyId(it.id)
    try {
      const res = await fetch('/api/projects/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: it.id, quotePrice, advanceAmount, quoteNote: d.note }),
      })
      if (res.ok) refresh()
      else { const e = await res.json().catch(() => ({})); alert(e.error || 'Could not send quote.') }
    } catch { alert('Something went wrong.') }
    setBusyId(null)
  }

  async function setStatus(it: ProjectRequest, status: string, markBalancePaidCash = false) {
    if (status === 'cancelled' && !confirm('Cancel this request?')) return
    if (markBalancePaidCash && !confirm('Mark balance as paid in cash and deliver?')) return
    setBusyId(it.id)
    try {
      const res = await fetch('/api/projects/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: it.id, status, markBalancePaidCash }),
      })
      if (res.ok) refresh()
      else { const e = await res.json().catch(() => ({})); alert(e.error || 'Could not update.') }
    } catch { alert('Something went wrong.') }
    setBusyId(null)
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FFF9F0; --white: #fff; --card: #fff; --border: #FFE2C2; --border-strong: #FFCB94;
      --text: #1A1330; --text-2: #6B6280; --text-3: #A89FC0;
      --green: #00B86B; --green-dark: #009957; --green-bg: #DFFFEF; --green-border: #9DEAC4;
      --shadow: 0 2px 14px rgba(124,92,252,0.08); --r: 18px;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #14101F; --white: #1C1730; --card: #221C3A; --border: #352C52; --border-strong: #463A6B;
        --text: #F3EEFF; --text-2: #B0A8CC; --text-3: #6E6590; --green-bg: #0A3A26; --green-border: #155C3C;
        --shadow: 0 2px 14px rgba(0,0,0,0.4); }
    }
    body { background: var(--bg); font-family: 'Poppins', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
    .k { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
    .nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 100; box-shadow: var(--shadow); }
    .card { background: var(--card); border: 1.5px solid var(--border); border-radius: var(--r); box-shadow: var(--shadow); overflow: hidden; }
    .inp { color: var(--text) !important; background: var(--bg) !important; border: 1.5px solid var(--border); border-radius: 10px; padding: 9px 12px; font-size: 13px; font-family: 'Poppins', sans-serif; width: 100%; outline: none; transition: border 0.15s; }
    .inp:focus { border-color: var(--green) !important; box-shadow: 0 0 0 3px rgba(0,184,107,0.1); }
    .pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 800; padding: 5px 11px; border-radius: 99px; }
    .b { border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif; transition: transform 0.12s, box-shadow 0.12s; }
    .b:active { transform: scale(0.96); }
    .b-primary { background: linear-gradient(135deg,#00B86B,#2D7FF9); color: #fff; box-shadow: 0 3px 0 #009957; }
    .b-soft { background: #EFEAFF; color: #6D28D9; border: 1.5px solid #DDD6FE; }
    .b-warn { background: #FEF2F2; color: #B91C1C; border: 1.5px solid #FCA5A5; }
    .b:disabled { opacity: 0.55; cursor: not-allowed; }
    .g3 { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 8px; }
    @media (max-width: 560px) { .g3 { grid-template-columns: 1fr 1fr; } .g3 > :last-child { grid-column: 1 / -1; } }
    .ftab { padding: 7px 14px; border-radius: 99px; border: 1.5px solid var(--border); background: var(--white); color: var(--text-2); font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif; white-space: nowrap; }
    .ftab.on { background: var(--text); color: var(--white); border-color: var(--text); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s ease; }
  `

  if (admin === false) {
    return (
      <>
        <style>{css}</style>
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          <nav className="nav"><span className="k" style={{ fontSize: '17px' }}>Projects · Admin</span></nav>
          <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔒</div>
            <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>You&apos;re not authorized to view this page.</p>
          </div>
        </div>
      </>
    )
  }

  const counts: Record<string, number> = { all: items.length }
  items.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1 })
  const shown = filter === 'all' ? items : items.filter((i) => i.status === filter)
  const tabs = ['all', 'quote_requested', 'quoted', 'in_progress', 'ready', 'delivered']

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav className="nav">
          <button onClick={() => router.push('/admin')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="k" style={{ fontSize: '17px' }}>🛠️ Projects · Admin</span>
        </nav>

        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '20px 20px 80px' }}>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
            {tabs.map((t) => (
              <button key={t} className={'ftab' + (filter === t ? ' on' : '')} onClick={() => setFilter(t)}>
                {t === 'all' ? 'All' : STATUS_META[t].text} {counts[t] ? '· ' + counts[t] : ''}
              </button>
            ))}
          </div>

          {loading && <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Loading…</p>}
          {!loading && shown.length === 0 && (
            <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '6px', opacity: 0.7 }}>🗂️</div>
              <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Nothing here yet.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shown.map((it) => {
              const st = STATUS_META[it.status] || STATUS_META.quote_requested
              const d = draft[it.id] || { price: '', advance: '', note: '' }
              const balance = (it.quotePrice != null && it.advanceAmount != null) ? Math.max(0, it.quotePrice - it.advanceAmount) : null
              return (
                <div className="card fade-in" key={it.id} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px' }}>{CAT_EMOJI[it.category] || '✨'}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="k" style={{ fontSize: '15px', lineHeight: 1.3 }}>{it.topic}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{it.category} · Class {it.classLevel} · due {new Date(it.deadline).toLocaleDateString()}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>{it.buyerName || 'student'} · 📞 {it.phone}{it.size ? ' · ' + it.size : ''}</div>
                      </div>
                    </div>
                    <span className="pill" style={{ color: st.color, background: st.bg, border: '1px solid ' + st.border, height: 'fit-content' }}>{st.emoji} {st.text}</span>
                  </div>

                  {it.photoUrl && <img src={it.photoUrl} alt="reference" style={{ marginTop: '12px', maxHeight: '160px', borderRadius: '10px', border: '1px solid var(--border)' }} />}
                  {it.description && <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '10px', lineHeight: 1.5 }}>{it.description}</p>}

                  {it.quotePrice != null && (
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span>Quoted <b style={{ color: 'var(--text)' }}>₹{it.quotePrice.toLocaleString()}</b></span>
                      <span>· advance ₹{it.advanceAmount?.toLocaleString()}</span>
                      <span>· balance ₹{balance?.toLocaleString()}</span>
                      {it.advancePaidPaise > 0 && <span style={{ color: 'var(--green-dark)', fontWeight: 700 }}>· advance PAID</span>}
                      {it.balancePaidPaise > 0 && <span style={{ color: 'var(--green-dark)', fontWeight: 700 }}>· balance PAID</span>}
                    </div>
                  )}

                  {(it.status === 'quote_requested' || it.status === 'quoted') && (
                    <div style={{ marginTop: '14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>{it.status === 'quoted' ? 'Update quote' : 'Send a quote'}</div>
                      <div className="g3">
                        <input className="inp" placeholder="Total ₹" inputMode="numeric" value={d.price} onChange={(e) => setDraftField(it.id, 'price', e.target.value.replace(/\D/g, ''))} />
                        <input className="inp" placeholder="Advance ₹" inputMode="numeric" value={d.advance} onChange={(e) => setDraftField(it.id, 'advance', e.target.value.replace(/\D/g, ''))} />
                        <input className="inp" placeholder="Note (optional)" value={d.note} onChange={(e) => setDraftField(it.id, 'note', e.target.value)} />
                      </div>
                      <button className="b b-primary" style={{ marginTop: '10px' }} disabled={busyId === it.id} onClick={() => sendQuote(it)}>
                        {it.status === 'quoted' ? 'Update quote' : 'Send quote →'}
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {it.status === 'in_progress' && (
                      <button className="b b-soft" disabled={busyId === it.id} onClick={() => setStatus(it, 'ready')}>Mark ready</button>
                    )}
                    {it.status === 'ready' && (
                      <>
                        <button className="b b-soft" disabled={busyId === it.id} onClick={() => setStatus(it, 'delivered', true)}>Delivered (cash)</button>
                        <span style={{ fontSize: '12px', color: 'var(--text-3)', alignSelf: 'center' }}>or student pays balance online</span>
                      </>
                    )}
                    {it.status !== 'delivered' && it.status !== 'cancelled' && (
                      <button className="b b-warn" disabled={busyId === it.id} onClick={() => setStatus(it, 'cancelled')}>Cancel</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}