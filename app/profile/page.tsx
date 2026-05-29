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
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-input: #FAFAF8; --bg-prefix: #F5F2ED;
      --nav-bg: #fff; --border: #EDE9E1; --text-primary: #1B2A4A; --text-secondary: #777;
      --text-muted: #bbb; --text-label: #999; --divider: #F0EDE7;
      --shadow-nav: 0 2px 12px rgba(27,42,74,0.06); --shadow-card: 0 2px 16px rgba(27,42,74,0.06);
      --img-bg: #F5F2ED; --cond-bg: #fff; --cond-active: #E1F5EE;
      --relist-bg: #FFF3CD; --relist-color: #856404;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --bg-input: #1A1D27; --bg-prefix: #242736;
        --nav-bg: #13151F; --border: #2A2D3E; --text-primary: #E8E6F0; --text-secondary: #8B8FA8;
        --text-muted: #555878; --text-label: #6B6F88; --divider: #2A2D3E;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3); --shadow-card: 0 2px 16px rgba(0,0,0,0.25);
        --img-bg: #242736; --cond-bg: #242736; --cond-active: #0F2D1F;
        --relist-bg: #2A2510; --relist-color: #D4A017;
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
    .kalam { font-family: 'Kalam', cursive; }
    input { color: var(--text-primary) !important; font-weight: 500; background: var(--bg-input) !important; }
    input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
    input:focus { outline: none !important; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1) !important; }
    .stat-card { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 16px; padding: 16px; text-align: center; transition: transform 0.15s; }
    .stat-card:hover { transform: translateY(-2px); }
    .listing-row { transition: background 0.15s; }
    .listing-row:hover { background: var(--bg) !important; }
    .action-btn { border: none; border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    .s1 { animation: slideUp 0.35s ease both; }
    .s2 { animation: slideUp 0.35s 0.06s ease both; }
    .s3 { animation: slideUp 0.35s 0.12s ease both; }
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
          <button onClick={() => router.push('/')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>Go to marketplace</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', transition: 'all 0.15s', flexShrink: 0 }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <img src="/logo.png" alt="BookMart" style={{ height: '28px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>My Profile</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button onClick={() => router.push('/wishlist')}
              style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
              ❤️ Wishlist
            </button>
            <button onClick={() => router.push('/sell')}
              style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 3px 10px rgba(29,158,117,0.25)' }}>
              + Sell
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 60px' }}>

          {/* Profile hero */}
          <div className="s1" style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #0F6E56 100%)', borderRadius: '24px', padding: '28px 24px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div className="kalam" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
                  {user?.firstName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>{user?.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
                  {phone && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>📱 +91 {phone}</div>}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Listed', value: listings.length, icon: '📚' },
                  { label: 'Active', value: activeListings.length, icon: '✅' },
                  { label: 'Sold', value: soldListings.length, icon: '🏷️' },
                  { label: 'Views', value: totalViews, icon: '👁️' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ fontSize: '16px', marginBottom: '3px' }}>{s.icon}</div>
                    <div className="kalam" style={{ fontSize: '20px', color: '#fff', fontWeight: '700', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {soldListings.length > 0 && (
                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '16px' }}>💰</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Estimated earnings from sold items:</span>
                  <span className="kalam" style={{ fontSize: '18px', color: '#4ADE80', fontWeight: '700', marginLeft: 'auto' }}>₹{totalEarnings}</span>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp number */}
          <div className="s2" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)', padding: '20px 22px', marginBottom: '16px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '32px', height: '32px', background: '#E1F5EE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>💬</div>
              <div className="kalam" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>WhatsApp number</div>
              {phone.length === 10 && <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#0F6E56', padding: '2px 8px', borderRadius: '99px', fontWeight: '700', marginLeft: 'auto' }}>✓ Set</span>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Buyers contact you on this number. Make sure it's correct.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-prefix)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 12px', fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0, gap: '4px' }}>
                🇮🇳 <span>+91</span>
              </div>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                style={{ flex: 1, padding: '10px 13px', borderRadius: '10px', border: `1.5px solid ${phone.length === 10 ? '#1D9E75' : 'var(--border)'}`, fontSize: '13px', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }} />
              <button onClick={savePhone} disabled={savingPhone || phone.length < 10}
                style={{ background: phoneSaved ? '#E1F5EE' : '#1D9E75', color: phoneSaved ? '#0F6E56' : '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: '700', cursor: phone.length < 10 ? 'not-allowed' : 'pointer', opacity: phone.length < 10 ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: 'Kalam, cursive', transition: 'all 0.2s' }}>
                {phoneSaved ? '✅ Saved!' : savingPhone ? '…' : 'Save'}
              </button>
            </div>
            {phone.length > 0 && phone.length < 10 && (
              <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ Enter a 10-digit number</div>
            )}
          </div>

          {/* Listings tabs */}
          <div className="s3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '12px', padding: '4px', border: '1.5px solid var(--border)' }}>
                {(['active', 'sold'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '7px 16px', borderRadius: '9px', border: 'none', background: activeTab === tab ? '#1D9E75' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Kalam, cursive' }}>
                    {tab === 'active' ? `Active (${activeListings.length})` : `Sold (${soldListings.length})`}
                  </button>
                ))}
              </div>
              <button onClick={() => router.push('/sell')}
                style={{ background: '#E1F5EE', color: '#0F6E56', border: '1.5px solid #B2E8D6', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', display: 'flex', alignItems: 'center', gap: '5px' }}>
                + New listing
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '76px' }} />)}
              </div>
            ) : tabListings.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{activeTab === 'active' ? '📭' : '🏷️'}</div>
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {activeTab === 'active' ? 'No active listings' : 'No sold listings yet'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  {activeTab === 'active' ? 'Post your first item and start selling!' : 'Mark items as sold when they are gone.'}
                </div>
                {activeTab === 'active' && (
                  <button onClick={() => router.push('/sell')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'Kalam, cursive' }}>Post a listing</button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tabListings.map(l => (
                  <div key={l.id} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: editingId === l.id ? '2px solid #1D9E75' : '1.5px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    {editingId === l.id ? (
                      <div style={{ padding: '18px' }}>
                        <div className="kalam" style={{ fontSize: '15px', fontWeight: '700', color: '#1D9E75', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>✏️ Edit listing</div>
                        {['title', 'subtitle'].map(field => (
                          <div key={field} style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                            <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }} />
                          </div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          {['price', 'origPrice'].map(field => (
                            <div key={field}>
                              <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field === 'origPrice' ? 'Original (₹)' : 'Price (₹)'}</label>
                              <input type="number" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {conditions.map(c => (
                              <button key={c} onClick={() => setForm({ ...form, condition: c })}
                                style={{ flex: 1, padding: '8px', borderRadius: '10px', border: form.condition === c ? '2px solid #1D9E75' : '1.5px solid var(--border)', background: form.condition === c ? 'var(--cond-active)' : 'var(--cond-bg)', cursor: 'pointer', fontSize: '12px', color: form.condition === c ? '#0F6E56' : 'var(--text-secondary)', fontWeight: form.condition === c ? '700' : '400', fontFamily: 'Kalam, cursive', transition: 'all 0.15s' }}>
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</label>
                          <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleSave(l.id)} disabled={saving}
                            style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 3px 10px rgba(29,158,117,0.25)' }}>
                            {saving ? 'Saving…' : '✅ Save changes'}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            style={{ flex: 1, background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '11px', fontSize: '13px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="listing-row" style={{ display: 'flex', gap: '12px', padding: '14px', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => window.location.href = '/listing/' + l.id}>
                        {/* Thumbnail */}
                        <div style={{ width: '58px', height: '58px', background: 'var(--img-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                          {l.images?.[0] ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.emoji}
                          {l.sold && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                              <span style={{ fontSize: '7px', fontWeight: '800', color: '#fff', letterSpacing: '1px' }}>SOLD</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: l.sold ? 'var(--text-muted)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                            {l.sold && <span style={{ fontSize: '9px', fontWeight: '800', background: '#E24B4A', color: '#fff', padding: '2px 6px', borderRadius: '99px', flexShrink: 0 }}>SOLD</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>{l.condition} · {l.location}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="kalam" style={{ fontSize: '16px', fontWeight: '700', color: l.sold ? 'var(--text-muted)' : '#1D9E75' }}>₹{l.price}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>👁️ {l.views || 0} views</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button className="action-btn" onClick={() => toggleSold(l.id, l.sold)}
                            style={{ background: l.sold ? 'var(--relist-bg)' : '#E1F5EE', color: l.sold ? 'var(--relist-color)' : '#0F6E56' }}>
                            {l.sold ? '🔄 Relist' : '✅ Sold'}
                          </button>
                          <button className="action-btn" onClick={() => { startEdit(l); }} style={{ background: '#EFF6FF', color: '#1D4ED8' }}>✏️ Edit</button>
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