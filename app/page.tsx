'use client'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'

const steps = [
  { icon: '📸', num: '1', title: 'Post your listing', desc: 'Add photos and set a price in under 2 minutes. Completely free.' },
  { icon: '💬', num: '2', title: 'Buyers contact you', desc: 'Interested buyers reach you directly on WhatsApp. No middlemen.' },
  { icon: '🤝', num: '3', title: 'Meet & exchange', desc: 'Meet locally in Chandigarh, hand over the book, collect the cash.' },
]

const categories = [
  { name: 'Textbooks', desc: 'NCERT & reference', emoji: '📗' },
  { name: 'Novels', desc: 'Fiction & literature', emoji: '📘' },
  { name: 'Notebooks', desc: 'Ruled, plain, spiral', emoji: '📓' },
  { name: 'Art Supplies', desc: 'Colors & brushes', emoji: '🎨' },
  { name: 'Stationery', desc: 'Pens, files & more', emoji: '✏️' },
  { name: 'Competitive', desc: 'JEE, NEET & exams', emoji: '📙' },
]

const testimonials = [
  { name: 'Priya S.', role: 'Class 12, DPS Chandigarh', text: 'Sold all my Class 11 books in 2 days! Got ₹800 back. So easy to use.', avatar: 'P' },
  { name: 'Arjun M.', role: 'B.Tech Student, Mohali', text: 'Found NCERT Physics for ₹180 instead of ₹320. Saved so much!', avatar: 'A' },
  { name: 'Sneha K.', role: 'JEE Aspirant, Panchkula', text: 'Got all my Arihant books at half price. Total lifesaver.', avatar: 'S' },
  { name: 'Rahul T.', role: 'Class 10, Sector 22', text: 'Posted photos, got WhatsApp messages within the hour!', avatar: 'R' },
]

const sampleListings = [
  { title: 'NCERT Physics Pt. 1', price: 180, origPrice: 320, location: 'Sector 40', emoji: '📗', condition: 'Good' },
  { title: 'Atomic Habits', price: 220, origPrice: 399, location: 'Sector 22', emoji: '📘', condition: 'New' },
  { title: 'Arihant JEE Maths', price: 280, origPrice: 450, location: 'Panchkula', emoji: '📙', condition: 'Fair' },
  { title: 'Classmate Notebook', price: 120, origPrice: 180, location: 'Sector 40-C', emoji: '📓', condition: 'New' },
]

const faqs = [
  { q: 'Is BuddyBooks free to use?', a: 'Yes, completely free. Listing, browsing, and contacting sellers costs nothing.' },
  { q: 'How do I contact a seller?', a: 'Every listing has a WhatsApp button. One tap and you\'re chatting directly with the seller.' },
  { q: 'Is it safe to buy/sell here?', a: 'We recommend meeting in a public place like a cafe or school campus. Never share OTPs or pay in advance.' },
  { q: 'What areas do you cover?', a: 'Chandigarh, Mohali, Panchkula and surrounding areas. Essentially the entire tricity region.' },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

export default function LandingPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const { ref: howRef, inView: howInView } = useInView()
  const { ref: catRef, inView: catInView } = useInView()
  const { ref: trustRef, inView: trustInView } = useInView()
  const { ref: testRef, inView: testInView } = useInView()
  const { ref: faqRef, inView: faqInView } = useInView()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #F7F6F3;
          --bg-white: #FFFFFF;
          --bg-card: #FFFFFF;
          --bg-subtle: #F0EEE9;
          --border: #E5E2DA;
          --border-strong: #D0CDC4;
          --text: #1A1A1A;
          --text-secondary: #5C5C5C;
          --text-muted: #9A9690;
          --green: #1D9E75;
          --green-dark: #157A5A;
          --green-light: #E8F7F2;
          --green-mid: #C8EDE1;
          --navy: #1B2A4A;
          --shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
          --shadow-lg: 0 8px 32px rgba(0,0,0,0.10);
          --radius: 16px;
          --radius-sm: 10px;
          --radius-lg: 24px;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #111111;
            --bg-white: #1A1A1A;
            --bg-card: #1E1E1E;
            --bg-subtle: #252525;
            --border: #2A2A2A;
            --border-strong: #383838;
            --text: #F0EEE9;
            --text-secondary: #A0A0A0;
            --text-muted: #666666;
            --green-light: #0D2B22;
            --green-mid: #1A3D2E;
            --shadow-sm: 0 1px 4px rgba(0,0,0,0.3);
            --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
            --shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
          }
        }

        body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
        .kalam { font-family: 'Kalam', cursive; }

        /* Nav */
        .nav { background: var(--bg-white); border-bottom: 1px solid var(--border); padding: 0 32px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .nav-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; text-decoration: none; }
        .nav-links { display: flex; align-items: center; gap: 8px; }

        /* Buttons */
        .btn-primary { background: var(--green); color: #fff; border: none; border-radius: var(--radius-sm); padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s, transform 0.15s; }
        .btn-primary:hover { background: var(--green-dark); transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: var(--text-secondary); border: none; border-radius: var(--radius-sm); padding: 10px 18px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .btn-ghost:hover { background: var(--bg-subtle); color: var(--text); }
        .btn-outline { background: transparent; color: var(--text); border: 1.5px solid var(--border-strong); border-radius: var(--radius-sm); padding: 10px 22px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .btn-outline:hover { border-color: var(--green); color: var(--green); }
        .btn-large { padding: 14px 32px; font-size: 16px; border-radius: var(--radius); }

        /* Cards */
        .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s; }
        .card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }

        /* Animations */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.1s; }
        .d3 { animation-delay: 0.15s; }
        .d4 { animation-delay: 0.2s; }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .reveal.in { opacity: 1; transform: translateY(0); }
        .reveal.d1 { transition-delay: 0.05s; }
        .reveal.d2 { transition-delay: 0.1s; }
        .reveal.d3 { transition-delay: 0.15s; }
        .reveal.d4 { transition-delay: 0.2s; }

        /* Trust badges */
        .trust-item { display: flex; align-items: flex-start; gap: 14px; padding: 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); }

        /* Listing cards */
        .listing-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        .listing-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

        /* FAQ */
        .faq-item { border-bottom: 1px solid var(--border); }
        .faq-btn { width: 100%; text-align: left; background: none; border: none; padding: 18px 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 600; color: var(--text); font-family: 'DM Sans', sans-serif; }
        .faq-answer { font-size: 14px; color: var(--text-secondary); line-height: 1.7; padding-bottom: 18px; }

        /* Section */
        .section { padding: 72px 32px; }
        .section-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--green); margin-bottom: 10px; }
        .section-title { font-family: 'Kalam', cursive; font-size: clamp(26px, 4vw, 36px); color: var(--text); margin-bottom: 12px; line-height: 1.2; }
        .section-sub { font-size: 15px; color: var(--text-secondary); line-height: 1.7; max-width: 520px; }

        /* Grid */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr; }
          .nav { padding: 0 16px; }
          .section { padding: 48px 16px; }
          .hero-title { font-size: 36px !important; }
        }
        @media (max-width: 480px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
        }

        /* Ticker */
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-wrap { overflow: hidden; background: var(--green); padding: 10px 0; }
        .ticker-track { display: flex; animation: ticker 20s linear infinite; width: max-content; }
        .ticker-track:hover { animation-play-state: paused; }
        .ticker-item { white-space: nowrap; padding: 0 28px; font-size: 13px; color: rgba(255,255,255,0.9); font-weight: 500; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav className="nav">
          <div className="nav-brand" onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '32px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '20px', color: 'var(--text)', fontWeight: '700' }}>BuddyBooks</span>
          </div>
          <div className="nav-links">
            <button className="btn-ghost" onClick={() => router.push('/marketplace')}>Browse listings</button>
            {isSignedIn ? (
              <button className="btn-primary" onClick={() => router.push('/sell')}>+ Sell a book</button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-primary">Get started</button>
              </SignInButton>
            )}
          </div>
        </nav>

        {/* Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...Array(3)].map((_, j) =>
              ['📚 100% free to use', '📍 Chandigarh · Mohali · Panchkula', '💬 WhatsApp direct contact', '✅ No commission', '📗 NCERT books available', '📙 JEE & NEET prep books', '🤝 Meet locally & exchange'].map((t, i) => (
                <span key={`${j}-${i}`} className="ticker-item">{t}</span>
              ))
            )}
          </div>
        </div>

        {/* Hero */}
        <section style={{ padding: 'clamp(48px, 8vw, 96px) 32px clamp(40px, 6vw, 72px)', maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--green-light)', color: 'var(--green)', fontSize: '12px', fontWeight: '600', padding: '5px 14px', borderRadius: '99px', marginBottom: '24px', border: '1px solid var(--green-mid)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                Chandigarh's student marketplace
              </div>
              <h1 className="kalam fade-up d1" style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--text)', lineHeight: 1.15, marginBottom: '18px' }}>
                Buy & sell books<br />
                <span style={{ color: 'var(--green)' }}>the smart way</span>
              </h1>
              <p className="fade-up d2" style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '32px', maxWidth: '420px' }}>
                Find second-hand textbooks, novels and stationery from students near you — at half the price.
              </p>
              <div className="fade-up d3" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn-primary btn-large" onClick={() => router.push('/marketplace')}>Browse listings →</button>
                {isSignedIn
                  ? <button className="btn-outline btn-large" onClick={() => router.push('/sell')}>Sell your books</button>
                  : <SignInButton mode="modal"><button className="btn-outline btn-large">Sell your books</button></SignInButton>
                }
              </div>
              {/* Social proof row */}
              <div className="fade-up d4" style={{ display: 'flex', gap: '24px', marginTop: '36px', flexWrap: 'wrap' }}>
                {[['500+', 'Listings posted'], ['₹250', 'Avg. savings'], ['Free', 'No commission']].map(([n, l]) => (
                  <div key={l}>
                    <div className="kalam" style={{ fontSize: '24px', color: 'var(--green)', fontWeight: '700', lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right — sample listings */}
            <div className="fade-up d2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {sampleListings.map((l, i) => {
                const disc = Math.round((1 - l.price / l.origPrice) * 100)
                return (
                  <div key={i} className="listing-card" onClick={() => router.push('/marketplace')}>
                    <div style={{ height: '90px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', position: 'relative' }}>
                      {l.emoji}
                      <span style={{ position: 'absolute', top: '7px', left: '7px', fontSize: '9px', background: l.condition === 'New' ? '#D1FAE5' : '#DBEAFE', color: l.condition === 'New' ? '#065F46' : '#1E40AF', padding: '2px 7px', borderRadius: '99px', fontWeight: '700' }}>{l.condition}</span>
                      <span style={{ position: 'absolute', top: '7px', right: '7px', fontSize: '9px', background: '#FEE2E2', color: '#991B1B', padding: '2px 7px', borderRadius: '99px', fontWeight: '700' }}>-{disc}%</span>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '3px' }}>
                        <span className="kalam" style={{ fontSize: '16px', color: 'var(--green)', fontWeight: '700' }}>₹{l.price}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>📍 {l.location}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Trust signals */}
        <section ref={trustRef} style={{ padding: '0 32px 64px', maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { icon: '🔒', title: 'Safe & local', desc: 'Meet in person. No prepayment needed.' },
              { icon: '💸', title: 'Always free', desc: 'No listing fees. No commission ever.' },
              { icon: '⚡', title: 'Fast & simple', desc: 'List in 2 minutes. Sell within hours.' },
              { icon: '📍', title: 'Tricity only', desc: 'Chandigarh, Mohali & Panchkula.' },
            ].map((t, i) => (
              <div key={t.title} className={`trust-item reveal${trustInView ? ' in' : ''} d${i + 1}`}>
                <div style={{ fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section ref={howRef} style={{ background: 'var(--bg-white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 32px' }}>
            <div style={{ marginBottom: '40px' }}>
              <div className={`section-label reveal${howInView ? ' in' : ''}`}>How it works</div>
              <h2 className={`section-title reveal${howInView ? ' in' : ''} d1`}>Three steps. Zero fees.</h2>
              <p className={`section-sub reveal${howInView ? ' in' : ''} d2`}>No registration hassle, no complicated process. Post, connect, sell.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {steps.map((s, i) => (
                <div key={s.num} className={`card reveal${howInView ? ' in' : ''} d${i + 1}`} style={{ padding: '28px 24px' }}>
                  <div style={{ display: 'flex', align: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--green-light)', border: '1px solid var(--green-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', alignSelf: 'center', flexShrink: 0 }}>{s.num}</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>{s.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section ref={catRef} style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 32px' }}>
          <div style={{ marginBottom: '32px' }}>
            <div className={`section-label reveal${catInView ? ' in' : ''}`}>Categories</div>
            <h2 className={`section-title reveal${catInView ? ' in' : ''} d1`}>What you can find here</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {categories.map((cat, i) => (
              <div key={cat.name} className={`card reveal${catInView ? ' in' : ''} d${(i % 4) + 1}`}
                onClick={() => router.push('/marketplace')}
                style={{ padding: '20px 16px', textAlign: 'center', cursor: 'pointer', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{cat.emoji}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '3px' }}>{cat.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section ref={testRef} style={{ background: 'var(--bg-white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 32px' }}>
            <div style={{ marginBottom: '40px' }}>
              <div className={`section-label reveal${testInView ? ' in' : ''}`}>Testimonials</div>
              <h2 className={`section-title reveal${testInView ? ' in' : ''} d1`}>Students love it</h2>
              <p className={`section-sub reveal${testInView ? ' in' : ''} d2`}>Real students saving real money across Chandigarh.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {testimonials.map((t, i) => (
                <div key={t.name} className={`card reveal${testInView ? ' in' : ''} d${(i % 4) + 1}`} style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                    {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#F59E0B', fontSize: '13px' }}>★</span>)}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <div className="kalam" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', flexShrink: 0, border: '1px solid var(--green-mid)' }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section ref={faqRef} style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 32px' }}>
          <div style={{ marginBottom: '36px' }}>
            <div className={`section-label reveal${faqInView ? ' in' : ''}`}>FAQ</div>
            <h2 className={`section-title reveal${faqInView ? ' in' : ''} d1`}>Common questions</h2>
          </div>
          <div className={`reveal${faqInView ? ' in' : ''} d2`}>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--green)', fontSize: '18px', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
                </button>
                {openFaq === i && <div className="faq-answer">{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '0 32px 80px', maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ background: 'var(--navy)', borderRadius: '24px', padding: '56px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>📚</div>
              <h2 className="kalam" style={{ fontSize: '32px', color: '#fff', marginBottom: '10px', lineHeight: 1.2 }}>Ready to get started?</h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: '380px' }}>List your old books today and earn extra cash. Completely free.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isSignedIn
                ? <button className="btn-primary btn-large" onClick={() => router.push('/sell')}>Sell a book →</button>
                : <SignInButton mode="modal"><button className="btn-primary btn-large">Start selling →</button></SignInButton>
              }
              <button onClick={() => router.push('/marketplace')}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius)', padding: '14px 28px', fontSize: '15px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
                Browse first
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 32px', background: 'var(--bg-white)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/logo.png" alt="BuddyBooks" style={{ height: '26px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="kalam" style={{ fontSize: '17px', color: 'var(--text)', fontWeight: '700' }}>BuddyBooks</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Student marketplace for Chandigarh · Free to use</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              {[['Browse', '/marketplace'], ['Sell', '/sell'], ['Wishlist', '/wishlist']].map(([l, h]) => (
                <span key={l} onClick={() => router.push(h)} style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>{l}</span>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}