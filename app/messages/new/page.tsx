'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

const SHADOW = 'shadow-[0_6px_20px_rgba(28,28,25,0.08)]'

function StartChat() {
  const router = useRouter()
  const params = useSearchParams()
  const listingId = params.get('listing') || ''
  const { isLoaded, isSignedIn } = useUser()
  const [error, setError] = useState('')
  const startedRef = useRef(false)

  async function start() {
    setError('')
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.id) { router.replace('/messages/' + d.id); return }
      if (res.status === 401) { setError('signin'); return }
      setError(typeof d.error === 'string' && d.error.length < 120 ? d.error : 'Could not start the chat.')
    } catch {
      setError('Could not start the chat. Please check your connection.')
    }
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!listingId) { setError('No book selected.'); return }
    if (!isSignedIn) { setError('signin'); return }
    if (startedRef.current) return
    startedRef.current = true
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, listingId])

  const mainBtn = 'w-full h-[52px] bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] rounded-full active:scale-[0.98] transition-transform'
  const back = listingId ? '/listing/' + listingId : '/marketplace'

  return (
    <div className="min-h-screen flex items-center justify-center p-5 text-[#1c1c19] antialiased font-['Plus_Jakarta_Sans',sans-serif]" style={{ background: '#fcf9f4' }}>
      <div className={'bg-white rounded-[2rem] p-7 max-w-sm w-full text-center lg:max-w-md lg:p-10 ' + SHADOW}>
        {!error && <p className="text-[14px] text-[#4f4633]">Opening your chat…</p>}
        {error === 'signin' && (
          <>
            <h1 className="text-[20px] font-bold mb-1">Sign in to chat</h1>
            <p className="text-[14px] text-[#4f4633] mb-6">Chats are private between the buyer and the seller.</p>
            <SignInButton mode="modal"><button className={mainBtn}>Sign in</button></SignInButton>
          </>
        )}
        {error && error !== 'signin' && (
          <>
            <h1 className="text-[20px] font-bold mb-1">Can't start this chat</h1>
            <p className="text-[14px] text-[#4f4633] mb-6">{error}</p>
            <button onClick={() => { startedRef.current = false; start() }} className={mainBtn + ' mb-3'}>Try again</button>
            <button onClick={() => router.push(back)} className={'w-full h-[52px] bg-white text-[#1c1c19] text-[17px] font-semibold rounded-full ' + SHADOW}>Back</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function NewChatPage() {
  return (
    <Suspense fallback={null}>
      <StartChat />
    </Suspense>
  )
}