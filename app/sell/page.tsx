'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const categories = ['textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const conditions = ['New', 'Good', 'Fair']
const emojis: Record<string, string> = {
  textbook: '📗',  novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙'
}

export default function SellPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    title: '', subtitle: '', price: '',
    origPrice: '', condition: 'Good',
    category: 'textbook', location: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (done) {
    return (
      <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '360px', width: '100%' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ color: '#1D9E75', marginBottom: '8px' }}>Listing posted!</h2>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>Your item is now live on BookMart.</p>
          <button onClick={() => router.push('/')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginBottom: '10px' }}>
            View marketplace
          </button>
          <button onClick={() => { setDone(false); setForm({ title: '', subtitle: '', price: '', origPrice: '', condition: 'Good', category: 'textbook', location: '' }) }} style={{ background: 'transparent', color: '#1D9E75', border: '1px solid #1D9E75', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
            Post another listing
          </button>
        </div>
      </div>
    )
  }

  async function submit() {
    if (!form.title || !form.price || !form.location) {
      alert('Please fill in title, price and location')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          price: parseInt(form.price),
          origPrice: form.origPrice ? parseInt(form.origPrice) : null,
          condition: form.condition,
          category: form.category,
          emoji: emojis[form.category],
          location: form.location,
          sellerId: 'user_001',
        }),
      })
      if (res.ok) { setDone(true) }
      else { alert('Something went wrong. Try again.') }
    } catch {
      alert('Could not connect. Try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1D9E75' }}>📚 Post a listing</span>
      </div>
      <div style={{ maxWidth: '520px', margin: '20px auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', color: '#333' }}>📝 Item details</div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Title *</label>
            <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. NCERT Physics Part 1 — Class 12" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Subtitle (optional)</label>
            <input value={form.subtitle} onChange={e => update('subtitle', e.target.value)} placeholder="e.g. 2023 edition, lightly used" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>Category *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => update('category', cat)} style={{ padding: '8px', borderRadius: '8px', border: form.category === cat ? '2px solid #1D9E75' : '1px solid #ddd', background: form.category === cat ? '#E1F5EE' : '#fff', cursor: 'pointer', fontSize: '12px', color: form.category === cat ? '#0F6E56' : '#555', fontWeight: form.category === cat ? 'bold' : 'normal', textTransform: 'capitalize' }}>
                  {emojis[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>Condition *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {conditions.map(c => (
                <button key={c} onClick={() => update('condition', c)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: form.condition === c ? '2px solid #1D9E75' : '1px solid #ddd', background: form.condition === c ? '#E1F5EE' : '#fff', cursor: 'pointer', fontSize: '12px', color: form.condition === c ? '#0F6E56' : '#555', fontWeight: form.condition === c ? 'bold' : 'normal' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', color: '#333' }}>💰 Pricing</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Your price (₹) *</label>
              <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="180" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Original price (₹)</label>
              <input type="number" value={form.origPrice} onChange={e => update('origPrice', e.target.value)} placeholder="320" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', color: '#333' }}>📍 Location</div>
          <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Sector 40, Chandigarh" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>
        <button onClick={submit} disabled={loading} style={{ width: '100%', background: loading ? '#aaa' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '30px' }}>
          {loading ? 'Posting...' : '🚀 Post listing'}
        </button>
      </div>
    </div>
  )
}