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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/listings/' + id)
      .then(res => res.json())
      .then(data => {
        setListing(data)
        setForm({ title: data.title, subtitle: data.subtitle || '', price: data.price, origPrice: data.origPrice || '', condition: data.condition, location: data.location })
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
    const res = await fetch('/api/listings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const updated = await res.json()
    setListing({ ...listing, ...updated })
    setEditing(false)
    setSaving(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      <div style={{ fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#bbb' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📚</div>
          <div style={{ fontSize: '14px' }}>Loading listing…</div>
        </div>
      </div>
    </>
  )

  if (!listing || listing.error) return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', padding: '60px 20px', textAlign: 'center', color: '#999' }}>Listing not found</div>
  )

  const discount = listing.origPrice ? Math.round((1 - listing.price / listing.origPrice) * 100) : 0
  const waText = 'Hi, I am interested in your listing on BookMart: ' + listing.title + ' for Rs.' + listing.price
  const phone = listing.seller?.phone?.replace(/\D/g, '') || ''
  const waLink = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(waText)}` : `https://wa.me/?text=${encodeURIComponent(waText)}`
  const hasImages = listing.images?.length > 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #F7F6F2; }
        input:focus { outline: none !important; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1) !important; }
        .thumb { transition: all 0.15s ease; cursor: pointer; }
        .thumb:hover { transform: scale(1.05); }
        .wa-btn { transition: all 0.2s ease; }
        .wa-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,211,102,0.35) !important; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .img-fade { animation: fadeIn 0.2s ease; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F6F2' }}>
        <nav style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => window.location.href = '/'} style={{ background: '#F7F6F2', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '800', color: '#1D9E75' }}>📚 BookMart</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button onClick={copyLink} style={{ background: '#F7F6F2', border: '1px solid #EBEBEB', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', color: copied ? '#1D9E75' : '#666', transition: 'all 0.15s' }}>
              {copied ? '✅ Copied!' : '🔗 Share'}
            </button>
            {isOwner && !editing && (
              <>
                <button onClick={() => setEditing(true)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✏️ Edit</button>
                <button onClick={handleDelete} disabled={deleting} style={{ background: '#FEF2F2', color: '#E24B4A', border: 'none', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{deleting ? 'Deleting…' : '🗑️ Delete'}</button>
              </>
            )}
          </div>
        </nav>

        <div style={{ maxWidth: '640px', margin: '24px auto', padding: '0 16px 40px' }}>

          {/* Image gallery */}
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #EBEBEB', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ height: '280px', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', position: 'relative', overflow: 'hidden' }}>
              {hasImages
                ? <img key={activeImg} className="img-fade" src={listing.images[activeImg]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{listing.emoji}</span>}
              <span style={{ position: 'absolute', top: '14px', left: '14px', fontSize: '11px', fontWeight: '600', background: listing.condition === 'New' ? '#DCFCE7' : '#EFF6FF', color: listing.condition === 'New' ? '#166534' : '#1D4ED8', padding: '4px 10px', borderRadius: '99px' }}>{listing.condition}</span>
              {discount > 0 && <span style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '11px', fontWeight: '600', background: '#FEF9C3', color: '#854D0E', padding: '4px 10px', borderRadius: '99px' }}>{discount}% off</span>}
              {listing.sold && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '24px', fontWeight: '800', letterSpacing: '4px', fontFamily: 'Syne, sans-serif' }}>SOLD</span>
                </div>
              )}
            </div>
            {hasImages && listing.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid #F5F5F5' }}>
                {listing.images.map((img: string, i: number) => (
                  <img key={i} className="thumb" src={img} onClick={() => setActiveImg(i)}
                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: activeImg === i ? '2.5px solid #1D9E75' : '2px solid #EBEBEB', opacity: activeImg === i ? 1 : 0.7 }} />
                ))}
              </div>
            )}
          </div>

          {editing ? (
            <div style={{ background: '#fff', borderRadius: '20px', border: '2px solid #1D9E75', padding: '24px', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: '700', color: '#1D9E75', marginBottom: '18px' }}>✏️ Edit listing</div>
              {[['Title', 'title', 'text'], ['Subtitle', 'subtitle', 'text'], ['Price (₹)', 'price', 'number'], ['Original price (₹)', 'origPrice', 'number'], ['Location', 'location', 'text']].map(([label, field, type]) => (
                <div key={field} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                  <input type={type} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #EBEBEB', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }} />
                </div>
              ))}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {conditions.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, condition: c })} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: form.condition === c ? '2px solid #1D9E75' : '1.5px solid #EBEBEB', background: form.condition === c ? '#E1F5EE' : '#fff', cursor: 'pointer', fontSize: '12px', color: form.condition === c ? '#0F6E56' : '#555', fontWeight: form.condition === c ? '600' : '400', fontFamily: 'Syne, sans-serif', transition: 'all 0.15s' }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{saving ? 'Saving…' : '✅ Save changes'}</button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, background: '#F7F6F2', color: '#888', border: '1.5px solid #EBEBEB', borderRadius: '12px', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #EBEBEB', padding: '22px', marginBottom: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: '800', color: listing.sold ? '#bbb' : '#222', flex: 1, marginRight: '10px', lineHeight: '1.3' }}>{listing.title}</div>
                {listing.sold && <span style={{ background: '#E24B4A', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.5px', flexShrink: 0 }}>SOLD</span>}
              </div>
              {listing.subtitle && <div style={{ fontSize: '14px', color: '#999', marginBottom: '16px', lineHeight: '1.5' }}>{listing.subtitle}</div>}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: '800', color: listing.sold ? '#bbb' : '#1D9E75' }}>₹{listing.price}</span>
                {listing.origPrice && <span style={{ fontSize: '16px', color: '#ddd', textDecoration: 'line-through' }}>₹{listing.origPrice}</span>}
                {discount > 0 && !listing.sold && <span style={{ fontSize: '12px', color: '#0F6E56', background: '#E1F5EE', padding: '3px 10px', borderRadius: '99px', fontWeight: '600' }}>Save ₹{listing.origPrice - listing.price}</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#777', background: '#F7F6F2', padding: '5px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {listing.location}</span>
                <span style={{ fontSize: '12px', color: '#777', background: '#F7F6F2', padding: '5px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}>🏷️ {listing.category}</span>
              </div>
            </div>
          )}

          {/* Seller + CTA */}
          {!editing && (
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #EBEBEB', padding: '22px', marginBottom: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: '700', color: '#222', marginBottom: '14px' }}>Seller</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #E1F5EE, #B2E8D6)', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', flexShrink: 0, fontFamily: 'Syne, sans-serif' }}>
                  {listing.seller?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: '700', color: '#222' }}>{listing.seller?.name}</div>
                  <div style={{ fontSize: '12px', color: '#bbb' }}>{listing.location}</div>
                </div>
              </div>

              {isOwner ? (
                <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#0F6E56', textAlign: 'center', fontWeight: '600', fontFamily: 'Syne, sans-serif' }}>✅ This is your listing</div>
              ) : listing.sold ? (
                <div style={{ background: '#F7F6F2', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#aaa', textAlign: 'center', fontWeight: '500' }}>🔒 This item has already been sold</div>
              ) : isSignedIn ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="wa-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#25D366', color: '#fff', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxShadow: '0 4px 16px rgba(37,211,102,0.25)', fontFamily: 'Syne, sans-serif' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Contact on WhatsApp
                </a>
              ) : (
                <SignInButton mode="modal">
                  <button style={{ width: '100%', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>Sign in to contact seller</button>
                </SignInButton>
              )}

              <button onClick={() => window.location.href = '/'} style={{ width: '100%', background: 'transparent', color: '#1D9E75', border: '1.5px solid #1D9E75', borderRadius: '14px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '10px', fontFamily: 'Syne, sans-serif', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget.style.background = '#E1F5EE') }}
                onMouseLeave={e => { (e.currentTarget.style.background = 'transparent') }}>
                ← Back to listings
              </button>
            </div>
          )}

          {/* Safety tip */}
          {!editing && (
            <div style={{ background: '#FFFBEB', borderRadius: '16px', padding: '14px 18px', display: 'flex', gap: '12px', border: '1px solid #FEF3C7' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: '700', color: '#92400E', marginBottom: '3px' }}>Safety tip</div>
                <div style={{ fontSize: '11px', color: '#A16207', lineHeight: '1.6' }}>Meet in a public place · Check item before paying · Never share OTP or bank details</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}