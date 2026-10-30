'use client'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { schools } from '@/lib/kit-prices'

const SHADOW = 'shadow-[0_6px_20px_rgba(28,28,25,0.08)]'
const ADMIN_WA = '919914735738'
const WA_HELP = 'https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent('Hi, I need help with my wrap&read order')
const LOOSE = 'Books and stationery'

type Tab = 'all' | 'active' | 'past' | 'chats'

const ACTIVE = ['confirmed', 'assembling', 'ready', 'cancellation_requested']
const PAST = ['delivered', 'cancelled']
const CANCELLABLE = ['confirmed', 'assembling', 'ready']
const STEPS = ['confirmed', 'assembling', 'ready', 'delivered']

function statusInfo(status: string, mode: string) {
  const pickup = mode !== 'delivery'
  const map: Record<string, { label: string; desc: string; tone: string }> = {
    confirmed: { label: 'Order confirmed', desc: 'We have received your order and payment.', tone: 'bg-[#ffdf9f] text-[#795900]' },
    assembling: { label: 'Being assembled', desc: 'Your order is being put together at the store.', tone: 'bg-[#FFF1D1] text-[#9A6B00]' },
    ready: {
      label: pickup ? 'Ready for pickup' : 'Ready',
      desc: pickup ? 'Your order is packed. Collect it from Booth 48, Sector 40-C.' : 'Your order is packed and will be delivered within 24 hours.',
      tone: 'bg-[#FFF1D1] text-[#9A6B00]',
    },
    delivered: {
      label: pickup ? 'Picked up' : 'Delivered',
      desc: 'All done. Exchange is available within 24 hours.',
      tone: 'bg-[#2E8B57]/10 text-[#2E8B57]',
    },
    cancellation_requested: { label: 'Cancellation requested', desc: 'The store will review your request and process your refund.', tone: 'bg-[#FFF1D1] text-[#9A6B00]' },
    cancelled: { label: 'Cancelled', desc: 'This order was cancelled. Any refund is handled by the store.', tone: 'bg-[#ba1a1a]/10 text-[#ba1a1a]' },
  }
  return map[status] || map.confirmed
}

function stepLabel(step: string, mode: string) {
  if (step === 'confirmed') return 'Confirmed'
  if (step === 'assembling') return 'Assembling'
  if (step === 'ready') return 'Ready'
  return mode === 'delivery' ? 'Delivered' : 'Picked up'
}

function money(n: any) {
  return '₹' + (Number(n) || 0).toLocaleString('en-IN')
}

// What to call an order: "Class 10 kit", "Books and stationery" or "Class 10 kit + books"
function orderTitle(order: any): string {
  const school = String(order.school || '')
  if (school === LOOSE) return LOOSE
  const cls = String(order.class || '').replace(/,?\s*Books/i, '').trim()
  const kit = cls ? 'Class ' + cls + ' kit' : 'School kit'
  return school.includes(LOOSE) ? kit + ' + books' : kit
}

export default function MyOrdersPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    fetch('/api/kit-orders')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isLoaded, isSignedIn, user])

  async function requestCancel(order: any) {
    if (!confirm('Request cancellation of this order?\n\nThe store will review your request and process your refund. Cancellation is not possible once your order has been picked up or delivered.')) return
    setCancelling(order.id)
    try {
      const res = await fetch('/api/kit-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, action: 'request-cancel' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Sorry, this order could not be cancelled.')
        setCancelling(null)
        return
      }
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancellation_requested' } : o))
      // Notify the store so they can approve + refund
      const msg = '🚫 CANCELLATION REQUEST\n' + orderTitle(order) + ' (Order ' + order.id.slice(-8) + ')'
        + '\nName: ' + order.buyerName + '\nPaid: ₹' + order.paidNow
        + '\nPlease process my refund. Thank you.'
      window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(msg), '_blank')
    } catch {
      alert('Something went wrong. Please try again or contact the store.')
    }
    setCancelling(null)
  }

  function reorder(order: any) {
    if (order.school === LOOSE) { router.push('/books'); return }
    const cls = parseInt(String(order.class || '').split(/[ ,]+/)[0])
    const q: string[] = []
    const firstSchool = String(order.school || '').split(' + ')[0]
    if (firstSchool && schools[firstSchool]) q.push('school=' + encodeURIComponent(firstSchool))
    if (cls) q.push('class=' + cls)
    router.push('/school-sets' + (q.length ? '?' + q.join('&') : ''))
  }

  const activeCount = orders.filter(o => ACTIVE.includes(o.status)).length
  const shown = tab === 'active' ? orders.filter(o => ACTIVE.includes(o.status))
    : tab === 'past' ? orders.filter(o => PAST.includes(o.status))
    : tab === 'chats' ? [] : orders

  const pageCls = "min-h-screen text-[#1c1c19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
  const pageStyle = { background: '#fcf9f4' }
  const iconBtn = 'w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#4f4633] active:scale-95 transition-transform shrink-0'
  const chip = (on: boolean) => 'shrink-0 px-4 py-2 rounded-full text-[13px] active:scale-95 transition-transform ' + (on ? 'bg-[#fbbf24] text-[#6c4f00] font-semibold shadow-[0_4px_14px_rgba(251,191,36,0.3)]' : 'bg-white text-[#1c1c19] font-medium ' + SHADOW)
  const secondaryBtn = 'h-11 px-3 rounded-full bg-white text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform ' + SHADOW
  const mainBtn = 'w-full h-[52px] bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] rounded-full active:scale-[0.98] transition-transform'

  const helpCard = (
    <section className={'bg-white rounded-[2rem] p-[18px] flex flex-col gap-3 ' + SHADOW}>
      <div>
        <h3 className="text-[15px] font-semibold">Need help with an order?</h3>
        <p className="text-[12px] text-[#4f4633] mt-0.5">The Bedi Book Store team is on WhatsApp.</p>
      </div>
      <p className="text-[12px] text-[#817661]">No cancellation or refund once your order has been picked up or delivered. After that, exchange is available within 24 hours.</p>
      <a href={WA_HELP} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
        <span className="material-symbols-outlined text-[18px] text-[#25D366]">chat</span>WhatsApp support
      </a>
    </section>
  )

  if (!isLoaded) {
    return (
      <div className={pageCls + ' flex items-center justify-center'} style={pageStyle}>
        <span className="material-symbols-outlined text-[32px] text-[#795900] animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className={pageCls + ' flex items-center justify-center p-5'} style={pageStyle}>
        <div className={'bg-white rounded-[2rem] p-7 max-w-sm w-full text-center ' + SHADOW}>
          <h1 className="text-[20px] font-bold mb-1">Track your orders</h1>
          <p className="text-[14px] text-[#4f4633] mb-6">Sign in to see your orders and where they are.</p>
          <SignInButton mode="modal">
            <button className={mainBtn}>Sign in</button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className={pageCls} style={pageStyle}>
      <main className="w-full max-w-md md:max-w-5xl mx-auto px-5 pb-[130px] lg:pb-16" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

          <div className="lg:col-span-8">
            {/* Title row */}
            <header className="flex items-center justify-between mb-5 h-12">
              <div>
                <h1 className="text-[20px] font-bold tracking-tight">My orders</h1>
                <p className="text-[12px] text-[#4f4633] mt-0.5">{activeCount === 0 ? 'Nothing on the way' : activeCount + (activeCount === 1 ? ' order on the way' : ' orders on the way')}</p>
              </div>
              <a aria-label="Chat with the store on WhatsApp" href={WA_HELP} target="_blank" rel="noopener noreferrer" className={iconBtn}>
                <span className="material-symbols-outlined text-[20px]">help_outline</span>
              </a>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setTab('all')} className={chip(tab === 'all')}>All</button>
              <button onClick={() => setTab('active')} className={chip(tab === 'active')}>Active</button>
              <button onClick={() => setTab('past')} className={chip(tab === 'past')}>Past</button>
              <button onClick={() => setTab('chats')} className={chip(tab === 'chats')}>Chats</button>
            </div>

            <div className="flex flex-col gap-4 pt-4">

              {tab === 'chats' ? (
                <div className={'bg-white rounded-[2rem] p-6 text-center ' + SHADOW}>
                  <h2 className="text-[15px] font-semibold mb-1">Chats about books you are buying</h2>
                  <p className="text-[13px] text-[#4f4633] mb-4">Marketplace books are arranged directly with the seller in chat.</p>
                  <button onClick={() => router.push('/messages')} className={mainBtn}>Open messages</button>
                </div>
              ) : loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map(i => <div key={i} className="h-48 rounded-[2rem] bg-white/70 animate-pulse" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className={'bg-white rounded-[2rem] p-6 text-center ' + SHADOW}>
                  <h2 className="text-[15px] font-semibold mb-1">No orders yet</h2>
                  <p className="text-[13px] text-[#4f4633] mb-4">Order a school kit or some stationery and track it here.</p>
                  <button onClick={() => router.push('/school-sets')} className={mainBtn}>Browse school kits</button>
                </div>
              ) : shown.length === 0 ? (
                <div className={'bg-white rounded-[2rem] p-6 text-center ' + SHADOW}>
                  <p className="text-[14px] text-[#4f4633]">No orders in this list.</p>
                </div>
              ) : (
                shown.map(order => {
                  const si = statusInfo(order.status, order.deliveryMode)
                  const stepIdx = STEPS.indexOf(order.status)
                  const showTracker = stepIdx >= 0
                  const open = expandedId === order.id
                  const items: string[] = Array.isArray(order.items) ? order.items : []
                  const canCancel = CANCELLABLE.includes(order.status)
                  const requested = order.status === 'cancellation_requested'
                  const delivered = order.status === 'delivered'
                  const code = 'PP-' + String(order.id || '').slice(-6).toUpperCase()
                  const when = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  const title = orderTitle(order)
                  const isLoose = order.school === LOOSE

                  return (
                    <article key={order.id} className={'bg-white rounded-[2rem] p-[18px] flex flex-col gap-3.5 ' + SHADOW}>

                      {/* Top */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-[15px] font-bold leading-snug">{isLoose ? LOOSE : order.school}</h2>
                          <p className="text-[12px] text-[#817661] mt-0.5">Order {code} · {when}</p>
                        </div>
                        <span className={'px-2.5 py-1 rounded-full text-[12px] font-semibold shrink-0 ' + si.tone}>{si.label}</span>
                      </div>

                      {/* Summary */}
                      <button onClick={() => setExpandedId(open ? null : order.id)} className="flex items-center gap-4 text-left">
                        <div className="w-16 h-20 rounded-[1rem] bg-[#f0ede9] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[28px] text-[#795900]/60">{isLoose ? 'edit_note' : 'backpack'}</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[15px] font-semibold truncate">{title}</span>
                          <p className="text-[12px] text-[#4f4633] mt-0.5">
                            {items.length} {items.length === 1 ? 'item' : 'items'} · {order.deliveryMode === 'delivery' ? 'Home delivery' : 'Pickup, Sector 40-C'}
                          </p>
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-[16px] font-bold">{money(order.totalAmount ?? order.paidNow)}</span>
                            <span className="text-[12px] text-[#817661]">Paid {money(order.paidNow)}</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[#817661] text-[22px] shrink-0 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                      </button>

                      {order.payLater > 0 && !['cancelled', 'delivered'].includes(order.status) && (
                        <div className="rounded-[1rem] bg-[#f6f3ee] px-3.5 py-2.5 text-[13px] font-medium">
                          {money(order.payLater)} to pay at {order.deliveryMode === 'delivery' ? 'delivery' : 'pickup'}
                        </div>
                      )}

                      {/* Tracker */}
                      {showTracker && (
                        <div className="rounded-[1rem] bg-[#f6f3ee]/60 p-3.5 flex flex-col gap-3">
                          <p className="text-[13px] font-semibold">{si.desc}</p>
                          <div className="flex items-start">
                            {STEPS.map((step, i) => {
                              const done = i <= stepIdx
                              const current = i === stepIdx
                              return (
                                <div key={step} className="flex-1 flex flex-col items-center text-center relative">
                                  {i > 0 && <div className={'absolute right-1/2 left-[-50%] top-3 h-0.5 ' + (i <= stepIdx ? 'bg-[#fbbf24]' : 'bg-[#e5e2dd]')} />}
                                  <div className={'w-6 h-6 rounded-full flex items-center justify-center z-10 ' + (done ? 'bg-[#fbbf24] text-[#6c4f00]' : 'bg-white text-[#817661]') + (current && !delivered ? ' ring-4 ring-[#fbbf24]/20' : '')}>
                                    <span className="material-symbols-outlined text-[14px]">{done ? 'check' : 'more_horiz'}</span>
                                  </div>
                                  <span className={'text-[11px] mt-1 ' + (current ? 'text-[#795900] font-semibold' : 'text-[#4f4633]')}>{stepLabel(step, order.deliveryMode)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {!showTracker && (
                        <div className={'rounded-[1rem] px-3.5 py-2.5 text-[13px] font-semibold ' + si.tone}>{si.desc}</div>
                      )}

                      {/* Expanded details */}
                      {open && (
                        <div className="flex flex-col gap-3">
                          <div className="rounded-[1rem] bg-[#f6f3ee]/60 p-3.5">
                            <p className="text-[13px] font-semibold mb-1">Items in this order</p>
                            <div className="max-h-64 overflow-y-auto">
                              {items.map((item, i) => {
                                const cut = item.lastIndexOf(' ₹')
                                const name = cut > -1 ? item.slice(0, cut) : item
                                const price = cut > -1 ? item.slice(cut + 2) : ''
                                return (
                                  <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-[#e5e2dd] last:border-0">
                                    <span className="text-[13px] text-[#4f4633] flex-1">{name}</span>
                                    {price && <span className="text-[13px] font-semibold shrink-0">₹{price}</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 text-[14px] px-1">
                            <div className="flex justify-between"><span className="text-[#4f4633]">Total</span><span className="font-semibold">{money(order.totalAmount)}</span></div>
                            <div className="flex justify-between"><span className="text-[#4f4633]">Paid now</span><span className="font-semibold">{money(order.paidNow)}</span></div>
                            {order.payLater > 0 && (
                              <div className="flex justify-between"><span className="text-[#4f4633]">Due at {order.deliveryMode === 'delivery' ? 'delivery' : 'pickup'}</span><span className="font-semibold">{money(order.payLater)}</span></div>
                            )}
                            <div className="flex justify-between"><span className="text-[#4f4633]">Payment</span><span className="font-semibold">{order.paymentMode === 'full' ? 'Paid in full' : '30% upfront'}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Cancellation / delivered notes */}
                      {requested && (
                        <div className="rounded-[1rem] bg-[#FFF1D1] text-[#9A6B00] p-3 text-[13px] font-medium text-center">
                          Cancellation requested. Waiting for store approval. Your refund is processed once approved.
                        </div>
                      )}
                      {delivered && (
                        <p className="text-[12px] text-[#817661] text-center">No cancellation or refund after pickup or delivery. Exchange is available within 24 hours.</p>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        {canCancel ? (
                          <button onClick={() => requestCancel(order)} disabled={cancelling === order.id} className={secondaryBtn + 'text-[#ba1a1a] disabled:opacity-60'}>
                            {cancelling === order.id ? 'Requesting…' : 'Cancel order'}
                          </button>
                        ) : (
                          <button onClick={() => reorder(order)} className={secondaryBtn}>
                            <span className="material-symbols-outlined text-[18px] text-[#4f4633]">refresh</span>Reorder
                          </button>
                        )}
                        <button onClick={() => window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent('Hi, I have a query about my ' + title + ' order (ID: ' + String(order.id).slice(-8) + ')'), '_blank')} className={secondaryBtn}>
                          <span className="material-symbols-outlined text-[18px] text-[#25D366]">chat</span>Contact store
                        </button>
                      </div>
                      {canCancel && <p className="text-[12px] text-[#817661] text-center -mt-1">You can cancel until the order is picked up or delivered. The store will review and process your refund.</p>}

                      {delivered && (
                        <div className="rounded-[1rem] bg-[#f6f3ee] p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold">Finished with these books?</p>
                            <p className="text-[12px] text-[#4f4633]">Juniors are looking for them.</p>
                          </div>
                          <button onClick={() => router.push('/sell')} className="h-9 px-4 rounded-full bg-white text-[13px] font-semibold text-[#795900] shrink-0 active:scale-95 transition-transform shadow-[0_6px_20px_rgba(28,28,25,0.08)]">Sell them</button>
                        </div>
                      )}
                    </article>
                  )
                })
              )}

              {/* Help (phones) */}
              <div className="lg:hidden">{helpCard}</div>
            </div>
          </div>

          {/* Help (desktop) */}
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-6 self-start">{helpCard}</aside>
        </div>
      </main>
    </div>
  )
}