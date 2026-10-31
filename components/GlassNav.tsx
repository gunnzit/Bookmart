'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LoadingScreen from '@/components/LoadingScreen'

// Loading screen timing
const MIN_SHOW_MS = 450   // never shorter than this (long enough to read the words)
const SETTLE_MS = 200     // extra wait after the new page appears, so it is fully drawn
const MAX_SHOW_MS = 8000  // safety: never get stuck

type Key = 'home' | 'market' | 'sell'

// Icons are Font Awesome (loaded in layout.tsx).
const TABS: { key: Key; label: string; icon: string; href: string }[] = [
  { key: 'home', label: 'Home', icon: 'fa-house', href: '/' },
  { key: 'market', label: 'Market', icon: 'fa-book-open', href: '/marketplace' },
  { key: 'sell', label: 'Sell', icon: 'fa-tag', href: '/sell' },
]

// What the loading screen says for each tab
const LOAD_TEXT: Record<Key, string> = {
  home: 'Opening Home',
  market: 'Opening the Marketplace',
  sell: 'Opening Sell a book',
}

// Pages that show the bar (Profile shows it with no tab lit)
function showsBar(path: string) {
  return path === '/' || path.startsWith('/marketplace') || path.startsWith('/profile')
}

function derive(path: string): Key | '' {
  if (path === '/') return 'home'
  if (path.startsWith('/sell')) return 'sell'
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
        }, SETTLE_MS))
      }))
    }, wait))
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [pathname, overlay])

  // Fade-out finished: take the loading screen away. This lives in its own effect because the
  // one above is cleaned up as soon as the overlay leaves "on", which used to cancel this timer
  // and leave the screen (and the bar) stuck on pages that do not show the bar, such as /sell.
  useEffect(() => {
    if (overlay !== 'out') return
    const t = setTimeout(() => setOverlay('off'), 280)
    return () => clearTimeout(t)
  }, [overlay])

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
    setLabel(LOAD_TEXT[key])
    setOverlay('on')
    router.push(href)
  }

  return (
    <>
      {/* Loading screen on every tab change (sits under the bar) */}
      {overlay !== 'off' && <LoadingScreen out={overlay === 'out'} label={label} />}

      {visible && (
        <nav
          aria-label="Main"
          // Phones: all pages. Larger screens: Home only (other pages have their own header menu).
          className={'fixed inset-x-0 flex justify-center pointer-events-none px-5 ' + (pathname === '/' || loadingOn ? '' : 'md:hidden') + ' lg:hidden'}
          style={{ zIndex: 300, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <div
            className="pointer-events-auto w-fit max-w-[320px] bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-full px-2 py-1.5 flex items-center justify-center gap-1"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {TABS.map(t => {
              const on = selected === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => go(t.key, t.href)}
                  aria-label={t.label}
                  aria-current={on ? 'page' : undefined}
                  className={'relative before:content-[""] before:absolute before:-inset-y-2 before:-inset-x-0.5 flex items-center justify-center h-8 rounded-full select-none transition-all duration-300 ease-out active:scale-95 ' + (on ? 'px-3.5 bg-[#F7CF65] text-stone-900 font-bold shadow-xs' : 'w-8 text-stone-500 hover:text-stone-800')}
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
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}