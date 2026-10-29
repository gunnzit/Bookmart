'use client'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Plain wrap&read page: glass top bar with a back button and title, warm off-white page.
// Used by the info pages (contact, terms, refund).
export default function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1c1c19] antialiased font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f4]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="w-full max-w-2xl mx-auto h-16 px-4 flex items-center gap-3">
          <button aria-label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
            className="w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center active:scale-90 transition-transform shrink-0">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-[20px] leading-[24px] font-bold tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-[12px] text-[#4f4633] truncate">{subtitle}</p>}
          </div>
        </div>
      </header>
      <main className="w-full max-w-2xl mx-auto px-4 pb-16" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}>
        {children}
      </main>
    </div>
  )
}
