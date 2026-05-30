'use client'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
  const router = useRouter()
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --nav-bg: #fff; --border: #EDE9E1;
      --text-primary: #1B2A4A; --text-secondary: #555; --text-muted: #999;
      --shadow-nav: 0 2px 12px rgba(27,42,74,0.06);
      --shadow-card: 0 2px 12px rgba(27,42,74,0.06);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --nav-bg: #13151F; --border: #2A2D3E;
        --text-primary: #E8E6F0; --text-secondary: #A0A4B8; --text-muted: #555878;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
        --shadow-card: 0 2px 12px rgba(0,0,0,0.25);
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
    .kalam { font-family: 'Kalam', cursive; }
    .contact-card { background: var(--bg-card); border-radius: 16px; border: 1.5px solid var(--border); padding: 20px 22px; display: flex; align-items: flex-start; gap: 16px; box-shadow: var(--shadow-card); transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; text-decoration: none; }
    .contact-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(27,42,74,0.10); }
  `
  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => router.back()} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>←</button>
          <span className="kalam" style={{ fontSize: '17px', color: '#1D9E75', fontWeight: '700' }}>BuddyBooks</span>
        </nav>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '36px 20px 60px' }}>
          <h1 className="kalam" style={{ fontSize: '30px', color: 'var(--text-primary)', marginBottom: '6px' }}>Contact Us</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>We're here to help. Reach out anytime.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <a href="https://wa.me/919914735738?text=Hi, I need help with BuddyBooks" target="_blank" rel="noopener noreferrer" className="contact-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>💬</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>WhatsApp</div>
                <div style={{ fontSize: '13px', color: '#1D9E75', fontWeight: '600' }}>+91 99147 35738</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Fastest response — usually within an hour</div>
              </div>
            </a>

            <a href="mailto:support@buddybooks.in" className="contact-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>✉️</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>Email</div>
                <div style={{ fontSize: '13px', color: '#2563EB', fontWeight: '600' }}>support@buddybooks.in</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>We reply within 24 hours</div>
              </div>
            </a>

            <a href="https://maps.google.com/?q=Sector+40-C+Chandigarh" target="_blank" rel="noopener noreferrer" className="contact-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>📍</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>Visit the Store</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Bedi Book Store, Sector 40-C, Chandigarh</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Mon–Sat: 9am–7pm · Sun: 10am–5pm</div>
              </div>
            </a>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1.5px solid var(--border)', padding: '22px' }}>
            <div className="kalam" style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '14px' }}>🙋 Common questions</div>
            {[
              { q: 'My listing was rejected — what do I do?', a: 'Check that your listing is for books, notebooks, or stationery only. Make sure photos are clear and include the MRP tag. Then repost or contact us.' },
              { q: 'I was charged but my listing is not featured', a: 'Contact us immediately on WhatsApp with your payment details. We will verify and activate your listing within 2 hours.' },
              { q: 'A buyer is not responding / scam concern', a: 'Never pay anyone in advance. Always meet in person in a public place. Report suspicious users to us via WhatsApp.' },
              { q: 'I want to delete my account and data', a: 'Email us at support@buddybooks.in with your registered email and we will delete your account and all associated data within 7 business days.' },
            ].map((faq, i) => (
              <div key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', paddingTop: i === 0 ? 0 : '14px', marginTop: i === 0 ? 0 : '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '5px' }}>{faq.q}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}