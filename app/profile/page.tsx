'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const conditions = ['New', 'Good', 'Fair']

export default function ProfilePage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active')

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mine = data.filter((l: any) => l.sellerId === user?.id)
          setListings(mine)
          if (mine.length > 0 && mine[0].seller?.phone) setPhone(mine[0].seller.phone)
        }
        setLoading(false)
      })
  }, [isSignedIn, user])

  async function savePhone() {
    if (!phone.trim()) return
    setSavingPhone(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user?.id, phone: phone.trim() }),
    })
    setSavingPhone(false)
    setPhoneSaved(true)
    setTimeout(() => setPhoneSaved(false), 2000)
  }

  function startEdit(l: any) {
    setEditingId(l.id)
    setForm({ title: l.title, subtitle: l.subtitle || '', price: l.price, origPrice: l.origPrice || '', condition: l.condition, location: l.location })
  }

  async function handleSave(id: string) {
    setSaving(true)
    const res = await fetch('/api/listings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const updated = await res.json()
    setListings(listings.map(l => l.id === id ? { ...l, ...updated } : l))
    setEditingId(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing?')) return
    await fetch('/api/listings/' + id, { method: 'DELETE' })
    setListings(listings.filter(l => l.id !== id))
  }

  async function toggleSold(id: string, currentSold: boolean) {
    await fetch('/api/listings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sold: !currentSold }) })
    setListings(listings.map(l => l.id === id ? { ...l, sold: !currentSold } : l))
  }

  const activeListings = listings.filter(l => !l.sold)
  const soldListings = listings.filter(l => l.sold)
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0)
  const totalEarnings = soldListings.reduce((sum, l) => sum + l.price, 0)
  const tabListings = activeTab === 'active' ? activeListings : soldListings

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FFF9F0; --bg-card: #fff; --bg-input: #FFF9F0; --bg-prefix: #FFF3E0;
      --nav-bg: #fff; --border: #FFE2C2; --border-strong: #FFCB94; --text-primary: #1A1330; --text-secondary: #6B6280;
      --text-muted: #A89FC0; --text-label: #A89FC0; --divider: #FFE2C2;
      --shadow-nav: 0 2px 12px rgba(124,92,252,0.06); --shadow-card: 0 2px 16px rgba(124,92,252,0.08);
      --img-bg: #FFF3E0; --cond-bg: #fff; --cond-active: #DFFFEF;
      --relist-bg: #FFF6DD; --relist-color: #B8860B;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #14101F; --bg-card: #221C3A; --bg-input: #1C1730; --bg-prefix: #2A2342;
        --nav-bg: #1C1730; --border: #352C52; --border-strong: #463A6B; --text-primary: #F3EEFF; --text-secondary: #B0A8CC;
        --text-muted: #6E6590; --text-label: #6E6590; --divider: #352C52;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3); --shadow-card: 0 2px 16px rgba(0,0,0,0.25);
        --img-bg: #2A2342; --cond-bg: #2A2342; --cond-active: #0A3A26;
        --relist-bg: #3D3315; --relist-color: #D4A017;
      }
    }
    body { background: var(--bg); font-family: 'Poppins', sans-serif; color: var(--text-primary); -webkit-font-smoothing: antialiased; }
    .kalam { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
    input { color: var(--text-primary) !important; font-weight: 500; background: var(--bg-input) !important; font-family: 'Poppins', sans-serif; }
    input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
    input:focus { outline: none !important; border-color: #00B86B !important; box-shadow: 0 0 0 3px rgba(0,184,107,0.12) !important; }
    .stat-card { background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 16px; text-align: center; transition: transform 0.15s; }
    .stat-card:hover { transform: translateY(-2px); }
    .listing-row { transition: background 0.15s; }
    .listing-row:hover { background: var(--bg) !important; }
    .action-btn { border: none; border-radius: 8px; padding: 6px 11px; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1); white-space: nowrap; }
    .action-btn:hover { transform: translateY(-2px); }
    .action-btn:active { transform: scale(0.94); }
    .btn-3d { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; }
    .btn-3d:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 6px 0 #009957 !important; }
    .btn-3d:not(:disabled):active { transform: translateY(2px); box-shadow: 0 1px 0 #009957 !important; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    .s1 { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
    .s2 { animation: slideUp 0.4s 0.06s cubic-bezier(0.22,1,0.36,1) both; }
    .s3 { animation: slideUp 0.4s 0.12s cubic-bezier(0.22,1,0.36,1) both; }
    @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    .skeleton { background: linear-gradient(90deg, var(--bg-card) 25%, var(--divider) 50%, var(--bg-card) 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 14px; }
  `

  if (!isSignedIn) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>🔒</div>
          <div className="kalam" style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>Sign in to view your profile</div>
          <button onClick={() => router.push('/')} className="btn-3d" style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '13px 28px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>Go to marketplace</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '2px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', transition: 'all 0.15s', flexShrink: 0 }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '28px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>My Profile</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button onClick={() => router.push('/my-orders')}
              style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
              📦 My Orders
            </button>
            <button onClick={() => router.push('/wishlist')}
              style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
              ❤️ Wishlist
            </button>
            <button onClick={() => router.push('/sell')} className="btn-3d"
              style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 3px 0 #009957' }}>
              + Sell
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 60px' }}>

          {/* Profile hero */}
          <div className="s1" style={{ background: 'linear-gradient(135deg, #1A1330 0%, #00B86B 60%, #2D7FF9 100%)', backgroundSize: '200% 200%', borderRadius: '24px', padding: '28px 24px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div className="kalam" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
                  {user?.firstName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>{user?.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
                  {phone && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '3px' }}>📱 +91 {phone}</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Listed', value: listings.length, icon: '📚' },
                  { label: 'Active', value: activeListings.length, icon: '✅' },
                  { label: 'Sold', value: soldListings.length, icon: '🏷️' },
                  { label: 'Views', value: totalViews, icon: '👁️' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.14)' }}>
                    <div style={{ fontSize: '16px', marginBottom: '3px' }}>{s.icon}</div>
                    <div className="kalam" style={{ fontSize: '20px', color: '#fff', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', fontWeight: '500' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {soldListings.length > 0 && (
                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span style={{ fontSize: '16px' }}>💰</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>Estimated earnings from sold items:</span>
                  <span className="kalam" style={{ fontSize: '18px', color: '#FFC83D', marginLeft: 'auto' }}>₹{totalEarnings}</span>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp number */}
          <div className="s2" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '2px solid var(--border)', padding: '20px 22px', marginBottom: '16px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '32px', height: '32px', background: '#DFFFEF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>💬</div>
              <div className="kalam" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>WhatsApp number</div>
              {phone.length === 10 && <span style={{ fontSize: '10px', background: '#DFFFEF', color: '#009957', padding: '3px 9px', borderRadius: '99px', fontWeight: '800', marginLeft: 'auto' }}>✓ Set</span>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '500' }}>Buyers contact you on this number. Make sure it's correct.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-prefix)', border: '2px solid var(--border)', borderRadius: '10px', padding: '0 12px', fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0, gap: '4px', fontWeight: '600' }}>
                🇮🇳 <span>+91</span>
              </div>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                style={{ flex: 1, padding: '11px 13px', borderRadius: '10px', border: `2px solid ${phone.length === 10 ? '#00B86B' : 'var(--border)'}`, fontSize: '13px', fontFamily: 'Poppins, sans-serif', transition: 'all 0.15s' }} />
              <button onClick={savePhone} disabled={savingPhone || phone.length < 10}
                style={{ background: phoneSaved ? '#DFFFEF' : 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: phoneSaved ? '#009957' : '#fff', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: '800', cursor: phone.length < 10 ? 'not-allowed' : 'pointer', opacity: phone.length < 10 ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s', boxShadow: phoneSaved || phone.length < 10 ? 'none' : '0 3px 0 #009957' }}>
                {phoneSaved ? '✅ Saved!' : savingPhone ? '…' : 'Save'}
              </button>
            </div>
            {phone.length > 0 && phone.length < 10 && (
              <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>⚠️ Enter a 10-digit number</div>
            )}
          </div>

          {/* Listings tabs */}
          <div className="s3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '12px', padding: '4px', border: '2px solid var(--border)' }}>
                {(['active', 'sold'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', background: activeTab === tab ? 'linear-gradient(135deg,#00B86B,#2D7FF9)' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--text-secondary)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Poppins, sans-serif' }}>
                    {tab === 'active' ? `Active (${activeListings.length})` : `Sold (${soldListings.length})`}
                  </button>
                ))}
              </div>
              <button onClick={() => router.push('/sell')}
                style={{ background: '#DFFFEF', color: '#009957', border: '2px solid #9DEAC4', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
                + New listing
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '76px' }} />)}
              </div>
            ) : tabListings.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '2px solid var(--border)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{activeTab === 'active' ? '📭' : '🏷️'}</div>
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {activeTab === 'active' ? 'No active listings' : 'No sold listings yet'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: '500' }}>
                  {activeTab === 'active' ? 'Post your first item and start selling!' : 'Mark items as sold when they are gone.'}
                </div>
                {activeTab === 'active' && (
                  <button onClick={() => router.push('/sell')} className="btn-3d" style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '800', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>Post a listing</button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tabListings.map(l => (
                  <div key={l.id} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: editingId === l.id ? '2px solid #00B86B' : '2px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    {editingId === l.id ? (
                      <div style={{ padding: '18px' }}>
                        <div className="kalam" style={{ fontSize: '15px', color: '#00B86B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>✏️ Edit listing</div>
                        {['title', 'subtitle'].map(field => (
                          <div key={field} style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                            <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '2px solid var(--border)', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }} />
                          </div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          {['price', 'origPrice'].map(field => (
                            <div key={field}>
                              <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field === 'origPrice' ? 'Original (₹)' : 'Price (₹)'}</label>
                              <input type="number" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '2px solid var(--border)', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {conditions.map(c => (
                              <button key={c} onClick={() => setForm({ ...form, condition: c })}
                                style={{ flex: 1, padding: '9px', borderRadius: '10px', border: form.condition === c ? '2px solid #00B86B' : '2px solid var(--border)', background: form.condition === c ? 'var(--cond-active)' : 'var(--cond-bg)', cursor: 'pointer', fontSize: '12px', color: form.condition === c ? '#009957' : 'var(--text-secondary)', fontWeight: form.condition === c ? '800' : '500', fontFamily: 'Poppins, sans-serif', transition: 'all 0.15s' }}>
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</label>
                          <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '2px solid var(--border)', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleSave(l.id)} disabled={saving} className="btn-3d"
                            style={{ flex: 1, background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 3px 0 #009957' }}>
                            {saving ? 'Saving…' : '✅ Save changes'}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            style={{ flex: 1, background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '2px solid var(--border)', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="listing-row" style={{ display: 'flex', gap: '12px', padding: '14px', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => window.location.href = '/listing/' + l.id}>
                        <div style={{ width: '58px', height: '58px', background: 'var(--img-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                          {l.images?.[0] ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.emoji}
                          {l.sold && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,19,48,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                              <span style={{ fontSize: '7px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>SOLD</span>
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: l.sold ? 'var(--text-muted)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                            {l.sold && <span style={{ fontSize: '9px', fontWeight: '900', background: '#E24B4A', color: '#fff', padding: '2px 7px', borderRadius: '99px', flexShrink: 0 }}>SOLD</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: '500' }}>{l.condition} · {l.location}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="kalam" style={{ fontSize: '16px', color: l.sold ? 'var(--text-muted)' : '#00B86B' }}>₹{l.price}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '500' }}>👁️ {l.views || 0} views</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button className="action-btn" onClick={() => toggleSold(l.id, l.sold)}
                            style={{ background: l.sold ? 'var(--relist-bg)' : '#DFFFEF', color: l.sold ? 'var(--relist-color)' : '#009957' }}>
                            {l.sold ? '🔄 Relist' : '✅ Sold'}
                          </button>
                          <button className="action-btn" onClick={() => { startEdit(l) }} style={{ background: '#E3F0FF', color: '#1D4ED8' }}>✏️ Edit</button>
                          <button className="action-btn" onClick={() => handleDelete(l.id)} style={{ background: '#FEF2F2', color: '#E24B4A' }}>🗑️ Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}