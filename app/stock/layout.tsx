import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { stockUser } from '@/lib/stock'
import { auth } from '@clerk/nextjs/server'

export const metadata: Metadata = { title: 'Stock', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

// Only the owner and the people in STOCK_EMAILS can open any /stock page
export default async function StockLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=%2Fstock')
  const me = await stockUser()
  if (!me) {
    return (
      <div className="min-h-screen bg-[#fcf9f4] flex flex-col items-center justify-center gap-3 px-8 text-center font-['Plus_Jakarta_Sans',sans-serif] text-[#1c1c19]">
        <span className="material-symbols-outlined text-[56px] text-[#795900]">lock</span>
        <h1 className="text-[20px] font-extrabold">This page is for the shop team</h1>
      </div>
    )
  }
  return <>{children}</>
}
