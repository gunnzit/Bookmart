'use client'
import { useRouter } from 'next/navigation'
import PageShell from '@/components/PageShell'

const SHADOW = 'shadow-[0_2px_12px_rgba(28,28,25,0.06)]'

export default function ContactPage() {
  const router = useRouter()

  const ways = [
    { href: 'https://wa.me/918872235738?text=Hi%2C%20I%20have%20a%20query%20about%20wrap%26read', icon: 'chat', title: 'Chat on WhatsApp', sub: '+91 88722 35738 · Fastest response', tint: 'bg-[#25D366] text-white', external: true },
    { href: 'tel:+918872235738', icon: 'call', title: 'Call us', sub: '+91 88722 35738 · Mon–Sat, 9am–7pm', tint: 'bg-[#fbbf24] text-[#6c4f00]' },
    { href: 'mailto:buddybookx@gmail.com', icon: 'mail', title: 'Email us', sub: 'buddybookx@gmail.com', tint: 'bg-[#ffdbce] text-[#a73a00]' },
  ]

  const quick = [
    { label: 'Browse Marketplace', href: '/marketplace', icon: 'storefront' },
    { label: 'School Kits', href: '/school-sets', icon: 'backpack' },
    { label: 'My Orders', href: '/my-orders', icon: 'receipt_long' },
    { label: 'Sell a Book', href: '/sell', icon: 'sell' },
  ]

  return (
    <PageShell title="Contact Us" subtitle="We usually reply within a few hours">
      <p className="text-[15px] text-[#4f4633] leading-relaxed mb-5">
        We&apos;re students too — reach out any time. We typically respond within a few hours on WhatsApp.
      </p>

      {/* Store */}
      <section className={'bg-white rounded-[2rem] p-5 mb-4 ' + SHADOW}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ffdf9f] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px] text-[#795900]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold">Bedi Book Store</h2>
            <p className="text-[13px] text-[#4f4633] leading-relaxed mt-1">
              Booth No. 48, Sector-40C<br />
              Chandigarh, Punjab — 160040<br />
              <span className="text-[12px] text-[#817661]">(Only Branch)</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-[#ebe8e3] text-[12px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-[#795900]">schedule</span>Mon–Sat, 9am–7pm</span>
              <span className="bg-[#ebe8e3] text-[12px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-[#795900]">location_on</span>Sec-40C, Chandigarh</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ways to reach us */}
      <section className="flex flex-col gap-2.5 mb-5">
        {ways.map(w => (
          <a key={w.title} href={w.href} {...(w.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={'bg-white rounded-[2rem] p-3.5 pr-4 flex items-center gap-3.5 active:scale-[0.99] transition-transform ' + SHADOW}>
            <span className={'w-11 h-11 rounded-full flex items-center justify-center shrink-0 ' + w.tint}>
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{w.icon}</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-bold">{w.title}</span>
              <span className="block text-[12px] text-[#4f4633] truncate">{w.sub}</span>
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#817661]">chevron_right</span>
          </a>
        ))}
      </section>

      {/* Map */}
      <section className={'bg-white rounded-[2rem] overflow-hidden mb-5 ' + SHADOW}>
        <div className="px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#a73a00]">location_on</span>
          <span className="text-[13px] font-bold">Bedi Book Store — Booth No. 48, Sector-40C, Chandigarh</span>
        </div>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3430.3!2d76.7794!3d30.7215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDQzJzE3LjQiTiA3NsKwNDYnNDUuOCJF!5e0!3m2!1sen!2sin!4v1234567890"
          width="100%" height="220" className="block border-0" allowFullScreen loading="lazy"
          referrerPolicy="no-referrer-when-downgrade" />
        <a href="https://maps.google.com/?q=Sector+40C+Chandigarh+book+store" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-3 text-[13px] font-bold text-[#795900] active:opacity-70">
          Open in Google Maps<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-2.5">
        {quick.map(l => (
          <button key={l.label} onClick={() => router.push(l.href)}
            className={'bg-white rounded-[1rem] p-4 text-left active:scale-[0.97] transition-transform ' + SHADOW}>
            <span className="w-9 h-9 rounded-full bg-[#ffdf9f] flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[20px] text-[#795900]">{l.icon}</span>
            </span>
            <span className="block text-[13px] font-bold">{l.label}</span>
          </button>
        ))}
      </section>
    </PageShell>
  )
}
