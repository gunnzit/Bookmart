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
  const [saved, setSaved] = useState(false)
  const [savingWishlist, setSavingWishlist] = useState(false)

  useEffect(() => {
    fetch('/api/listings/' + id + '?track=true')
      .then(res => res.json())
      .then(data => {
        setListing(data)
        setForm({ title: data.title, subtitle: data.subtitle || '', price: data.price, origPrice: data.origPrice || '', condition: data.condition, location: data.location })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // Check if already wishlisted
  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch(`/api/wishlist?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSaved(data.some((w: any) => w.listingId === id))
        }
      })
  }, [isSignedIn, user, id])

  const isOwner = isSignedIn && user && listing && user.id === listing.sellerId

  async function toggleWishlist() {
    if (!isSignedIn || !user) return
    setSavingWishlist(true)
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, listingId: id }),
    })
    const data = await res.json()
    setSaved(data.saved)
    setSavingWishlist(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(true)
    await fetch('/api/listings/' + id, { method: 'DELETE' })
    router.push('/marketplace')
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

  const sharedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-img: #F5F2ED; --bg-input: #FAFAF8;
      --bg-tag: #F5F2ED; --nav-bg: #fff; --border: #EDE9E1; --border-thumb: #EDE9E1;
      --text-primary: #1B2A4A; --text-secondary: #888; --text-muted: #bbb; --text-label: #999;
      --shadow-nav: 0 2px 12px rgba(27,42,74,0.05); --shadow-card: 0 2px 12px rgba(27,42,74,0.05);
      --shadow-img: 0 4px 24px rgba(27,42,74,0.07); --back-btn-bg: #FAFAF8; --share-btn-bg: #FAFAF8;
      --cancel-btn-bg: #FAFAF8; --sold-bg: #F5F2ED; --condition-bg: #fff; --condition-active-bg: #E1F5EE;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --bg-img: #242736; --bg-input: #1A1D27;
        --bg-tag: #242736; --nav-bg: #13151F; --border: #2A2D3E; --border-thumb: #2A2D3E;
        --text-primary: #E8E6F0; --text-secondary: #8B8FA8; --text-muted: #555878; --text-label: #6B6F88;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3); --shadow-card: 0 2px 12px rgba(0,0,0,0.2);
        --shadow-img: 0 4px 24px rgba(0,0,0,0.3); --back-btn-bg: #1A1D27; --share-btn-bg: #1A1D27;
        --cancel-btn-bg: #1A1D27; --sold-bg: #242736; --condition-bg: #242736; --condition-active-bg: #0F2D1F;
      }
    }
    body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text-primary); }
    .logo-text { font-family: 'Kalam', cursive; }
    input { color: var(--text-primary) !important; font-weight: 500; }
    input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
    input:focus { outline: none !important; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1) !important; }
    .thumb { transition: all 0.15s; cursor: pointer; }
    .thumb:hover { transform: scale(1.06); }
    .wa-btn { transition: all 0.2s ease; }
    .wa-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37,211,102,0.35) !important; }
    .back-btn:hover { background: var(--bg-img) !important; }
    .back-to-listings:hover { background: #E1F5EE !important; }
    .heart-btn { transition: all 0.2s ease; }
    .heart-btn:hover { transform: scale(1.1); }
    .heart-btn:active { transform: scale(0.95); }
    @media (prefers-color-scheme: dark) { .back-to-listings:hover { background: #0F2D1F !important; } }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
    .img-fade { animation: fadeIn 0.2s ease; }
    @keyframes heartPop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
    .heart-pop { animation: heartPop 0.3s ease; }
  `

  if (loading) return (
    <>
      <style>{sharedStyles}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="logo-text" style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
          <div style={{ fontSize: '14px' }}>Loading…</div>
        </div>
      </div>
    </>
  )

  if (!listing || listing.error) return (
    <>
      <style>{sharedStyles}</style>
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Listing not found</div>
    </>
  )

  const discount = listing.origPrice ? Math.round((1 - listing.price / listing.origPrice) * 100) : 0
  const waText = 'Hi, I am interested in your listing on BookMart: ' + listing.title + ' for Rs.' + listing.price
  const phone = listing.seller?.phone?.replace(/\D/g, '') || ''
  const waLink = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(waText)}` : `https://wa.me/?text=${encodeURIComponent(waText)}`
  const hasImages = listing.images?.length > 0

  return (
    <>
      <style>{sharedStyles}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button className="back-btn" onClick={() => window.location.href = '/marketplace'} style={{ background: 'var(--back-btn-bg)', border: '1.5px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', color: 'var(--text-primary)' }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="BookMart" style={{ height: '32px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="logo-text" style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: '700' }}>BookMart</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Wishlist heart button */}
            {!isOwner && (
              isSignedIn ? (
                <button className="heart-btn" onClick={toggleWishlist} disabled={savingWishlist}
                  style={{ background: saved ? '#FEF2F2' : 'var(--share-btn-bg)', border: `1.5px solid ${saved ? '#FCA5A5' : 'var(--border)'}`, borderRadius: '10px', padding: '7px 12px', fontSize: '16px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className={saved ? 'heart-pop' : ''}>{saved ? '❤️' : '🤍'}</span>
                  <span style={{ fontSize: '11px', color: saved ? '#E24B4A' : 'var(--text-secondary)', fontWeight: '600' }}>{saved ? 'Saved' : 'Save'}</span>
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button style={{ background: 'var(--share-btn-bg)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '7px 12px', fontSize: '16px', cursor: 'pointer' }}>🤍</button>
                </SignInButton>
              )
            )}
            <button onClick={copyLink} style={{ background: copied ? '#E1F5EE' : 'var(--share-btn-bg)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', color: copied ? '#0F6E56' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
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

        <div style={{ maxWidth: '640px', margin: '24px auto', padding: '0 16px 48px' }}>

          {/* Image gallery */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1.5px solid var(--border)', overflow: 'hidden', marginBottom: '16px', boxShadow: 'var(--shadow-img)' }}>
            <div style={{ height: '300px', background: 'var(--bg-img)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', position: 'relative', overflow: 'hidden' }}>
              {hasImages ? <img key={activeImg} className="img-fade" src={listing.images[activeImg]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : listing.emoji}
              <span style={{ position: 'absolute', top: '14px', left: '14px', fontSize: '11px', fontWeight: '600', background: listing.condition === 'New' ? 'rgba(220,252,231,0.95)' : 'rgba(239,246,255,0.95)', color: listing.condition === 'New' ? '#166534' : '#1D4ED8', padding: '4px 10px', borderRadius: '99px', backdropFilter: 'blur(4px)' }}>{listing.condition}</span>
              {discount > 0 && <span style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '11px', fontWeight: '600', background: 'rgba(254,249,195,0.95)', color: '#854D0E', padding: '4px 10px', borderRadius: '99px', backdropFilter: 'blur(4px)' }}>{discount}% off</span>}
              {listing.sold && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(27,42,74,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="logo-text" style={{ color: '#fff', fontSize: '28px', letterSpacing: '4px' }}>SOLD</span>
                </div>
              )}
            </div>
            {hasImages && listing.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                {listing.images.map((img: string, i: number) => (
                  <img key={i} className="thumb" src={img} onClick={() => setActiveImg(i)}
                    style={{ width: '58px', height: '58px', objectFit: 'cover', borderRadius: '10px', border: activeImg === i ? '2.5px solid #1D9E75' : `2px solid var(--border-thumb)`, opacity: activeImg === i ? 1 : 0.65 }} />
                ))}
              </div>
            )}
          </div>

          {/* Edit form */}
          {editing ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '2px solid #1D9E75', padding: '24px', marginBottom: '14px' }}>
              <div className="logo-text" style={{ fontSize: '16px', color: '#1D9E75', marginBottom: '18px', fontWeight: '700' }}>✏️ Edit listing</div>
              {(['title', 'subtitle', 'price', 'origPrice', 'location'] as const).map(field => (
                <div key={field} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field === 'origPrice' ? 'Original Price (₹)' : field === 'price' ? 'Price (₹)' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input type={['price', 'origPrice'].includes(field) ? 'number' : 'text'} value={form[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', background: 'var(--bg-input)', transition: 'all 0.15s' }} />
                </div>
              ))}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-label)', display: 'block', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {conditions.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, condition: c })} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: form.condition === c ? '2px solid #1D9E75' : `1.5px solid var(--border)`, background: form.condition === c ? 'var(--condition-active-bg)' : 'var(--condition-bg)', cursor: 'pointer', fontSize: '13px', color: form.condition === c ? '#0F6E56' : 'var(--text-secondary)', fontWeight: form.condition === c ? '600' : '400', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.25)' }}>{saving ? 'Saving…' : '✅ Save changes'}</button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, background: 'var(--cancel-btn-bg)', color: 'var(--text-secondary)', border: `1.5px solid var(--border)`, borderRadius: '12px', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)', padding: '22px', marginBottom: '14px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '600', color: listing.sold ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: '1.3', flex: 1 }}>{listing.title}</h1>
                {listing.sold && <span style={{ background: '#E24B4A', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.5px', flexShrink: 0 }}>SOLD</span>}
              </div>
              {listing.subtitle && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.6' }}>{listing.subtitle}</p>}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
                <span className="logo-text" style={{ fontSize: '36px', color: listing.sold ? 'var(--text-muted)' : '#1D9E75', fontWeight: '700' }}>₹{listing.price}</span>
                {listing.origPrice && <span style={{ fontSize: '16px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{listing.origPrice}</span>}
                {discount > 0 && !listing.sold && <span style={{ fontSize: '12px', color: '#0F6E56', background: '#E1F5EE', padding: '3px 10px', borderRadius: '99px', fontWeight: '600' }}>Save ₹{listing.origPrice - listing.price}</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-tag)', padding: '5px 12px', borderRadius: '99px' }}>📍 {listing.location}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-tag)', padding: '5px 12px', borderRadius: '99px', textTransform: 'capitalize' }}>🏷️ {listing.category}</span>
              </div>
            </div>
          )}

          {/* Seller + CTA */}
          {!editing && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)', padding: '22px', marginBottom: '14px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>Seller</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div className="logo-text" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #E1F5EE, #B2E8D6)', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0, border: '1.5px solid #B2E8D6' }}>
                  {listing.seller?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{listing.seller?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>📍 {listing.location}</div>
                </div>
              </div>
              {isOwner ? (
                <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#0F6E56', textAlign: 'center', fontWeight: '600' }}>✅ This is your listing</div>
              ) : listing.sold ? (
                <div style={{ background: 'var(--sold-bg)', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>🔒 This item has already been sold</div>
              ) : isSignedIn ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="wa-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#25D366', color: '#fff', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 4px 20px rgba(37,211,102,0.28)', fontFamily: 'Kalam, cursive' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Contact on WhatsApp
                </a>
              ) : (
                <SignInButton mode="modal">
                  <button style={{ width: '100%', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive' }}>Sign in to contact seller</button>
                </SignInButton>
              )}
              <button className="back-to-listings" onClick={() => window.location.href = '/marketplace'}
                style={{ width: '100%', background: 'transparent', color: '#1D9E75', border: '1.5px solid #1D9E75', borderRadius: '14px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '10px', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                ← Back to listings
              </button>
            </div>
          )}

          {/* Safety tip */}
          {!editing && (
            <div style={{ background: '#FFFBEB', borderRadius: '16px', padding: '14px 18px', display: 'flex', gap: '12px', border: '1.5px solid #FEF3C7' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400E', marginBottom: '3px', fontFamily: 'Kalam, cursive' }}>Safety tip</div>
                <div style={{ fontSize: '11px', color: '#A16207', lineHeight: '1.6' }}>Meet in a public place · Check item before paying · Never share OTP or bank details</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}