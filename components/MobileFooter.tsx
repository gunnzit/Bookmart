import Link from 'next/link'
import Logo from '@/components/Logo'
import { SETS_OPEN } from '@/lib/features'

// Compact footer for phones (below lg), the small sibling of DesktopFooter.
// It carries its own bottom padding so the floating bottom bar never covers it;
// pages that already pad their column pass a negative margin in className to cancel the extra space.
const WHATSAPP_TEXT = '+91 88722 35738'
const WHATSAPP_LINK = 'https://wa.me/918872235738'

export default function MobileFooter({ className = '' }: { className?: string }) {
  const a = 'text-[13px] text-stone-300 active:text-white'
  return (
    <footer className={'lg:hidden bg-[#1c1c19] text-white mt-8 rounded-t-[1.75rem] px-5 pt-7 font-[\'Plus_Jakarta_Sans\',sans-serif] ' + className} style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 0px))' }}>
      <span className="inline-block rounded-lg bg-[#fcf9f4] px-2.5 py-1.5"><Logo height={22} /></span>
      <p className="text-[12px] text-stone-300 mt-3">Buy, sell and exchange school books near you.</p>
      <div className="grid grid-cols-2 gap-6 mt-5">
        <ul className="space-y-2.5">
          <li><Link href="/marketplace" className={a}>Marketplace</Link></li>
          <li><Link href="/requests" className={a}>Book requests</Link></li>
          {SETS_OPEN && <li><Link href="/school-sets" className={a}>School sets</Link></li>}
          <li><Link href="/sell" className={a}>Sell a book</Link></li>
        </ul>
        <ul className="space-y-2.5">
          <li><Link href="/contact" className={a}>Contact</Link></li>
          <li><Link href="/terms" className={a}>Terms</Link></li>
          <li><Link href="/privacy" className={a}>Privacy</Link></li>
          <li><Link href="/refund" className={a}>Refund policy</Link></li>
        </ul>
      </div>
      <p className="text-[12px] text-stone-400 mt-5 leading-snug"><i className="fa-solid fa-location-dot mr-1.5" />Booth 48, Bedi Book Store, Sector 40-C, Chandigarh</p>
      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 text-[13px] font-bold text-[#F7CF65]">
        <i className="fa-brands fa-whatsapp text-[16px]" />{WHATSAPP_TEXT}
      </a>
      <p className="text-[11px] text-stone-500 border-t border-white/10 mt-5 pt-3">© wrap&amp;read</p>
    </footer>
  )
}
