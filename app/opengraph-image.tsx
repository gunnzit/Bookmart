import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'BuddyBooks — Buy & Sell Second-Hand Books in Chandigarh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 60%, #1565c0 100%)',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', right: '-60px', top: '-60px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', right: '120px', bottom: '-80px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          display: 'flex',
        }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '36px' }}>
          <div style={{
            background: '#FF6B35',
            borderRadius: '14px',
            width: '60px', height: '60px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px',
            marginRight: '16px',
          }}>
            📚
          </div>
          <span style={{
            color: 'white', fontSize: '34px', fontWeight: '700', letterSpacing: '-0.5px',
          }}>
            BuddyBooks
          </span>
        </div>

        {/* Headline */}
        <div style={{
          color: 'white', fontSize: '68px', fontWeight: '800',
          lineHeight: '1.1', margin: '0 0 24px 0', maxWidth: '720px',
          display: 'flex', flexWrap: 'wrap',
        }}>
          Buy &amp; Sell Books in Chandigarh
        </div>

        {/* Subline */}
        <div style={{
          color: 'rgba(255,255,255,0.75)', fontSize: '28px',
          margin: '0 0 44px 0', maxWidth: '580px', lineHeight: '1.4',
          display: 'flex',
        }}>
          Student marketplace · Save up to 60% on school &amp; college books
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '14px' }}>
          {['Free to list', 'No commission', 'Chandigarh Tricity'].map((tag) => (
            <div
              key={tag}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                borderRadius: '100px',
                padding: '10px 22px',
                color: 'white', fontSize: '20px',
                display: 'flex',
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{
          position: 'absolute', bottom: '48px', right: '80px',
          color: 'rgba(255,255,255,0.5)', fontSize: '22px',
          display: 'flex',
        }}>
          buddybooks.in
        </div>
      </div>
    ),
    { ...size }
  )
}