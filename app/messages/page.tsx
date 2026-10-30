'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { ConversationList, useConversations, type ConvTab } from '@/components/ConversationList'

const SHADOW = 'shadow-[0_6px_20px_rgba(28,28,25,0.08)]'

export default function MessagesPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const { rows, status, reload } = useConversations(isLoaded && !!isSignedIn)
  const [tab, setTab] = useState<ConvTab>('all')

  const pageCls = "min-h-screen text-[#1c1c19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
  const pageStyle = { background: '#fcf9f4' }
  const mainBtn = 'w-full h-[52px] bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] rounded-full active:scale-[0.98] transition-transform'

  const unreadTotal = rows.filter(r => r.unread).length

  return (
    <div className={pageCls} style={pageStyle}>
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-[#fcf9f4]/85 backdrop-blur-xl shadow-[0_6px_20px_rgba(28,28,25,0.06)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-16 px-5 flex items-center justify-between gap-4 max-w-xl mx-auto">
          <button aria-label="Back to market" onClick={() => router.push('/marketplace')} className={'w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center active:scale-95 transition-transform shrink-0'}>
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0 flex flex-col items-center text-center">
            <h1 className="text-[20px] font-bold leading-tight">Messages</h1>
            {unreadTotal > 0 && <span className="text-[12px] text-[#795900] font-semibold">{unreadTotal} new</span>}
          </div>
          <span className="w-10 shrink-0" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 pb-16 lg:max-w-[1200px] lg:px-6 lg:pt-8! lg:pb-12 lg:flex lg:gap-6 lg:items-start" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}>
        {isLoaded && !isSignedIn ? (
          <div className={'bg-white rounded-[2rem] p-7 text-center mt-6 lg:mx-auto lg:max-w-md lg:w-full lg:mt-12 ' + SHADOW}>
            <h2 className="text-[20px] font-bold mb-1">Sign in to see your messages</h2>
            <p className="text-[14px] text-[#4f4633] mb-6">Chat with buyers and sellers about books.</p>
            <SignInButton mode="modal"><button className={mainBtn}>Sign in</button></SignInButton>
          </div>
        ) : (
          <>
            <div className="lg:w-[340px] lg:shrink-0">
              <div className="hidden lg:flex items-baseline justify-between mb-3">
                <h2 className="text-[22px] font-black tracking-tight">Messages</h2>
                {unreadTotal > 0 && <span className="text-[12px] text-[#795900] font-semibold">{unreadTotal} new</span>}
              </div>
              <ConversationList rows={rows} status={status} reload={reload} tab={tab} setTab={setTab} />
            </div>
            <section aria-label="No conversation open" className="hidden lg:flex flex-1 min-w-0 min-h-[520px] bg-white rounded-3xl border border-stone-200 shadow-sm items-center justify-center text-center p-10">
              <div>
                <div className="w-16 h-16 rounded-full bg-[#F7CF65]/40 text-[#795900] flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[30px]">chat</span>
                </div>
                <h2 className="text-[20px] font-bold mb-1">Pick a conversation</h2>
                <p className="text-[14px] text-[#4f4633] max-w-xs mx-auto">Choose a chat on the left to read it and reply. Meet in daylight at school gates or market hubs.</p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
