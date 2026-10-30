import Link from 'next/link'

// Slim footer for desktop screens (lg and up). Links are the real pages of the site.
export default function DesktopFooter() {
  const link = 'hover:text-stone-800 transition-colors'
  return (
    <footer className="hidden lg:block mt-16 pb-8 text-center text-[12px] text-stone-500 font-['Plus_Jakarta_Sans',sans-serif]">
      <p>
        <Link href="/contact" className={link}>Contact</Link> · <Link href="/terms" className={link}>Terms</Link> · <Link href="/privacy" className={link}>Privacy</Link> · <Link href="/refund" className={link}>Refund</Link>
      </p>
      <p className="mt-1">Bedi Book Store · Sector 40-C, Chandigarh</p>
    </footer>
  )
}
