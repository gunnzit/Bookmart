'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Page, Card, Bi, Tag, Busy, api, errText, rupees, shortDate } from '@/components/stock/ui'

type Summary = {
  me: { name: string; isOwner: boolean }
  units: number; value: number; low: number; owed: number; dueSoon: number
  recent: { id: string; supplierName: string; billNo: string | null; total: number | null; status: string; createdAt: string }[]
}

// Phone photos are large; shrink to 2000px on the long side before sending (keeps the bill readable)
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej()), 'image/jpeg', 0.85))
  } catch {
    return file
  }
}

export default function StockHome() {
  const router = useRouter()
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)
  const [s, setS] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    api<Summary>('/api/stock/summary').then(r => {
      if (r.ok) setS(r.data)
      else setErr(errText(r.data.error).join(' · '))
    })
  }, [])

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return
    setErr('')
    setBusy(true)
    const form = new FormData()
    for (const f of Array.from(files).slice(0, 4)) form.append('photos', await shrink(f), 'bill.jpg')
    const r = await api<{ id: string }>('/api/stock/bills', { method: 'POST', body: form })
    if (r.ok && r.data.id) { router.push('/stock/bills/' + r.data.id); return }
    setBusy(false)
    setErr(errText(r.data.error)[0])
  }

  return (
    <Page title="Stock" hi="">
      {busy && <Busy en="Reading your bill…" hi="" />}

      {/* Add bill: the main action */}
      {/* Two ways in: the camera, or photos already on the phone (gallery). "capture" forces the camera, so the gallery input has none. */}
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={e => { upload(e.target.files); e.target.value = '' }} />
      <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={e => { upload(e.target.files); e.target.value = '' }} />
      <button type="button" onClick={() => camera.current?.click()} className="w-full rounded-[24px] bg-[#fbbf24] text-[#6c4f00] p-4 flex items-center gap-4 text-left shadow-[0_10px_28px_rgba(251,191,36,0.45)] active:scale-[0.98] transition-transform">
        <span className="w-20 h-12 rounded-[24px] bg-white/60 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[32px]">photo_camera</span>
        </span>
        <span className="flex flex-col">
          <span className="text-[22px] font-extrabold leading-tight">Add bill</span>
          <span className="text-[14px] font-semibold mt-1 opacity-80">Take a photo of the supplier bill</span>
        </span>
      </button>
      <button type="button" onClick={() => gallery.current?.click()} className="w-full h-14 -mt-2 rounded-[20px] bg-white text-[#1c1c19] flex items-center justify-center gap-2 text-[16px] font-bold shadow-[0_4px_20px_rgba(28,28,25,0.05)] active:scale-[0.98] transition-transform">
        <span className="material-symbols-outlined text-[22px] text-[#795900]">photo_library</span>Choose from gallery
      </button>
      {err && <p className="text-[14px] font-semibold text-[#c2410c] bg-[#ffedd5] rounded-2xl px-4 py-3">{err}</p>}
      <p className="text-[14px] text-[#4f4633] -mt-2 px-1">Long bill? Choose up to 4 photos together from the gallery.</p>

      <Link href="/stock/count" className="w-full h-14 rounded-[20px] bg-[#1c1c19] text-white flex items-center justify-center gap-2 text-[16px] font-bold active:scale-[0.98]">
        <span className="material-symbols-outlined text-[22px]">inventory</span>Count stock on the shelves
      </Link>

      {/* Numbers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { en: 'In stock', hi: '', v: s ? s.units.toLocaleString('en-IN') : '…', href: '/stock/items' },
          { en: 'Stock value', hi: '', v: s ? rupees(s.value) : '…', href: '/stock/items' },
          { en: 'Running low', hi: '', v: s ? String(s.low) : '…', href: '/stock/items?filter=low', warn: !!s && s.low > 0 },
        ].map(t => (
          <Link key={t.en} href={t.href} className={'rounded-[24px] p-4 flex flex-col gap-2 shadow-[0_4px_20px_rgba(28,28,25,0.05)] active:scale-[0.98] ' + (t.warn ? 'bg-[#ffedd5]' : 'bg-white')}>
            <span className={'text-[20px] font-extrabold leading-none ' + (t.warn ? 'text-[#c2410c]' : '')}>{t.v}</span>
            <Bi en={t.en} hi={t.hi} size={14} hiSize={13} />
          </Link>
        ))}
      </div>

      {/* Owed to suppliers */}
      <Link href="/stock/suppliers" className="block active:scale-[0.99]">
        <Card className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Bi en="To pay suppliers" hi="" size={18} />
            {s && s.dueSoon > 0 && <span className="text-[14px] font-semibold text-[#c2410c]">{s.dueSoon} bill{s.dueSoon > 1 ? 's' : ''} due this week</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={'text-[24px] font-extrabold ' + (s && s.owed > 0 ? 'text-[#c2410c]' : '')}>{s ? rupees(s.owed) : '…'}</span>
            <span className="material-symbols-outlined text-[22px] text-[#795900]">chevron_right</span>
          </div>
        </Card>
      </Link>

      {/* Search */}
      <form onSubmit={e => { e.preventDefault(); router.push('/stock/items' + (q.trim() ? '?q=' + encodeURIComponent(q.trim()) : '')) }} className="flex gap-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search books or stationery" className="flex-1 min-w-0 h-12 rounded-[22px] bg-white px-5 text-[16px] shadow-[0_4px_20px_rgba(28,28,25,0.05)] outline-none focus:ring-2 focus:ring-[#fbbf24]" />
        <button type="submit" aria-label="Search" className="w-12 h-12 rounded-[22px] bg-[#1c1c19] text-white flex items-center justify-center shrink-0 active:scale-95">
          <span className="material-symbols-outlined text-[24px]">search</span>
        </button>
      </form>

      {/* Recent bills */}
      <section className="flex flex-col gap-3">
        <Bi en="Recent bills" hi="" size={20} className="px-1" />
        {s && s.recent.length === 0 && <Card><p className="text-[15px] text-[#4f4633]">No bills yet. Tap “Add bill” to start.</p></Card>}
        {s?.recent.map(b => (
          <Link key={b.id} href={'/stock/bills/' + b.id} className="bg-white rounded-[24px] p-4 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(28,28,25,0.05)] active:scale-[0.99]">
            <div className="min-w-0">
              <p className="text-[16px] font-bold truncate">{b.supplierName || 'Bill'}</p>
              <p className="text-[14px] text-[#4f4633]">{shortDate(b.createdAt)}{b.billNo ? ' · #' + b.billNo : ''}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[16px] font-extrabold">{rupees(b.total)}</span>
              {b.status === 'added' ? <Tag tone="green">Added</Tag> : <Tag tone="yellow">Check</Tag>}
            </div>
          </Link>
        ))}
      </section>

      <Link href="/stock/suppliers" className="text-center text-[15px] font-bold text-[#795900] py-2">Supplier khata</Link>
    </Page>
  )
}
