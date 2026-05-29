'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'

const conditions = ['New', 'Good', 'Fair']

export default function ListingPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()
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

  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch(`/api/wishlist?userId=${user.id}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSaved(data.some((w: any) => w.listingId === id)) })
  }, [isSignedIn, user, id])

  const isOwner = isSignedIn && user && listing && user.id === listing.sellerId

  async function toggleWishlist() {
    if (!isSignedIn || !user) { openSignIn(); return }
    setSavingWishlist(true)
    const res = await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, listingId: id }) })
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

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-img: #F5F2ED; --bg-input: #FAFAF8;
      --bg-tag: #F0EDE7; --nav-bg: #fff; --border: #EDE9E1; --border-thumb: #EDE9E1;
      --text-primary: #1B2A4A; --text-secondary: #777; --text-muted: #bbb; --text-label: #999;
      --shadow-nav: 0 2px 12px rgba(27,42,74,0.06); --shadow-card: 0 2px 16px rgba(27,42,74,0.06);
      --shadow-img: 0 8px 40px rgba(27,42,74,0.10); --sold-bg: #F5F2ED;
      --condition-bg: #fff; --condition-active-bg: #E1F5EE;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --bg-img: #242736; --bg-input: #1A1D27;
        --bg-tag: #242736; --nav-bg: #13151F; --border: #2A2D3E; --border-thumb: #2A2D3E;
        --text-primary: #E8E6F0; --text-secondary: #8B8FA8; --text-muted: #555878; --text-label: #6B6F88;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3); --shadow-card: 0 2px 16px rgba(0,0,0,0.25);
        --shadow-img: 0 8px 40px rgba(0,0,0,0.4); --sold-bg: #242736;
        --condition-bg: #242736; --condition-active-bg: #0F2D1F;
      }
    }
    body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text-primary); }
    .kalam { font-family: 'Kalam', cursive; }
    input { color: var(--text-primary) !important; font-weight: 500; }
    input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
    input:focus { outline: none !important; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1) !important; }
    .thumb { transition: all 0.18s; cursor: pointer; border-radius: 10px; }
    .thumb:hover { transform: scale(1.05); opacity: 1 !important; }
    .wa-btn { transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 10px; background: #25D366; color: #fff; border-radius: 16px; padding: 16px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 6px 24px rgba(37,211,102,0.32); font-family: 'Kalam', cursive; }
    .wa-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(37,211,102,0.42) !important; }
    .back-btn { background: var(--bg-card); border: 1.5px solid var(--border); width: 38px; height: 38px; border-radius: 12px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; color: var(--text-primary); transition: all 0.15s; }
    .back-btn:hover { background: var(--bg-img) !important; }
    .heart-btn { transition: all 0.2s ease; }
    .heart-btn:hover { transform: scale(1.12); }
    .heart-btn:active { transform: scale(0.92); }
    .icon-btn { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 10px; padding: 7px 13px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
    .icon-btn:hover { background: var(--bg-img) !important; }
    .tag { font-size: 12px; color: var(--text-secondary); background: var(--bg-tag); padding: 5px 13px; border-radius: 99px; display: inline-flex; align-items: center; gap: 4px; }
    .back-to-listings { width: 100%; background: transparent; color: #1D9E75; border: 1.5px solid #1D9E75; border-radius: 14px; padding: 13px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; margin-top: 10px; }
    .back-to-listings:hover { background: #E1F5EE !important; }
    @media (prefers-color-scheme: dark) { .back-to-listings:hover { background: #0F2D1F !important; } }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
    .img-fade { animation: fadeIn 0.22s ease; }
    @keyframes heartPop { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
    .heart-pop { animation: heartPop 0.3s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .slide-up { animation: slideUp 0.4s ease forwards; }
    .slide-up-1 { animation: slideUp 0.4s 0.05s ease both; }
    .slide-up-2 { animation: slideUp 0.4s 0.1s ease both; }
    .slide-up-3 { animation: slideUp 0.4s 0.15s ease both; }
  `

  if (loading) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>📚</div>
          <div style={{ fontSize: '14px' }}>Loading…</div>
        </div>
      </div>
    </>
  )

  if (!listing || listing.error) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>📭</div>
          <div className="kalam" style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>Listing not found</div>
          <button onClick={() => router.push('/marketplace')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '8px', fontFamily: 'Kalam, cursive' }}>Browse marketplace</button>
        </div>
      </div>
    </>
  )

  const discount = listing.origPrice ? Math.round((1 - listing.price / listing.origPrice) * 100) : 0
  const waText = 'Hi, I am interested in your listing on BookMart: ' + listing.title + ' for Rs.' + listing.price
  const phone = listing.seller?.phone?.replace(/\D/g, '') || ''
  const waLink = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(waText)}` : `https://wa.me/?text=${encodeURIComponent(waText)}`
  const hasImages = listing.images?.length > 0

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button className="back-btn" onClick={() => window.location.href = '/marketplace'}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BookMart" style={{ height: '30px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '19px', color: 'var(--text-primary)', fontWeight: '700' }}>BookMart</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {!isOwner && (
              <button className="heart-btn" onClick={toggleWishlist} disabled={savingWishlist}
                style={{ background: saved ? '#FEF2F2' : 'var(--bg-card)', border: `1.5px solid ${saved ? '#FCA5A5' : 'var(--border)'}`, borderRadius: '10px', padding: '7px 12px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className={saved ? 'heart-pop' : ''}>{saved ? '❤️' : '🤍'}</span>
                <span style={{ fontSize: '11px', color: saved ? '#E24B4A' : 'var(--text-secondary)', fontWeight: '600' }}>{saved ? 'Saved' : 'Save'}</span>
              </button>
            )}
            <button className="icon-btn" onClick={copyLink} style={{ background: copied ? '#E1F5EE' : 'var(--bg-card)', color: copied ? '#0F6E56' : 'var(--text-secondary)', border: `1.5px solid ${copied ? '#B2E8D6' : 'var(--border)'}` }}>
              {copied ? '✅' : '🔗'} {copied ? 'Copied!' : 'Share'}
            </button>
            {isOwner && !editing && (
              <>
                <button className="icon-btn" onClick={() => setEditing(true)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none' }}>✏️ Edit</button>
                <button className="icon-btn" onClick={handleDelete} disabled={deleting} style={{ background: '#FEF2F2', color: '#E24B4A', border: 'none' }}>{deleting ? '…' : '🗑️'}</button>
              </>
            )}
          </div>
        </nav>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 60px' }}>

          {/* Main image */}
          <div className="slide-up" style={{ borderRadius: '24px', overflow: 'hidden', marginBottom: '14px', boxShadow: 'var(--shadow-img)', position: 'relative', background: 'var(--bg-img)' }}>
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '88px', position: 'relative', overflow: 'hidden' }}>
              {hasImages
                ? <img key={activeImg} className="img-fade" src={listing.images[activeImg]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ display: 'block' }}>{listing.emoji}</span>}
              {/* Condition */}
              <span style={{ position: 'absolute', top: '14px', left: '14px', fontSize: '11px', fontWeight: '700', background: listing.condition === 'New' ? 'rgba(220,252,231,0.95)' : listing.condition === 'Fair' ? 'rgba(254,243,199,0.95)' : 'rgba(239,246,255,0.95)', color: listing.condition === 'New' ? '#166534' : listing.condition === 'Fair' ? '#92400E' : '#1D4ED8', padding: '4px 12px', borderRadius: '99px', backdropFilter: 'blur(6px)' }}>{listing.condition}</span>
              {/* Discount */}
              {discount >= 15 && !listing.sold && (
                <span style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '11px', fontWeight: '700', background: 'linear-gradient(135deg, #FF6B35, #E24B4A)', color: '#fff', padding: '4px 12px', borderRadius: '99px' }}>-{discount}% OFF</span>
              )}
              {/* Sold overlay */}
              {listing.sold && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span className="kalam" style={{ color: '#fff', fontSize: '32px', letterSpacing: '6px', display: 'block' }}>SOLD</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>This item is no longer available</span>
                  </div>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {hasImages && listing.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                {listing.images.map((img: string, i: number) => (
                  <img key={i} className="thumb" src={img} onClick={() => setActiveImg(i)}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', border: activeImg === i ? '2.5px solid #1D9E75' : '2px solid var(--border-thumb)', opacity: activeImg === i ? 1 : 0.55 }} />
                ))}
              </div>
            )}
          </div>

          {/* Edit form */}
          {editing ? (
            <div className="slide-up" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '2px solid #1D9E75', padding: '24px', marginBottom: '14px' }}>
              <div className="kalam" style={{ fontSize: '16px', color: '#1D9E75', marginBottom: '18px', fontWeight: '700' }}>✏️ Edit listing</div>
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
                    <button key={c} onClick={() => setForm({ ...form, condition: c })} style={{ flex: 1, padding: '9px', borderRadius: '10px', border: form.condition === c ? '2px solid #1D9E75' : '1.5px solid var(--border)', background: form.condition === c ? 'var(--condition-active-bg)' : 'var(--condition-bg)', cursor: 'pointer', fontSize: '13px', color: form.condition === c ? '#0F6E56' : 'var(--text-secondary)', fontWeight: form.condition === c ? '600' : '400', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.25)' }}>{saving ? 'Saving…' : '✅ Save changes'}</button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {/* Title + Price card */}
              <div className="slide-up-1" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)', padding: '22px 24px', marginBottom: '12px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '21px', fontWeight: '700', color: listing.sold ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: '1.3', flex: 1 }}>{listing.title}</h1>
                  {listing.sold && <span style={{ background: '#E24B4A', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', letterSpacing: '1px', flexShrink: 0, marginTop: '4px' }}>SOLD</span>}
                </div>
                {listing.subtitle && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>{listing.subtitle}</p>}

                {/* Price row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span className="kalam" style={{ fontSize: '38px', color: listing.sold ? 'var(--text-muted)' : '#1D9E75', fontWeight: '700', lineHeight: 1 }}>₹{listing.price}</span>
                  {listing.origPrice && <span style={{ fontSize: '17px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{listing.origPrice}</span>}
                  {discount > 0 && !listing.sold && (
                    <span style={{ fontSize: '12px', color: '#fff', background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', padding: '4px 12px', borderRadius: '99px', fontWeight: '700' }}>Save ₹{listing.origPrice - listing.price}</span>
                  )}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="tag">📍 {listing.location}</span>
                  <span className="tag" style={{ textTransform: 'capitalize' }}>🏷️ {listing.category}</span>
                  <span className="tag">👁️ {listing.views || 0} views</span>
                </div>
              </div>

              {/* Seller + CTA card */}
              <div className="slide-up-2" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)', padding: '22px 24px', marginBottom: '12px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Seller</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div className="kalam" style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0 }}>
                    {listing.seller?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{listing.seller?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.34 1 3 2.34 3 4c0 2.5 3 7 3 7s3-4.5 3-7c0-1.66-1.34-3-3-3z" fill="var(--text-muted)"/><circle cx="6" cy="4" r="1" fill="var(--bg-card)"/></svg>
                      {listing.location}
                    </div>
                  </div>
                </div>

                {isOwner ? (
                  <div style={{ background: 'linear-gradient(135deg, #E1F5EE, #D1FAE5)', borderRadius: '14px', padding: '14px 16px', fontSize: '14px', color: '#0F6E56', textAlign: 'center', fontWeight: '600', fontFamily: 'Kalam, cursive', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    ✅ This is your listing
                  </div>
                ) : listing.sold ? (
                  <div style={{ background: 'var(--sold-bg)', borderRadius: '14px', padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    🔒 This item has already been sold
                  </div>
                ) : isSignedIn ? (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="wa-btn">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Contact on WhatsApp
                  </a>
                ) : (
                  <button onClick={() => openSignIn()} style={{ width: '100%', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                    Sign in to contact seller
                  </button>
                )}

                <button className="back-to-listings" onClick={() => window.location.href = '/marketplace'}>
                  ← Back to listings
                </button>
              </div>

              {/* Safety tip */}
              <div className="slide-up-3" style={{ borderRadius: '16px', padding: '16px 18px', display: 'flex', gap: '14px', background: 'linear-gradient(135deg, #FFFBEB, #FFF7E0)', border: '1.5px solid #FEF3C7', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🛡️</div>
                <div>
                  <div className="kalam" style={{ fontSize: '13px', fontWeight: '700', color: '#92400E', marginBottom: '4px' }}>Stay safe when buying</div>
                  <div style={{ fontSize: '12px', color: '#A16207', lineHeight: '1.7' }}>
                    Meet in a <strong>public place</strong> · Inspect before paying · <strong>Never share OTP</strong> or bank details
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}