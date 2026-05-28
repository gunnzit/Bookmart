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

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setListings(data.filter((l: any) => l.sellerId === user?.id))
        }
        setLoading(false)
      })
  }, [isSignedIn, user])

  function startEdit(l: any) {
    setEditingId(l.id)
    setForm({
      title: l.title,
      subtitle: l.subtitle || '',
      price: l.price,
      origPrice: l.origPrice || '',
      condition: l.condition,
      location: l.location,
    })
  }

  async function handleSave(id: string) {
    setSaving(true)
    const res = await fetch('/api/listings/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
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

  if (!isSignedIn) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Sign in to view your profile</div>
        <button onClick={() => router.push('/')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Go to marketplace</button>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1D9E75' }}>📚 My Profile</span>
      </div>

      <div style={{ maxWidth: '600px', margin: '16px auto', padding: '0 16px' }}>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E1F5EE', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', flexShrink: 0 }}>
            {user?.firstName?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{user?.fullName}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
          <button onClick={() => router.push('/sell')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ New listing</button>
        </div>

        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '10px', padding: '0 4px' }}>
          My listings ({listings.length})
        </div>

        {loading ? (
          <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '40px' }}>Loading...</p>
        ) : listings.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>No listings yet</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Post your first item and start selling!</div>
            <button onClick={() => router.push('/sell')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Post a listing</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {listings.map(l => (
              <div key={l.id} style={{ background: '#fff', borderRadius: '12px', border: editingId === l.id ? '2px solid #1D9E75' : '1px solid #eee', overflow: 'hidden' }}>

                {editingId === l.id ? (
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1D9E75', marginBottom: '12px' }}>✏️ Edit listing</div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Title</label>
                      <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' as any }} />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Subtitle</label>
                      <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' as any }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Price (₹)</label>
                        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' as any }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Original price (₹)</label>
                        <input type="number" value={form.origPrice} onChange={e => setForm({ ...form, origPrice: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' as any }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Condition</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {conditions.map(c => (
                          <button key={c} onClick={() => setForm({ ...form, condition: c })} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: form.condition === c ? '2px solid #1D9E75' : '1px solid #ddd', background: form.condition === c ? '#E1F5EE' : '#fff', cursor: 'pointer', fontSize: '12px', color: form.condition === c ? '#0F6E56' : '#555', fontWeight: form.condition === c ? 'bold' : 'normal' }}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Location</label>
                      <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' as any }} />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleSave(l.id)} disabled={saving} style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {saving ? 'Saving...' : '✅ Save changes'}
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ flex: 1, background: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', padding: '12px 14px', alignItems: 'center' }}>
                    <div style={{ width: '52px', height: '52px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                      {l.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{l.condition} · {l.location}</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1D9E75', marginTop: '2px' }}>₹{l.price}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => startEdit(l)} style={{ background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Edit</button>
                      <button onClick={() => handleDelete(l.id)} style={{ background: '#FDECEA', color: '#E24B4A', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Delete</button>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}