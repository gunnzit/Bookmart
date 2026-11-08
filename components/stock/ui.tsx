'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

// Shared pieces for the stock register. Built for people who are new to phones:
// very big buttons, big numbers, one main action per screen, English with Hindi underneath.

export const rupees = (n: number | null | undefined) => (n == null ? '—' : '₹' + Math.round(n).toLocaleString('en-IN'))
export const shortDate = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

// English label with the Hindi underneath
export const Bi: React.FC<{ en: string; hi: string; size?: number; hiSize?: number; className?: string }> = ({ en, hi, size = 18, hiSize, className = '' }) => (
  <span className={'flex flex-col leading-tight ' + className}>
    <span style={{ fontSize: size }} className="font-bold">{en}</span>
    <span style={{ fontSize: hiSize || Math.max(13, size - 4) }} className="opacity-75 font-medium">{hi}</span>
  </span>
)

export const Page: React.FC<{ title: string; hi: string; back?: string; children: ReactNode; footer?: ReactNode }> = ({ title, hi, back, children, footer }) => {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1c1c19] font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="sticky top-0 z-30 bg-[#fcf9f4]/90 backdrop-blur-md border-b border-[#efe9df]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-xl mx-auto px-4 h-[76px] flex items-center gap-3">
          {back && (
            <button onClick={() => router.push(back)} aria-label="Back" className="w-14 h-14 rounded-full bg-[#f0ede9] flex items-center justify-center shrink-0 active:scale-95">
              <span className="material-symbols-outlined text-[28px]">arrow_back</span>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-[24px] font-extrabold leading-tight truncate">{title}</h1>
            <p className="text-[15px] text-[#4f4633] font-medium leading-tight">{hi}</p>
          </div>
        </div>
      </header>
      <main className={'max-w-xl mx-auto px-4 pt-5 flex flex-col gap-5 ' + (footer ? 'pb-40' : 'pb-16')}>{children}</main>
      {footer && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-[#fcf9f4]/95 backdrop-blur-md border-t border-[#efe9df] px-4 pt-3" style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-xl mx-auto">{footer}</div>
        </div>
      )}
    </div>
  )
}

export const Card: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={'bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(28,28,25,0.05)] ' + className}>{children}</section>
)

// The big main action button (gold), at least 72px tall
export const BigButton: React.FC<{ onClick?: () => void; href?: string; disabled?: boolean; children: ReactNode; tone?: 'gold' | 'soft' | 'dark' }> = ({ onClick, href, disabled, children, tone = 'gold' }) => {
  const cls = 'w-full min-h-[72px] rounded-[24px] px-6 py-3 flex items-center justify-center gap-3 text-center active:scale-[0.98] transition-transform disabled:opacity-50 ' +
    (tone === 'gold' ? 'bg-[#fbbf24] text-[#6c4f00] shadow-[0_6px_18px_rgba(251,191,36,0.4)]' : tone === 'dark' ? 'bg-[#1c1c19] text-white' : 'bg-[#f0ede9] text-[#1c1c19]')
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button type="button" onClick={onClick} disabled={disabled} className={cls}>{children}</button>
}

export const Tag: React.FC<{ tone: 'green' | 'yellow' | 'orange' | 'grey'; children: ReactNode }> = ({ tone, children }) => {
  const c = { green: 'bg-[#dcfce7] text-[#166534]', yellow: 'bg-[#fef3c7] text-[#92400e]', orange: 'bg-[#ffedd5] text-[#c2410c]', grey: 'bg-[#f0ede9] text-[#4f4633]' }[tone]
  return <span className={'px-3 py-1 rounded-full text-[14px] font-bold whitespace-nowrap ' + c}>{children}</span>
}

// Full-screen message while something slow happens (reading a bill, saving)
export const Busy: React.FC<{ en: string; hi: string }> = ({ en, hi }) => (
  <div className="fixed inset-0 z-50 bg-[#fcf9f4]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-8 text-center font-['Plus_Jakarta_Sans',sans-serif]">
    <div className="w-16 h-16 rounded-full border-[6px] border-[#fbbf24] border-t-transparent animate-spin" />
    <Bi en={en} hi={hi} size={26} hiSize={20} className="items-center text-[#1c1c19]" />
    <p className="text-[16px] text-[#4f4633]">Please keep this screen open · कृपया यह स्क्रीन खुली रखें</p>
  </div>
)

export async function api<T = any>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T & { error?: string } }> {
  try {
    const res = await fetch(url, { cache: 'no-store', ...init })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  } catch {
    return { ok: false, data: { error: 'offline' } as any }
  }
}

// Plain-language messages for errors from the stock API
export const ERR: Record<string, [string, string]> = {
  offline: ['No internet. Please try again.', 'इंटरनेट नहीं है। फिर से कोशिश करें।'],
  no_access: ['You do not have access to stock.', 'आपको स्टॉक देखने की अनुमति नहीं है।'],
  storage_not_set: ['Bill photos are not set up yet. Tell the owner.', 'बिल फोटो की सेटिंग बाकी है। मालिक को बताएं।'],
  save_failed: ['Could not save the photo. Try again.', 'फोटो सेव नहीं हुई। फिर से कोशिश करें।'],
  bad_photo: ['That photo could not be used. Take it again.', 'यह फोटो नहीं चली। दोबारा लें।'],
  too_many_photos: ['Up to 4 photos per bill.', 'एक बिल में 4 फोटो तक।'],
  need_supplier: ['Please type the supplier name.', 'सप्लायर का नाम लिखें।'],
  no_lines: ['Add at least one item with a quantity.', 'कम से कम एक आइटम और संख्या लिखें।'],
  already_added: ['This bill is already added to stock.', 'यह बिल पहले ही स्टॉक में जुड़ चुका है।'],
  not_enough: ['Not that many in stock.', 'स्टॉक में इतने नहीं हैं।'],
  bad_amount: ['Enter the amount.', 'रकम लिखें।'],
}
export const errText = (code?: string) => ERR[code || ''] || ['Something went wrong. Try again.', 'कुछ गड़बड़ हुई। फिर से कोशिश करें।']
