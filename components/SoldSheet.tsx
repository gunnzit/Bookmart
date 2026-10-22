'use client'
import { useEffect, useState } from 'react'

type Buyer = { id: string; name: string; lastMessageAt: string }

// "Who bought it?" bottom sheet. Used on the listing page and on the profile.
// Marks the book sold and privately records the buyer (or "sold elsewhere").
export default function SoldSheet({
  listingId,
  title,
  onClose,
  onDone,
}: {
  listingId: string
  title: string
  onClose: () => void
  onDone: () => void
}) {
  const [buyers, setBuyers] = useState<Buyer[] | null>(null)
  const [pick, setPick] = useState('') // '' = nothing chosen yet, 'elsewhere', or a buyer id
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    fetch('/api/listings/' + listingId + '/buyers', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { buyers: [] }))
      .then(d => {
        if (!alive) return
        const list: Buyer[] = Array.isArray(d.buyers) ? d.buyers : []
        setBuyers(list)
        if (list.length === 0) setPick('elsewhere')
      })
      .catch(() => {
        if (!alive) return
        setBuyers([])
        setPick('elsewhere')
      })
    return () => { alive = false }
  }, [listingId])

  async function confirm() {
    if (!pick || busy) return
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/listings/' + listingId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sold: true, soldToId: pick === 'elsewhere' ? null : pick }),
      })
      if (res.ok) {
        onDone()
        return
      }
      const d = await res.json().catch(() => ({}))
      setErr(typeof d.error === 'string' && d.error.length < 120 ? d.error : 'Could not update. Please try again.')
    } catch {
      setErr('Could not connect. Please try again.')
    }
    setBusy(false)
  }

  const row = (on: boolean) =>
    'w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.99] transition-transform ' +
    (on ? 'bg-[#FFF1EA] border-2 border-[#E8632B]' : 'bg-[#FFF7F2] border border-[#F0E2DA]')

  return (
    <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-[28px] md:rounded-[28px] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_-10px_35px_rgba(30,27,25,0.2)] font-['Plus_Jakarta_Sans',sans-serif] text-[#1E1B19]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 rounded-full bg-[#F0E2DA] mx-auto mb-4 md:hidden" />
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-[18px] font-bold">Who bought it?</h3>
            <p className="text-[13px] text-[#9A908A] mt-0.5 truncate">{title}</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {buyers === null ? (
          <div className="flex flex-col gap-2.5">
            {[0, 1].map(i => <div key={i} className="h-[52px] rounded-2xl bg-[#FFF1EA] animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {buyers.length === 0 && (
              <p className="text-[13px] text-[#5E5650] mb-1">No one has chatted about this book in the app yet.</p>
            )}
            {buyers.map(b => (
              <button key={b.id} type="button" onClick={() => setPick(b.id)} className={row(pick === b.id)}>
                <span className="w-9 h-9 rounded-full bg-[#FCE3D6] text-[#C4501A] flex items-center justify-center text-[14px] font-bold shrink-0">
                  {b.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold truncate">{b.name}</span>
                  <span className="block text-[12px] text-[#9A908A]">Chatted about this book</span>
                </span>
                {pick === b.id && <span className="material-symbols-outlined text-[20px] text-[#E8632B]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
              </button>
            ))}
            <button type="button" onClick={() => setPick('elsewhere')} className={row(pick === 'elsewhere')}>
              <span className="w-9 h-9 rounded-full bg-[#F8EDE6] text-[#5E5650] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">storefront</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold">Sold somewhere else</span>
                <span className="block text-[12px] text-[#9A908A]">Outside the app, or someone I did not chat with</span>
              </span>
              {pick === 'elsewhere' && <span className="material-symbols-outlined text-[20px] text-[#E8632B]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
            </button>
          </div>
        )}

        {err && <p className="text-[12px] text-[#D64545] mt-3">{err}</p>}

        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="h-[52px] px-6 rounded-full bg-white border border-[#F0E2DA] text-[15px] font-semibold active:scale-95 transition-transform">Cancel</button>
          <button
            onClick={confirm}
            disabled={!pick || busy}
            className="flex-1 h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {busy ? 'Saving…' : 'Mark as sold'}
          </button>
        </div>
        <p className="text-[12px] text-[#9A908A] text-center mt-3">The buyer is only saved for your records. It is never shown to others.</p>
      </div>
    </div>
  )
}