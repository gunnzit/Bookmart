// The Pageplus loading screen. Used by the bar (on every tab change)
// and by app/loading.tsx (when a page waits for the server).
export default function LoadingScreen({ delayMs = 0, out = false }: { delayMs?: number; out?: boolean }) {
  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 200, opacity: out ? 0 : 1, transition: 'opacity 250ms ease', pointerEvents: out ? 'none' : 'auto' }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <style>{`
        @keyframes ppLoadFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ppLoadBar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes ppLoadDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40%           { transform: translateY(-9px); opacity: 1; }
        }
        @keyframes ppLoadBreathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pp-anim { animation: none !important; }
        }
      `}</style>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center bg-surface"
        style={{ paddingBottom: 90, animation: 'ppLoadFade 0.2s ease ' + delayMs + 'ms both' }}
      >
        {/* Thin sliding bar at the top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden" style={{ background: 'rgba(196,80,26,0.12)' }}>
          <div className="pp-anim h-full w-1/3 rounded-full" style={{ background: '#c4501a', animation: 'ppLoadBar 1.2s ease-in-out infinite' }} />
        </div>

        {/* Wordmark */}
        <div className="pp-anim font-headline-lg text-[40px] leading-none tracking-tight text-on-surface" style={{ animation: 'ppLoadBreathe 2.2s ease-in-out infinite' }}>
          Page<span style={{ color: '#ff743b' }}>plus</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Books, kits &amp; stationery</p>

        {/* Bouncing dots */}
        <div className="flex items-center gap-2 mt-7">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="pp-anim block w-2.5 h-2.5 rounded-full"
              style={{ background: '#c4501a', animation: 'ppLoadDot 1.1s ease-in-out ' + i * 0.16 + 's infinite' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}