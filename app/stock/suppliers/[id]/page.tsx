'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Page, Card, Bi, BigButton, Busy, api, errText, rupees, shortDate } from '@/components/stock/ui'

type Entry = { kind: 'bill' | 'payment'; id: string; date: string; amount: number; label: string; sub: string }
type Data = { supplier: { id: string; name: string; gstin: string | null }; balance: { billed: number; paid: number; owed: number }; nextDue: string | null; entries: Entry[] }

const MODES = [
  { k: 'cash', en: 'Cash', hi: '', icon: 'payments' },
  { k: 'upi', en: 'UPI', hi: '', icon: 'qr_code_2' },
  { k: 'bank', en: 'Bank', hi: '', icon: 'account_balance' },
  { k: 'cheque', en: 'Cheque', hi: '', icon: 'receipt_long' },
]

export default function SupplierKhata() {
  const { id } = useParams<{ id: string }>()
  const [d, setD] = useState<Data | null>(null)
  const [paying, setPaying] = useState(false)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('cash')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(() => api<Data>('/api/stock/suppliers/' + id).then(r => { if (r.ok) setD(r.data) }), [id])
  useEffect(() => { load() }, [load])

  async function pay() {
    setBusy(true); setMsg(null)
    const r = await api('/api/stock/suppliers/' + id + '/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(amount), mode, note }) })
    setBusy(false)
    if (r.ok) { setPaying(false); setAmount(''); setNote(''); setMsg({ ok: true, text: '✓ Payment saved' }); load() }
    else setMsg({ ok: false, text: errText(r.data.error).join(' · ') })
  }

  if (!d) return <Page title="Supplier khata" hi="" back="/stock/suppliers"><p className="text-[15px] text-[#4f4633]">Loading…</p></Page>
  const owed = d.balance.owed

  return (
    <Page title={d.supplier.name} hi="" back="/stock/suppliers"
      footer={<BigButton onClick={() => { setPaying(true); setAmount(owed > 0 ? String(owed) : ''); setMsg(null) }}><span className="material-symbols-outlined text-[24px]">currency_rupee</span><Bi en="Pay" hi="" size={22} hiSize={17} /></BigButton>}>
      {busy && <Busy en="Saving…" hi="" />}
      {msg && <p className={'text-[15px] font-bold rounded-2xl px-4 py-3 ' + (msg.ok ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#ffedd5] text-[#c2410c]')}>{msg.text}</p>}

      <Card className={owed > 0 ? 'bg-[#fff1e6]' : ''}>
        <Bi en={owed > 0 ? 'You owe' : 'All paid'} hi="" size={18} />
        <p className={'text-[32px] font-extrabold leading-tight mt-1 ' + (owed > 0 ? 'text-[#c2410c]' : 'text-[#166534]')}>{rupees(Math.abs(owed))}{owed < 0 ? ' extra paid' : ''}</p>
        {d.nextDue && owed > 0 && <p className="text-[15px] font-bold text-[#4f4633] mt-1">Pay by {shortDate(d.nextDue)}</p>}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/70 rounded-[18px] p-3"><p className="text-[14px] font-bold text-[#4f4633]">Bills</p><p className="text-[18px] font-extrabold">{rupees(d.balance.billed)}</p></div>
          <div className="bg-white/70 rounded-[18px] p-3"><p className="text-[14px] font-bold text-[#4f4633]">Paid</p><p className="text-[18px] font-extrabold">{rupees(d.balance.paid)}</p></div>
        </div>
        {d.supplier.gstin && <p className="text-[14px] text-[#4f4633] mt-3">GSTIN · {d.supplier.gstin}</p>}
      </Card>

      <section className="flex flex-col gap-3">
        <Bi en="Bills and payments" hi="" size={20} className="px-1" />
        {d.entries.length === 0 && <p className="text-[15px] text-[#4f4633]">Nothing yet.</p>}
        {d.entries.map(e => {
          const row = (
            <div className="bg-white rounded-[24px] p-4 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(28,28,25,0.05)]">
              <div className="flex items-center gap-3 min-w-0">
                <span className={'w-12 h-12 rounded-full flex items-center justify-center shrink-0 ' + (e.kind === 'bill' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#dcfce7] text-[#166534]')}>
                  <span className="material-symbols-outlined text-[20px]">{e.kind === 'bill' ? 'receipt_long' : 'payments'}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[16px] font-bold truncate">{e.kind === 'bill' ? e.label + '' : 'Paid · ' + e.label}</p>
                  <p className="text-[14px] text-[#4f4633] truncate">{shortDate(e.date)}{e.sub ? ' · ' + e.sub : ''}</p>
                </div>
              </div>
              <span className={'text-[17px] font-extrabold shrink-0 ' + (e.kind === 'bill' ? '' : 'text-[#166534]')}>{e.kind === 'bill' ? '+' : '−'}{rupees(e.amount)}</span>
            </div>
          )
          return e.kind === 'bill' ? <Link key={e.id} href={'/stock/bills/' + e.id}>{row}</Link> : <div key={e.id}>{row}</div>
        })}
      </section>

      {/* Pay sheet */}
      {paying && (
        <div className="fixed inset-0 z-40 bg-black/45 flex items-end justify-center" onClick={() => setPaying(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-[#fcf9f4] rounded-t-[32px] p-5 flex flex-col gap-4 max-h-[92vh] overflow-y-auto" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
            <div className="w-12 h-1.5 rounded-full bg-[#e5e2dd] mx-auto" />
            <div>
              <Bi en="Record payment" hi="" size={22} hiSize={17} />
              <p className="text-[14px] text-[#4f4633] mt-1">To {d.supplier.name}{owed > 0 ? ' · still owed ' + rupees(owed) : ''}</p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-bold text-[#4f4633]">Amount ₹</span>
              <input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))} className="h-12 rounded-[22px] bg-white px-5 text-[28px] font-extrabold outline-none focus:ring-2 focus:ring-[#fbbf24]" />
            </label>
            {owed > 0 && (
              <div className="flex gap-2">
                <button onClick={() => setAmount(String(owed))} className="flex-1 h-12 rounded-full bg-[#f0ede9] text-[14px] font-bold">Full</button>
                <button onClick={() => setAmount(String(Math.round(owed / 2)))} className="flex-1 h-12 rounded-full bg-[#f0ede9] text-[14px] font-bold">Half</button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {MODES.map(m => (
                <button key={m.k} onClick={() => setMode(m.k)} className={'h-12 rounded-[22px] flex items-center justify-center gap-3 ' + (mode === m.k ? 'bg-[#1c1c19] text-white' : 'bg-white shadow-sm')}>
                  <span className="material-symbols-outlined text-[24px]">{m.icon}</span>
                  <Bi en={m.en} hi={m.hi} size={18} hiSize={14} />
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-bold text-[#4f4633]">Note (optional)</span>
              <input value={note} onChange={e => setNote(e.target.value)} className="h-12 rounded-[18px] bg-white px-4 text-[16px] outline-none focus:ring-2 focus:ring-[#fbbf24]" />
            </label>
            {msg && !msg.ok && <p className="text-[14px] font-bold text-[#c2410c]">{msg.text}</p>}
            <BigButton onClick={pay} disabled={busy || !(Number(amount) > 0)}><Bi en={'Save payment ' + (Number(amount) > 0 ? rupees(Number(amount)) : '')} hi="" size={20} hiSize={16} className="items-center" /></BigButton>
          </div>
        </div>
      )}
    </Page>
  )
}
