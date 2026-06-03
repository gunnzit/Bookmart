'use client'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
  const router = useRouter()

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #F7F6F3; --white: #fff; --card: #fff; --border: #E5E2DA;
      --text: #1B2A4A; --text-2: #666; --text-3: #999;
      --green: #1D9E75; --shadow: 0 2px 12px rgba(27,42,74,0.07); --r: 16px;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0F1117; --white: #1A1D27; --card: #1E2130; --border: #2A2D3E; --text: #E8E6F0; --text-2: #A0A0B0; --text-3: #666880; --shadow: 0 2px 12px rgba(0,0,0,0.3); }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
    .k { font-family: 'Kalam', cursive; }
    .nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 50; box-shadow: var(--shadow); }
    .card { background: var(--card); border: 1.5px solid var(--border); border-radius: var(--r); box-shadow: var(--shadow); }
    .contact-btn { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-radius: var(--r); border: 1.5px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.15s; text-decoration: none; width: 100%; }
    .contact-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(27,42,74,0.1); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    .fu { animation: fadeUp 0.35s ease both; }
    .fu1 { animation-delay: 0.05s; } .fu2 { animation-delay: 0.1s; } .fu3 { animation-delay: 0.15s; } .fu4 { animation-delay: 0.2s; }
  `

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav className="nav">
          <button onClick={() => router.back()} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '28px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>BuddyBooks</span>
          </div>
        </nav>

        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Header */}
          <div className="fu fu1" style={{ marginBottom: '28px' }}>
            <h1 className="k" style={{ fontSize: 'clamp(26px, 5vw, 36px)', color: 'var(--text)', marginBottom: '8px' }}>Contact Us 👋</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7 }}>
              We're students too — reach out any time. We typically respond within a few hours on WhatsApp.
            </p>
          </div>

          {/* Store card */}
          <div className="card fu fu2" style={{ padding: '22px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #1B2A4A, #1D9E75)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📚</div>
              <div style={{ flex: 1 }}>
                <div className="k" style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '4px' }}>Bedi Book Store</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '12px' }}>
                  Booth No. 48, Sector-40C<br />
                  Chandigarh, Punjab — 160040<br />
                  <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>(Only Branch)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', background: '#E8F7F2', color: '#1D9E75', padding: '4px 10px', borderRadius: '99px', fontWeight: '600', border: '1px solid #C0E8D8' }}>🕐 Mon–Sat, 9am–7pm</span>
                  <span style={{ fontSize: '12px', background: '#EFF6FF', color: '#3B82F6', padding: '4px 10px', borderRadius: '99px', fontWeight: '600', border: '1px solid #BFDBFE' }}>📍 Sec-40C, Chandigarh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact buttons */}
          <div className="fu fu3" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>

            {/* WhatsApp */}
            <a href="https://wa.me/918872235738?text=Hi%2C%20I%20have%20a%20query%20about%20BuddyBooks" target="_blank" rel="noopener noreferrer" className="contact-btn"
              style={{ borderColor: '#C0E8D8', background: 'linear-gradient(135deg, #E8F7F2, #D1FAE5)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#065F46', marginBottom: '2px' }}>Chat on WhatsApp</div>
                <div style={{ fontSize: '12px', color: '#047857' }}>+91 88722 35738 · Fastest response</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#1D9E75', flexShrink: 0 }}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>

            {/* Phone call */}
            <a href="tel:+918872235738" className="contact-btn" style={{ borderColor: '#BFDBFE', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>📞</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E40AF', marginBottom: '2px' }}>Call us</div>
                <div style={{ fontSize: '12px', color: '#3B82F6' }}>+91 88722 35738 · Mon–Sat, 9am–7pm</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#3B82F6', flexShrink: 0 }}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>

            {/* Email */}
            <a href="mailto:buddybookx@gmail.com" className="contact-btn" style={{ borderColor: '#DDD6FE', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>✉️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#5B21B6', marginBottom: '2px' }}>Email us</div>
                <div style={{ fontSize: '12px', color: '#7C3AED' }}>buddybookx@gmail.com</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#8B5CF6', flexShrink: 0 }}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>

          </div>

          {/* Map embed */}
          <div className="fu fu4" style={{ borderRadius: 'var(--r)', overflow: 'hidden', border: '1.5px solid var(--border)', marginBottom: '24px', boxShadow: 'var(--shadow)' }}>
            <div style={{ background: 'var(--card)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📍</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Bedi Book Store — Booth No. 48, Sector-40C, Chandigarh</span>
            </div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3430.3!2d76.7794!3d30.7215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDQzJzE3LjQiTiA3NsKwNDYnNDUuOCJF!5e0!3m2!1sen!2sin!4v1234567890"
              width="100%" height="220" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" />
            <a href="https://maps.google.com/?q=Sector+40C+Chandigarh+book+store" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', background: 'var(--card)', fontSize: '12px', fontWeight: '700', color: '#3B82F6', textDecoration: 'none', borderTop: '1px solid var(--border)' }}>
              Open in Google Maps →
            </a>
          </div>

          {/* Quick links */}
          <div className="fu fu4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Browse Marketplace', href: '/marketplace', emoji: '🛒', color: '#1D9E75', bg: '#E8F7F2' },
              { label: 'School Kits', href: '/school-sets', emoji: '🎒', color: '#3B82F6', bg: '#EFF6FF' },
              { label: 'My Orders', href: '/my-orders', emoji: '📦', color: '#8B5CF6', bg: '#F5F3FF' },
              { label: 'Sell a Book', href: '/sell', emoji: '📚', color: '#F97316', bg: '#FFF7ED' },
            ].map(l => (
              <button key={l.label} onClick={() => router.push(l.href)}
                style={{ background: l.bg, border: '1.5px solid ' + l.color + '44', borderRadius: '14px', padding: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{l.emoji}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: l.color }}>{l.label}</div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}