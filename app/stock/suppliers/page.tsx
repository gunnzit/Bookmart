'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Page, Bi, api, rupees } from '@/components/stock/ui'

type S = { id: string; name: string; owed: number }

export default function Suppliers() {
  const [list, setList] = useState<S[] | null>(null)
  useEffect(() => { api<{ suppliers: S[] }>('/api/stock/suppliers').then(r => setList(r.ok ? r.data.suppliers : [])) }, [])
  const total = (list || []).reduce((s, x) => s + Math.max(0, x.owed), 0)

  return (
    <Page title="Supplier khata" hi="सप्लायर खाता" back="/stock">
      <div className="bg-white rounded-[28px] p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(28,28,25,0.05)]">
        <Bi en="Total to pay" hi="कुल देना है" size={18} />
        <span className={'text-[32px] font-extrabold ' + (total > 0 ? 'text-[#c2410c]' : '')}>{list ? rupees(total) : '…'}</span>
      </div>
      {list?.length === 0 && <p className="text-[17px] text-[#4f4633] bg-white rounded-[24px] p-5">Suppliers appear here when you add their bill. · बिल जोड़ने पर सप्लायर यहां दिखेंगे।</p>}
      <div className="flex flex-col gap-3">
        {list?.map(s => (
          <Link key={s.id} href={'/stock/suppliers/' + s.id} className="bg-white rounded-[24px] p-5 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(28,28,25,0.05)] active:scale-[0.99]">
            <span className="text-[19px] font-bold min-w-0 truncate">{s.name}</span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="flex flex-col items-end">
                <span className={'text-[22px] font-extrabold ' + (s.owed > 0 ? 'text-[#c2410c]' : 'text-[#166534]')}>{s.owed > 0 ? rupees(s.owed) : 'Paid ✓'}</span>
                <span className="text-[13px] font-bold text-[#4f4633]">{s.owed > 0 ? 'to pay · देना है' : 'चुकता'}</span>
              </span>
              <span className="material-symbols-outlined text-[28px] text-[#795900]">chevron_right</span>
            </span>
          </Link>
        ))}
      </div>
    </Page>
  )
}
