'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const ADMIN_ID = 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

export default function AdminHubPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()
  const [badges, setBadges] = useState<{ cancelReqs: number; notifyWaiting: number; pendingListings: number }>({ cancelReqs: 0, notifyWaiting: 0, pendingListings: 0 })

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || user?.id !== ADMIN_ID) { router.push('/'); return }
    loadBadges()
  }, [isLoaded, isSignedIn, user])

  async function loadBadges() {
    // each fetch fails silently so one broken endpoint never blanks the hub
    const next = { cancelReqs: 0, notifyWaiting: 0, pendingListings: 0 }
    try {
      const orders = await fetch('/api/kit-orders').then(r => r.json())
      if (Array.isArray(orders)) next.cancelReqs = orders.filter((o: any) => o.status === 'cancellation_requested').length
    } catch {}
    try {
      const notifies = await fetch('/api/stock/notify').then(r => r.json())
      if (Array.isArray(notifies)) next.notifyWaiting = notifies.filter((n: any) => !n.notified).length
    } catch {}
    try {
      const listings = await fetch('/api/listings?admin=true&t=' + Date.now(), { cache: 'no-store' }).then(r => r.json())
      if (Array.isArray(listings)) next.pendingListings = listings.filter((l: any) => l.status === 'pending').length
    } catch {}
    setBadges(next)
  }

  const cards = [
    { title: 'Listings', desc: 'Approve, edit, feature & manage book listings', emoji: '📚', href: '/admin', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', badge: badges.pendingListings, badgeLabel: 'pending' },
    { title: 'Kit Orders', desc: 'School kit orders, statuses & cancellations', emoji: '📦', href: '/admin/orders', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', badge: badges.cancelReqs, badgeLabel: 'cancel reqs' },
    { title: 'Stock & Notify', desc: 'Mark items out of stock & see who is waiting', emoji: '🔔', href: '/admin/stock', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', badge: badges.notifyWaiting, badgeLabel: 'waiting' },
  ]

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg:#F7F6F3; --white:#fff; --card:#fff; --border:#E5E2DA; --text:#1B2A4A; --text-2:#666; --text-3:#999; --shadow:0 2px 12px rgba(27,42,74,0.07); }
    @media (prefers-color-scheme: dark){ :root{ --bg:#0F1117; --white:#1A1D27; --card:#1E2130; --border:#2A2D3E; --text:#E8E6F0; --text-2:#A0A0B0; --text-3:#666880; --shadow:0 2px 12px rgba(0,0,0,0.3);} }
    body{ background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--text); }
    .k{ font-family:'Kalam',cursive; }
    .hub-card{ background:var(--card); border:1.5px solid var(--border); border-radius:18px; padding:22px; cursor:pointer; transition:transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s, border-color 0.15s; text-align:left; width:100%; font-family:'DM Sans',sans-serif; position:relative; display:flex; align-items:center; gap:18px; }
    .hub-card:hover{ transform:translateY(-3px); box-shadow:0 12px 32px rgba(27,42,74,0.12); }
    .hub-card:active{ transform:scale(0.98); }
  `

  if (!isLoaded) return null

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{ background: 'var(--white)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow)' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>⚙️ Admin Hub</span>
          <button onClick={loadBadges} style={{ marginLeft: 'auto', background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>↻ Refresh</button>
        </nav>

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px 60px' }}>
          <div style={{ marginBottom: '8px' }}>
            <h1 className="k" style={{ fontSize: '26px', color: 'var(--text)' }}>Hi {user?.firstName || 'there'} 👋</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: '500', marginTop: '2px' }}>Everything in one place. Tip: bookmark this page for one-tap access.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            {cards.map(c => (
              <button key={c.title} className="hub-card" onClick={() => router.push(c.href)} style={{ borderColor: c.badge > 0 ? c.border : 'var(--border)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0, border: '1.5px solid ' + c.border }}>{c.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="k" style={{ fontSize: '19px', color: 'var(--text)' }}>{c.title}</span>
                    {c.badge > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff', background: c.color, padding: '2px 9px', borderRadius: '99px' }}>{c.badge} {c.badgeLabel}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px', fontWeight: '500' }}>{c.desc}</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: c.color }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '24px', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '14px', padding: '16px 18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>💡 Make this even faster</div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: '500' }}>
              Bookmark <strong>buddybooks.in/admin/hub</strong> in your phone/browser. On a phone you can “Add to Home Screen” so it opens like an app — one tap, no typing.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}