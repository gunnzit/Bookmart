'use client'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; emoji: string; desc: string }> = {
  confirmed:  { label: 'Order Confirmed',  color: '#2D7FF9', bg: '#E3F0FF', border: '#BFDBFE', emoji: '✅', desc: "We've received your order and payment." },
  assembling: { label: 'Being Assembled',  color: '#FF6B2C', bg: '#FFEDE2', border: '#FED7AA', emoji: '📦', desc: "Your kit is being assembled at the store." },
  ready:      { label: 'Ready!',           color: '#7C5CFC', bg: '#EFEAFF', border: '#DDD6FE', emoji: '🎒', desc: 'Your kit is packed and ready.' },
  delivered:  { label: 'Delivered',        color: '#00B86B', bg: '#DFFFEF', border: '#9DEAC4', emoji: '🏠', desc: 'Kit delivered. Enjoy the new school year!' },
}

const statusSteps = ['confirmed', 'assembling', 'ready', 'delivered']

export default function MyOrdersPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    fetch('/api/kit-orders?clerkId=' + user.id)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isLoaded, isSignedIn, user])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FFF9F0; --white: #fff; --card: #fff; --border: #FFE2C2; --border-strong: #FFCB94;
      --text: #1A1330; --text-2: #6B6280; --text-3: #A89FC0;
      --green: #00B86B; --shadow: 0 2px 14px rgba(124,92,252,0.08); --r: 18px;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #14101F; --white: #1C1730; --card: #221C3A; --border: #352C52; --border-strong: #463A6B; --text: #F3EEFF; --text-2: #B0A8CC; --text-3: #6E6590; --shadow: 0 2px 14px rgba(0,0,0,0.4); }
    }
    body { background: var(--bg); font-family: 'Poppins', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
    .k { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
    .order-card { background: var(--card); border: 2px solid var(--border); border-radius: var(--r); box-shadow: var(--shadow); overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; }
    .order-card:hover { box-shadow: 0 12px 36px rgba(124,92,252,0.14); transform: translateY(-2px); }
    .item-pill { display: inline-flex; background: var(--bg); border: 2px solid var(--border); border-radius: 8px; padding: 5px 11px; font-size: 11px; color: var(--text-2); margin: 3px; font-weight: 600; }
    .btn-3d { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; }
    .btn-3d:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #009957 !important; }
    .btn-3d:active { transform: translateY(2px); box-shadow: 0 1px 0 #009957 !important; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    .fade-up { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .pulse { animation: pulse 1.5s ease-in-out infinite; }
  `

  if (!isLoaded) return null

  if (!isSignedIn) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '320px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📦</div>
          <h2 className="k" style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>Track your orders</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '24px', lineHeight: 1.6, fontWeight: '500' }}>Sign in to see your school kit orders and track their status.</p>
          <SignInButton mode="modal">
            <button className="btn-3d" style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px 28px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>Sign in to view orders</button>
          </SignInButton>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--white)', borderBottom: '2px solid var(--border)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow)' }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'none', border: '2px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>My Orders</span>
          <button onClick={() => router.push('/school-sets')} style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#FFF6DD,#FFEDE2)', border: '2px solid #FFCB94', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: '800', color: '#FF6B2C', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            🎒 Order another kit
          </button>
        </nav>

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px 60px' }}>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2].map(i => (
                <div key={i} style={{ background: 'var(--card)', borderRadius: 'var(--r)', height: '120px', border: '2px solid var(--border)' }} className="pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>📦</div>
              <h2 className="k" style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>No orders yet</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '24px', lineHeight: 1.6, fontWeight: '500' }}>Order a school kit and track it here in real time.</p>
              <button onClick={() => router.push('/school-sets')} className="btn-3d"
                style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px 28px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>
                Browse school kits →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '4px', fontWeight: '600' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
              {orders.map((order, idx) => {
                const sc = statusConfig[order.status] || statusConfig.confirmed
                const currentStep = statusSteps.indexOf(order.status)
                const isExpanded = expandedId === order.id
                const items = Array.isArray(order.items) ? order.items : []

                return (
                  <div key={order.id} className="order-card fade-up" style={{ animationDelay: idx * 0.06 + 's' }}>
                    {/* Color bar */}
                    <div style={{ height: '5px', background: 'linear-gradient(90deg, ' + sc.color + ', ' + sc.color + '88)' }} />

                    {/* Header */}
                    <div style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>Class {order.class} Kit 🎒</span>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: sc.color, background: sc.bg, padding: '4px 11px', borderRadius: '99px', border: '2px solid ' + sc.border }}>
                              {sc.emoji} {sc.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '500' }}>
                            {order.school} · Ordered {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', fontWeight: '500' }}>
                            {order.deliveryMode === 'delivery' ? '🚚 Home delivery' : '🏪 Pickup from Sector-40C'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div className="k" style={{ fontSize: '20px', color: '#00B86B' }}>₹{order.paidNow.toLocaleString()}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '500' }}>paid</div>
                          {order.payLater > 0 && (
                            <div style={{ fontSize: '11px', color: '#FF6B2C', fontWeight: '800', marginTop: '3px' }}>₹{order.payLater.toLocaleString()} at {order.deliveryMode === 'pickup' ? 'pickup' : 'delivery'}</div>
                          )}
                        </div>
                      </div>

                      {/* Progress tracker */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                        {statusSteps.map((step, i) => {
                          const done = i <= currentStep
                          const current = i === currentStep
                          const sc2 = statusConfig[step]
                          return (
                            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < statusSteps.length - 1 ? 1 : 'none' }}>
                              <div title={sc2.label} style={{ width: '32px', height: '32px', borderRadius: '50%', background: done ? sc2.color : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? '14px' : '11px', border: current ? '2.5px solid ' + sc2.color : 'none', boxShadow: current ? '0 0 0 4px ' + sc2.color + '33' : 'none', transition: 'all 0.3s', flexShrink: 0 }}>
                                {done ? sc2.emoji : <span style={{ color: 'var(--text-3)' }}>{i + 1}</span>}
                              </div>
                              {i < statusSteps.length - 1 && (
                                <div style={{ flex: 1, height: '3px', background: i < currentStep ? sc.color : 'var(--border)', transition: 'background 0.3s', margin: '0 2px' }} />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Current status desc */}
                      <div style={{ marginTop: '10px', fontSize: '12px', color: sc.color, fontWeight: '700', background: sc.bg, borderRadius: '10px', padding: '8px 12px', border: '2px solid ' + sc.border }}>
                        {sc.emoji} {sc.desc}
                      </div>
                    </div>

                    {/* Expanded items */}
                    {isExpanded && (
                      <div style={{ borderTop: '2px solid var(--border)', padding: '16px 20px', background: 'var(--bg)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Items in your kit</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '16px' }}>
                          {items.map((item: string, i: number) => (
                            <span key={i} className="item-pill">{item}</span>
                          ))}
                        </div>

                        {/* Payment summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                          {[
                            { l: 'Total', v: '₹' + order.totalAmount?.toLocaleString() },
                            { l: 'Paid now', v: '₹' + order.paidNow?.toLocaleString() },
                            order.payLater > 0 ? { l: 'Due at ' + order.deliveryMode, v: '₹' + order.payLater?.toLocaleString() } : null,
                            { l: 'Payment', v: order.paymentMode === 'full' ? '💳 Full' : '🤝 30% upfront' },
                          ].filter(Boolean).map((r: any) => (
                            <div key={r.l} style={{ background: 'var(--card)', borderRadius: '10px', padding: '10px 12px', border: '2px solid var(--border)' }}>
                              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>{r.l}</div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{r.v}</div>
                            </div>
                          ))}
                        </div>

                        {/* Contact store */}
                        <button onClick={() => window.open('https://wa.me/919914735738?text=' + encodeURIComponent('Hi, I have a query about my Class ' + order.class + ' kit order (ID: ' + order.id.slice(-8) + ')'), '_blank')}
                          style={{ width: '100%', background: '#DFFFEF', color: '#00B86B', border: '2px solid #9DEAC4', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Contact store about this order
                        </button>
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