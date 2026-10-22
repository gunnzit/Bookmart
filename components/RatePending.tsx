'use client'
import { useEffect, useState } from 'react'

type Item = { listingId: string; title: string; image: string | null; sellerName: string }

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'
const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

// "Rate your sellers" cards for the profile page. Shows only books the seller marked sold to this
// person and that they have not rated yet. Renders nothing when there is nothing to rate.
export default function RatePending() {
  const [items, setItems] = useState<Item[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [thanks, setThanks] = useState(false)

  useEffect(() => {
    fetch('/api/reviews/pending', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(d => { if (Array.isArray(d.items)) setItems(d.items) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!thanks) return
    const t = setTimeout(() => setThanks(false), 3500)
    return () => clearTimeout(t)
  }, [thanks])

  function open(id: string) {
    setOpenId(id)
    setRating(0)
    setComment('')
    setErr('')
  }

  async function submit(listingId: string) {
    if (!rating || busy) return
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, rating, comment }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok || d.error === 'already_reviewed') {
        setItems(prev => prev.filter(i => i.listingId !== listingId))
        setOpenId(null)
        setThanks(true)
      } else {
        setErr('Could not send your rating. Please try again.')
      }
    } catch {
      setErr('Could not connect. Please try again.')
    }
    setBusy(false)
  }

  if (items.length === 0 && !thanks) return null

  return (
    <section className="mb-7">
      <div className="flex items-center gap-2 mb-2 px-1">
        <h3 className="text-[15px] font-bold">Rate your sellers</h3>
        {items.length > 0 && <span className="px-2 py-0.5 rounded-full bg-[#FFF1EA] text-[12px] font-medium">{items.length} to rate</span>}
      </div>

      {thanks && (
        <p className="text-[13px] text-[#2E8B57] bg-[#2E8B57]/10 rounded-2xl px-3.5 py-2.5 mb-3">Thanks for your rating. It helps other buyers.</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map(it => (
          <article key={it.listingId} className={'bg-white rounded-[22px] p-[18px] ' + SHADOW}>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-14 rounded-[12px] overflow-hidden bg-[#FFF1EA] shrink-0 flex items-center justify-center">
                {it.image
                  ? <img src={it.image} alt="" className="w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-[22px] text-[#C4501A]/50">menu_book</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold leading-snug line-clamp-2">{it.title}</p>
                <p className="text-[12px] text-[#5E5650] mt-0.5">You bought this from {it.sellerName}</p>
              </div>
              {openId !== it.listingId && (
                <button onClick={() => open(it.listingId)} className="h-8 px-3.5 rounded-full bg-[#E8632B] text-white text-[12px] font-semibold active:scale-95 transition-transform shrink-0">Rate</button>
              )}
            </div>

            {openId === it.listingId && (
              <div className="mt-4 pt-4 border-t border-[#F0E2DA]">
                <p className="text-[14px] font-semibold mb-2">How was {it.sellerName}?</p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} aria-label={i + ' star'} onClick={() => setRating(i)} className="p-0.5 active:scale-90 transition-transform">
                      <span style={{ fontSize: 30, lineHeight: 1, color: i <= rating ? '#F5B82E' : '#E8DCD3' }}>★</span>
                    </button>
                  ))}
                  {rating > 0 && <span className="text-[13px] text-[#5E5650] ml-1.5">{WORDS[rating]}</span>}
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 500))}
                  rows={2}
                  placeholder="Add a short comment (optional)"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF1EA] text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] border border-transparent focus:outline-none focus:bg-white focus:border-[#E8632B] focus:ring-2 focus:ring-[#E8632B]/20 resize-none"
                />
                {err && <p className="text-[12px] text-[#D64545] mt-2">{err}</p>}
                <div className="flex gap-2.5 mt-3">
                  <button onClick={() => setOpenId(null)} className="h-12 px-5 rounded-full bg-white border border-[#F0E2DA] text-[14px] font-semibold active:scale-95 transition-transform">Cancel</button>
                  <button onClick={() => submit(it.listingId)} disabled={!rating || busy} className="flex-1 h-12 bg-[#E8632B] text-white text-[15px] font-semibold rounded-full disabled:opacity-40 active:scale-[0.98] transition-transform">
                    {busy ? 'Sending…' : 'Submit rating'}
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}