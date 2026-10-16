'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import LoadingScreen from '@/components/LoadingScreen'

const BAR_HEIGHT = 66
const PILL_HEIGHT = 54
const MAX_PILL_WIDTH = 76
const DRAG_THRESHOLD = 10

// Loading screen timing
const MIN_SHOW_MS = 700   // never shorter than this
const SETTLE_MS = 350     // extra wait after the new page appears, so it is fully drawn
const MAX_SHOW_MS = 8000  // safety: never get stuck

type Key = 'home' | 'sets' | 'sell' | 'market' | 'stationery'

const TABS: { key: Key; label: string; icon: string; href: string }[] = [
  { key: 'home', label: 'Home', icon: 'storefront', href: '/' },
  { key: 'sets', label: 'Sets', icon: 'local_library', href: '/school-sets' },
  { key: 'sell', label: 'Sell', icon: 'add', href: '/sell' },
  { key: 'market', label: 'Market', icon: 'sell', href: '/marketplace' },
  { key: 'stationery', label: 'Stationery', icon: 'draw', href: '/school-sets' },
]
const PILL_KEYS: Key[] = ['home', 'sets', 'market', 'stationery']

// Pages that show the bar
function showsBar(path: string) {
  return path === '/' || path.startsWith('/school-sets') || path.startsWith('/marketplace') || path.startsWith('/my-orders') || path.startsWith('/profile')
}

function derive(path: string): Key | '' {
  if (path === '/') return 'home'
  if (path.startsWith('/school-sets')) return 'sets'
  if (path.startsWith('/marketplace') || path.startsWith('/listing')) return 'market'
  return ''
}

export default function GlassNav() {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const { isSignedIn } = useUser()

  const navRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<Partial<Record<Key, HTMLElement | null>>>({})
  const startX = useRef(0)
  const pressing = useRef(false)
  const justDragged = useRef(false)
  const fromPath = useRef(pathname)
  const startedAt = useRef(0)

  const visible = showsBar(pathname)
  const [selected, setSelected] = useState<Key | ''>(() => derive(pathname))
  const [pillX, setPillX] = useState(0)
  const [pillW, setPillW] = useState(64)
  const [measured, setMeasured] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [overlay, setOverlay] = useState<'off' | 'on' | 'out'>('off')

  // Keep "selected" in step with the page. Stationery and Sets are the same page.
  useEffect(() => {
    setSelected(prev => (pathname.startsWith('/school-sets') && prev === 'stationery') ? 'stationery' : derive(pathname))
  }, [pathname])

  // Loading screen: once the new page is in, wait for the minimum time, fonts and a settle
  // moment, then fade out and scroll to the top.
  useEffect(() => {
    if (overlay !== 'on') return
    if (pathname === fromPath.current) return
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - startedAt.current))
    timers.push(setTimeout(async () => {
      try { await (document as any).fonts?.ready } catch {}
      requestAnimationFrame(() => requestAnimationFrame(() => {
        timers.push(setTimeout(() => {
          if (cancelled) return
          window.scrollTo(0, 0)
          setOverlay('out')
          timers.push(setTimeout(() => { if (!cancelled) setOverlay('off') }, 280))
        }, SETTLE_MS))
      }))
    }, wait))
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [pathname, overlay])

  // Safety: the loading screen can never get stuck
  useEffect(() => {
    if (overlay !== 'on') return
    const t = setTimeout(() => setOverlay('off'), MAX_SHOW_MS)
    return () => clearTimeout(t)
  }, [overlay])

  // Real position and width of a tab (not nav width / 5)
  const measure = useCallback((key: Key): { c: number; w: number } | null => {
    const el = slotRefs.current[key]
    const nav = navRef.current
    if (!el || !nav) return null
    const r = el.getBoundingClientRect()
    const n = nav.getBoundingClientRect()
    return { c: r.left - n.left + r.width / 2, w: r.width }
  }, [])

  const widthFor = (w: number) => Math.max(48, Math.min(MAX_PILL_WIDTH, w - 6))

  useLayoutEffect(() => {
    if (!visible) return
    function place() {
      if (!selected) return
      const m = measure(selected as Key)
      if (!m) return
      const pw = widthFor(m.w)
      setPillW(pw)
      setPillX(m.c - pw / 2)
      setMeasured(true)
    }
    place()
    const t = setTimeout(place, 250) // after fonts load
    window.addEventListener('resize', place)
    return () => { clearTimeout(t); window.removeEventListener('resize', place) }
  }, [selected, visible, measure])

  function go(key: Key, href: string) {
    if (key !== 'sell') setSelected(key)
    const target = href.split('?')[0]
    if (target === pathname) { router.push(href); return } // same page: no loading screen
    fromPath.current = pathname
    startedAt.current = Date.now()
    setOverlay('on')
    router.push(href)
  }

  function nearestKey(x: number): Key {
    let best: Key = 'home'
    let bestD = Infinity
    for (const k of PILL_KEYS) {
      const m = measure(k)
      if (!m) continue
      const d = Math.abs(m.c - x)
      if (d < bestD) { bestD = d; best = k }
    }
    return best
  }

  function localX(e: React.PointerEvent) {
    const n = navRef.current!.getBoundingClientRect()
    return e.clientX - n.left
  }

  function settleBack() {
    if (!selected) return
    const m = measure(selected as Key)
    if (m) { const pw = widthFor(m.w); setPillW(pw); setPillX(m.c - pw / 2) }
  }

  function onPointerDown(e: React.PointerEvent) {
    pressing.current = true
    justDragged.current = false
    startX.current = e.clientX
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pressing.current) return
    const moved = Math.abs(e.clientX - startX.current) > DRAG_THRESHOLD
    if (!dragging && moved) {
      setDragging(true)
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
    }
    if (dragging || moved) {
      const n = navRef.current!.getBoundingClientRect()
      const x = Math.min(Math.max(localX(e) - pillW / 2, 4), n.width - pillW - 4)
      setPillX(x) // free follow, no transition while dragging
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const wasDragging = dragging
    pressing.current = false
    if (!wasDragging) return
    setDragging(false)
    justDragged.current = true
    setTimeout(() => { justDragged.current = false }, 300)

    const key = nearestKey(localX(e))
    const tab = TABS.find(t => t.key === key)!
    const alreadyThere = key === selected && (tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href))
    if (alreadyThere) settleBack()
    else go(key, tab.href)
  }

  function onPointerCancel() {
    pressing.current = false
    setDragging(false)
    settleBack()
  }

  function swallowClickAfterDrag(e: React.MouseEvent) {
    if (justDragged.current) { e.preventDefault(); e.stopPropagation() }
  }

  const showPill = measured && !!selected

  const sellInner = (
    <div className="flex flex-col items-center" style={{ transform: 'translateY(-12px)' }}>
      <div className="w-[50px] h-[50px] rounded-full bg-primary-container text-on-primary shadow-[0_6px_16px_rgba(196,80,26,0.4)] flex items-center justify-center active:scale-95 transition-transform">
        <span className="material-symbols-outlined text-[28px]">add</span>
      </div>
      <span className="text-[10px] font-semibold mt-0.5" style={{ color: '#58423a' }}>Sell</span>
    </div>
  )

  return (
    <>
      {/* Mandatory loading screen on every tab change (sits under the bar) */}
      {overlay !== 'off' && <LoadingScreen out={overlay === 'out'} />}

      {visible && (
        <>
          <style>{`
            @keyframes glassGlowDrift {
              0%   { background-position: 20% 30%; }
              50%  { background-position: 80% 70%; }
              100% { background-position: 20% 30%; }
            }
          `}</style>
          <div
            ref={navRef}
            className="md:hidden fixed inset-x-3 mx-auto max-w-[420px] select-none"
            style={{
              zIndex: 300,
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
              height: BAR_HEIGHT,
              borderRadius: BAR_HEIGHT / 2,
              background: 'rgba(255,255,255,0.28)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 10px 30px rgba(45,30,18,0.14), inset 0 1px 0 rgba(255,255,255,0.7)',
              touchAction: 'pan-y',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClickCapture={swallowClickAfterDrag}
          >
            {/* Glass pill: sits BEHIND the icons and words, and wraps both */}
            {showPill && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  zIndex: 0,
                  top: (BAR_HEIGHT - PILL_HEIGHT) / 2,
                  left: 0,
                  width: pillW,
                  height: PILL_HEIGHT,
                  borderRadius: PILL_HEIGHT / 2,
                  transform: 'translateX(' + pillX + 'px) scale(' + (dragging ? 1.08 : 1) + ')',
                  transition: dragging ? 'none' : 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  background: 'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%), rgba(232,99,43,0.16)',
                  backgroundSize: '220% 220%',
                  animation: 'glassGlowDrift 3.6s ease-in-out infinite',
                  border: '1px solid rgba(255,255,255,0.7)',
                  boxShadow: '0 4px 14px rgba(196,80,26,0.18), inset 0 0 10px rgba(255,255,255,0.35)',
                  pointerEvents: 'none',
                }}
              />
            )}

            <div className="relative flex items-center justify-around h-full px-1.5" style={{ zIndex: 1 }}>
              {TABS.map(t => {
                if (t.key === 'sell') {
                  return (
                    <div key="sell" className="flex-1 flex items-center justify-center">
                      {isSignedIn ? (
                        <button aria-label="Sell" onClick={() => go('sell', '/sell')}>{sellInner}</button>
                      ) : (
                        <SignInButton mode="modal"><button aria-label="Sell">{sellInner}</button></SignInButton>
                      )}
                    </div>
                  )
                }
                const on = selected === t.key
                return (
                  <button
                    key={t.key}
                    ref={el => { slotRefs.current[t.key] = el }}
                    onClick={() => go(t.key, t.href)}
                    aria-label={t.label}
                    aria-current={on ? 'page' : undefined}
                    className="flex-1 flex flex-col items-center justify-center gap-[3px] h-full"
                    style={{
                      color: on ? '#7f2b00' : '#4a3a33',
                      opacity: 1,
                      textShadow: '0 0 6px rgba(255,255,255,0.9)',
                    }}
                  >
                    <span className="material-symbols-outlined text-[24px] leading-none" style={{ fontVariationSettings: on ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
                    <span className="text-[10px] leading-none whitespace-nowrap" style={{ fontWeight: on ? 800 : 600 }}>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}