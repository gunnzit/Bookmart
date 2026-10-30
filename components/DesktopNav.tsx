'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Logo from '@/components/Logo'

// Top bar for desktop screens (lg and up). Phones keep their own headers and the bottom pill.
// Mounted once in app/layout.tsx (inside Suspense). Hidden on admin and sign-in/up pages.
// On /marketplace typing writes ?q= into the address and the page filters; elsewhere Enter opens /marketplace?q=.
const HIDE_ON = ['/admin', '/sign-in', '/sign-up']
const LINKS = [
  { href: '/', label: 'Home', match: (p: string) => p === '/' },
  { href: '/marketplace', label: 'Market', match: (p: string) => p.startsWith('/marketplace') || p.startsWith('/listing') },
  { href: '/sell', label: 'Sell', match: (p: string) => p.startsWith('/sell') },
]

export default function DesktopNav() {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const { isSignedIn } = useUser()
  const sp = useSearchParams()
  const onMarket = pathname.startsWith('/marketplace')
  const urlQ = sp.get('q') ?? ''
  const [own, setOwn] = useState('')
  const [unread, setUnread] = useState(0)
  const value = onMarket ? urlQ : own

  function onType(v: string) {
    if (!onMarket) { setOwn(v); return }
    window.history.replaceState(null, '', v ? '/marketplace?q=' + encodeURIComponent(v) : '/marketplace')
  }

  function goSignIn() {
    router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname + window.location.search))
  }

  // Unread message count for the messages icon
  useEffect(() => {
    if (!isSignedIn) { setUnread(0); return }
    let stop = false
    async function loadUnread() {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/chat/conversations', { cache: 'no-store' })
        if (!res.ok) return
        const d = await res.json()
        if (!stop) setUnread(Number(d.unreadCount) || 0)
      } catch {}
    }
    loadUnread()
    const t = setInterval(loadUnread, 30000)
    return () => { stop = true; clearInterval(t) }
  }, [isSignedIn])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (onMarket) return
    const q = own.trim()
    router.push(q ? '/marketplace?q=' + encodeURIComponent(q) : '/marketplace')
  }

  const iconBtn = 'relative w-10 h-10 rounded-full flex items-center justify-center text-[#1c1c19] hover:bg-[#f0ede9] transition-colors'

  if (HIDE_ON.some(h => pathname === h || pathname.startsWith(h + '/'))) return null

  return (
    <header className="hidden lg:block sticky top-0 z-[200] bg-[#fcf9f4]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.05)] font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-[1200px] mx-auto h-[68px] px-6 flex items-center gap-8">
        <Link href="/" aria-label="wrap&read home" className="flex items-center shrink-0">
          <Logo height={30} />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {LINKS.map(l => {
            const on = l.match(pathname)
            return (
              <Link key={l.href} href={l.href} aria-current={on ? 'page' : undefined}
                className={'px-4 py-1.5 rounded-full text-[14px] transition-colors ' + (on ? 'bg-[#F7CF65] text-[#1c1c19] font-bold' : 'text-[#4f4633] font-semibold hover:bg-[#f0ede9]')}>
                {l.label}
              </Link>
            )
          })}
        </nav>
        <form onSubmit={onSubmit} className="flex-1 max-w-[460px] ml-auto relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#817661] text-[13px]" />
          <input
            value={value}
            onChange={e => onType(e.target.value)}
            aria-label="Search books, authors, schools"
            placeholder="Search books, authors, schools"
            className="w-full h-11 bg-white pl-10 pr-4 rounded-full text-[14px] font-medium placeholder:text-[#817661] border border-stone-200 outline-none focus:ring-2 focus:ring-[#F7CF65]"
          />
        </form>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" aria-label="Notifications" className={iconBtn}>
            <i className="fa-regular fa-bell text-[16px]" />
          </button>
          <button type="button" aria-label={unread > 0 ? 'Messages, ' + unread + ' unread' : 'Messages'} onClick={() => (isSignedIn ? router.push('/messages') : goSignIn())} className={iconBtn}>
            <i className="fa-regular fa-comment-dots text-[16px]" />
            {unread > 0 && (
              <span className="absolute top-0 right-0 bg-[#EA580C] text-white text-[10px] font-extrabold px-1 rounded-full border-2 border-[#fcf9f4] leading-tight">{unread > 9 ? '9+' : unread}</span>
            )}
          </button>
          <button type="button" aria-label={isSignedIn ? 'Profile' : 'Sign in'} onClick={() => (isSignedIn ? router.push('/profile') : goSignIn())}
            className="ml-1 w-10 h-10 bg-[#F7CF65] rounded-full flex items-center justify-center text-[#1c1c19] hover:brightness-95 transition">
            <i className="fa-regular fa-user text-[15px]" />
          </button>
        </div>
      </div>
    </header>
  )
}
