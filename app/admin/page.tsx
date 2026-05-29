'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const ADMIN_ID = 'user_3EMHmiU5Qw2vZpxYOFM7viVRYZD'

export default function AdminPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [tab, setTab] = useState<'listings' | 'users'>('listings')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || user?.id !== ADMIN_ID) {
      router.push('/')
      return
    }
    fetchData()
  }, [isLoaded, isSignedIn, user])

  async function fetchData() {
    setLoading(true)
    const res = await fetch('/api/listings?t=' + Date.now(), { cache: 'no-store' })
    const data = await res.json()
    if (Array.isArray(data)) {
      setListings(data)
      // Extract unique users
      const userMap = new Map()
      data.forEach((l: any) => {
        if (l.seller && !userMap.has(l.sellerId)) {
          userMap.set(l.sellerId, { ...l.seller, id: l.sellerId, listingCount: 0 })
        }
        if (userMap.has(l.sellerId)) {
          userMap.get(l.sellerId).listingCount++
        }
      })
      setUsers(Array.from(userMap.values()))
    }
    setLoading(false)
  }

  async function deleteListing(id: string) {
    if (!confirm('Delete this listing?')) return
    await fetch('/api/listings/' + id, { method: 'DELETE' })
    setListings(prev => prev.filter(l => l.id !== id))
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch('/api/listings/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const updated = await res.json()
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l))
    setEditingId(null)
    setSaving(false)
  }

  async function toggleSold(id: string, sold: boolean) {
    await fetch('/api/listings/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sold: !sold }),
    })
    setListings(prev => prev.map(l => l.id === id ? { ...l, sold: !sold } : l))
  }

  function toggleBan(userId: string) {
    setBannedUsers(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const filteredListings = listings.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.seller?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.location?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: listings.length,
    active: listings.filter(l => !l.sold).length,
    sold: listings.filter(l => l.sold).length,
    users: users.length,
  }

  if (!isLoaded || loading) return (
    <div style={{ minHeight: '100vh', background: '#0F1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#8B8FA8', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>Loading admin panel…</div>
    </div>
  )

  if (!isSignedIn || user?.id !== ADMIN_ID) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0F1117; font-family: 'DM Sans', sans-serif; color: #E8E6F0; }
        .kalam { font-family: 'Kalam', cursive; }
        input { color: #E8E6F0 !important; background: #1A1D27 !important; }
        input::placeholder { color: #555878 !important; }
        input:focus { outline: none !important; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.15) !important; }
        .row:hover { background: #1E2130 !important; }
        .tab-btn { transition: all 0.15s; }
        .tab-btn:hover { background: #1E2130 !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #2A2D3E; border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0F1117' }}>

        {/* Top nav */}
        <nav style={{ background: '#13151F', borderBottom: '1.5px solid #2A2D3E', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: '#1A1D27', border: '1.5px solid #2A2D3E', width: '34px', height: '34px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8E6F0' }}>←</button>
          <span className="kalam" style={{ fontSize: '18px', color: '#1D9E75', fontWeight: '700' }}>⚙️ Admin Panel</span>
          <span style={{ fontSize: '11px', color: '#555878', background: '#1A1D27', padding: '3px 10px', borderRadius: '99px', border: '1px solid #2A2D3E' }}>BookMart</span>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#555878' }}>Signed in as <span style={{ color: '#1D9E75' }}>{user?.firstName}</span></div>
        </nav>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total listings', value: stats.total, color: '#1D9E75', icon: '📚' },
              { label: 'Active', value: stats.active, color: '#3B82F6', icon: '✅' },
              { label: 'Sold', value: stats.sold, color: '#F59E0B', icon: '🏷️' },
              { label: 'Sellers', value: stats.users, color: '#8B5CF6', icon: '👥' },
            ].map(s => (
              <div key={s.label} style={{ background: '#1A1D27', borderRadius: '16px', border: '1.5px solid #2A2D3E', padding: '16px 20px' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>{s.icon}</div>
                <div className="kalam" style={{ fontSize: '28px', color: s.color, fontWeight: '700', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#555878', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#1A1D27', border: '1.5px solid #2A2D3E', borderRadius: '10px', padding: '0 12px', height: '38px', gap: '8px', flex: 1, minWidth: '200px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#555878" strokeWidth="1.5"/><path d="M9.5 9.5L12 12" stroke="#555878" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings or users…"
                style={{ border: 'none', background: 'transparent', fontSize: '13px', flex: 1, fontFamily: 'DM Sans, sans-serif' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555878', fontSize: '16px', padding: 0 }}>×</button>}
            </div>
            <div style={{ display: 'flex', background: '#1A1D27', borderRadius: '10px', border: '1.5px solid #2A2D3E', overflow: 'hidden' }}>
              {(['listings', 'users'] as const).map(t => (
                <button key={t} className="tab-btn" onClick={() => setTab(t)}
                  style={{ padding: '8px 18px', border: 'none', background: tab === t ? '#1D9E75' : 'transparent', color: tab === t ? '#fff' : '#8B8FA8', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' }}>
                  {t === 'listings' ? `📚 Listings (${filteredListings.length})` : `👥 Users (${filteredUsers.length})`}
                </button>
              ))}
            </div>
            <button onClick={fetchData} style={{ background: '#1A1D27', border: '1.5px solid #2A2D3E', borderRadius: '10px', padding: '8px 14px', color: '#8B8FA8', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>🔄 Refresh</button>
          </div>

          {/* Listings tab */}
          {tab === 'listings' && (
            <div style={{ background: '#1A1D27', borderRadius: '16px', border: '1.5px solid #2A2D3E', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #2A2D3E' }}>
                      {['Item', 'Seller', 'Price', 'Location', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#555878', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map(l => (
                      <>
                        <tr key={l.id} className="row" style={{ borderBottom: '1px solid #1E2130', background: 'transparent', transition: 'background 0.1s' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#242736', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                {l.images?.[0] ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.emoji}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#E8E6F0', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                                <div style={{ fontSize: '10px', color: '#555878', textTransform: 'capitalize' }}>{l.category}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: '#8B8FA8', whiteSpace: 'nowrap' }}>{l.seller?.name || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="kalam" style={{ fontSize: '15px', color: '#1D9E75', fontWeight: '700' }}>₹{l.price}</span>
                            {l.origPrice && <span style={{ fontSize: '10px', color: '#555878', textDecoration: 'line-through', marginLeft: '4px' }}>₹{l.origPrice}</span>}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: '#8B8FA8', whiteSpace: 'nowrap' }}>{l.location}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '99px', background: l.sold ? 'rgba(245,158,11,0.15)' : 'rgba(29,158,117,0.15)', color: l.sold ? '#F59E0B' : '#1D9E75' }}>
                              {l.sold ? 'SOLD' : 'ACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => fetch('/api/listings/' + l.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: !l.featured }) }).then(() => fetchData())}
  style={{ background: l.featured ? 'rgba(234,179,8,0.2)' : 'rgba(100,100,100,0.1)', color: l.featured ? '#EAB308' : '#888', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
  {l.featured ? '⭐ Featured' : '☆ Feature'}
</button>
                              <button onClick={() => { setEditingId(editingId === l.id ? null : l.id); setEditForm({ title: l.title, subtitle: l.subtitle || '', price: l.price, origPrice: l.origPrice || '', condition: l.condition, location: l.location }) }}
                                style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✏️</button>
                              <button onClick={() => toggleSold(l.id, l.sold)}
                                style={{ background: l.sold ? 'rgba(245,158,11,0.15)' : 'rgba(29,158,117,0.15)', color: l.sold ? '#F59E0B' : '#1D9E75', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {l.sold ? 'Relist' : 'Sold'}
                              </button>
                              <button onClick={() => deleteListing(l.id)}
                                style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                        {editingId === l.id && (
                          <tr key={l.id + '-edit'} style={{ background: '#13151F', borderBottom: '1px solid #2A2D3E' }}>
                            <td colSpan={6} style={{ padding: '16px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                                {[['Title', 'title', 'text'], ['Subtitle', 'subtitle', 'text'], ['Price (₹)', 'price', 'number'], ['Orig. Price (₹)', 'origPrice', 'number'], ['Condition', 'condition', 'text'], ['Location', 'location', 'text']].map(([label, field, type]) => (
                                  <div key={field}>
                                    <label style={{ fontSize: '10px', color: '#555878', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                                    <input type={type} value={editForm[field]} onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #2A2D3E', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }} />
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => saveEdit(l.id)} disabled={saving} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive' }}>{saving ? 'Saving…' : '✅ Save'}</button>
                                <button onClick={() => setEditingId(null)} style={{ background: '#1A1D27', color: '#8B8FA8', border: '1.5px solid #2A2D3E', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
                {filteredListings.length === 0 && (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#555878', fontSize: '14px' }}>No listings found</div>
                )}
              </div>
            </div>
          )}

          {/* Users tab */}
          {tab === 'users' && (
            <div style={{ background: '#1A1D27', borderRadius: '16px', border: '1.5px solid #2A2D3E', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #2A2D3E' }}>
                    {['User', 'Email', 'Phone', 'Listings', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#555878', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="row" style={{ borderBottom: '1px solid #1E2130', background: 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="kalam" style={{ width: '34px', height: '34px', borderRadius: '50%', background: bannedUsers.has(u.id) ? '#2A1A1A' : 'linear-gradient(135deg, #E1F5EE, #B2E8D6)', color: bannedUsers.has(u.id) ? '#EF4444' : '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: bannedUsers.has(u.id) ? '#EF4444' : '#E8E6F0' }}>{u.name}</div>
                            {u.id === ADMIN_ID && <div style={{ fontSize: '9px', color: '#1D9E75', fontWeight: '700', letterSpacing: '0.5px' }}>ADMIN</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#8B8FA8' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#8B8FA8' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75', fontFamily: 'Kalam, cursive' }}>{u.listingCount}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '99px', background: bannedUsers.has(u.id) ? 'rgba(239,68,68,0.15)' : 'rgba(29,158,117,0.15)', color: bannedUsers.has(u.id) ? '#EF4444' : '#1D9E75' }}>
                          {bannedUsers.has(u.id) ? 'BANNED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.id !== ADMIN_ID && (
                          <button onClick={() => toggleBan(u.id)}
                            style={{ background: bannedUsers.has(u.id) ? 'rgba(29,158,117,0.15)' : 'rgba(239,68,68,0.12)', color: bannedUsers.has(u.id) ? '#1D9E75' : '#EF4444', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {bannedUsers.has(u.id) ? '✅ Unban' : '🚫 Ban'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center', color: '#555878', fontSize: '14px' }}>No users found</div>
              )}
            </div>
          )}

          <div style={{ marginTop: '16px', fontSize: '11px', color: '#2A2D3E', textAlign: 'center' }}>
            Admin panel · BookMart · {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </>
  )
}