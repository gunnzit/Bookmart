'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function WishlistPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all')

  useEffect(() => {
    if (!isSignedIn || !user) { setLoading(false); return }
    fetch(`/api/wishlist?userId=${user.id}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setItems(data); setLoading(false) })
  }, [isSignedIn, user])

  async function removeFromWishlist(listingId: string) {
    setRemoving(listingId)
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, listingId }),
    })
    setItems(prev => prev.filter(i => i.listingId !== listingId))
    setRemoving(null)
  }

  const filtered = items.filter(i => {
    if (filter === 'available') return !i.listing?.sold
    if (filter === 'sold') return i.listing?.sold
    return true
  })

  const availableCount = items.filter(i => !i.listing?.sold).length
  const soldCount = items.filter(i => i.listing?.sold).length

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-img: #F5F2ED;
      --nav-bg: #fff; --border: #EDE9E1;
      --text-primary: #1B2A4A; --text-secondary: #888; --text-muted: #bbb;
      --shadow-nav: 0 2px 12px rgba(27,42,74,0.05);
      --shadow-card: 0 2px 12px rgba(27,42,74,0.06);
      --shadow-hover: 0 8px 32px rgba(27,42,74,0.12);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --bg-img: #242736;
        --nav-bg: #13151F; --border: #2A2D3E;
        --text-primary: #E8E6F0; --text-secondary: #8B8FA8; --text-muted: #555878;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
        --shadow-card: 0 2px 12px rgba(0,0,0,0.25);
        --shadow-hover: 0 8px 32px rgba(0,0,0,0.4);
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
    .kalam { font-family: 'Kalam', cursive; }
    .wcard { background: var(--bg-card); border-radius: 18px; border: 1.5px solid var(--border); overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; box-shadow: var(--shadow-card); }
    .wcard:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); border-color: #1D9E75; }
    .wcard.sold-card:hover { border-color: var(--border); }
    .remove-btn { transition: all 0.15s; }
    .remove-btn:hover { transform: scale(1.15); }
    .chip { border: 1.5px solid var(--border); border-radius: 99px; padding: 5px 14px; font-size: 12px; font-weight: 600; cursor: pointer; background: transparent; color: var(--text-secondary); transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
    .chip.active { background: #1D9E75; color: #fff; border-color: #1D9E75; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    .item-enter { animation: fadeUp 0.3s ease both; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .skeleton { animation: pulse 1.5s ease infinite; }
    @keyframes pop { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
    .heart-pop { animation: pop 0.3s ease; }
  `

  if (!isSignedIn) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '320px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
          <div className="kalam" style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px' }}>Sign in to view your wishlist</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>Save listings you love and come back to them anytime.</div>
          <button onClick={() => router.push('/')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>Go home</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '28px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '700' }}>Wishlist</span>
          </div>
          {items.length > 0 && (
            <span style={{ background: '#FEF2F2', color: '#E24B4A', fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '99px', border: '1px solid #FCA5A5' }}>
              ❤️ {items.length}
            </span>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => router.push('/marketplace')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              + Add more
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px 60px' }}>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ borderRadius: '18px', height: '240px', background: 'var(--bg-card)', border: '1.5px solid var(--border)' }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            // Empty state
            <div style={{ textAlign: 'center', padding: '64px 20px' }}>
              <div style={{ width: '88px', height: '88px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 20px', border: '2px solid #FCA5A5' }}>🤍</div>
              <div className="kalam" style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>Nothing saved yet</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto 28px' }}>
                Tap the ❤️ on any listing to save it here for later.
              </div>
              <button onClick={() => router.push('/marketplace')}
                style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 28px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
                Browse listings →
              </button>
            </div>
          ) : (
            <>
              {/* Stats bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>❤️</span>
                    <div>
                      <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', lineHeight: 1 }}>{items.length}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total saved</div>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <div>
                      <div className="kalam" style={{ fontSize: '18px', color: '#1D9E75', lineHeight: 1 }}>{availableCount}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Available</div>
                    </div>
                  </div>
                  {soldCount > 0 && (
                    <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🏷️</span>
                      <div>
                        <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1 }}>{soldCount}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sold</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter chips */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: `All (${items.length})` },
                  { key: 'available', label: `✅ Available (${availableCount})` },
                  ...(soldCount > 0 ? [{ key: 'sold', label: `🏷️ Sold (${soldCount})` }] : []),
                ].map(f => (
                  <button key={f.key} className={`chip${filter === f.key ? ' active' : ''}`}
                    onClick={() => setFilter(f.key as any)}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Available items alert */}
              {availableCount > 0 && filter !== 'sold' && (
                <div style={{ background: '#E1F5EE', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#0F6E56', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔔</span>
                  <span><strong>{availableCount} listing{availableCount !== 1 ? 's' : ''}</strong> in your wishlist {availableCount === 1 ? 'is' : 'are'} still available — grab them before they're gone!</span>
                </div>
              )}

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                {filtered.map((item, idx) => {
                  const l = item.listing
                  if (!l) return null
                  const discount = l.origPrice ? Math.round((1 - l.price / l.origPrice) * 100) : 0
                  const isRemoving = removing === l.id

                  return (
                    <div key={item.id} className="item-enter" style={{ position: 'relative', animationDelay: `${idx * 0.04}s` }}>
                      <div className={`wcard${l.sold ? ' sold-card' : ''}`} onClick={() => router.push('/listing/' + l.id)}
                        style={{ opacity: l.sold ? 0.75 : 1 }}>
                        {/* Image */}
                        <div style={{ height: '130px', background: 'var(--bg-img)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative', overflow: 'hidden' }}>
                          {l.images?.[0]
                            ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                            : l.emoji}
                          {/* Condition badge */}
                          <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', background: l.condition === 'New' ? 'rgba(220,252,231,0.95)' : l.condition === 'Fair' ? 'rgba(254,243,199,0.95)' : 'rgba(239,246,255,0.95)', color: l.condition === 'New' ? '#166534' : l.condition === 'Fair' ? '#92400E' : '#1D4ED8', padding: '2px 7px', borderRadius: '99px', fontWeight: '700' }}>{l.condition}</span>
                          {/* Discount badge */}
                          {discount >= 15 && !l.sold && (
                            <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', background: 'linear-gradient(135deg, #FF6B35, #E24B4A)', color: '#fff', padding: '2px 7px', borderRadius: '99px', fontWeight: '700' }}>-{discount}%</span>
                          )}
                          {/* Sold overlay */}
                          {l.sold && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                              <span className="kalam" style={{ color: '#fff', fontSize: '16px', letterSpacing: '3px' }}>SOLD</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ padding: '11px 13px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                          {l.subtitle && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.subtitle}</div>}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '4px' }}>
                            <span className="kalam" style={{ fontSize: '17px', color: l.sold ? 'var(--text-muted)' : '#1D9E75', fontWeight: '700' }}>₹{l.price}</span>
                            {l.origPrice && <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            📍 {l.location}
                          </div>
                          {l.seller?.name && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                              by {l.seller.name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove button */}
                      <button className={`remove-btn${!isRemoving ? ' heart-pop' : ''}`}
                        onClick={e => { e.stopPropagation(); removeFromWishlist(l.id) }}
                        disabled={isRemoving}
                        style={{ position: 'absolute', top: '8px', right: '8px', width: '30px', height: '30px', borderRadius: '50%', background: isRemoving ? 'rgba(200,200,200,0.9)' : 'rgba(255,255,255,0.95)', border: 'none', cursor: isRemoving ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        {isRemoving ? '…' : '❤️'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Sold items hint */}
              {soldCount > 0 && filter === 'all' && (
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {soldCount} item{soldCount !== 1 ? 's' : ''} already sold — you can remove them by tapping ❤️
                </div>
              )}

              {/* Empty filtered state */}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No {filter} listings in your wishlist
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}