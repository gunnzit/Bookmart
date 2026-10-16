'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LoadingScreen from '@/components/LoadingScreen'

// Loading screen timing
const MIN_SHOW_MS = 700   // never shorter than this
const SETTLE_MS = 350     // extra wait after the new page appears, so it is fully drawn
const MAX_SHOW_MS = 8000  // safety: never get stuck

type Key = 'home' | 'sets' | 'market' | 'profile'

const TABS: { key: Key; label: string; icon: string; href: string }[] = [
  { key: 'home', label: 'Home', icon: 'home', href: '/' },
  { key: 'sets', label: 'Sets', icon: 'menu_book', href: '/school-sets' },
  { key: 'market', label: 'Market', icon: 'storefront', href: '/marketplace' },
  { key: 'profile', label: 'Profile', icon: 'person', href: '/profile' },
]

// Pages that show the bar
function showsBar(path: string) {
  return path === '/' || path.startsWith('/school-sets') || path.startsWith('/marketplace') || path.startsWith('/my-orders') || path.startsWith('/profile')
}

function derive(path: string): Key | '' {
  if (path === '/') return 'home'
  if (path.startsWith('/school-sets')) return 'sets'
  if (path.startsWith('/marketplace') || path.startsWith('/listing')) return 'market'
  if (path.startsWith('/profile') || path.startsWith('/my-orders')) return 'profile'
  return ''
}

export default function GlassNav() {
  const router = useRouter()
  const pathname = usePathname() || '/'

  const fromPath = useRef(pathname)
  const startedAt = useRef(0)

  const visible = showsBar(pathname)
  const [selected, setSelected] = useState<Key | ''>(() => derive(pathname))
  const [overlay, setOverlay] = useState<'off' | 'on' | 'out'>('off')

  // Keep "selected" in step with the page
  useEffect(() => {
    setSelected(derive(pathname))
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

  function go(key: Key, href: string) {
    setSelected(key)
    if (href === pathname) return // same page: nothing to load
    fromPath.current = pathname
    startedAt.current = Date.now()
    setOverlay('on')
    router.push(href)
  }

  return (
    <>
      {/* Loading screen on every tab change (sits under the bar) */}
      {overlay !== 'off' && <LoadingScreen out={overlay === 'out'} />}

      {visible && (
        <nav
          aria-label="Main"
          // Phones: all pages. Larger screens: Home only (other pages have their own header menu).
          className={'fixed inset-x-0 flex justify-center pointer-events-none px-5 ' + (pathname === '/' ? '' : 'md:hidden')}
          style={{ zIndex: 300, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <div
            className="pointer-events-auto flex items-center"
            style={{
              gap: 4,
              padding: 6,
              borderRadius: 9999,
              // Frosted glass: see-through, blurred, with a light edge
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 6px 20px rgba(120,70,40,0.12)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {TABS.map(t => {
              const on = selected === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => go(t.key, t.href)}
                  aria-label={t.label}
                  aria-current={on ? 'page' : undefined}
                  className="flex items-center justify-center active:scale-95"
                  style={{
                    height: 40,
                    minWidth: 40,
                    padding: on ? '0 16px' : '0 10px',
                    borderRadius: 9999,
                    background: on ? '#E8632B' : 'transparent',
                    color: on ? '#FFFFFF' : '#3D3530',
                    boxShadow: on ? '0 4px 12px rgba(232,99,43,0.35)' : 'none',
                    transition: 'all 320ms cubic-bezier(0.34, 1.3, 0.64, 1)',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, fontVariationSettings: on ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {t.icon}
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      maxWidth: on ? 70 : 0,
                      marginLeft: on ? 6 : 0,
                      opacity: on ? 1 : 0,
                      fontSize: 13,
                      fontWeight: 600,
                      transition: 'max-width 320ms ease, margin-left 320ms ease, opacity 220ms ease',
                    }}
                  >
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}