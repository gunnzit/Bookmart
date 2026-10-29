import Logo from '@/components/Logo'

// The wrap&read loading screen. Used by the bar (on every tab change, with a "label")
// and by app/loading.tsx (when a page waits for the server, no label needed).
export default function LoadingScreen({ delayMs = 0, out = false, label = '' }: { delayMs?: number; out?: boolean; label?: string }) {
  const text = label || 'Loading'
  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 200, opacity: out ? 0 : 1, transition: 'opacity 250ms ease', pointerEvents: out ? 'none' : 'auto' }}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <style>{`
        @keyframes wrLdFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wrLdPop { 0% { opacity: 0; transform: translateY(14px) scale(.9) } 60% { opacity: 1; transform: translateY(-3px) scale(1.03) } 100% { opacity: 1; transform: none } }
        @keyframes wrLdBob { 0%, 100% { translate: 0 0 } 50% { translate: 0 -6px } }
        @keyframes wrLdBar { 0% { transform: translateX(-110%) } 100% { transform: translateX(310%) } }
        @keyframes wrLdDot { 0%, 80%, 100% { opacity: .25 } 40% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .wr-ld { animation: none !important; } }
      `}</style>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-8"
        style={{
          paddingBottom: 90,
          background: 'linear-gradient(180deg, #F7CF65 0%, #FBDD8A 55%, #FAF8F5 100%)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          animation: 'wrLdFade 0.2s ease ' + delayMs + 'ms both',
        }}
      >
        {/* Logo */}
        <div className="wr-ld" style={{ animation: 'wrLdPop .6s cubic-bezier(.22,1,.36,1) both' }}>
          <div className="wr-ld" style={{ animation: 'wrLdBob 2.6s ease-in-out .6s infinite' }}>
            <Logo height={50} className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]" />
          </div>
        </div>

        {/* What is happening, in words */}
        <p className="wr-ld flex items-center" style={{ marginTop: 26, fontSize: 15, fontWeight: 700, color: '#1E1B19', animation: 'wrLdFade .4s ease .15s both' }}>
          {text}
          <span aria-hidden className="inline-flex" style={{ marginLeft: 2 }}>
            {[0, 1, 2].map(i => (
              <span key={i} className="wr-ld" style={{ animation: 'wrLdDot 1.2s ease-in-out ' + i * 0.2 + 's infinite' }}>.</span>
            ))}
          </span>
        </p>
        <p className="wr-ld" style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: '#5C4300', animation: 'wrLdFade .4s ease .3s both' }}>
          Second-hand books from students near you
        </p>

        {/* Progress bar */}
        <div className="overflow-hidden rounded-full" style={{ marginTop: 22, width: 150, height: 5, background: 'rgba(30,27,25,0.12)' }}>
          <div className="wr-ld h-full rounded-full" style={{ width: '34%', background: '#1E1B19', animation: 'wrLdBar 1.1s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  )
}