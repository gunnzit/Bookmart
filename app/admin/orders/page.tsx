'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const ADMIN_ID = 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

const statusFlow = ['confirmed', 'assembling', 'ready', 'delivered']
const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  confirmed:  { label: 'Confirmed',  color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', emoji: '✅' },
  assembling: { label: 'Assembling', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', emoji: '📦' },
  ready:      { label: 'Ready',      color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', emoji: '🎒' },
  delivered:  { label: 'Delivered',  color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8', emoji: '🏠' },
}

export default function AdminOrdersPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || user?.id !== ADMIN_ID) { router.push('/'); return }
    fetchOrders()
  }, [isLoaded, isSignedIn, user])

  async function fetchOrders() {
    setLoading(true)
    const res = await fetch('/api/kit-orders?admin=true&clerkId=' + ADMIN_ID)
    const data = await res.json()
    if (Array.isArray(data)) setOrders(data)
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch('/api/kit-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, clerkId: ADMIN_ID }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    setUpdating(null)
  }

  function nextStatus(current: string) {
    const idx = statusFlow.indexOf(current)
    return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const stats = {
    total: orders.length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    assembling: orders.filter(o => o.status === 'assembling').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((s, o) => s + o.paidNow, 0),
    pending: orders.reduce((s, o) => s + o.payLater, 0),
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #F7F6F3; --white: #fff; --card: #fff; --border: #E5E2DA;
      --text: #1B2A4A; --text-2: #666; --text-3: #999;
      --green: #1D9E75; --shadow: 0 2px 12px rgba(27,42,74,0.07);
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0F1117; --white: #1A1D27; --card: #1E2130; --border: #2A2D3E; --text: #E8E6F0; --text-2: #A0A0B0; --text-3: #666880; --shadow: 0 2px 12px rgba(0,0,0,0.3); }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
    .k { font-family: 'Kalam', cursive; }
    .order-card { background: var(--card); border: 1.5px solid var(--border); border-radius: 16px; box-shadow: var(--shadow); overflow: hidden; transition: box-shadow 0.2s; }
    .order-card:hover { box-shadow: 0 8px 32px rgba(27,42,74,0.10); }
    .filter-btn { padding: 7px 16px; border-radius: 99px; border: 1.5px solid var(--border); background: var(--white); color: var(--text-2); font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
    .filter-btn.active { background: #1B2A4A; color: #fff; border-color: #1B2A4A; }
    .next-btn { border: none; border-radius: 10px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
    .next-btn:hover { transform: translateY(-1px); }
    .next-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    .fade-up { animation: fadeUp 0.3s ease both; }
    .item-pill { display: inline-flex; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 4px 10px; font-size: 11px; color: var(--text-2); margin: 3px; }
  `

  if (!isLoaded) return null

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--white)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow)' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>Admin — Kit Orders</span>
          <button onClick={fetchOrders} style={{ marginLeft: 'auto', background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>↻ Refresh</button>
        </nav>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'Total orders', value: stats.total, color: '#1B2A4A', bg: '#F7F6F3' },
              { label: 'Confirmed', value: stats.confirmed, color: '#3B82F6', bg: '#EFF6FF' },
              { label: 'Assembling', value: stats.assembling, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Ready', value: stats.ready, color: '#8B5CF6', bg: '#F5F3FF' },
              { label: 'Delivered', value: stats.delivered, color: '#1D9E75', bg: '#E8F7F2' },
              { label: 'Revenue', value: '₹' + stats.revenue.toLocaleString(), color: '#1D9E75', bg: '#E8F7F2' },
              { label: 'Pending COD', value: '₹' + stats.pending.toLocaleString(), color: '#F97316', bg: '#FFF7ED' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '14px 16px', border: '1.5px solid ' + (s.bg === '#F7F6F3' ? 'var(--border)' : 'transparent') }}>
                <div className="k" style={{ fontSize: '22px', color: s.color, marginBottom: '2px' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {['all', 'confirmed', 'assembling', 'ready', 'delivered'].map(f => (
              <button key={f} className={'filter-btn' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)} style={filter === f && f !== 'all' ? { background: statusConfig[f]?.color, borderColor: statusConfig[f]?.color } : {}}>
                {f === 'all' ? '📋 All' : statusConfig[f]?.emoji + ' ' + statusConfig[f]?.label}
              </button>
            ))}
          </div>

          {/* Orders list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
              <div>Loading orders…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>No orders here yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((order, idx) => {
                const sc = statusConfig[order.status] || statusConfig.confirmed
                const next = nextStatus(order.status)
                const nextSc = next ? statusConfig[next] : null
                const isExpanded = expandedId === order.id
                const items = Array.isArray(order.items) ? order.items : []
                return (
                  <div key={order.id} className="order-card fade-up" style={{ animationDelay: idx * 0.04 + 's' }}>
                    {/* Status bar */}
                    <div style={{ height: '4px', background: sc.color }} />

                    {/* Main row */}
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, border: '1.5px solid ' + sc.border }}>
                        {sc.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="k" style={{ fontSize: '16px', color: 'var(--text)' }}>Class {order.class} Kit</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: '99px', border: '1px solid ' + sc.border }}>{sc.emoji} {sc.label}</span>
                          {order.payLater > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#F97316', background: '#FFF7ED', padding: '2px 8px', borderRadius: '99px', border: '1px solid #FED7AA' }}>₹{order.payLater.toLocaleString()} COD</span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{order.buyerName} · {order.buyerPhone}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                          {order.deliveryMode === 'delivery' ? '🚚 Delivery — ' + order.address : '🏪 Pickup'} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="k" style={{ fontSize: '20px', color: '#1D9E75' }}>₹{order.paidNow.toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>paid · total ₹{order.totalAmount.toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{order.paymentMode === 'full' ? '💳 Full' : '🤝 30% upfront'}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: 'var(--text-3)' }}>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg)' }}>
                        {/* Items */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Items ({items.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {items.map((item: string, i: number) => (
                              <span key={i} className="item-pill">{item}</span>
                            ))}
                          </div>
                        </div>

                        {/* Payment breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                          {[
                            { l: 'Kit subtotal', v: '₹' + order.kitSubtotal?.toLocaleString() },
                            { l: 'Delivery fee', v: order.deliveryFee > 0 ? '₹' + order.deliveryFee : 'Free' },
                            { l: 'Paid now', v: '₹' + order.paidNow?.toLocaleString() },
                            { l: 'Due at ' + order.deliveryMode, v: order.payLater > 0 ? '₹' + order.payLater?.toLocaleString() : '—' },
                            { l: 'Payment ID', v: order.paymentId?.slice(-10) + '…' },
                          ].map(r => (
                            <div key={r.l} style={{ background: 'var(--card)', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>{r.l}</div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{r.v}</div>
                            </div>
                          ))}
                        </div>

                        {/* Status actions */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '600' }}>Move to:</div>
                          {statusFlow.filter(s => s !== order.status).map(s => {
                            const sc2 = statusConfig[s]
                            return (
                              <button key={s} className="next-btn" disabled={updating === order.id}
                                onClick={() => updateStatus(order.id, s)}
                                style={{ background: sc2.bg, color: sc2.color, border: '1.5px solid ' + sc2.border }}>
                                {updating === order.id ? '…' : sc2.emoji + ' ' + sc2.label}
                              </button>
                            )
                          })}
                          {/* WhatsApp buyer */}
                          <button onClick={() => window.open('https://wa.me/91' + order.buyerPhone.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hi ' + order.buyerName + ', your Class ' + order.class + ' kit is ' + statusConfig[order.status]?.label?.toLowerCase() + '. — BuddyBooks 📚'), '_blank')}
                            style={{ marginLeft: 'auto', background: '#E8F7F2', color: '#1D9E75', border: '1.5px solid #C0E8D8', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                            💬 WhatsApp buyer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}