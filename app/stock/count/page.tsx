'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Page, Card, BigButton, Busy, api, errText, rupees } from '@/components/stock/ui'

// Counting the shop from scratch. Two ways:
// 1. Snap an item: photo of the cover / price sticker → AI fills in the name, MRP, class, barcode →
//    type how many are on the shelf → save (updates the item if it is already in the list).
// 2. Count list: go through items (e.g. the NCERT books added automatically), scan or search, type the count.

type Item = { id: string; name: string; mrp: number | null; qty: number; category: string; barcode: string | null; countedAt: string | null; className?: number | null }
type Read = { name: string; publisher: string | null; className: number | null; mrp: number | null; barcode: string | null; category: string; ncert: boolean }

async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    return await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej()), 'image/jpeg', 0.85))
  } catch { return file }
}

const CATS = [{ k: 'book', l: 'Book' }, { k: 'notebook', l: 'Notebook' }, { k: 'stationery', l: 'Stationery' }, { k: 'other', l: 'Other' }]
const MORE: Record<string, string> = {
  exists: 'An item with this name is already in the list. Search for it in Count list.',
  need_name: 'Type the item name.', bad_qty: 'Type how many are on the shelf.',
}
const msgFor = (code?: string) => MORE[code || ''] || errText(code)[0]

// Big number entry used for every count
const CountInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <button onClick={() => onChange(String(Math.max(0, (Number(value) || 0) - 1)))} className="w-14 h-14 rounded-[16px] bg-[#f0ede9] text-[26px] font-bold">−</button>
    <input autoFocus inputMode="numeric" value={value} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="0" className="flex-1 min-w-0 h-14 rounded-[16px] bg-white text-center text-[28px] font-extrabold outline-none focus:ring-2 focus:ring-[#fbbf24]" />
    <button onClick={() => onChange(String((Number(value) || 0) + 1))} className="w-14 h-14 rounded-[16px] bg-[#f0ede9] text-[26px] font-bold">+</button>
  </div>
)

export default function CountStock() {
  const [mode, setMode] = useState<'snap' | 'list'>('snap')
  return (
    <Page title="Count stock" hi="" back="/stock">
      <div className="grid grid-cols-2 gap-2 bg-[#f0ede9] p-1 rounded-full">
        {(['snap', 'list'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={'h-11 rounded-full text-[15px] font-bold ' + (mode === m ? 'bg-white shadow-sm' : 'text-[#4f4633]')}>{m === 'snap' ? 'Snap an item' : 'Count list'}</button>
        ))}
      </div>
      {mode === 'snap' ? <Snap /> : <CountList />}
    </Page>
  )
}

// ── Snap an item ────────────────────────────────────────────────────────
function Snap() {
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [read, setRead] = useState<Read | null>(null)
  const [match, setMatch] = useState<Item | null>(null)
  const [similar, setSimilar] = useState<Item[]>([])
  const [form, setForm] = useState({ name: '', mrp: '', category: 'book', className: '', barcode: '', publisher: '' })
  const [count, setCount] = useState('')

  async function snap(files: FileList | null) {
    if (!files || files.length === 0) return
    setErr(''); setOk(''); setBusy('Reading the item…')
    const fd = new FormData()
    for (const f of Array.from(files).slice(0, 3)) fd.append('photos', await shrink(f), 'item.jpg')
    const r = await api<{ read: Read; match: Item | null; similar: Item[] }>('/api/stock/snap', { method: 'POST', body: fd })
    setBusy('')
    if (!r.ok) { setErr(msgFor(r.data.error)); return }
    const x = r.data.read
    setRead(x); setMatch(r.data.match); setSimilar(r.data.similar || [])
    setForm({ name: x.name, mrp: x.mrp != null ? String(x.mrp) : '', category: x.category, className: x.className != null ? String(x.className) : '', barcode: x.barcode || '', publisher: x.publisher || '' })
    setCount('')
  }
  function reset() { setRead(null); setMatch(null); setSimilar([]); setCount(''); setErr('') }

  async function saveCount(target: Item) {
    setBusy('Saving…'); setErr('')
    const r = await api('/api/stock/items/' + target.id + '/count', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: Number(count), mrp: form.mrp, barcode: form.barcode }) })
    setBusy('')
    if (r.ok) { setOk(`✓ ${target.name}: ${Number(count)} counted`); reset() } else setErr(msgFor(r.data.error))
  }
  async function saveNew() {
    setBusy('Saving…'); setErr('')
    const r = await api<{ item: Item }>('/api/stock/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ncert: read?.ncert, count: Number(count) }) })
    setBusy('')
    if (r.ok) { setOk(`✓ Added ${r.data.item.name}: ${Number(count)} on the shelf`); reset() } else setErr(msgFor(r.data.error))
  }

  const input = 'h-12 rounded-[14px] bg-[#f6f3ee] px-3 text-[16px] outline-none focus:ring-2 focus:ring-[#fbbf24] w-full'
  const counted = count !== '' && Number.isInteger(Number(count))

  return (
    <div className="flex flex-col gap-4">
      {busy && <Busy en={busy} hi="" />}
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={e => { snap(e.target.files); e.target.value = '' }} />
      <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={e => { snap(e.target.files); e.target.value = '' }} />
      {ok && <p className="text-[15px] font-bold bg-[#dcfce7] text-[#166534] rounded-2xl px-4 py-3">{ok}</p>}
      {err && <p className="text-[15px] font-bold bg-[#ffedd5] text-[#c2410c] rounded-2xl px-4 py-3">{err}</p>}

      {!read && (
        <>
          <button onClick={() => camera.current?.click()} className="w-full rounded-[24px] bg-[#fbbf24] text-[#6c4f00] p-4 flex items-center gap-4 text-left shadow-[0_10px_28px_rgba(251,191,36,0.45)] active:scale-[0.98]">
            <span className="w-14 h-14 rounded-[18px] bg-white/60 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[30px]">photo_camera</span></span>
            <span className="flex flex-col">
              <span className="text-[20px] font-extrabold leading-tight">Snap an item</span>
              <span className="text-[14px] font-semibold opacity-80">Photo of the cover or the price sticker</span>
            </span>
          </button>
          <button onClick={() => gallery.current?.click()} className="w-full h-12 -mt-2 rounded-[18px] bg-white shadow-sm flex items-center justify-center gap-2 text-[15px] font-bold"><span className="material-symbols-outlined text-[20px] text-[#795900]">photo_library</span>Choose from gallery</button>
          <p className="text-[14px] text-[#4f4633] px-1">Tip: the back cover usually has the MRP and the barcode, so it reads best. For a long item, choose up to 3 photos from the gallery.</p>
        </>
      )}

      {read && match && (
        <Card className="flex flex-col gap-3">
          <p className="text-[14px] font-bold text-[#166534]">Already in the list</p>
          <p className="text-[18px] font-extrabold leading-snug">{match.name}</p>
          <p className="text-[14px] text-[#4f4633]">{match.mrp != null ? 'MRP ' + rupees(match.mrp) + ' · ' : ''}{match.countedAt ? `last count ${match.qty}` : 'not counted yet'}</p>
          <p className="text-[15px] font-bold">How many on the shelf?</p>
          <CountInput value={count} onChange={setCount} />
          <BigButton onClick={() => saveCount(match)} disabled={!counted}><span className="text-[17px] font-extrabold">Save count</span></BigButton>
          <button onClick={reset} className="h-11 text-[14px] font-bold text-[#4f4633]">Cancel</button>
        </Card>
      )}

      {read && !match && (
        <Card className="flex flex-col gap-3">
          <p className="text-[14px] font-bold text-[#795900]">New item — check what we read</p>
          <label className="flex flex-col gap-1"><span className="text-[13px] font-bold text-[#4f4633]">Name</span><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={input} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1"><span className="text-[13px] font-bold text-[#4f4633]">MRP ₹</span><input inputMode="decimal" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value.replace(/[^\d.]/g, '') }))} className={input} /></label>
            <label className="flex flex-col gap-1"><span className="text-[13px] font-bold text-[#4f4633]">Class</span><input inputMode="numeric" value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value.replace(/\D/g, '').slice(0, 2) }))} placeholder="—" className={input} /></label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATS.map(c => <button key={c.k} onClick={() => setForm(f => ({ ...f, category: c.k }))} className={'h-10 px-4 rounded-full text-[14px] font-bold ' + (form.category === c.k ? 'bg-[#1c1c19] text-white' : 'bg-[#f0ede9]')}>{c.l}</button>)}
          </div>
          {(form.publisher || form.barcode) && <p className="text-[13px] text-[#4f4633]">{[form.publisher, form.barcode && 'Barcode ' + form.barcode].filter(Boolean).join(' · ')}</p>}
          {similar.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-bold text-[#c2410c]">Is it one of these already in the list?</p>
              {similar.map(s => (
                <button key={s.id} onClick={() => setMatch(s)} className="rounded-[14px] bg-[#fff1e6] px-3 py-2 text-left text-[14px] font-bold">{s.name}{s.mrp != null ? ' · ' + rupees(s.mrp) : ''} →</button>
              ))}
            </div>
          )}
          <p className="text-[15px] font-bold">How many on the shelf?</p>
          <CountInput value={count} onChange={setCount} />
          <BigButton onClick={saveNew} disabled={!counted || form.name.trim().length < 2}><span className="text-[17px] font-extrabold">Add to stock</span></BigButton>
          <button onClick={reset} className="h-11 text-[14px] font-bold text-[#4f4633]">Cancel</button>
        </Card>
      )}
    </div>
  )
}

// ── Count list ──────────────────────────────────────────────────────────
function CountList() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'uncounted' | 'all'>('uncounted')
  const [items, setItems] = useState<Item[] | null>(null)
  const [open, setOpen] = useState<Item | null>(null)
  const [count, setCount] = useState('')
  const [msg, setMsg] = useState('')
  const [scanning, setScanning] = useState(false)
  const [canScan, setCanScan] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  const load = useCallback(() => {
    api<{ items: Item[] }>(`/api/stock/items?q=${encodeURIComponent(q)}&filter=${filter}`).then(r => setItems(r.ok ? r.data.items : []))
  }, [q, filter])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])
  useEffect(() => { setCanScan(typeof window !== 'undefined' && 'BarcodeDetector' in window) }, [])

  async function seedNcert() {
    setMsg('Adding NCERT books…')
    const r = await api<{ added: number; total: number }>('/api/stock/seed-ncert', { method: 'POST' })
    setMsg(r.ok ? `✓ ${r.data.added} NCERT books added (count them below).` : msgFor(r.data.error)); load()
  }

  // Camera barcode scan (Chrome on Android). Finds the item with that barcode and opens it.
  async function scan() {
    setScanning(true); setMsg('')
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (video.current) { video.current.srcObject = stream; await video.current.play() }
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'] })
      const started = Date.now()
      while (Date.now() - started < 20000) {
        const found = video.current ? await detector.detect(video.current) : []
        if (found.length) {
          const code = String(found[0].rawValue).replace(/\D/g, '')
          const r = await api<{ items: Item[] }>('/api/stock/items?filter=all&barcode=' + code)
          if (r.ok && r.data.items[0]) { setOpen(r.data.items[0]); setCount('') }
          else setMsg(`Barcode ${code} is not in the list yet. Use “Snap an item” to add it.`)
          break
        }
        await new Promise(r => setTimeout(r, 250))
      }
    } catch {
      setMsg('Camera not available. Search by name instead.')
    } finally {
      stream?.getTracks().forEach(t => t.stop())
      setScanning(false)
    }
  }

  async function save() {
    if (!open) return
    const r = await api('/api/stock/items/' + open.id + '/count', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: Number(count) }) })
    if (r.ok) { setMsg(`✓ ${open.name}: ${Number(count)}`); setOpen(null); setCount(''); load() } else setMsg(msgFor(r.data.error))
  }

  return (
    <div className="flex flex-col gap-3">
      {msg && <p className="text-[15px] font-bold bg-[#f6f3ee] rounded-2xl px-4 py-3">{msg}</p>}
      <div className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="flex-1 min-w-0 h-12 rounded-[16px] bg-white px-4 text-[16px] shadow-sm outline-none focus:ring-2 focus:ring-[#fbbf24]" />
        {canScan && <button onClick={scan} aria-label="Scan barcode" className="w-12 h-12 rounded-[16px] bg-[#1c1c19] text-white flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[24px]">barcode_scanner</span></button>}
      </div>
      <div className="flex gap-2">
        {(['uncounted', 'all'] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={'h-10 px-4 rounded-full text-[14px] font-bold whitespace-nowrap ' + (filter === f ? 'bg-[#1c1c19] text-white' : 'bg-white shadow-sm')}>{f === 'uncounted' ? 'Not counted' : 'All'}</button>)}
        <button onClick={seedNcert} className="h-10 px-4 rounded-full text-[14px] font-bold whitespace-nowrap bg-[#fff1e6] text-[#795900] ml-auto">+ NCERT</button>
      </div>

      {scanning && (
        <div className="rounded-[20px] overflow-hidden bg-black relative">
          <video ref={video} muted playsInline className="w-full h-64 object-cover" />
          <p className="absolute bottom-2 inset-x-0 text-center text-white text-[14px] font-bold">Point at the barcode…</p>
        </div>
      )}
      {!scanning && <video ref={video} hidden muted playsInline />}

      {items === null && <p className="text-[15px] text-[#4f4633]">Loading…</p>}
      {items?.length === 0 && <p className="text-[15px] text-[#4f4633] bg-white rounded-[20px] p-4">{filter === 'uncounted' ? 'Everything here is counted. Use “Snap an item” for new things, or tap “+ NCERT”.' : 'No items yet.'}</p>}
      {items?.map(i => (
        <button key={i.id} onClick={() => { setOpen(i); setCount(i.countedAt ? String(i.qty) : '') }} className="bg-white rounded-[18px] p-3 flex items-center gap-3 text-left shadow-sm active:scale-[0.99]">
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold leading-snug">{i.name}</p>
            <p className="text-[13px] text-[#4f4633]">{i.mrp != null ? 'MRP ' + rupees(i.mrp) : 'No MRP'}{i.className ? ' · Class ' + i.className : ''}</p>
          </div>
          <span className={'shrink-0 min-w-[56px] text-center rounded-[14px] px-2 py-1 text-[15px] font-extrabold ' + (i.countedAt ? 'bg-[#f6f3ee]' : 'bg-[#fff1e6] text-[#c2410c]')}>{i.countedAt ? i.qty : 'Count'}</span>
        </button>
      ))}

      {open && (
        <div className="fixed inset-0 z-40 bg-black/45 flex items-end justify-center" onClick={() => setOpen(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-[#fcf9f4] rounded-t-[28px] p-5 flex flex-col gap-3" style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}>
            <div className="w-12 h-1.5 rounded-full bg-[#e5e2dd] mx-auto" />
            <p className="text-[18px] font-extrabold leading-snug">{open.name}</p>
            <p className="text-[14px] text-[#4f4633]">{open.mrp != null ? 'MRP ' + rupees(open.mrp) + ' · ' : ''}{open.countedAt ? `last count ${open.qty}` : 'not counted yet'}</p>
            <p className="text-[15px] font-bold">How many on the shelf?</p>
            <CountInput value={count} onChange={setCount} />
            <BigButton onClick={save} disabled={count === ''}><span className="text-[17px] font-extrabold">Save count</span></BigButton>
          </div>
        </div>
      )}
    </div>
  )
}
