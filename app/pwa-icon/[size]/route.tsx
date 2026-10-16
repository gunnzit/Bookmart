import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const ALLOWED = [180, 192, 512]

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params
  const size = Number(raw)
  if (!ALLOWED.includes(size)) return new Response('Not found', { status: 404 })

  // Full-bleed square: the phone rounds the corners itself. The "P" stays inside
  // the centre 80% so it is never cut off when the icon is masked into a circle.
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #a23900 0%, #c4501a 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <span style={{ fontSize: Math.round(size * 0.52), fontWeight: 800, lineHeight: 1 }}>P</span>
          <span style={{ fontSize: Math.round(size * 0.3), fontWeight: 800, lineHeight: 1, color: '#ff743b', marginLeft: Math.round(size * 0.015), marginTop: Math.round(size * 0.02) }}>+</span>
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