import Link from 'next/link'
import Logo from '@/components/Logo'
import { SETS_OPEN } from '@/lib/features'

// Footer for desktop screens (lg and up). Links are the real pages of the site.
const WHATSAPP_TEXT = '+91 88722 35738'
const WHATSAPP_LINK = 'https://wa.me/918872235738'

export default function DesktopFooter() {
  const col = 'text-[13px] text-stone-300 hover:text-white transition-colors'
  return (
    <footer className="hidden lg:block bg-[#1c1c19] text-white mt-20 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-8">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1.4fr] gap-10">
          <div>
            <span className="inline-block rounded-xl bg-[#fcf9f4] px-3 py-2"><Logo height={26} /></span>
            <p className="text-[13px] text-stone-300 leading-relaxed mt-4 max-w-[300px]">Buy, sell and exchange school books with students and families near you.</p>
            <p className="text-[12px] text-stone-400 mt-4"><i className="fa-solid fa-location-dot mr-1.5" />Chandigarh, Mohali and Panchkula</p>
          </div>
          <div>
            <h4 className="text-[13px] font-bold mb-3">Explore</h4>
            <ul className="space-y-2">
              <li><Link href="/marketplace" className={col}>All books</Link></li>
              <li><Link href="/requests" className={col}>Book requests</Link></li>
              {SETS_OPEN && <li><Link href="/school-sets" className={col}>School sets</Link></li>}
              <li><Link href="/sell" className={col}>Sell a book</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-bold mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className={col}>Contact</Link></li>
              <li><Link href="/terms" className={col}>Terms of service</Link></li>
              <li><Link href="/privacy" className={col}>Privacy policy</Link></li>
              <li><Link href="/refund" className={col}>Refund policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-bold mb-3">Need help?</h4>
            <p className="text-[13px] text-stone-300 mb-3">Message us on WhatsApp for questions about a book or an order.</p>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/10 hover:bg-white/15 transition-colors rounded-2xl px-4 py-3">
              <i className="fa-brands fa-whatsapp text-[22px] text-[#F7CF65]" />
              <span>
                <span className="block text-[11px] text-stone-300">WhatsApp support</span>
                <span className="block text-[17px] font-bold text-[#F7CF65]">{WHATSAPP_TEXT}</span>
              </span>
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 mt-10 pt-5 text-[12px] text-stone-400">
          <span>© wrap&amp;read</span>
          <span className="flex gap-5">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/refund" className="hover:text-white">Refunds</Link>
            <Link href="/contact" className="hover:text-white">Support</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
