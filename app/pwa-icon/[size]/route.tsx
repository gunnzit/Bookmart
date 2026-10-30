import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const ALLOWED = [180, 192, 512]

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params
  const size = Number(raw)
  if (!ALLOWED.includes(size)) return new Response('Not found', { status: 404 })

  // Full-bleed square: the phone rounds the corners itself. The "w&r" stays inside
  // the centre 80% so it is never cut off when the icon is masked into a circle.
  // Colours from the wrap&read logo: dark ink, white letters, orange "&".
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1C1916',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', fontSize: Math.round(size * 0.3), fontWeight: 800, lineHeight: 1, letterSpacing: -Math.round(size * 0.01) }}>
          <span>w</span>
          <span style={{ color: '#FD6830' }}>&amp;</span>
          <span>r</span>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }
  )
}