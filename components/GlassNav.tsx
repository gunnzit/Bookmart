'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LoadingScreen from '@/components/LoadingScreen'
import { SETS_OPEN, BOOKS_OPEN } from '@/lib/features'

// Loading screen timing
const MIN_SHOW_MS = 450   // never shorter than this (long enough to read the words)
const SETTLE_MS = 200     // extra wait after the new page appears, so it is fully drawn
const MAX_SHOW_MS = 8000  // safety: never get stuck

type Key = 'home' | 'sets' | 'books' | 'market'

// Icons are Font Awesome (loaded in layout.tsx). The 4th tab is the Shop (books, stationery).
const TABS: { key: Key; label: string; icon: string; href: string; soon?: boolean; soonText: string }[] = [
  { key: 'home', label: 'Home', icon: 'fa-house', href: '/', soonText: '' },
  { key: 'market', label: 'Market', icon: 'fa-book-open', href: '/marketplace', soonText: '' },
  { key: 'sets', label: 'Sets', icon: 'fa-bag-shopping', href: '/school-sets', soon: !SETS_OPEN, soonText: 'Sets are coming soon' },
  { key: 'books', label: 'Shop', icon: 'fa-cart-shopping', href: '/books', soon: !BOOKS_OPEN, soonText: 'Shop is coming soon' },
]

// What the loading screen says for each tab
const LOAD_TEXT: Record<Key, string> = {
  home: 'Opening Home',
  market: 'Opening the Marketplace',
  sets: 'Opening School Sets',
  books: 'Opening the Shop',
}

// Pages that show the bar (Profile and My Orders still show it, with no tab lit)
function showsBar(path: string) {
  return path === '/' || path.startsWith('/school-sets') || path.startsWith('/books') || path.startsWith('/marketplace') || path.startsWith('/my-orders') || path.startsWith('/profile')
}

function derive(path: string): Key | '' {
  if (path === '/') return 'home'
  if (path.startsWith('/school-sets')) return 'sets'
  if (path.startsWith('/books')) return 'books'
  if (path.startsWith('/marketplace') || path.startsWith('/listing')) return 'market'
  return ''
}

export default function GlassNav() {
  const router = useRouter()
  const pathname = usePathname() || '/'

  const fromPath = useRef(pathname)
  const startedAt = useRef(0)

  const [selected, setSelected] = useState<Key | ''>(() => derive(pathname))
  const [overlay, setOverlay] = useState<'off' | 'on' | 'out'>('off')
  const [soonMsg, setSoonMsg] = useState('')
  const [label, setLabel] = useState('')

  // The bar always stays on screen while the loading screen is showing
  const loadingOn = overlay !== 'off'
  const visible = showsBar(pathname) || loadingOn

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

  // Tabs that are not open yet: show a short message instead of opening the page
  function showSoon(text: string) {
    setSoonMsg(text)
    setTimeout(() => setSoonMsg(''), 1800)
  }

  function go(key: Key, href: string) {
    setSelected(key)
    if (href === pathname) return // same page: nothing to load
    fromPath.current = pathname
    startedAt.current = Date.now()
    setLabel(LOAD_TEXT[key])
    setOverlay('on')
    router.push(href)
  }

  return (
    <>
      {/* Loading screen on every tab change (sits under the bar) */}
      {overlay !== 'off' && <LoadingScreen out={overlay === 'out'} label={label} />}

      {soonMsg && visible && (
        <div
          className="fixed inset-x-0 flex justify-center pointer-events-none px-5"
          style={{ zIndex: 310, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
        >
          <div className="bg-white rounded-full px-4 py-2 text-[14px] font-medium text-[#1E1B19]" style={{ boxShadow: '0 6px 20px rgba(120,70,40,0.12)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {soonMsg}
          </div>
        </div>
      )}

      {visible && (
        <nav
          aria-label="Main"
          // Phones: all pages. Larger screens: Home only (other pages have their own header menu).
          className={'fixed inset-x-0 flex justify-center pointer-events-none px-5 ' + (pathname === '/' || loadingOn ? '' : 'md:hidden')}
          style={{ zIndex: 300, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <div
            className="pointer-events-auto w-fit max-w-[320px] bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-full px-2 py-1.5 flex items-center justify-center gap-1"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {TABS.map(t => {
              const on = selected === t.key
              const soon = !!t.soon
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => (soon ? showSoon(t.soonText) : go(t.key, t.href))}
                  aria-label={soon ? t.label + ' (coming soon)' : t.label}
                  aria-disabled={soon || undefined}
                  aria-current={on ? 'page' : undefined}
                  className={'relative flex items-center justify-center h-8 rounded-full select-none transition-all duration-300 ease-out active:scale-95 ' + (on ? 'px-3.5 bg-[#F7CF65] text-stone-900 font-bold shadow-xs' : 'w-8 text-stone-500 hover:text-stone-800')}
                  style={{ opacity: soon ? 0.5 : 1 }}
                >
                  <i className={'fa-solid ' + t.icon + ' text-xs transition-colors'} />
                  <span
                    className="overflow-hidden whitespace-nowrap font-bold transition-all duration-300"
                    style={{
                      display: 'inline-block',
                      maxWidth: on ? 80 : 0,
                      marginLeft: on ? 6 : 0,
                      opacity: on ? 1 : 0,
                      fontSize: 12,
                    }}
                  >
                    {t.label}
                  </span>
                  {soon && (
                    <span
                      className="absolute pointer-events-none"
                      style={{ top: -9, right: -8, padding: '1px 6px', borderRadius: 9999, background: '#FCE389', color: '#1C1917', border: '1px solid #FCD34D', fontSize: 9, fontWeight: 700, opacity: 1 }}
                    >
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}