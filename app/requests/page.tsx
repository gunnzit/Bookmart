'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'textbook', label: 'School Textbooks' },
  { key: 'stationery', label: 'Stationery & Guides' },
  { key: 'novel', label: 'Fiction & Storybooks' },
  { key: 'competitive', label: 'Competitive Exams' },
]
const AREAS = ['Sector 40-C, Chd', 'Mohali Phase 7', 'Panchkula Sec 11', 'Chandigarh East']

const categoryLabel = (k: string) => CATEGORIES.find(c => c.key === k)?.label || (k ? k.charAt(0).toUpperCase() + k.slice(1) : '')

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 2) return 'just now'
  if (mins < 60) return mins + ' mins ago'
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago')
  const days = Math.round(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return days + ' days ago'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Req = {
  id: string
  title: string
  author: string | null
  category: string
  maxPrice: number | null
  location: string
  note: string | null
  status: string
  createdAt: string
  name: string
  mine: boolean
}

export default function RequestsPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  const [requests, setRequests] = useState<Req[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [hasPhone, setHasPhone] = useState(true)

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('textbook')
  const [budget, setBudget] = useState('')
  const [area, setArea] = useState(AREAS[0])
  const [customArea, setCustomArea] = useState('')
  const [customOpen, setCustomOpen] = useState(false)
  const [customDraft, setCustomDraft] = useState('')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const [posting, setPosting] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [toast, setToast] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/book-requests', { cache: 'no-store' })
      const d = await res.json()
      if (Array.isArray(d.requests)) { setRequests(d.requests); setHasPhone(d.hasPhone !== false); setLoadError('') }
      else setLoadError('Could not load requests.')
    } catch {
      setLoadError('Could not connect. Check your internet and try again.')
    }
    setLoading(false)
  }

  // Load again when sign-in state is known, so "You posted" cards appear
  useEffect(() => {
    if (!isLoaded) return
    load()
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!isSignedIn) { openSignIn(); return }
    if (title.trim().length < 2) { setFormError('Enter the book title.'); return }
    setPosting(true)
    try {
      const res = await fetch('/api/book-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, category, maxPrice: budget, location: area, note }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.request) { setFormError(typeof d.error === 'string' ? d.error : 'Could not post. Please try again.'); setPosting(false); return }
      setRequests(prev => [d.request, ...prev])
      setTitle(''); setAuthor(''); setBudget(''); setNote('')
      setToast('Request posted')
    } catch {
      setFormError('Could not connect. Please try again.')
    }
    setPosting(false)
  }

  function addCustomArea() {
    const v = customDraft.replace(/\s+/g, ' ').trim().slice(0, 40)
    if (v.length < 2) return
    setCustomArea(v)
    setArea(v)
    setCustomDraft('')
    setCustomOpen(false)
  }

  async function markFound(id: string) {
    if (busyId) return
    setBusyId(id)
    try {
      const res = await fetch('/api/book-requests/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'found' }),
      })
      if (res.ok) { setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'found' } : r))); setToast('Marked as found') }
    } catch {}
    setBusyId('')
  }

  async function remove(id: string) {
    if (busyId) return
    if (!confirm('Delete this request?')) return
    setBusyId(id)
    try {
      const res = await fetch('/api/book-requests/' + id, { method: 'DELETE' })
      if (res.ok) setRequests(prev => prev.filter(r => r.id !== id))
    } catch {}
    setBusyId('')
  }

  async function share() {
    const url = 'https://pageplus.in/requests'
    const text = 'Books wanted near you on Pageplus. Have one? List it.'
    try {
      if (navigator.share) { await navigator.share({ title: 'Book Requests', text, url }); return }
    } catch { return }
    try {
      await navigator.clipboard.writeText(url)
      setToast('Link copied')
    } catch {
      window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank')
    }
  }

  const openRequests = requests.filter(r => r.status === 'open')
  const mine = requests.filter(r => r.mine)
  const shown = tab === 'mine' ? mine : openRequests

  const pageStyle = { background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }
  const inputCls = 'w-full bg-[#F8EDE6] text-[#1E1B19] text-[14px] px-4 py-3 rounded-[16px] placeholder:text-[#9A908A] focus:outline-none focus:ring-2 focus:ring-[#FCE3D6] transition-all'
  const chipOn = 'shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold bg-[#E8632B] text-white shadow-sm transition-all'
  const chipOff = 'shrink-0 px-3.5 py-2 rounded-full text-[12px] text-[#1E1B19] bg-[#FFF1EA] hover:bg-[#F0E2DA] transition-all'

  return (
    <div className="min-h-screen flex flex-col text-[#251914] antialiased font-['Plus_Jakarta_Sans',sans-serif]" style={pageStyle}>

      {toast && (
        <div className="fixed inset-x-0 flex justify-center pointer-events-none px-5" style={{ zIndex: 350, top: 'calc(env(safe-area-inset-top, 0px) + 72px)' }}>
          <div className="bg-[#1E1B19] text-white rounded-full px-4 py-2.5 text-[13px] shadow-[0_10px_28px_rgba(30,27,25,0.28)]">{toast}</div>
        </div>
      )}

      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#FDEADF]/80 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-16 px-5 flex items-center justify-between max-w-md md:max-w-2xl mx-auto">
          <button aria-label="Go back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/marketplace'))}
            className={'w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E1B19] active:scale-95 transition-transform ' + SHADOW}>
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="text-[20px] leading-[26px] font-bold text-[#1E1B19] tracking-tight">Book Requests</h1>
          <div className="flex items-center gap-2">
            <button aria-label="Share" onClick={share} className={'w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E1B19] active:scale-95 transition-transform ' + SHADOW}>
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <button aria-label="Profile" onClick={() => (isSignedIn ? router.push('/profile') : openSignIn())} className="w-8 h-8 rounded-full bg-[#E8632B] flex items-center justify-center active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-white text-[18px]">person</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full px-5 pb-16 max-w-md md:max-w-2xl mx-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}>
        <div className="flex flex-col w-full gap-7">

          {/* Intro */}
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[14px] leading-5 text-[#5E5650]">Tell sellers what you need. We’ll let you know when it’s listed.</p>
            <div className={'flex items-center gap-1.5 bg-[#FFF1EA] px-3 py-1.5 rounded-full shrink-0 ' + SHADOW}>
              <span className="w-2 h-2 rounded-full bg-[#2E8B57]" />
              <span className="text-[12px] text-[#1E1B19] font-semibold">Tricity</span>
            </div>
          </div>

          {/* Request form */}
          <section className={'bg-white rounded-[22px] p-5 flex flex-col gap-5 ' + SHADOW}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[20px] leading-[26px] font-bold text-[#1E1B19] tracking-tight">Request a book</h2>
                <p className="text-[12px] text-[#9A908A] mt-0.5">Local parents will check their shelves</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FFF1EA] flex items-center justify-center text-[#E8632B]">
                <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
              </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="book-title" className="text-[12px] font-semibold text-[#1E1B19]">Book title <span className="text-[#E8632B]">*</span></label>
                <input id="book-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="e.g. NCERT Exemplar Physics Class 12" type="text" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="book-author" className="text-[12px] text-[#5E5650]">Author (optional)</label>
                <input id="book-author" value={author} onChange={e => setAuthor(e.target.value)} maxLength={80} placeholder="e.g. SL Arora, HC Verma" type="text" className={inputCls} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#1E1B19]">Category</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                  {CATEGORIES.map(c => (
                    <button key={c.key} type="button" onClick={() => setCategory(c.key)} className={category === c.key ? chipOn : chipOff}>{c.label}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="book-budget" className="text-[12px] text-[#5E5650]">Highest price you will pay (optional)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-[16px] font-bold text-[#5E5650]">₹</span>
                  <input id="book-budget" value={budget} onChange={e => setBudget(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="Maximum budget" className={inputCls + ' !pl-8'} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#1E1B19]">Meetup area <span className="text-[#E8632B]">*</span></span>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map(a => (
                    <button key={a} type="button" onClick={() => setArea(a)}
                      className={'px-3 py-1.5 rounded-full text-[12px] transition-all ' + (area === a ? 'font-semibold bg-[#E8632B] text-white shadow-sm' : 'text-[#1E1B19] bg-[#FFF1EA] hover:bg-[#F0E2DA]')}>{a}</button>
                  ))}
                  {customArea && (
                    <button type="button" onClick={() => setArea(customArea)}
                      className={'pl-3 pr-2 py-1.5 rounded-full text-[12px] transition-all flex items-center gap-1 ' + (area === customArea ? 'font-semibold bg-[#E8632B] text-white shadow-sm' : 'text-[#1E1B19] bg-[#FFF1EA] hover:bg-[#F0E2DA]')}>
                      <span>{customArea}</span>
                      <span aria-label="Remove area" onClick={e => { e.stopPropagation(); setCustomArea(''); if (area === customArea) setArea(AREAS[0]) }} className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                  {customOpen ? (
                    <div className="flex items-center gap-1 bg-[#F8EDE6] rounded-full pl-3 pr-1 py-1 focus-within:ring-2 focus-within:ring-[#FCE3D6]">
                      <input autoFocus value={customDraft} onChange={e => setCustomDraft(e.target.value)} maxLength={40} placeholder="Type your area"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomArea() } }}
                        className="w-32 bg-transparent text-[12px] text-[#1E1B19] placeholder:text-[#9A908A] focus:outline-none" />
                      <button type="button" aria-label="Add area" onClick={addCustomArea} className="w-6 h-6 rounded-full bg-[#E8632B] text-white flex items-center justify-center active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setCustomOpen(true)}
                      className="px-3 py-1.5 rounded-full text-[12px] text-[#C4501A] bg-[#FFF1EA] hover:bg-[#F0E2DA] flex items-center gap-1 transition-all">
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      <span>{customArea ? 'Change area' : 'Other area'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="book-note" className="text-[12px] text-[#5E5650]">Note (optional)</label>
                <textarea id="book-note" value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={2} placeholder="e.g. Clean interior pages needed for board exam prep"
                  className="w-full bg-[#F8EDE6] text-[#1E1B19] text-[14px] px-4 py-2.5 rounded-[16px] placeholder:text-[#9A908A] focus:outline-none focus:ring-2 focus:ring-[#FCE3D6] resize-none transition-all" />
              </div>

              {formError && <p className="text-[12px] text-[#D64545]">{formError}</p>}

              <div className="pt-2">
                <button type="submit" disabled={posting}
                  className="w-full h-[52px] bg-[#E8632B] text-white rounded-full text-[17px] leading-[22px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_6px_20px_rgba(232,99,43,0.25)] disabled:opacity-60">
                  <span>{posting ? 'Posting…' : isSignedIn ? 'Post request' : 'Sign in to post'}</span>
                  {!posting && <span className="material-symbols-outlined text-[20px]">send</span>}
                </button>
                {isSignedIn && !hasPhone && (
                  <p className="text-[12px] text-[#5E5650] text-center mt-2.5">
                    Add your WhatsApp number in <button type="button" onClick={() => router.push('/profile')} className="font-semibold text-[#C4501A]">Profile</button> to get an alert when it is listed.
                  </p>
                )}
              </div>
            </form>
          </section>

          {/* Open requests */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="text-[20px] leading-[26px] font-bold text-[#1E1B19]">Open requests near you</h3>
                <span className="text-[12px] text-[#9A908A] font-semibold shrink-0">({openRequests.length} open)</span>
              </div>
            </div>

            {isSignedIn && (
              <div className="flex items-center p-1 bg-[#F8EDE6] rounded-full self-start shadow-[0_6px_20px_rgba(120,70,40,0.04)]">
                <button onClick={() => setTab('all')} className={'px-3 py-1 rounded-full text-[12px] transition-all ' + (tab === 'all' ? 'font-semibold bg-white text-[#1E1B19] shadow-sm' : 'text-[#9A908A]')}>All ({openRequests.length})</button>
                <button onClick={() => setTab('mine')} className={'px-3 py-1 rounded-full text-[12px] transition-all ' + (tab === 'mine' ? 'font-semibold bg-white text-[#1E1B19] shadow-sm' : 'text-[#9A908A]')}>My requests ({mine.length})</button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-4">
                {[0, 1].map(i => <div key={i} className="h-[200px] rounded-[22px] bg-white/70 animate-pulse" />)}
              </div>
            ) : loadError ? (
              <div className={'bg-white rounded-[22px] p-6 text-center ' + SHADOW}>
                <p className="text-[14px] text-[#5E5650] mb-4">{loadError}</p>
                <button onClick={() => { setLoading(true); load() }} className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">Try again</button>
              </div>
            ) : shown.length === 0 ? (
              <div className={'bg-white rounded-[22px] p-6 text-center ' + SHADOW}>
                <p className="text-[14px] text-[#5E5650]">{tab === 'mine' ? 'You have not posted a request yet.' : 'No open requests yet. Post the first one above.'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {shown.map(r => {
                  const sub = [r.author, categoryLabel(r.category)].filter(Boolean).join(' · ')
                  const found = r.status === 'found'
                  return (
                    <article key={r.id} className={'bg-white rounded-[22px] p-4 flex flex-col gap-3.5 transition-all ' + SHADOW + (found ? ' opacity-75' : '')}>
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2">
                        {r.mine ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FCE3D6] text-[#C4501A]">You posted</span>
                            <span className="text-[12px] text-[#9A908A]">{timeAgo(r.createdAt)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0 text-[#9A908A]">
                            <div className="w-7 h-7 rounded-full bg-[#FCE3D6] text-[#E8632B] flex items-center justify-center text-[12px] font-semibold shrink-0">{r.name.charAt(0).toUpperCase()}</div>
                            <div className="flex items-center gap-1 text-[12px] min-w-0">
                              <span className="font-semibold text-[#1E1B19] truncate">{r.name}</span>
                              <span>·</span>
                              <span className="whitespace-nowrap">{timeAgo(r.createdAt)}</span>
                            </div>
                          </div>
                        )}
                        <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#FFF1EA] text-[#5E5650] truncate max-w-[45%]">{r.location}</span>
                      </div>

                      {/* Book */}
                      <div className="flex flex-col gap-1">
                        <h4 className="text-[17px] leading-tight font-semibold text-[#1E1B19]">{r.title}</h4>
                        {sub && <p className="text-[12px] text-[#9A908A]">{sub}</p>}
                      </div>

                      {/* Price and note */}
                      {(r.maxPrice || r.note) && (
                        <div className="bg-[#FFF7F2] rounded-[16px] p-3 flex flex-col gap-1.5">
                          {r.maxPrice ? (
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#5E5650]">{r.mine ? 'Your offered budget' : 'Willing to pay'}</span>
                              <span className={'text-[16px] font-bold ' + (r.mine ? 'text-[#1E1B19]' : 'text-[#C4501A]')}>Wanted up to ₹{r.maxPrice.toLocaleString('en-IN')}</span>
                            </div>
                          ) : null}
                          {r.note && <p className="text-[13px] leading-relaxed text-[#5E5650]">“{r.note}”</p>}
                        </div>
                      )}

                      {/* Actions */}
                      {r.mine ? (
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1 text-[#5E5650]">
                            <span className={'w-2 h-2 rounded-full ' + (found ? 'bg-[#9A908A]' : 'bg-[#2E8B57]')} />
                            <span className="text-[12px]">{found ? 'Found' : 'Open'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!found && (
                              <button onClick={() => markFound(r.id)} disabled={busyId === r.id}
                                className="px-3 py-1.5 rounded-full bg-[#FFF1EA] hover:bg-[#F8EDE6] text-[#2E8B57] text-[12px] font-semibold flex items-center gap-1 active:scale-95 transition-all disabled:opacity-60">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                <span>Mark as found</span>
                              </button>
                            )}
                            <button aria-label="Delete request" onClick={() => remove(r.id)} disabled={busyId === r.id}
                              className="w-8 h-8 rounded-full bg-[#FFF1EA] hover:bg-[#F8EDE6] text-[#9A908A] hover:text-[#D64545] flex items-center justify-center active:scale-95 transition-all disabled:opacity-60">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-0.5">
                          <button onClick={() => router.push('/sell')}
                            className="w-full py-2.5 px-4 rounded-full bg-[#FFF1EA] hover:bg-[#FCE3D6] active:scale-95 text-[#C4501A] text-[14px] font-semibold flex items-center justify-center gap-2 transition-all">
                            <span className="material-symbols-outlined text-[18px]">sell</span>
                            <span>I have this, list it</span>
                          </button>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* How alerts work */}
          <section className="bg-[#FFF1EA] rounded-[22px] p-4 flex items-start gap-3.5">
            <div className="w-9 h-9 shrink-0 rounded-full bg-white flex items-center justify-center text-[#E8632B] shadow-sm mt-0.5">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div className="flex flex-col gap-1">
              <h5 className="text-[15px] leading-5 font-semibold text-[#1E1B19]">Can’t find what you need?</h5>
              <p className="text-[13px] leading-relaxed text-[#5E5650]">When a local parent lists it, we message you on WhatsApp.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}