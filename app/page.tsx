'use client'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'

const steps = [
  { icon: '📸', num: '1', title: 'Post your listing', desc: 'Add photos and set a price in under 2 minutes. Free.' },
  { icon: '💬', num: '2', title: 'Buyers contact you', desc: 'Buyers reach you directly on WhatsApp. No middlemen.' },
  { icon: '🤝', num: '3', title: 'Meet & exchange', desc: 'Meet locally, hand over the book, collect the cash.' },
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
  { q: 'Is it safe to buy here?', a: 'We recommend meeting in a public place like a cafe or school campus. Never share OTPs or pay in advance.' },
  { q: 'What areas do you cover?', a: 'Chandigarh, Mohali, Panchkula and surrounding tricity areas.' },
]

function useInView(threshold = 0.1) {
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

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #F7F6F3;
      --white: #FFFFFF;
      --card: #FFFFFF;
      --subtle: #F0EEE9;
      --border: #E5E2DA;
      --border-strong: #CCC9C0;
      --text: #1A1A1A;
      --text-2: #5C5C5C;
      --text-3: #9A9690;
      --green: #1D9E75;
      --green-dark: #157A5A;
      --green-bg: #E8F7F2;
      --green-border: #C0E8D8;
      --navy: #1B2A4A;
      --shadow: 0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.10);
      --r: 14px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111;
        --white: #1A1A1A;
        --card: #1E1E1E;
        --subtle: #252525;
        --border: #2A2A2A;
        --border-strong: #3A3A3A;
        --text: #F0EEE9;
        --text-2: #A0A0A0;
        --text-3: #666;
        --green-bg: #0D2B22;
        --green-border: #1A4035;
        --shadow: 0 1px 4px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3);
        --shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
      }
    }

    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
    .k { font-family: 'Kalam', cursive; }

    /* Nav */
    .nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }

    /* Buttons */
    .btn-p { display: inline-flex; align-items: center; justify-content: center; background: var(--green); color: #fff; border: none; border-radius: 10px; padding: 11px 22px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s, transform 0.15s; white-space: nowrap; }
    .btn-p:hover { background: var(--green-dark); transform: translateY(-1px); }
    .btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--text-2); border: none; border-radius: 10px; padding: 11px 16px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; white-space: nowrap; }
    .btn-ghost:hover { background: var(--subtle); color: var(--text); }
    .btn-o { display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--text); border: 1.5px solid var(--border-strong); border-radius: 10px; padding: 10px 22px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; white-space: nowrap; }
    .btn-o:hover { border-color: var(--green); color: var(--green); }

    /* Card */
    .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--r); box-shadow: var(--shadow); }
    .card-hover { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
    .card-hover:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }

    /* Reveal animations */
    .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .reveal.in { opacity: 1; transform: none; }
    .r1 { transition-delay: 0s; }
    .r2 { transition-delay: 0.08s; }
    .r3 { transition-delay: 0.16s; }
    .r4 { transition-delay: 0.24s; }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
    .fu { animation: fadeUp 0.5s ease both; }
    .fu1 { animation-delay: 0.05s; }
    .fu2 { animation-delay: 0.1s; }
    .fu3 { animation-delay: 0.15s; }
    .fu4 { animation-delay: 0.22s; }

    /* Ticker */
    @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .ticker-wrap { overflow: hidden; background: var(--green); padding: 9px 0; }
    .ticker-track { display: flex; animation: ticker 22s linear infinite; width: max-content; }
    .ticker-item { white-space: nowrap; padding: 0 24px; font-size: 12px; color: rgba(255,255,255,0.92); font-weight: 500; }

    /* Section */
    .section { padding: 56px 20px; }
    .max { max-width: 920px; margin: 0 auto; }
    .section-tag { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--green); margin-bottom: 8px; }
    .section-h { font-family: 'Kalam', cursive; font-size: clamp(24px, 4vw, 34px); color: var(--text); margin-bottom: 10px; line-height: 1.2; }
    .section-p { font-size: 15px; color: var(--text-2); line-height: 1.7; }

    /* FAQ */
    .faq-btn { width: 100%; text-align: left; background: none; border: none; padding: 17px 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 600; color: var(--text); font-family: 'DM Sans', sans-serif; gap: 12px; }
    .faq-body { font-size: 14px; color: var(--text-2); line-height: 1.7; padding-bottom: 17px; }

    /* Listing card */
    .lcard { background: var(--card); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .lcard:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }

    /* Responsive */
    @media (min-width: 640px) {
      .nav { padding: 0 32px; }
      .section { padding: 72px 32px; }
      .stats-row { flex-direction: row !important; gap: 40px !important; }
      .listings-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .steps-grid { grid-template-columns: repeat(3, 1fr) !important; }
      .cat-grid { grid-template-columns: repeat(6, 1fr) !important; }
      .trust-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .test-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (min-width: 900px) {
      .test-grid { grid-template-columns: repeat(4, 1fr) !important; }
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
  `

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav className="nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '30px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="k" style={{ fontSize: '19px', color: 'var(--text)', fontWeight: '700' }}>BuddyBooks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn-ghost" onClick={() => router.push('/marketplace')}>Browse</button>
            {isSignedIn
              ? <button className="btn-p" onClick={() => router.push('/sell')}>+ Sell</button>
              : <SignInButton mode="modal"><button className="btn-p">Get started</button></SignInButton>
            }
          </div>
        </nav>

        {/* Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...Array(3)].map((_, j) =>
              ['📚 100% free to use', '✅ No commission ever', '📍 Chandigarh · Mohali · Panchkula', '💬 WhatsApp direct contact', '📗 NCERT books available', '📙 JEE & NEET prep books', '🤝 Meet locally & exchange'].map((t, i) => (
                <span key={`${j}-${i}`} className="ticker-item">{t}</span>
              ))
            )}
          </div>
        </div>

        {/* Hero — mobile first, stacked */}
        <section style={{ padding: 'clamp(36px, 6vw, 72px) 20px clamp(32px, 5vw, 56px)', maxWidth: '920px', margin: '0 auto' }}>

          {/* Badge */}
          <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--green-bg)', color: 'var(--green)', fontSize: '11px', fontWeight: '700', padding: '5px 13px', borderRadius: '99px', marginBottom: '18px', border: '1px solid var(--green-border)', letterSpacing: '0.2px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            Chandigarh's student marketplace
          </div>

          {/* Title */}
          <h1 className="k fu fu1" style={{ fontSize: 'clamp(34px, 7vw, 58px)', color: 'var(--text)', lineHeight: 1.15, marginBottom: '16px' }}>
            Buy & sell books<br /><span style={{ color: 'var(--green)' }}>the smart way</span>
          </h1>

          {/* Subtitle */}
          <p className="fu fu2" style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.75, marginBottom: '24px', maxWidth: '480px' }}>
            Find second-hand textbooks, novels and stationery from students near you — at half the price.
          </p>

          {/* CTA buttons */}
          <div className="fu fu3" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button className="btn-p" style={{ fontSize: '16px', padding: '13px 28px' }} onClick={() => router.push('/marketplace')}>Browse listings →</button>
            {isSignedIn
              ? <button className="btn-o" style={{ fontSize: '16px', padding: '12px 24px' }} onClick={() => router.push('/sell')}>Sell your books</button>
              : <SignInButton mode="modal"><button className="btn-o" style={{ fontSize: '16px', padding: '12px 24px' }}>Sell your books</button></SignInButton>
            }
          </div>

          {/* Stats row */}
          <div className="fu fu4 stats-row" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
            {[['500+', 'Listings posted'], ['₹250', 'Avg. savings'], ['Free', 'No commission']].map(([n, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="k" style={{ fontSize: '22px', color: 'var(--green)', fontWeight: '700', lineHeight: 1 }}>{n}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Sample listing cards */}
          <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {sampleListings.map((l, i) => {
              const disc = Math.round((1 - l.price / l.origPrice) * 100)
              return (
                <div key={i} className="lcard" onClick={() => router.push('/marketplace')}>
                  <div style={{ height: '80px', background: 'var(--subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', position: 'relative' }}>
                    {l.emoji}
                    <span style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '9px', background: l.condition === 'New' ? '#D1FAE5' : '#DBEAFE', color: l.condition === 'New' ? '#065F46' : '#1E40AF', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>{l.condition}</span>
                    <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '9px', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>-{disc}%</span>
                  </div>
                  <div style={{ padding: '10px 11px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '3px' }}>
                      <span className="k" style={{ fontSize: '15px', color: 'var(--green)', fontWeight: '700' }}>₹{l.price}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>📍 {l.location}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Trust signals */}
        <section ref={trustRef} style={{ padding: '0 20px 56px', maxWidth: '920px', margin: '0 auto' }}>
          <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { icon: '🔒', title: 'Safe & local', desc: 'Meet in person. No prepayment needed.' },
              { icon: '💸', title: 'Always free', desc: 'No listing fees. No commission.' },
              { icon: '⚡', title: 'Fast & simple', desc: 'List in 2 minutes. Sell within hours.' },
              { icon: '📍', title: 'Tricity only', desc: 'Chandigarh, Mohali & Panchkula.' },
            ].map((t, i) => (
              <div key={t.title} className={`card reveal${trustInView ? ' in' : ''} r${i + 1}`} style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section ref={howRef} style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section max">
            <div style={{ marginBottom: '32px' }}>
              <div className={`section-tag reveal${howInView ? ' in' : ''}`}>How it works</div>
              <h2 className={`section-h reveal${howInView ? ' in' : ''} r2`}>Three steps. Zero fees.</h2>
              <p className={`section-p reveal${howInView ? ' in' : ''} r3`} style={{ maxWidth: '480px' }}>No registration hassle. Post, connect, sell.</p>
            </div>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {steps.map((s, i) => (
                <div key={s.num} className={`card reveal${howInView ? ' in' : ''} r${i + 1}`} style={{ padding: '24px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', flexShrink: 0 }}>{s.num}</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '7px' }}>{s.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section ref={catRef} className="section max">
          <div style={{ marginBottom: '28px' }}>
            <div className={`section-tag reveal${catInView ? ' in' : ''}`}>Categories</div>
            <h2 className={`section-h reveal${catInView ? ' in' : ''} r2`}>What you can find here</h2>
          </div>
          <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {categories.map((cat, i) => (
              <div key={cat.name} className={`card card-hover reveal${catInView ? ' in' : ''} r${(i % 4) + 1}`}
                onClick={() => router.push('/marketplace')}
                style={{ padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', marginBottom: '7px' }}>{cat.emoji}</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>{cat.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section ref={testRef} style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section max">
            <div style={{ marginBottom: '28px' }}>
              <div className={`section-tag reveal${testInView ? ' in' : ''}`}>Testimonials</div>
              <h2 className={`section-h reveal${testInView ? ' in' : ''} r2`}>Students love it</h2>
              <p className={`section-p reveal${testInView ? ' in' : ''} r3`}>Real students saving real money across Chandigarh.</p>
            </div>
            <div className="test-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {testimonials.map((t, i) => (
                <div key={t.name} className={`card reveal${testInView ? ' in' : ''} r${(i % 4) + 1}`} style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
                    {[...Array(5)].map((_, j) => <span key={j} style={{ color: '#F59E0B', fontSize: '12px' }}>★</span>)}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '14px' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <div className="k" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0, border: '1px solid var(--green-border)' }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section ref={faqRef} className="section" style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <div className={`section-tag reveal${faqInView ? ' in' : ''}`}>FAQ</div>
            <h2 className={`section-h reveal${faqInView ? ' in' : ''} r2`}>Common questions</h2>
          </div>
          <div className={`reveal${faqInView ? ' in' : ''} r3`} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0 20px', boxShadow: 'var(--shadow)' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--green)', fontSize: '20px', fontWeight: '300', transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && <div className="faq-body">{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="section" style={{ maxWidth: '920px', margin: '0 auto', paddingTop: '0' }}>
          <div style={{ background: 'var(--navy)', borderRadius: '20px', padding: 'clamp(32px, 6vw, 56px) clamp(24px, 5vw, 48px)', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '14px' }}>📚</div>
            <h2 className="k" style={{ fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', marginBottom: '10px', lineHeight: 1.2 }}>Ready to get started?</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px', lineHeight: 1.7, maxWidth: '360px', margin: '0 auto 28px' }}>List your old books today and earn extra cash. Completely free, no sign-up required to browse.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {isSignedIn
                ? <button className="btn-p" style={{ fontSize: '15px', padding: '13px 28px' }} onClick={() => router.push('/sell')}>Sell a book →</button>
                : <SignInButton mode="modal"><button className="btn-p" style={{ fontSize: '15px', padding: '13px 28px' }}>Start selling →</button></SignInButton>
              }
              <button onClick={() => router.push('/marketplace')}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
                Browse first
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 20px', background: 'var(--white)' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <img src="/logo.png" alt="BuddyBooks" style={{ height: '24px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="k" style={{ fontSize: '16px', color: 'var(--text)', fontWeight: '700' }}>BuddyBooks</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Student marketplace · Chandigarh · Free</span>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
  {[['Browse', '/marketplace'], ['Sell', '/sell'], ['Wishlist', '/wishlist'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Refund', '/refund'], ['Contact', '/contact']].map(([l, h]) => (
    <span key={l} onClick={() => router.push(h)} style={{ fontSize: '12px', color: 'var(--text-3)', cursor: 'pointer', transition: 'color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>{l}</span>
  ))}
</div>
          </div>
        </footer>

      </div>
    </>
  )
}