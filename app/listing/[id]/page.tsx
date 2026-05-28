'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

const conditions = ['New', 'Good', 'Fair']

export default function ListingPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    fetch('/api/listings/' + id)
      .then(res => res.json())
      .then(data => {
        setListing(data)
        setForm({
          title: data.title,
          subtitle: data.subtitle || '',
          price: data.price,
          origPrice: data.origPrice || '',
          condition: data.condition,
          location: data.location,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const isOwner = isSignedIn && user && listing && user.id === listing.sellerId

  async function handleDelete() {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(true)
    await fetch('/api/listings/' + id, { method: 'DELETE' })
    router.push('/')
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/listings/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const updated = await res.json()
    setListing({ ...listing, ...updated })
    setEditing(false)
    setSaving(false)
  }

  if (loading) return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>
  )

  if (!listing || listing.error) return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', textAlign: 'center', color: '#888' }}>Listing not found</div>
  )

  const discount = listing.origPrice ? Math.round((1 - listing.price / listing.origPrice) * 100) : 0
  const waText = 'Hi, I am interested in your listing on BookMart: ' + listing.title + ' for Rs.' + listing.price
  const phone = listing.seller?.phone?.replace(/\D/g, '') || ''
const waLink = phone
  ? `https://wa.me/91${phone}?text=${encodeURIComponent(waText)}`
  : `https://wa.me/?text=${encodeURIComponent(waText)}`
  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1D9E75' }}>📚 BookMart</span>
        {isOwner && !editing && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditing(true)} style={{ background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Edit</button>
            <button onClick={handleDelete} disabled={deleting} style={{ background: '#FDECEA', color: '#E24B4A', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{deleting ? 'Deleting...' : '🗑️ Delete'}</button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '600px', margin: '16px auto', padding: '0 16px' }}>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', marginBottom: '12px' }}>
         <div style={{ height: '220px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', position: 'relative', overflow: 'hidden' }}>
              {listing.images?.[0]
                 ? <img src={listing.images[activeImg]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 : listing.emoji}
            <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '11px', fontWeight: 'bold', background: listing.condition === 'New' ? '#E1F5EE' : '#E6F1FB', color: listing.condition === 'New' ? '#0F6E56' : '#185FA5', padding: '3px 10px', borderRadius: '99px' }}>
              {listing.condition}
            </span>
            {discount > 0 && (
              <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', fontWeight: 'bold', background: '#E6F1FB', color: '#185FA5', padding: '3px 10px', borderRadius: '99px' }}>
                {discount}% off
              </span>
            )}
            {/* SOLD overlay */}
            {listing.sold && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '3px' }}>SOLD</span>
              </div>
            )}
          </div>
        </div>
      
       {listing.images?.length > 1 && (
  <div style={{ display: 'flex', gap: '8px', padding: '10px', background: '#fff' }}>
   {listing.images.map((img: string, i: number) => (
  <img key={i} src={img} onClick={() => setActiveImg(i)} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: activeImg === i ? '2px solid #1D9E75' : '1px solid #eee', cursor: 'pointer' }} />
))}
  </div>
)}

        {editing ? (
          <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #1D9E75', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1D9E75', marginBottom: '14px' }}>✏️ Edit listing</div>

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
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                {saving ? 'Saving...' : '✅ Save changes'}
              </button>
              <button onClick={() => setEditing(false)} style={{ flex: 1, background: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: listing.sold ? '#9ca3af' : '#333' }}>{listing.title}</div>
              {listing.sold && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.05em', flexShrink: 0 }}>SOLD</span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{listing.subtitle}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: listing.sold ? '#9ca3af' : '#1D9E75' }}>₹{listing.price}</span>
              {listing.origPrice && <span style={{ fontSize: '15px', color: '#aaa', textDecoration: 'line-through' }}>₹{listing.origPrice}</span>}
              {discount > 0 && !listing.sold && <span style={{ fontSize: '12px', color: '#0F6E56', background: '#E1F5EE', padding: '2px 8px', borderRadius: '99px', fontWeight: 'bold' }}>Save ₹{listing.origPrice - listing.price}</span>}
            </div>
            <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '12px' }}>
              <span>📍 {listing.location}</span>
              <span>🏷️ {listing.category}</span>
            </div>
          </div>
        )}

        {!editing && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>Seller</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E6F1FB', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>
                {listing.seller?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{listing.seller?.name}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{listing.location}</div>
              </div>
            </div>

            {isOwner ? (
              <div style={{ background: '#E1F5EE', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#0F6E56', textAlign: 'center', fontWeight: 'bold' }}>
                ✅ This is your listing
              </div>
            ) : listing.sold ? (
              <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#888', textAlign: 'center' }}>
                🔒 This item has already been sold
              </div>
            ) : isSignedIn ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#25D366', color: '#fff', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', marginBottom: '8px' }}>
                💬 Contact on WhatsApp
              </a>
            ) : (
              <SignInButton mode="modal">
                <button style={{ width: '100%', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
                  Sign in to contact seller
                </button>
              </SignInButton>
            )}

            <button onClick={() => router.push('/')} style={{ width: '100%', background: 'transparent', color: '#1D9E75', border: '1px solid #1D9E75', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
              Back to listings
            </button>
          </div>
        )}

        {!editing && (
          <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0F6E56', marginBottom: '3px' }}>Safety tip</div>
              <div style={{ fontSize: '11px', color: '#0F6E56', lineHeight: '1.5' }}>Meet in a public place · Check item before paying · Never share OTP or bank details</div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
