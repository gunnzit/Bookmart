import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/chat'
import { shopDetails, invoiceCode } from '@/lib/counter'
import PrintButton from './PrintButton'

// A counter bill as a GST invoice. Anyone with the link can view it (the link is a long random
// token, sent only to that customer). Prices include GST; the tax is shown per rate, split into
// CGST and SGST (sale within Chandigarh).

export const metadata: Metadata = { title: 'Invoice', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sale = await prisma.counterSale.findUnique({
    where: { token },
    include: { lines: { orderBy: { position: 'asc' } }, staff: { select: { name: true } } },
  })
  if (!sale) notFound()

  const shop = shopDetails()
  const factor = sale.subtotal > 0 ? sale.total / sale.subtotal : 1
  // tax breakup by rate (lines without a rate are shown as no tax)
  const byRate = new Map<number, { taxable: number; tax: number }>()
  for (const l of sale.lines) {
    const r = l.gstRate ?? 0
    const amt = l.amount * factor
    const t = amt / (1 + r / 100)
    const cur = byRate.get(r) || { taxable: 0, tax: 0 }
    byRate.set(r, { taxable: cur.taxable + t, tax: cur.tax + (amt - t) })
  }
  const rates = [...byRate.entries()].sort((a, b) => a[0] - b[0])
  const pending = sale.lines.filter(l => l.pendingQty > 0)

  return (
    <div className="min-h-screen bg-[#f0ede9] print:bg-white py-6 print:py-0 px-3 font-['Plus_Jakarta_Sans',sans-serif] text-[#1c1c19]">
      <div className="max-w-[720px] mx-auto bg-white rounded-[20px] print:rounded-none shadow-[0_4px_20px_rgba(28,28,25,0.06)] print:shadow-none p-6 text-[14px]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e5e2dd] pb-4">
          <div>
            <p className="text-[20px] font-extrabold">{shop.name}</p>
            <p className="text-[#4f4633]">{shop.address}</p>
            {shop.gstin && <p className="mt-1"><b>GSTIN:</b> {shop.gstin}</p>}
            <p className="text-[#4f4633]">State: {shop.state}</p>
          </div>
          <div className="text-right">
            <p className="text-[18px] font-extrabold">{shop.gstin ? 'Tax Invoice' : 'Bill'}</p>
            <p><b>No.</b> {invoiceCode(sale.invoiceNo, sale.createdAt)}</p>
            <p><b>Date</b> {sale.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</p>
            {sale.status === 'returned' && <p className="mt-1 font-extrabold text-[#c2410c]">RETURNED</p>}
          </div>
        </div>

        <div className="py-3 border-b border-[#e5e2dd] flex flex-wrap gap-x-6 gap-y-1">
          <p><b>Customer:</b> {sale.customerName || 'Walk-in customer'}{sale.customerPhone ? ` · ${sale.customerPhone}` : ''}</p>
          <p><b>Place of supply:</b> Chandigarh</p>
          {sale.school && <p><b>Set:</b> {sale.school}, Class {sale.className}</p>}
        </div>

        <table className="w-full mt-3 border-collapse">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-wide text-[#817661] border-b border-[#e5e2dd]">
              <th className="py-2 pr-2 w-8">#</th><th className="py-2 pr-2">Item</th><th className="py-2 pr-2">HSN</th>
              <th className="py-2 pr-2 text-right">Qty</th><th className="py-2 pr-2 text-right">Rate</th><th className="py-2 pr-2 text-right">GST</th><th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((l, i) => (
              <tr key={l.id} className="border-b border-[#f0ede9] align-top">
                <td className="py-2 pr-2">{i + 1}</td>
                <td className="py-2 pr-2">{l.name}{l.pendingQty > 0 && <span className="block text-[12px] text-[#c2410c]">{l.pendingQty} to hand over later</span>}</td>
                <td className="py-2 pr-2">{l.hsn || '—'}</td>
                <td className="py-2 pr-2 text-right">{l.qty}</td>
                <td className="py-2 pr-2 text-right">{inr(l.unitPrice)}</td>
                <td className="py-2 pr-2 text-right">{l.gstRate != null ? l.gstRate + '%' : '—'}</td>
                <td className="py-2 text-right">{inr(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col items-end gap-1">
          <p>Subtotal <b className="inline-block w-28 text-right">{inr(sale.subtotal)}</b></p>
          {sale.discount > 0 && <p>Discount <b className="inline-block w-28 text-right">−{inr(sale.discount)}</b></p>}
          <p className="text-[18px]">Total <b className="inline-block w-28 text-right">{inr(sale.total)}</b></p>
          <p className="text-[#4f4633]">Paid by {sale.payMode === 'upi' ? 'UPI' : 'cash'}</p>
        </div>

        {shop.gstin && (
          <table className="w-full mt-5 border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-wide text-[#817661] border-b border-[#e5e2dd]">
                <th className="py-2">GST rate</th><th className="py-2 text-right">Taxable value</th><th className="py-2 text-right">CGST</th><th className="py-2 text-right">SGST</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(([r, v]) => (
                <tr key={r} className="border-b border-[#f0ede9]">
                  <td className="py-1.5">{r}%</td>
                  <td className="py-1.5 text-right">{inr(v.taxable)}</td>
                  <td className="py-1.5 text-right">{inr(v.tax / 2)}</td>
                  <td className="py-1.5 text-right">{inr(v.tax / 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pending.length > 0 && (
          <div className="mt-5 rounded-[14px] bg-[#fff1e6] p-3">
            <p className="font-bold text-[#c2410c]">To hand over later</p>
            <p className="text-[13px]">{pending.map(l => `${l.name} × ${l.pendingQty}`).join(', ')}</p>
          </div>
        )}

        <p className="mt-6 text-center text-[13px] text-[#4f4633]">Thank you for shopping with us. · wrap&amp;read · pageplus.in</p>
        <p className="text-center text-[12px] text-[#817661]">Billed by {sale.staff.name}</p>
        <div className="mt-5 flex justify-center print:hidden"><PrintButton /></div>
      </div>
    </div>
  )
}
