'use client'
import { useEffect, useState } from 'react'
import { Page, Bi, BigButton, api, errText, rupees } from '@/components/stock/ui'

type Item = { id: string; name: string; category: string; qty: number; mrp: number | null; costPrice: number | null; lowAt: number }
const FILTERS = [
  { k: 'all', en: 'All', hi: 'सब' }, { k: 'book', en: 'Books', hi: 'किताबें' },
  { k: 'stationery', en: 'Stationery', hi: 'स्टेशनरी' }, { k: 'low', en: 'Running low', hi: 'कम बचा' },
]

export default function StockList() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [items, setItems] = useState<Item[] | null>(null)
  const [open, setOpen] = useState<Item | null>(null)
  const [count, setCount] = useState('1')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // starting search/filter from the address (links from the stock home)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('q')) setQ(p.get('q')!)
    if (p.get('filter')) setFilter(p.get('filter')!)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      api<{ items: Item[] }>(`/api/stock/items?q=${encodeURIComponent(q)}&filter=${filter}`).then(r => setItems(r.ok ? r.data.items : []))
    }, 250)
    return () => clearTimeout(t)
  }, [q, filter])

  async function takeOut(reason: 'sold' | 'adjust', change: number) {
    if (!open) return
    setSaving(true); setMsg('')
    const r = await api<{ qty: number }>('/api/stock/items/' + open.id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ change, reason }) })
    setSaving(false)
    if (r.ok) {
      setItems(items?.map(i => (i.id === open.id ? { ...i, qty: r.data.qty } : i)) || null)
      setOpen(null); setCount('1')
    } else setMsg(errText(r.data.error).join(' · '))
  }

  return (
    <Page title="Stock list" hi="दुकान का स्टॉक" back="/stock">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search · खोजें (e.g. ncert 8 science)" className="h-16 rounded-[22px] bg-white px-5 text-[18px] shadow-[0_4px_20px_rgba(28,28,25,0.05)] outline-none focus:ring-2 focus:ring-[#fbbf24]" />
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={'shrink-0 h-14 px-5 rounded-full flex items-center ' + (filter === f.k ? (f.k === 'low' ? 'bg-[#c2410c] text-white' : 'bg-[#1c1c19] text-white') : 'bg-white shadow-sm')}>
            <Bi en={f.en} hi={f.hi} size={15} hiSize={12} />
          </button>
        ))}
      </div>

      {items === null && <p className="text-[17px] text-[#4f4633]">Loading… · लोड हो रहा है…</p>}
      {items?.length === 0 && <p className="text-[17px] text-[#4f4633] bg-white rounded-[24px] p-5">Nothing here yet. Items appear when a bill is added. · बिल जोड़ने पर आइटम दिखेंगे।</p>}
      <div className="flex flex-col gap-3">
        {items?.map(i => {
          const low = i.qty <= i.lowAt
          return (
            <button key={i.id} onClick={() => { setOpen(i); setMsg('') }} className="bg-white rounded-[24px] p-4 flex items-center gap-3 text-left shadow-[0_4px_20px_rgba(28,28,25,0.05)] active:scale-[0.99]">
              <div className="flex-1 min-w-0">
                <p className="text-[18px] font-bold leading-snug">{i.name}</p>
                <p className="text-[15px] text-[#4f4633] mt-0.5">{i.category === 'book' ? 'Book · किताब' : i.category === 'stationery' ? 'Stationery · स्टेशनरी' : 'Other · अन्य'}{i.mrp != null ? ' · MRP ' + rupees(i.mrp) : ''}</p>
              </div>
              <div className={'shrink-0 min-w-[84px] rounded-[18px] px-3 py-2 text-center ' + (low ? 'bg-[#ffedd5] text-[#c2410c]' : 'bg-[#f6f3ee]')}>
                <p className="text-[28px] font-extrabold leading-none">{i.qty}</p>
                <p className="text-[13px] font-bold mt-1">left · बचे</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Item sheet: take items out of stock */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/45 flex items-end justify-center" onClick={() => setOpen(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-[#fcf9f4] rounded-t-[32px] p-5 flex flex-col gap-4" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
            <div className="w-12 h-1.5 rounded-full bg-[#e5e2dd] mx-auto" />
            <div>
              <p className="text-[22px] font-extrabold leading-snug">{open.name}</p>
              <p className="text-[18px] text-[#4f4633] mt-1"><b className="text-[#1c1c19] text-[24px]">{open.qty}</b> in stock · स्टॉक में{open.mrp != null ? ' · MRP ' + rupees(open.mrp) : ''}</p>
            </div>
            <Bi en="How many sold or used?" hi="कितने बिके / इस्तेमाल हुए?" size={18} />
            <div className="flex items-center gap-3">
              <button onClick={() => setCount(String(Math.max(1, (Number(count) || 1) - 1)))} className="w-16 h-16 rounded-[20px] bg-[#f0ede9] text-[32px] font-bold">−</button>
              <input inputMode="numeric" value={count} onChange={e => setCount(e.target.value.replace(/\D/g, ''))} className="flex-1 h-16 rounded-[20px] bg-white text-center text-[30px] font-extrabold outline-none focus:ring-2 focus:ring-[#fbbf24]" />
              <button onClick={() => setCount(String((Number(count) || 0) + 1))} className="w-16 h-16 rounded-[20px] bg-[#f0ede9] text-[32px] font-bold">+</button>
            </div>
            {msg && <p className="text-[16px] font-bold text-[#c2410c]">{msg}</p>}
            <BigButton onClick={() => takeOut('sold', -(Number(count) || 0))} disabled={saving || !(Number(count) > 0)}>
              <Bi en={`Sold / used ${Number(count) || 0}`} hi="बिक गए / इस्तेमाल हुए" size={20} hiSize={16} className="items-center" />
            </BigButton>
            <button onClick={() => { const v = prompt('Correct count in shop? · दुकान में सही गिनती?', String(open.qty)); if (v != null && v.trim() !== '') takeOut('adjust', Math.round(Number(v)) - open.qty) }} className="h-14 rounded-[18px] bg-[#f0ede9] text-[16px] font-bold">Fix the count · गिनती ठीक करें</button>
          </div>
        </div>
      )}
    </Page>
  )
}
