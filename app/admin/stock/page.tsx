'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { kits } from '@/lib/kit-prices'

const ADMIN_ID = 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'
const STORE_NAME = 'BuddyBooks'

// Build the unique item list once, with which classes each item appears in.
function buildItemIndex() {
  const map = new Map<string, Set<number>>()
  for (const key of Object.keys(kits)) {
    const cls = Number(key)
    const kit = (kits as any)[cls]
    for (const it of [...kit.ncert, ...kit.pvt, ...kit.stationery]) {
      if (!map.has(it.name)) map.set(it.name, new Set())
      map.get(it.name)!.add(cls)
    }
    for (const nb of kit.notebooks) {
      if (!map.has(nb.name)) map.set(nb.name, new Set())
      map.get(nb.name)!.add(cls)
    }
  }
  return Array.from(map.entries())
    .map(([name, classes]) => ({ name, classes: Array.from(classes).sort((a, b) => a - b) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default function AdminStockPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()
  const [tab, setTab] = useState<'stock' | 'notify'>('stock')
  const [oos, setOos] = useState<Set<string>>(new Set())
  const [notifies, setNotifies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const items = buildItemIndex()

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || user?.id !== ADMIN_ID) { router.push('/'); return }
    load()
  }, [isLoaded, isSignedIn, user])

  async function load() {
    setLoading(true)
    try {
      const [s, n] = await Promise.all([
        fetch('/api/stock').then(r => r.json()),
        fetch('/api/stock/notify').then(r => r.json()),
      ])
      if (s?.outOfStock) setOos(new Set(s.outOfStock))
      if (Array.isArray(n)) setNotifies(n)
    } catch {}
    setLoading(false)
  }

  async function toggle(name: string, currentlyOOS: boolean) {
    setBusy(name)
    const inStock = currentlyOOS // if it's currently OOS and we click, we set it back IN stock
    const res = await fetch('/api/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemName: name, inStock }),
    })
    if (res.ok) {
      setOos(prev => {
        const next = new Set(prev)
        if (inStock) next.delete(name); else next.add(name)
        return next
      })
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Could not update')
    }
    setBusy(null)
  }

  async function markNotified(id: string) {
    await fetch('/api/stock/notify', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notified: true }),
    })
    setNotifies(prev => prev.map(n => n.id === id ? { ...n, notified: true } : n))
  }

  async function removeNotify(id: string) {
    if (!confirm('Remove this request from the list?')) return
    await fetch('/api/stock/notify', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delete: true }),
    })
    setNotifies(prev => prev.filter(n => n.id !== id))
  }

  const shownItems = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
  const waiting = notifies.filter(n => !n.notified)

  // group notify requests by item
  const byItem = new Map<string, any[]>()
  for (const n of notifies) {
    if (!byItem.has(n.itemName)) byItem.set(n.itemName, [])
    byItem.get(n.itemName)!.push(n)
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg:#F7F6F3; --white:#fff; --card:#fff; --border:#E5E2DA; --text:#1B2A4A; --text-2:#666; --text-3:#999; --shadow:0 2px 12px rgba(27,42,74,0.07); }
    @media (prefers-color-scheme: dark){ :root{ --bg:#0F1117; --white:#1A1D27; --card:#1E2130; --border:#2A2D3E; --text:#E8E6F0; --text-2:#A0A0B0; --text-3:#666880; --shadow:0 2px 12px rgba(0,0,0,0.3);} }
    body{ background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--text); }
    .k{ font-family:'Kalam',cursive; }
    input{ color:var(--text)!important; background:var(--bg)!important; }
    .tab{ padding:8px 18px; border:none; background:transparent; color:var(--text-2); font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; border-radius:8px; }
    .tab.active{ background:#1B2A4A; color:#fff; }
    .toggle-btn{ border:none; border-radius:8px; padding:6px 14px; font-size:12px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }
    .row{ display:flex; align-items:center; gap:12px; padding:10px 14px; border-bottom:1px solid var(--border); }
  `

  if (!isLoaded) return null

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{ background: 'var(--white)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow)' }}>
          <button onClick={() => router.push('/admin/orders')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)' }}>←</button>
          <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>Admin — Stock & Notify</span>
          <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>↻ Refresh</button>
        </nav>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
            <button className={'tab' + (tab === 'stock' ? ' active' : '')} onClick={() => setTab('stock')}>📦 Manage stock ({oos.size} out)</button>
            <button className={'tab' + (tab === 'notify' ? ' active' : '')} onClick={() => setTab('notify')}>🔔 Notify list ({waiting.length} waiting)</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)' }}>Loading…</div>
          ) : tab === 'stock' ? (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px', lineHeight: 1.5 }}>
                Toggle an item <strong>Out of stock</strong> and it becomes unavailable on the kit page everywhere it appears, with a “Notify me” button for customers. Toggle it back when restocked.
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '14px' }} />

              <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                {shownItems.map(it => {
                  const isOOS = oos.has(it.name)
                  return (
                    <div key={it.name} className="row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{it.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Classes {it.classes.join(', ')}</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '99px', background: isOOS ? '#FEE2E2' : '#E8F7F2', color: isOOS ? '#DC2626' : '#1D9E75' }}>
                        {isOOS ? '🚫 Out of stock' : '✅ In stock'}
                      </span>
                      <button className="toggle-btn" disabled={busy === it.name} onClick={() => toggle(it.name, isOOS)}
                        style={{ background: isOOS ? '#E8F7F2' : '#FEE2E2', color: isOOS ? '#1D9E75' : '#DC2626', minWidth: '110px' }}>
                        {busy === it.name ? '…' : isOOS ? 'Mark in stock' : 'Mark out'}
                      </button>
                    </div>
                  )
                })}
                {shownItems.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>No items match “{search}”.</div>}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px', lineHeight: 1.5 }}>
                People waiting to be told when an item is back. WhatsApp them, then tap <strong>Mark notified</strong>.
              </div>
              {byItem.size === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: '34px', marginBottom: '10px' }}>🔔</div>No one waiting yet.
                </div>
              ) : (
                Array.from(byItem.entries()).map(([itemName, reqs]) => {
                  const stillOOS = oos.has(itemName)
                  return (
                    <div key={itemName} style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '14px', marginBottom: '14px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{itemName}</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px', background: stillOOS ? '#FEE2E2' : '#E8F7F2', color: stillOOS ? '#DC2626' : '#1D9E75' }}>
                          {stillOOS ? 'still out of stock' : 'back in stock'}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)' }}>{reqs.length} waiting</span>
                      </div>
                      {reqs.map((n: any) => (
                        <div key={n.id} className="row" style={{ opacity: n.notified ? 0.5 : 1 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{n.buyerName || 'Customer'} · {n.phone}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{n.notified ? ' · notified ✓' : ''}</div>
                          </div>
                          <button onClick={() => window.open('https://wa.me/91' + String(n.phone).replace(/\D/g, '') + '?text=' + encodeURIComponent('Hi' + (n.buyerName ? ' ' + n.buyerName : '') + ', good news — "' + itemName + '" is back in stock at ' + STORE_NAME + '! You can order it now. 📚'), '_blank')}
                            style={{ background: '#E8F7F2', color: '#1D9E75', border: '1.5px solid #C0E8D8', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                            💬 WhatsApp
                          </button>
                          {!n.notified && (
                            <button onClick={() => markNotified(n.id)} style={{ background: '#EFF6FF', color: '#3B82F6', border: '1.5px solid #BFDBFE', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>✓ Mark notified</button>
                          )}
                          <button onClick={() => removeNotify(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}