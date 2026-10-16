'use client'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { schools } from '@/lib/kit-prices'
import BottomNav from '@/components/BottomNav'

const ADMIN_WA = '919914735738'
const WA_HELP = 'https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent('Hi, I need help with my Pageplus order')

type Tab = 'all' | 'active' | 'past' | 'chats'

const ACTIVE = ['confirmed', 'assembling', 'ready', 'cancellation_requested']
const PAST = ['delivered', 'cancelled']
const CANCELLABLE = ['confirmed', 'assembling', 'ready']
const STEPS = ['confirmed', 'assembling', 'ready', 'delivered']

function statusInfo(status: string, mode: string) {
  const pickup = mode !== 'delivery'
  const map: Record<string, { label: string; desc: string; tone: string }> = {
    confirmed: { label: 'Order Confirmed', desc: "We've received your order and payment.", tone: 'bg-primary-fixed text-on-primary-fixed-variant' },
    assembling: { label: 'Being Assembled', desc: 'Your kit is being assembled at the store.', tone: 'bg-secondary-fixed text-on-secondary-fixed' },
    ready: {
      label: pickup ? 'Ready for Pickup' : 'Ready',
      desc: pickup ? 'Your kit is packed. Collect it from Booth 48, Sector 40-C.' : 'Your kit is packed and will be delivered within 24 hours.',
      tone: 'bg-[#E0A100]/15 text-[#9A6B00]',
    },
    delivered: {
      label: pickup ? 'Picked Up' : 'Delivered',
      desc: 'All done. Exchange is available within 24 hours.',
      tone: 'bg-[#2E8B57]/10 text-[#2E8B57]',
    },
    cancellation_requested: { label: 'Cancellation Requested', desc: 'The store will review your request and process your refund.', tone: 'bg-[#E0A100]/15 text-[#9A6B00]' },
    cancelled: { label: 'Cancelled', desc: 'This order was cancelled. Any refund is handled by the store.', tone: 'bg-error-container text-on-error-container' },
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

export default function MyOrdersPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()

  const [logoOk, setLogoOk] = useState(true)
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
    if (!confirm('Request cancellation of this order?\n\nThe store will review your request and process your refund. Cancellation is not possible once your kit has been picked up or delivered.')) return
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
      const msg = '🚫 CANCELLATION REQUEST\nClass ' + order.class + ' kit (Order ' + order.id.slice(-8) + ')'
        + '\nName: ' + order.buyerName + '\nPaid: ₹' + order.paidNow
        + '\nPlease process my refund. Thank you.'
      window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(msg), '_blank')
    } catch {
      alert('Something went wrong. Please try again or contact the store.')
    }
    setCancelling(null)
  }

  function reorder(order: any) {
    const cls = parseInt(String(order.class || '').split(/[ ,]+/)[0])
    const q: string[] = []
    if (order.school && schools[order.school]) q.push('school=' + encodeURIComponent(order.school))
    if (cls) q.push('class=' + cls)
    router.push('/school-sets' + (q.length ? '?' + q.join('&') : ''))
  }

  const activeCount = orders.filter(o => ACTIVE.includes(o.status)).length
  const pastCount = orders.filter(o => PAST.includes(o.status)).length
  const shown = tab === 'active' ? orders.filter(o => ACTIVE.includes(o.status))
    : tab === 'past' ? orders.filter(o => PAST.includes(o.status))
    : tab === 'chats' ? [] : orders

  const navLink = 'font-label-lg text-label-lg text-on-surface-variant hover:text-primary-container transition-colors px-3 py-2 rounded-full hover:bg-surface-container-low whitespace-nowrap'
  const tabBtn = (on: boolean) => 'px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ' + (on ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')
  const badge = (n: number, on: boolean) => <span className={'px-1.5 rounded-full font-label-micro text-[11px] ' + (on ? 'bg-white/25 text-on-primary' : 'bg-primary/10 text-primary')}>{n}</span>

  const helpCard = (
    <section className="bg-surface-container rounded-2xl p-space-md shadow-sm flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[22px]">support_agent</span>
        </div>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Need help with an order?</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">The Bedi Book Store team is on WhatsApp.</p>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-3 flex items-start gap-2">
        <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">info</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">No cancellation or refund once your kit has been picked up or delivered. After that, exchange is available within 24 hours.</p>
      </div>
      <a href={WA_HELP} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl bg-[#25D366] text-white font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
        <span className="material-symbols-outlined text-[18px]">chat</span>WhatsApp support
      </a>
    </section>
  )

  if (!isLoaded) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-[36px] text-primary animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-5">
        <div className="text-center max-w-xs">
          <span className="material-symbols-outlined text-[48px] text-primary">inventory_2</span>
          <h1 className="font-headline-md text-headline-md mt-2 mb-1">Track your orders</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-5">Sign in to see your school kit orders and their status.</p>
          <SignInButton mode="modal">
            <button className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Sign in to view orders</button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(45,30,18,0.04)]">
        <div className="h-16 px-margin md:px-margin-desktop flex items-center justify-between gap-space-sm md:gap-6 max-w-md mx-auto md:max-w-[1100px]">
          <div className="flex items-center gap-space-sm min-w-0">
            <button aria-label="Back" onClick={() => router.push('/')} className="min-w-[44px] min-h-[44px] -ml-space-xs flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            {logoOk ? (
              <img alt="Pageplus" className="h-8 w-auto object-contain cursor-pointer" src="/pageplus-logo.png" onError={() => setLogoOk(false)} onClick={() => router.push('/')} />
            ) : (
              <span className="font-headline-md text-headline-md text-primary cursor-pointer" onClick={() => router.push('/')}>Pageplus</span>
            )}
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            <button className={navLink} onClick={() => router.push('/school-sets')}>School Sets</button>
            <button className={navLink} onClick={() => router.push('/marketplace')}>Marketplace</button>
            <button className={navLink + ' !text-primary-container font-bold'} onClick={() => router.push('/my-orders')}>My Orders</button>
            <button className={navLink} onClick={() => router.push('/profile')}>Profile</button>
          </nav>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => router.push('/school-sets')} className="h-10 px-3.5 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[18px]">add</span><span className="hidden sm:inline">Order another kit</span><span className="sm:hidden">Kit</span>
            </button>
            <button aria-label="Profile" onClick={() => router.push('/profile')} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 ml-1">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-[1100px] pt-16 pb-28 md:pb-12 px-margin md:px-margin-desktop">
        <div className="pt-space-md lg:pt-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

          <div className="lg:col-span-8">
            {/* Title */}
            <div className="flex items-end justify-between gap-3 mb-space-sm">
              <div>
                <span className="font-label-micro text-label-micro uppercase text-primary tracking-widest block mb-1">Account &amp; history</span>
                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">My Orders</h1>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
                <span>{activeCount} Active</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-space-xs overflow-x-auto scrollbar-none py-space-xs -mx-margin px-margin md:mx-0 md:px-0">
              <button onClick={() => setTab('all')} className={tabBtn(tab === 'all')}>All Orders {badge(orders.length, tab === 'all')}</button>
              <button onClick={() => setTab('active')} className={tabBtn(tab === 'active')}>Active {badge(activeCount, tab === 'active')}</button>
              <button onClick={() => setTab('past')} className={tabBtn(tab === 'past')}>Past &amp; Completed {badge(pastCount, tab === 'past')}</button>
              <button onClick={() => setTab('chats')} className={tabBtn(tab === 'chats')}>Chats</button>
            </div>

            <div className="flex flex-col gap-space-lg pt-space-md">

              {tab === 'chats' ? (
                <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
                  <span className="material-symbols-outlined text-[40px] text-primary">forum</span>
                  <h2 className="font-headline-sm text-headline-sm mt-2 mb-1">Chats about books you&apos;re buying</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Marketplace books are arranged directly with the seller in chat.</p>
                  <button onClick={() => router.push('/messages')} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Open messages</button>
                </div>
              ) : loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map(i => <div key={i} className="h-48 rounded-2xl bg-surface-container animate-pulse" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
                  <span className="material-symbols-outlined text-[44px] text-primary">inventory_2</span>
                  <h2 className="font-headline-sm text-headline-sm mt-2 mb-1">No orders yet</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Order a school kit and track it here.</p>
                  <button onClick={() => router.push('/school-sets')} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Browse school kits</button>
                </div>
              ) : shown.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
                  <p className="font-body-md text-body-md text-on-surface-variant">No orders in this list.</p>
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

                  return (
                    <div key={order.id} className="rounded-2xl bg-surface-container-lowest p-space-md shadow-md flex flex-col gap-space-md relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-secondary-container" />

                      {/* Top */}
                      <div className="flex items-start justify-between gap-space-sm pt-1">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant">ORDER #{code}</span>
                            <span className="w-1 h-1 rounded-full bg-outline-variant" />
                            <span className="font-body-sm text-body-sm text-on-surface-variant">{when}</span>
                          </div>
                          <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">{order.school}</span>
                        </div>
                        <span className={'px-2.5 py-1 rounded-full font-label-micro text-[11px] font-semibold shrink-0 ' + si.tone}>{si.label}</span>
                      </div>

                      {/* Summary tile */}
                      <button onClick={() => setExpandedId(open ? null : order.id)} className="flex items-center gap-space-md p-space-sm rounded-xl bg-surface-container-low text-left">
                        <div className="w-16 h-20 rounded-lg bg-primary-fixed/60 flex items-center justify-center shrink-0 relative">
                          <span className="material-symbols-outlined text-[30px] text-primary">backpack</span>
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-inverse-surface/80 text-surface-bright font-label-micro text-[9px]">{items.length} items</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface truncate">Class {order.class} School Kit</span>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            {order.deliveryMode === 'delivery' ? 'Home delivery within 24 hours' : 'Pickup from Sector 40-C'}
                          </p>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{money(order.totalAmount ?? order.paidNow)}</span>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-micro text-label-micro">Paid {money(order.paidNow)}</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-outline text-[22px] shrink-0 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                      </button>

                      {order.payLater > 0 && !['cancelled', 'delivered'].includes(order.status) && (
                        <div className="rounded-xl bg-primary-fixed/50 px-3 py-2 flex items-center gap-2 text-on-primary-fixed-variant font-label-md text-label-md">
                          <span className="material-symbols-outlined text-[18px]">payments</span>
                          {money(order.payLater)} to pay at {order.deliveryMode === 'delivery' ? 'delivery' : 'pickup'}
                        </div>
                      )}

                      {/* Tracker */}
                      {showTracker && (
                        <div className="rounded-xl bg-surface-container-low/70 p-3.5 flex flex-col gap-2.5">
                          <span className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface">
                            <span className="material-symbols-outlined text-[18px] text-primary">{delivered ? 'check_circle' : 'local_shipping'}</span>
                            {si.desc}
                          </span>
                          <div className="flex items-start pt-1">
                            {STEPS.map((step, i) => {
                              const done = i <= stepIdx
                              const current = i === stepIdx
                              return (
                                <div key={step} className="flex-1 flex flex-col items-center text-center relative">
                                  {i > 0 && <div className={'absolute right-1/2 left-[-50%] top-3 h-0.5 ' + (i <= stepIdx ? 'bg-primary' : 'bg-outline-variant')} />}
                                  <div className={'w-6 h-6 rounded-full flex items-center justify-center z-10 ' + (done ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant') + (current && !delivered ? ' ring-4 ring-primary/20' : '')}>
                                    <span className="material-symbols-outlined text-[14px]">{done ? 'check' : 'more_horiz'}</span>
                                  </div>
                                  <span className={'font-label-micro text-[10px] mt-1 ' + (current ? 'text-primary font-bold' : 'text-on-surface-variant')}>{stepLabel(step, order.deliveryMode)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {!showTracker && (
                        <div className={'rounded-xl px-3 py-2.5 font-label-md text-label-md font-semibold ' + si.tone}>{si.desc}</div>
                      )}

                      {/* Expanded details */}
                      {open && (
                        <div className="flex flex-col gap-3">
                          <div className="rounded-xl bg-surface-container-low p-3">
                            <p className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant mb-1">Items in your kit</p>
                            <div className="max-h-64 overflow-y-auto">
                              {items.map((item, i) => {
                                const cut = item.lastIndexOf(' ₹')
                                const name = cut > -1 ? item.slice(0, cut) : item
                                const price = cut > -1 ? item.slice(cut + 2) : ''
                                return (
                                  <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-[#EADFCC]/70 last:border-0">
                                    <span className="font-body-sm text-body-sm text-on-surface-variant flex-1">{name}</span>
                                    {price && <span className="font-label-md text-label-md text-on-surface font-semibold shrink-0">₹{price}</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { l: 'Total', v: money(order.totalAmount) },
                              { l: 'Paid now', v: money(order.paidNow) },
                              order.payLater > 0 ? { l: 'Due at ' + (order.deliveryMode === 'delivery' ? 'delivery' : 'pickup'), v: money(order.payLater) } : null,
                              { l: 'Payment', v: order.paymentMode === 'full' ? 'Paid in full' : '30% upfront' },
                            ].filter(Boolean).map((r: any) => (
                              <div key={r.l} className="bg-surface-container-low rounded-lg p-2.5">
                                <p className="font-label-micro text-[10px] uppercase text-on-surface-variant">{r.l}</p>
                                <p className="font-label-md text-label-md font-semibold text-on-surface">{r.v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cancellation area */}
                      {requested && (
                        <div className="rounded-xl bg-[#E0A100]/15 text-[#9A6B00] p-3 font-label-md text-label-md text-center">
                          Cancellation requested. Waiting for store approval. Your refund is processed once approved.
                        </div>
                      )}
                      {delivered && (
                        <div className="rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm text-on-surface-variant text-center">
                          No cancellation or refund after pickup or delivery. Exchange is available within 24 hours.
                        </div>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-space-sm pt-1">
                        {canCancel ? (
                          <button onClick={() => requestCancel(order)} disabled={cancelling === order.id} className="h-11 px-3 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60">
                            <span className="material-symbols-outlined text-[18px]">cancel</span>{cancelling === order.id ? 'Requesting…' : 'Cancel order'}
                          </button>
                        ) : (
                          <button onClick={() => reorder(order)} className="h-11 px-3 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">refresh</span>Reorder
                          </button>
                        )}
                        <button onClick={() => window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent('Hi, I have a query about my Class ' + order.class + ' kit order (ID: ' + String(order.id).slice(-8) + ')'), '_blank')} className="h-11 px-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform">
                          <span className="material-symbols-outlined text-[18px]">chat</span>Contact store
                        </button>
                      </div>
                      {canCancel && <p className="font-body-sm text-[12px] text-on-surface-variant text-center -mt-1">You can cancel until the kit is picked up or delivered. The store will review and process your refund.</p>}

                      {delivered && (
                        <div className="rounded-xl bg-secondary-fixed/50 p-3 flex items-center justify-between gap-space-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                              <span className="material-symbols-outlined text-[18px]">cycle</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-label-md text-label-md font-semibold text-on-secondary-fixed">Finished with these books?</p>
                              <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">Juniors are looking for them.</p>
                            </div>
                          </div>
                          <button onClick={() => router.push('/sell')} className="h-9 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold shrink-0 active:scale-95 transition-transform">Sell them</button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Help (phones) */}
              <div className="lg:hidden">{helpCard}</div>
            </div>
          </div>

          {/* Help (desktop) */}
          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 self-start mt-0">{helpCard}</aside>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}