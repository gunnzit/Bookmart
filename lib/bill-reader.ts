// Reads a photographed supplier bill with Google Gemini and returns the lines as data.
// Nothing is added to stock here: a person checks the result on the check screen first.
// Provider: Gemini (GEMINI_API_KEY in Vercel; model from GEMINI_MODEL, default below).
// To switch to another provider later, replace readBill() and keep the ReadBill shape.

export type ReadLine = {
  name: string
  qty: number
  unitPrice: number | null
  mrp: number | null
  gstRate: number | null
  hsn: string | null
  amount: number | null
  category: 'book' | 'stationery' | 'other'
  unsure: boolean
}

export type ReadBill = {
  supplierName: string
  gstin: string | null
  billNo: string | null
  billDate: string | null // YYYY-MM-DD
  total: number | null
  lines: ReadLine[]
}

// Tried in order. On Google's free tier a model is sometimes "experiencing high demand" (503) or
// rate-limited (429); then we wait briefly, retry once, and move on to the next model.
const MODELS = [process.env.GEMINI_MODEL || 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite']
  .filter((m, i, all) => all.indexOf(m) === i)
const BUSY = new Set([429, 500, 503])
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

const PROMPT = `You are reading a photographed purchase bill (tax invoice or challan) from an Indian supplier of school books and stationery to a bookshop in Chandigarh. The bill may be printed or handwritten, in English, Hindi or both, and may continue across several photos (read them in order as one bill).

Return ONLY the JSON described by the schema.
- supplierName: the seller's business name (not the buyer, not "Bedi Book Store").
- gstin: the seller's 15-character GSTIN if printed, else null.
- billNo: invoice/bill number, else null. billDate: as YYYY-MM-DD, else null.
- total: the final bill amount payable (after tax and discount), else null.
- lines: one entry per item row. name = item exactly as written (expand obvious abbreviations only if certain). qty = quantity as a number. unitPrice = rate per unit charged. mrp = printed MRP per unit if the bill shows it. gstRate = tax percent for the line if shown (e.g. 0, 5, 12, 18). hsn = HSN code if shown. amount = line amount.
- category: "book" for books/guides/textbooks, "stationery" for notebooks, pens, pencils, files, art material etc., otherwise "other".
- unsure: true if any part of that line was hard to read or you are guessing. Never invent rows or numbers; use null when a value is not on the bill.
Ignore totals, tax summary rows, terms and signatures as item lines.`

const SCHEMA = {
  type: 'object',
  properties: {
    supplierName: { type: 'string' },
    gstin: { type: 'string', nullable: true },
    billNo: { type: 'string', nullable: true },
    billDate: { type: 'string', nullable: true },
    total: { type: 'number', nullable: true },
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          qty: { type: 'number' },
          unitPrice: { type: 'number', nullable: true },
          mrp: { type: 'number', nullable: true },
          gstRate: { type: 'number', nullable: true },
          hsn: { type: 'string', nullable: true },
          amount: { type: 'number', nullable: true },
          category: { type: 'string', enum: ['book', 'stationery', 'other'] },
          unsure: { type: 'boolean' },
        },
        required: ['name', 'qty', 'category', 'unsure'],
      },
    },
  },
  required: ['supplierName', 'lines'],
}

const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : null)
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

export async function readBill(images: { mime: string; base64: string }[]): Promise<ReadBill> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('reader_not_set')

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: PROMPT }, ...images.map(i => ({ inline_data: { mime_type: i.mime, data: i.base64 } }))] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0 },
  })
  let res: Response | null = null
  outer: for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body,
      })
      if (res.ok) break outer
      const text = await res.text().catch(() => '')
      console.error('Bill reader failed', model, res.status, text.slice(0, 300))
      if (!BUSY.has(res.status)) {
        // 404 = this model name is not available on the account: try the next one
        if (res.status === 404) continue outer
        throw new Error('read_failed')
      }
      await wait(1500 * (attempt + 1))
    }
  }
  if (!res || !res.ok) throw new Error('reader_busy')
  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
  let raw: any
  try {
    raw = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''))
  } catch {
    console.error('Bill reader returned non-JSON', text.slice(0, 300))
    throw new Error('read_failed')
  }

  const date = str(raw.billDate)
  return {
    supplierName: str(raw.supplierName) || '',
    gstin: str(raw.gstin),
    billNo: str(raw.billNo),
    billDate: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    total: num(raw.total),
    lines: (Array.isArray(raw.lines) ? raw.lines : [])
      .map((l: any): ReadLine => ({
        name: str(l.name) || '',
        qty: num(l.qty) ?? 1,
        unitPrice: num(l.unitPrice),
        mrp: num(l.mrp),
        gstRate: num(l.gstRate),
        hsn: str(l.hsn),
        amount: num(l.amount),
        category: ['book', 'stationery', 'other'].includes(l.category) ? l.category : 'other',
        unsure: !!l.unsure,
      }))
      .filter((l: ReadLine) => l.name),
  }
}
