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

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-input: #FAFAF8; --bg-input-prefix: #f5f5f5;
      --nav-bg: #fff; --border: #EDE9E1; --text-primary: #1B2A4A; --text-secondary: #888;
      --text-muted: #bbb; --text-label: #888; --shadow-nav: 0 2px 12px rgba(27,42,74,0.05);
      --shadow-card: 0 2px 8px rgba(27,42,74,0.04); --divider: #f5f5f5;
      --listing-img-bg: #f9f9f9; --condition-bg: #fff; --condition-active: #E1F5EE;
      --cancel-bg: transparent; --relist-bg: #FFF3CD; --relist-color: #856404;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --bg-input: #1A1D27; --bg-input-prefix: #242736;
        --nav-bg: #13151F; --border: #2A2D3E; --text-primary: #E8E6F0; --text-secondary: #8B8FA8;
        --text-muted: #555878; --text-label: #6B6F88; --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
        --shadow-card: 0 2px 8px rgba(0,0,0,0.2); --divider: #2A2D3E;
        --listing-img-bg: #242736; --condition-bg: #242736; --condition-active: #0F2D1F;
        --cancel-bg: #1A1D27; --relist-bg: #2A2510; --relist-color: #D4A017;
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
    .kalam { font-family: 'Kalam', cursive; }
    input { color: var(--text-primary) !important; font-weight: 500; background: var(--bg-input); }
    input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
    input:focus { outline: none !important; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1) !important; }
    .back-btn:hover { background: var(--bg) !important; }
    .wishlist-btn:hover { background: #FEF2F2 !important; border-color: #FCA5A5 !important; }
  `

  if (!isSignedIn) return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>Sign in to view your profile</div>
          <button onClick={() => router.push('/')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: 'Kalam, cursive' }}>Go to marketplace</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button className="back-btn" onClick={() => router.push('/marketplace')} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', transition: 'all 0.15s', flexShrink: 0 }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="BookMart" style={{ height: '32px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '16px', fontWeight: '700', color: '#1D9E75' }}>My Profile</span>
          </div>
          {/* Wishlist button */}
          <button className="wishlist-btn" onClick={() => router.push('/wishlist')}
            style={{ marginLeft: 'auto', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
            ❤️ <span>Wishlist</span>
          </button>
        </nav>

        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '0 16px 40px' }}>

          {/* Profile card */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)', padding: '20px', marginBottom: '14px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div className="kalam" style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E1F5EE', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', flexShrink: 0, border: '1.5px solid #B2E8D6' }}>
                {user?.firstName?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.fullName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
              <button onClick={() => router.push('/sell')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 3px 10px rgba(29,158,117,0.25)' }}>+ New listing</button>
            </div>

            {/* WhatsApp */}
            <div style={{ borderTop: '1.5px solid var(--divider)', paddingTop: '16px' }}>
              <div className="kalam" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>💬 WhatsApp number</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Buyers will use this to contact you. Enter your 10-digit Indian mobile number.</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input-prefix)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 10px', fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  🇮🇳 +91
                </div>
                <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }} />
                <button onClick={savePhone} disabled={savingPhone || phone.length < 10}
                  style={{ background: phoneSaved ? '#E1F5EE' : '#1D9E75', color: phoneSaved ? '#0F6E56' : '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: phone.length < 10 ? 'not-allowed' : 'pointer', opacity: phone.length < 10 ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: 'Kalam, cursive' }}>
                  {phoneSaved ? '✅ Saved!' : savingPhone ? 'Saving…' : 'Save'}
                </button>
              </div>
              {phone.length > 0 && phone.length < 10 && (
                <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '6px' }}>Enter a 10-digit number</div>
              )}
            </div>
          </div>

          {/* Listings header */}
          <div className="kalam" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', padding: '0 4px' }}>
            My listings ({listings.length})
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '40px' }}>Loading…</p>
          ) : listings.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '6px' }}>No listings yet</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Post your first item and start selling!</div>
              <button onClick={() => router.push('/sell')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'Kalam, cursive' }}>Post a listing</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {listings.map(l => (
                <div key={l.id} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: editingId === l.id ? '2px solid #1D9E75' : '1.5px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {editingId === l.id ? (
                    <div style={{ padding: '16px' }}>
                      <div className="kalam" style={{ fontSize: '14px', fontWeight: '700', color: '#1D9E75', marginBottom: '14px' }}>✏️ Edit listing</div>
                      {['title', 'subtitle'].map(field => (
                        <div key={field} style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                          <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }} />
                        </div>
                      ))}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        {['price', 'origPrice'].map(field => (
                          <div key={field}>
                            <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field === 'origPrice' ? 'Original price (₹)' : 'Price (₹)'}</label>
                            <input type="number" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {conditions.map(c => (
                            <button key={c} onClick={() => setForm({ ...form, condition: c })}
                              style={{ flex: 1, padding: '7px', borderRadius: '8px', border: form.condition === c ? '2px solid #1D9E75' : '1.5px solid var(--border)', background: form.condition === c ? 'var(--condition-active)' : 'var(--condition-bg)', cursor: 'pointer', fontSize: '12px', color: form.condition === c ? '#0F6E56' : 'var(--text-secondary)', fontWeight: form.condition === c ? '600' : '400', fontFamily: 'Kalam, cursive' }}>
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</label>
                        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleSave(l.id)} disabled={saving}
                          style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive' }}>
                          {saving ? 'Saving…' : '✅ Save changes'}
                        </button>
                        <button onClick={() => setEditingId(null)}
                          style={{ flex: 1, background: 'var(--cancel-bg)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', padding: '12px 14px', alignItems: 'center' }}>
                      <div style={{ width: '52px', height: '52px', background: 'var(--listing-img-bg)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        {l.images?.[0] ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.emoji}
                        {l.sold && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '8px', fontWeight: '700', color: '#fff', letterSpacing: '1px' }}>SOLD</span>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: l.sold ? 'var(--text-muted)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                          {l.sold && <span style={{ fontSize: '9px', fontWeight: '700', background: '#E24B4A', color: '#fff', padding: '2px 6px', borderRadius: '99px', flexShrink: 0 }}>SOLD</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.condition} · {l.location}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          👁️ {l.views || 0} view{(l.views || 0) !== 1 ? 's' : ''}
                        </div>
                        <div className="kalam" style={{ fontSize: '15px', fontWeight: '700', color: l.sold ? 'var(--text-muted)' : '#1D9E75', marginTop: '2px' }}>₹{l.price}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => toggleSold(l.id, l.sold)}
                          style={{ background: l.sold ? 'var(--relist-bg)' : '#E1F5EE', color: l.sold ? 'var(--relist-color)' : '#0F6E56', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {l.sold ? '🔄 Relist' : '✅ Mark sold'}
                        </button>
                        <button onClick={() => startEdit(l)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => handleDelete(l.id)} style={{ background: '#FEF2F2', color: '#E24B4A', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>🗑️ Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}