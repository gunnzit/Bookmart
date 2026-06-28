'use client'
import { useState, useEffect, useCallback } from 'react'
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

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  quote_requested: { text: 'New — needs quote', color: '#92400E', bg: '#FFFBEB' },
  quoted: { text: 'Quoted', color: '#1D4ED8', bg: '#EFF6FF' },
  in_progress: { text: 'In progress', color: '#7C3AED', bg: '#F5F3FF' },
  ready: { text: 'Ready', color: '#B45309', bg: '#FFF7ED' },
  delivered: { text: 'Delivered', color: '#047857', bg: '#ECFDF5' },
  cancelled: { text: 'Cancelled', color: '#B91C1C', bg: '#FEF2F2' },
}

export default function AdminProjectsPage() {
  const { isSignedIn } = useUser()
  const [items, setItems] = useState<ProjectRequest[]>([])
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, { price: string; advance: string; note: string }>>({})

  const refresh = useCallback(async () => {
    if (!isSignedIn) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects/list')
      if (res.ok) {
        const d = await res.json()
        setItems(d.items || [])
        setAdmin(!!d.admin)
      } else {
        setAdmin(false)
      }
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
    if (!(quotePrice > 0) || !(advanceAmount >= 0) || advanceAmount > quotePrice) {
      alert('Enter a valid total and an advance between 0 and the total.')
      return
    }
    setBusyId(it.id)
    try {
      const res = await fetch('/api/projects/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: it.id, status, markBalancePaidCash }),
      })
      if (res.ok) refresh()
      else { const e = await res.json().catch(() => ({})); alert(e.error || 'Could not update.') }
    } catch { alert('Something went wrong.') }
    setBusyId(null)
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    .ap { font-family: 'Poppins', sans-serif; color: #1A1330; max-width: 820px; margin: 0 auto; padding: 24px 18px 80px; }
    .ap h1 { font-size: 24px; font-weight: 800; margin: 0 0 18px; }
    .card { background: #fff; border: 1.5px solid #E5E1F0; border-radius: 14px; padding: 16px; margin-bottom: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
    .ap input, .ap textarea { border: 1.5px solid #E5E1F0; border-radius: 9px; padding: 8px 10px; font-size: 13px; font-family: 'Poppins', sans-serif; width: 100%; outline: none; }
    .ap input:focus, .ap textarea:focus { border-color: #00B86B; }
    .pill { display: inline-block; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 99px; }
    .b { border: none; border-radius: 9px; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif; }
    .b-primary { background: linear-gradient(135deg,#00B86B,#2D7FF9); color: #fff; }
    .b-soft { background: #EFEAFF; color: #6D28D9; border: 1.5px solid #DDD6FE; }
    .b-warn { background: #FEF2F2; color: #B91C1C; border: 1.5px solid #FCA5A5; }
    .b:disabled { opacity: 0.6; cursor: not-allowed; }
    .muted { color: #6B6280; font-size: 13px; }
    .g3 { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 8px; }
    @media (max-width: 560px) { .g3 { grid-template-columns: 1fr; } }
  `

  if (admin === false) {
    return (
      <>
        <style>{css}</style>
        <div className="ap"><h1>Projects — Admin</h1><p className="muted">You&apos;re not authorized to view this page.</p></div>
      </>
    )
  }

  return (
    <>
      <style>{css}</style>
      <div className="ap">
        <h1>Projects — Admin</h1>
        {loading && <p className="muted">Loading…</p>}
        {!loading && items.length === 0 && <p className="muted">No requests yet.</p>}

        {items.map((it) => {
          const st = STATUS_LABEL[it.status] || STATUS_LABEL.quote_requested
          const d = draft[it.id] || { price: '', advance: '', note: '' }
          const balance = (it.quotePrice != null && it.advanceAmount != null) ? Math.max(0, it.quotePrice - it.advanceAmount) : null
          return (
            <div className="card" key={it.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{it.topic}</div>
                  <div className="muted">{it.category} · Class {it.classLevel} · due {new Date(it.deadline).toLocaleDateString()}</div>
                  <div className="muted">{it.buyerName || 'student'} · 📞 {it.phone}</div>
                  {it.size && <div className="muted">Size: {it.size}</div>}
                </div>
                <span className="pill" style={{ color: st.color, background: st.bg, height: 'fit-content' }}>{st.text}</span>
              </div>

              {it.photoUrl && <img src={it.photoUrl} alt="reference" style={{ marginTop: '10px', maxHeight: '150px', borderRadius: '10px' }} />}
              {it.description && <p className="muted" style={{ marginTop: '8px' }}>{it.description}</p>}

              {it.quotePrice != null && (
                <div className="muted" style={{ marginTop: '8px' }}>
                  Quoted ₹{it.quotePrice} · advance ₹{it.advanceAmount} · balance ₹{balance}
                  {it.advancePaidPaise > 0 && ' · advance PAID'}
                  {it.balancePaidPaise > 0 && ' · balance PAID'}
                </div>
              )}

              {/* Send / update quote */}
              {(it.status === 'quote_requested' || it.status === 'quoted') && (
                <div style={{ marginTop: '12px' }}>
                  <div className="g3">
                    <input placeholder="Total ₹" inputMode="numeric" value={d.price} onChange={(e) => setDraftField(it.id, 'price', e.target.value.replace(/\D/g, ''))} />
                    <input placeholder="Advance ₹" inputMode="numeric" value={d.advance} onChange={(e) => setDraftField(it.id, 'advance', e.target.value.replace(/\D/g, ''))} />
                    <input placeholder="Note (optional)" value={d.note} onChange={(e) => setDraftField(it.id, 'note', e.target.value)} />
                  </div>
                  <button className="b b-primary" style={{ marginTop: '10px' }} disabled={busyId === it.id} onClick={() => sendQuote(it)}>
                    {it.status === 'quoted' ? 'Update quote' : 'Send quote'}
                  </button>
                </div>
              )}

              {/* Status actions */}
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {it.status === 'in_progress' && (
                  <button className="b b-soft" disabled={busyId === it.id} onClick={() => setStatus(it, 'ready')}>Mark ready</button>
                )}
                {it.status === 'ready' && (
                  <>
                    <button className="b b-soft" disabled={busyId === it.id} onClick={() => setStatus(it, 'delivered', true)}>Delivered (balance in cash)</button>
                    <span className="muted" style={{ alignSelf: 'center' }}>or student pays balance online</span>
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
    </>
  )
}