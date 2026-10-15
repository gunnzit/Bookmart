'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

export default function NewChatPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [error, setError] = useState('')
  const [listingId, setListingId] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    const lid = new URLSearchParams(window.location.search).get('listing') || ''
    setListingId(lid)
    if (!lid) { setError('No book was selected.'); return }
    if (!isSignedIn || started.current) return
    started.current = true
    fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: lid }),
    })
      .then(async res => {
        const d = await res.json().catch(() => ({}))
        if (res.ok && d.id) router.replace('/messages/' + d.id)
        else setError(d.error || 'Could not start the chat.')
      })
      .catch(() => setError('Could not connect. Please try again.'))
  }, [isLoaded, isSignedIn])

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-5">
      <div className="text-center max-w-sm">
        {error ? (
          <>
            <span className="material-symbols-outlined text-[44px] text-primary">forum</span>
            <h1 className="font-headline-md text-headline-md mt-2 mb-1">Can&apos;t open this chat</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              {listingId && <button onClick={() => router.push('/listing/' + listingId)} className="bg-surface-container-low text-on-surface font-label-lg text-label-lg font-semibold px-5 py-2.5 rounded-xl">View listing</button>}
              <button onClick={() => router.push('/marketplace')} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-5 py-2.5 rounded-xl shadow-md">Marketplace</button>
            </div>
          </>
        ) : isLoaded && !isSignedIn ? (
          <>
            <span className="material-symbols-outlined text-[44px] text-primary">lock</span>
            <h1 className="font-headline-md text-headline-md mt-2 mb-1">Sign in to chat</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Chats are private between you and the seller.</p>
            <SignInButton mode="modal">
              <button className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Sign in</button>
            </SignInButton>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[44px] text-primary animate-pulse">forum</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Opening chat…</p>
          </>
        )}
      </div>
    </div>
  )
}