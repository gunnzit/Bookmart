'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

export default function ListingPage() {
  const { id } = useParams()
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        setListing(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', textAlign: 'center', color: '#888' }}>
      Loading...
    </div>
  )

  if (!listing || listing.error) return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', textAlign: 'center', color: '#888' }}>
      Listing not found
    </div>
  )

  const discount = listing.origPrice ? Math.round((1 - listing.price / listing.origPrice) * 100) : 0

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1D9E75' }}>📚 BookMart</span>
      </div>

      <div style={{ maxWidth: '600px', margin: '16px auto', padding: '0 16px' }}>

        {/* Photo */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ height: '220px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', position: 'relative' }}>
            {listing.emoji}
            <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '11px', fontWeight: 'bold', background: listing.condition === 'New' ? '#E1F5EE' : '#E6F1FB', color: listing.condition === 'New' ? '#0F6E56' : '#185FA5', padding: '3px 10px', borderRadius: '99px' }}>
              {listing.condition}
            </span>
            {discount > 0 && (
              <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', fontWeight: 'bold', background: '#E6F1FB', color: '#185FA5', padding: '3px 10px', borderRadius: '99px' }}>
                {discount}% off
              </span>
            )}
          </div>
        </div>

        {/* Price & title */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{listing.title}</div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{listing.subtitle}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#1D9E75' }}>₹{listing.price}</span>
            {listing.origPrice && <span style={{ fontSize: '15px', color: '#aaa', textDecoration: 'line-through' }}>₹{listing.origPrice}</span>}
            {discount > 0 && <span style={{ fontSize: '12px', color: '#0F6E56', background: '#E1F5EE', padding: '2px 8px', borderRadius: '99px', fontWeight: 'bold' }}>Save ₹{listing.origPrice - listing.price}</span>}
          </div>
          <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '12px' }}>
            <span>📍 {listing.location}</span>
            <span>🏷️ {listing.category}</span>
          </div>
        </div>

        {/* Seller */}
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

          {isSignedIn ? (
            
              href={`https://wa.me/?text=Hi, I'm interested in your listing "${listing.title}" for ₹${listing.price} on BookMart`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', marginBottom: '8px' }}
            >
              💬 Contact on WhatsApp
            </a>
          ) : (
            <SignInButton mode="modal">
              <button style={{ width: '100%', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
                Sign in to contact seller
              </button>
            </SignInButton>
          )}

          <button
            onClick={() => router.push('/')}
            style={{ width: '100%', background: 'transparent', color: '#1D9E75', border: '1px solid #1D9E75', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ← Back to listings
          </button>
        </div>

        {/* Safety */}
        <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0F6E56', marginBottom: '3px' }}>Safety tip</div>
            <div style={{ fontSize: '11px', color: '#0F6E56', lineHeight: '1.5' }}>Meet in a public place · Check item before paying · Never share OTP or bank details</div>
          </div>
        </div>

      </div>
    </div>
  )
}