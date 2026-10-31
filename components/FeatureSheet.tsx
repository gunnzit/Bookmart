'use client'
import { useEffect, useRef, useState } from 'react'
import { FEATURE_TIERS, type FeatureTier } from '@/lib/featured'

type Book = {
  title: string
  price: number
  origPrice?: number | null
  images?: string[]
  location?: string
  seller?: { name?: string | null } | null
}

const fill = { fontVariationSettings: "'FILL' 1" }

function endDate(days: number) {
  return new Date(Date.now() + days * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function priceText(n: number) {
  return n === 0 ? 'Free' : '₹' + n.toLocaleString('en-IN')
}

// A small screen showing the real page, shrunk to fit, with the seller's book shown as featured in it.
// Phone: 390px wide. Computer: 1280px wide. The page itself blocks taps in this mode, so it is look-only.
const SCREENS = {
  phone: { w: 390, h: 640 },
  computer: { w: 1280, h: 800 },
}
type Device = keyof typeof SCREENS

function DeviceWindow({ src, device, onFailed }: { src: string; device: Device; onFailed: () => void }) {
  const { w, h } = SCREENS[device]
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(device === 'phone' ? 0.75 : 0.3)
  const [ready, setReady] = useState(false)
  const failed = useRef(onFailed)
  failed.current = onFailed

  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / w)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w])

  // Slow or failed load: show the simple preview instead
  useEffect(() => {
    if (ready) return
    const t = setTimeout(() => failed.current(), 15000)
    return () => clearTimeout(t)
  }, [ready])

  const screen = (
    <div ref={box} className={'relative w-full overflow-hidden bg-[#fcf9f4] ' + (device === 'phone' ? 'rounded-[1.75rem]' : 'rounded-[6px]')} style={{ height: h * scale }}>
      <iframe
        src={src}
        title="Preview of your featured book"
        tabIndex={-1}
        onLoad={() => setTimeout(() => setReady(true), 1200)}
        className="absolute top-0 left-0 border-0 origin-top-left"
        style={{ width: w, height: h, transform: `scale(${scale})` }}
      />
      {!ready && (
        <div className="absolute inset-0 bg-[#fcf9f4] p-4 flex flex-col gap-3" aria-hidden>
          <div className="h-8 rounded-full bg-[#ebe8e3] animate-pulse" />
          <div className="h-6 w-2/3 rounded-full bg-[#ebe8e3] animate-pulse" />
          <div className={'grid gap-3 mt-2 ' + (device === 'phone' ? 'grid-cols-2' : 'grid-cols-5')}>
            {Array.from({ length: device === 'phone' ? 4 : 5 }, (_, k) => <div key={k} className="aspect-[3/4] rounded-2xl bg-[#ebe8e3] animate-pulse" />)}
          </div>
        </div>
      )}
    </div>
  )

  if (device === 'phone') return (
    <div className="mx-auto w-full max-w-[300px] rounded-[2.25rem] bg-[#1c1c19] p-2 shadow-[0_12px_30px_rgba(28,28,25,0.25)]">
      {screen}
      <p className="text-center text-[10px] text-white/70 py-1.5">Live preview · only you can see this</p>
    </div>
  )

  // Computer: a laptop screen with a base
  return (
    <div className="mx-auto w-full">
      <div className="rounded-[14px] bg-[#1c1c19] p-2 pb-1.5 shadow-[0_12px_30px_rgba(28,28,25,0.25)]">
        {screen}
        <p className="text-center text-[10px] text-white/70 pt-1.5">Live preview · only you can see this</p>
      </div>
      <div className="mx-auto h-2.5 w-[112%] -ml-[6%] rounded-b-[10px] bg-gradient-to-b from-[#3a3a36] to-[#1c1c19]" />
    </div>
  )
}

// "Feature your book" bottom sheet (designed in Stitch). Shows the seller how their own book will look,
// where it shows and until when, before they pay. Used on the book page; My listings opens it via ?feature=1.
export default function FeatureSheet({ listingId, book, busy, onPay, onClose }: {
  listingId?: string
  book: Book
  busy: boolean
  onPay: (tier: FeatureTier) => void
  onClose: () => void
}) {
  const [view, setView] = useState<'market' | 'home'>('market')
  // Computers start on the computer view, phones on the phone view
  const [device, setDevice] = useState<Device>(() => (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? 'computer' : 'phone'))
  const [tier, setTier] = useState<FeatureTier>('standard')
  // The live window falls back to the simple cards if it cannot load
  const [windowState, setWindowState] = useState<'ok' | 'failed'>('ok')
  const chosen = FEATURE_TIERS.find(t => t.tier === tier)!
  const until = endDate(chosen.days)

  const photo = book.images?.[0]
  const place = (book.location || '').split(',')[0]
  const seller = (book.seller?.name || '').split(' ')[0]
  const meta = [seller, place].filter(Boolean).join(' • ')
  const showOrig = Number(book.origPrice) > Number(book.price)

  const cover = (h: string) => (
    <div className={'relative w-full rounded-xl overflow-hidden bg-[#f6f3ee] flex items-center justify-center ' + h}>
      {photo
        ? <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <span className="material-symbols-outlined text-[28px] text-[#795900]/50">menu_book</span>}
    </div>
  )
  const tag = <span className="px-1.5 py-0.5 rounded-md bg-[#fbbf24] text-[#1c1c19] font-bold text-[9px] uppercase tracking-wide flex items-center gap-1"><span className="material-symbols-outlined text-[11px]" style={fill}>star</span>Featured</span>
  // A plain card next to yours, drawn as soft placeholders (not a real book)
  const plainCard = (h: string) => (
    <div className="bg-white rounded-2xl p-2.5 border border-[#e5e2dd] opacity-55">
      <div className="h-5 mb-1.5" />
      <div className={'w-full rounded-xl bg-[#ebe8e3] ' + h} />
      <div className="h-2.5 rounded bg-[#ebe8e3] mt-2.5" />
      <div className="h-2.5 w-2/3 rounded bg-[#ebe8e3] mt-1.5" />
      <div className="h-3 w-10 rounded bg-[#ebe8e3] mt-2.5" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-title"
        onClick={e => e.stopPropagation()}
        className="bg-[#fcf9f4] rounded-t-[28px] md:rounded-[28px] w-full max-w-md md:max-w-2xl max-h-[92vh] flex flex-col shadow-[0_-10px_35px_rgba(30,27,25,0.2)] font-['Plus_Jakarta_Sans',sans-serif] text-[#1c1c19]"
      >
        {/* Header */}
        <div className="px-5 pt-3 pb-3 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-[#e5e2dd] mx-auto mb-3 md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="feature-title" className="text-[22px] leading-[28px] font-extrabold tracking-tight">Feature your book</h2>
              <p className="text-[13px] text-[#4f4633] mt-0.5">Get seen first by students near you</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrolling content */}
        <div className="overflow-y-auto px-5 pb-4 flex flex-col gap-5">
          {/* 1. How your book will look */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[15px] font-bold">How your book will look</h3>
              <div className="bg-[#f0ede9] rounded-full p-1 flex" role="tablist" aria-label="Screen">
                {([['phone', 'smartphone', 'Phone'], ['computer', 'laptop', 'Computer']] as const).map(([k, icon, label]) => (
                  <button key={k} role="tab" aria-selected={device === k} aria-label={label} title={label} onClick={() => setDevice(k)}
                    className={'h-8 px-2.5 rounded-full flex items-center gap-1 text-[12px] transition-all ' + (device === k ? 'bg-white font-bold shadow-sm' : 'text-[#4f4633] font-medium')}>
                    <span className="material-symbols-outlined text-[16px]">{icon}</span><span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#f0ede9] rounded-full p-1 flex mb-3" role="tablist">
              {([['market', 'Marketplace'], ['home', 'Home']] as const).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
                  className={'flex-1 h-9 rounded-full text-[13px] transition-all ' + (view === k ? 'bg-white font-bold shadow-sm' : 'text-[#4f4633] font-medium')}>
                  {label}
                </button>
              ))}
            </div>

            {listingId && windowState !== 'failed' ? (
              <DeviceWindow
                key={view + device}
                device={device}
                src={(view === 'home' ? '/' : '/marketplace') + '?featurePreview=' + encodeURIComponent(listingId)}
                onFailed={() => setWindowState('failed')}
              />
            ) : (
            <div className="bg-white rounded-[1.5rem] p-3.5 shadow-[0_4px_20px_rgba(28,28,25,0.05)]">
              {view === 'market' ? (
                <>
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-[#795900]">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>Shown first on Marketplace
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white rounded-2xl p-2.5 border-2 border-[#fbbf24] shadow-[0_6px_18px_rgba(251,191,36,0.25)]">
                      <div className="flex items-center mb-1.5 h-5">{tag}</div>
                      {cover('aspect-[3/4]')}
                      <p className="text-[12px] font-bold leading-snug line-clamp-2 mt-2">{book.title}</p>
                      {meta && <p className="text-[10px] text-[#4f4633] truncate mt-0.5">{meta}</p>}
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-[13px] font-extrabold">{priceText(book.price)}</span>
                        {showOrig && <span className="text-[10px] text-[#817661] line-through">₹{book.origPrice}</span>}
                      </div>
                    </div>
                    {plainCard('aspect-[3/4]')}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[13px] font-extrabold mb-2">Featured Books</p>
                  <div className="flex gap-2.5">
                    <div className="w-[46%] shrink-0 bg-white rounded-2xl p-2 border-2 border-[#fbbf24] shadow-[0_6px_18px_rgba(251,191,36,0.25)]">
                      <div className="relative">
                        {cover('aspect-[3/4]')}
                        <span className="absolute bottom-1 left-1">{tag}</span>
                      </div>
                      <p className="text-[12px] font-bold leading-snug line-clamp-2 mt-1.5">{book.title}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-[13px] font-extrabold text-[#EA580C]">{priceText(book.price)}</span>
                        {showOrig && <span className="text-[10px] text-[#817661] line-through">₹{book.origPrice}</span>}
                      </div>
                    </div>
                    <div className="w-[46%] shrink-0">{plainCard('aspect-[3/4]')}</div>
                  </div>
                </>
              )}
            </div>
            )}
          </section>

          {/* 2. Where it shows */}
          <section className="bg-[#f6f3ee] rounded-[1.5rem] p-4 flex flex-col gap-3">
            <h3 className="text-[15px] font-bold">Where it shows</h3>
            {[
              { icon: 'storefront', t: 'First on Marketplace, in search and categories' },
              { icon: 'home', t: 'In the Featured Books row on Home' },
              { icon: 'star', t: 'Gold Featured star on your book page' },
            ].map(r => (
              <div key={r.icon} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-[#795900]" style={fill}>{r.icon}</span>
                </span>
                <span className="text-[13px] leading-[18px]">{r.t}</span>
              </div>
            ))}
          </section>

          {/* 3. Pick how long */}
          <section>
            <h3 className="text-[15px] font-bold mb-2.5">Pick how long</h3>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Feature length">
              {FEATURE_TIERS.map(t => {
                const on = t.tier === tier
                return (
                  <button key={t.tier} role="radio" aria-checked={on} onClick={() => setTier(t.tier)}
                    className={'relative rounded-[1.25rem] px-2 pt-4 pb-3 text-center transition-all active:scale-[0.97] ' + (on ? 'bg-gradient-to-b from-[#fff4d6] to-white border-2 border-[#fbbf24] shadow-[0_8px_20px_rgba(251,191,36,0.25)] -translate-y-0.5' : 'bg-white border border-[#e5e2dd]')}>
                    {t.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#1c1c19] text-white text-[9px] font-bold uppercase tracking-wide">Most popular</span>}
                    <div className="text-[13px] font-bold">{t.label}</div>
                    <div className="text-[20px] leading-[26px] font-extrabold mt-1">₹{t.price}</div>
                    <div className="text-[11px] text-[#4f4633] mt-0.5">{t.days} days</div>
                    <div className="text-[10px] text-[#795900] font-semibold mt-1.5">Until {endDate(t.days)}</div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 4. Good to know */}
          <section className="flex flex-col gap-2 text-[12px] leading-[17px] text-[#4f4633]">
            <p className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-[#795900]">event_available</span>Ends by itself on {until}. No auto-renew.</p>
            <p className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-[#795900]">info</span>Non-refundable once active. If your book sells early, the feature just ends.</p>
          </section>
        </div>

        {/* Pinned pay bar */}
        <div className="shrink-0 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-[#f0ede9] bg-[#fcf9f4] rounded-b-none md:rounded-b-[28px]">
          <button onClick={() => onPay(tier)} disabled={busy}
            className="w-full h-[52px] rounded-full bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(251,191,36,0.35)] active:scale-[0.98] transition-transform disabled:opacity-60">
            {busy ? 'Opening payment…' : <>Pay ₹{chosen.price} and feature<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
          </button>
          <p className="text-[11px] text-[#817661] text-center mt-2 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[13px]">lock</span>Secure payment by Razorpay · UPI, cards, netbanking
          </p>
        </div>
      </div>
    </div>
  )
}
