'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Page, Card, Bi, Tag, Busy, BigButton, api, errText, rupees, shortDate } from '@/components/stock/ui'

type Line = { name: string; qty: number; unitPrice: number | null; mrp: number | null; gstRate: number | null; hsn: string | null; amount: number | null; category: string; unsure: boolean }
type Bill = {
  id: string; supplierName: string; gstin: string | null; billNo: string | null; billDate: string | null; dueDate: string | null
  total: number | null; status: string; readError: string | null; uploadedBy: string; createdAt: string; lines: Line[]
}

const dayStr = (d: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '')
const n = (v: string) => (v.trim() === '' ? null : Number(v))
const CAT: Record<string, string> = { book: 'Book · किताब', stationery: 'Stationery · स्टेशनरी', other: 'Other · अन्य' }

const Field: React.FC<{ en: string; hi: string; value: string; onChange: (v: string) => void; type?: string; inputMode?: 'numeric' | 'decimal' | 'text' }> = ({ en, hi, value, onChange, type = 'text', inputMode }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[15px] font-bold text-[#4f4633]">{en} · {hi}</span>
    <input type={type} inputMode={inputMode} value={value} onChange={e => onChange(e.target.value)} className="h-14 rounded-[18px] bg-[#f6f3ee] px-4 text-[19px] font-semibold outline-none focus:ring-2 focus:ring-[#fbbf24]" />
  </label>
)

export default function CheckBill() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [bill, setBill] = useState<Bill | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [zoom, setZoom] = useState<string | null>(null)
  const [edit, setEdit] = useState<number | null>(null)
  const [busy, setBusy] = useState<'' | 'saving' | 'adding'>('')
  const [msg, setMsg] = useState<{ tone: 'err' | 'ok'; text: string } | null>(null)

  useEffect(() => {
    api<{ bill: Bill; photoUrls: string[] }>('/api/stock/bills/' + id).then(r => {
      if (r.ok) { setBill(r.data.bill); setPhotos(r.data.photoUrls) }
      else setMsg({ tone: 'err', text: errText(r.data.error).join(' · ') })
    })
  }, [id])

  if (!bill) return <Page title="Check the bill" hi="बिल जांचें" back="/stock">{msg ? <p className="text-[17px] text-[#c2410c]">{msg.text}</p> : <p className="text-[17px] text-[#4f4633]">Loading… · लोड हो रहा है…</p>}</Page>

  const added = bill.status === 'added'
  const set = (patch: Partial<Bill>) => setBill({ ...bill, ...patch })
  const setLine = (i: number, patch: Partial<Line>) => set({ lines: bill.lines.map((l, k) => (k === i ? { ...l, ...patch } : l)) })
  const linesTotal = bill.lines.reduce((s, l) => s + (l.amount ?? (l.unitPrice ?? 0) * l.qty), 0)
  const unsureCount = bill.lines.filter(l => l.unsure).length

  async function save() {
    return api('/api/stock/bills/' + id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bill, billDate: dayStr(bill!.billDate), dueDate: dayStr(bill!.dueDate) }),
    })
  }
  async function saveOnly() {
    setBusy('saving'); setMsg(null)
    const r = await save()
    setBusy('')
    setMsg(r.ok ? { tone: 'ok', text: 'Saved. You can finish later. · सेव हो गया।' } : { tone: 'err', text: errText(r.data.error).join(' · ') })
  }
  async function addToStock() {
    setBusy('adding'); setMsg(null)
    const r1 = await save()
    if (!r1.ok) { setBusy(''); setMsg({ tone: 'err', text: errText(r1.data.error).join(' · ') }); return }
    const r2 = await api('/api/stock/bills/' + id + '/add', { method: 'POST' })
    setBusy('')
    if (r2.ok) { set({ status: 'added' }); setMsg({ tone: 'ok', text: '✓ Added to stock · स्टॉक में जुड़ गया' }); window.scrollTo(0, 0) }
    else setMsg({ tone: 'err', text: errText(r2.data.error).join(' · ') })
  }
  async function remove() {
    if (!confirm('Delete this bill? · यह बिल हटाएं?')) return
    const r = await api('/api/stock/bills/' + id, { method: 'DELETE' })
    if (r.ok) router.push('/stock')
  }

  return (
    <Page title={added ? 'Bill' : 'Check the bill'} hi={added ? 'बिल' : 'बिल जांचें'} back="/stock"
      footer={added ? <BigButton href="/stock" tone="dark"><Bi en="Back to stock" hi="स्टॉक पर वापस" size={20} className="items-center" /></BigButton> : (
        <div className="flex flex-col gap-2">
          <BigButton onClick={addToStock} disabled={!!busy}><span className="material-symbols-outlined text-[30px]">check_circle</span><Bi en="Add to stock" hi="स्टॉक में जोड़ें" size={22} hiSize={17} /></BigButton>
          <div className="flex gap-2">
            <button onClick={saveOnly} disabled={!!busy} className="flex-1 h-14 rounded-[18px] bg-[#f0ede9] text-[16px] font-bold">Save for later · बाद में</button>
            <button onClick={remove} disabled={!!busy} className="h-14 px-5 rounded-[18px] text-[16px] font-bold text-[#c2410c]">Delete · हटाएं</button>
          </div>
        </div>
      )}>
      {busy && <Busy en={busy === 'adding' ? 'Adding to stock…' : 'Saving…'} hi={busy === 'adding' ? 'स्टॉक में जोड़ रहे हैं…' : 'सेव हो रहा है…'} />}
      {zoom && (
        <button onClick={() => setZoom(null)} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2" aria-label="Close photo">
          <img src={zoom} alt="Bill" className="max-w-full max-h-full object-contain" />
          <span className="absolute top-5 right-5 w-14 h-14 rounded-full bg-white text-[#1c1c19] flex items-center justify-center"><span className="material-symbols-outlined text-[30px]">close</span></span>
        </button>
      )}

      {msg && <p className={'text-[17px] font-bold rounded-2xl px-4 py-3 ' + (msg.tone === 'ok' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#ffedd5] text-[#c2410c]')}>{msg.text}</p>}

      {/* Bill photos */}
      {photos.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {photos.map((u, i) => (
            <button key={u} onClick={() => setZoom(u)} className="relative shrink-0 w-28 h-36 rounded-[18px] overflow-hidden bg-[#f0ede9] shadow-sm">
              <img src={u} alt={'Bill photo ' + (i + 1)} className="w-full h-full object-cover" />
              <span className="absolute bottom-1.5 right-1.5 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"><span className="material-symbols-outlined text-[22px]">zoom_in</span></span>
            </button>
          ))}
        </div>
      )}

      {!added && (
        <Card className="bg-[#fff8e6]">
          <Bi en={bill.readError ? 'We could not read this bill. Please type the items.' : 'We read this bill. Please check each line.'} hi={bill.readError ? 'बिल पढ़ा नहीं गया। आइटम खुद लिखें।' : 'हमने बिल पढ़ा। हर लाइन जांचें।'} size={18} />
          {unsureCount > 0 && <p className="mt-2 text-[16px] font-bold text-[#c2410c]">{unsureCount} line{unsureCount > 1 ? 's' : ''} need checking (orange) · {unsureCount} लाइन जांचें</p>}
        </Card>
      )}

      {/* Bill details */}
      <Card className="flex flex-col gap-4">
        {added ? (
          <div className="flex flex-col gap-1">
            <p className="text-[22px] font-extrabold">{bill.supplierName}</p>
            <p className="text-[16px] text-[#4f4633]">{bill.billNo ? 'Bill #' + bill.billNo + ' · ' : ''}{shortDate(bill.billDate)}{bill.gstin ? ' · GSTIN ' + bill.gstin : ''}</p>
            <div className="mt-2"><Tag tone="green">✓ Added to stock · स्टॉक में जुड़ गया</Tag></div>
          </div>
        ) : (
          <>
            <Field en="Supplier" hi="सप्लायर" value={bill.supplierName} onChange={v => set({ supplierName: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field en="Bill no." hi="बिल नं." value={bill.billNo || ''} onChange={v => set({ billNo: v })} />
              <Field en="Date" hi="तारीख" type="date" value={dayStr(bill.billDate)} onChange={v => set({ billDate: v || null })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field en="Bill total ₹" hi="कुल" inputMode="decimal" value={bill.total == null ? '' : String(bill.total)} onChange={v => set({ total: n(v) })} />
              <Field en="Pay by" hi="कब तक देना" type="date" value={dayStr(bill.dueDate)} onChange={v => set({ dueDate: v || null })} />
            </div>
            {bill.gstin && <p className="text-[15px] text-[#4f4633]">Supplier GSTIN · {bill.gstin}</p>}
          </>
        )}
      </Card>

      {/* Lines */}
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between px-1">
          <Bi en={`Items (${bill.lines.length})`} hi="आइटम" size={20} />
          <span className="text-[16px] font-bold text-[#4f4633]">Lines total {rupees(linesTotal)}</span>
        </div>
        {bill.lines.map((l, i) => (
          <div key={i} className={'rounded-[24px] p-4 shadow-[0_4px_20px_rgba(28,28,25,0.05)] ' + (l.unsure && !added ? 'bg-[#fff1e6] ring-2 ring-[#fdba74]' : 'bg-white')}>
            {edit === i && !added ? (
              <div className="flex flex-col gap-3">
                <Field en="Item name" hi="आइटम का नाम" value={l.name} onChange={v => setLine(i, { name: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field en="Quantity" hi="संख्या" inputMode="numeric" value={String(l.qty)} onChange={v => setLine(i, { qty: Number(v) || 0 })} />
                  <Field en="Price ₹" hi="रेट" inputMode="decimal" value={l.unitPrice == null ? '' : String(l.unitPrice)} onChange={v => setLine(i, { unitPrice: n(v) })} />
                  <Field en="MRP ₹" hi="एमआरपी" inputMode="decimal" value={l.mrp == null ? '' : String(l.mrp)} onChange={v => setLine(i, { mrp: n(v) })} />
                  <Field en="Line total ₹" hi="कुल" inputMode="decimal" value={l.amount == null ? '' : String(l.amount)} onChange={v => setLine(i, { amount: n(v) })} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(CAT).map(([k, label]) => (
                    <button key={k} onClick={() => setLine(i, { category: k })} className={'h-12 px-4 rounded-full text-[15px] font-bold ' + (l.category === k ? 'bg-[#1c1c19] text-white' : 'bg-[#f0ede9]')}>{label}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setLine(i, { unsure: false }); setEdit(null) }} className="flex-1 h-14 rounded-[18px] bg-[#fbbf24] text-[#6c4f00] text-[17px] font-extrabold">Done · हो गया</button>
                  <button onClick={() => { set({ lines: bill.lines.filter((_, k) => k !== i) }); setEdit(null) }} className="h-14 px-4 rounded-[18px] text-[16px] font-bold text-[#c2410c]">Remove · हटाएं</button>
                </div>
              </div>
            ) : (
              <button onClick={() => !added && setEdit(i)} className="w-full text-left flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[18px] font-bold leading-snug">{l.name}</p>
                  <p className="text-[16px] text-[#4f4633] mt-1">
                    Qty <b className="text-[#1c1c19] text-[20px]">{l.qty}</b> · Rate {rupees(l.unitPrice)}{l.mrp != null ? ' · MRP ' + rupees(l.mrp) : ''}
                  </p>
                  {l.unsure && !added && <p className="text-[15px] font-bold text-[#c2410c] mt-1">Please check: not clear · कृपया जांचें</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[19px] font-extrabold">{rupees(l.amount ?? (l.unitPrice != null ? l.unitPrice * l.qty : null))}</span>
                  {!added && <span className="w-11 h-11 rounded-full bg-[#f0ede9] flex items-center justify-center"><span className="material-symbols-outlined text-[22px]">edit</span></span>}
                </div>
              </button>
            )}
          </div>
        ))}
        {!added && (
          <button onClick={() => { set({ lines: [...bill.lines, { name: '', qty: 1, unitPrice: null, mrp: null, gstRate: null, hsn: null, amount: null, category: 'book', unsure: false }] }); setEdit(bill.lines.length) }} className="h-16 rounded-[22px] border-2 border-dashed border-[#d6cfc2] text-[17px] font-bold text-[#795900]">
            + Add a missing item · आइटम जोड़ें
          </button>
        )}
      </section>
      <p className="text-[14px] text-[#817661] px-1">Uploaded by {bill.uploadedBy} · {shortDate(bill.createdAt)}</p>
    </Page>
  )
}
