'use client'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const classKits = [
  { cls: 1, price: 2035 }, { cls: 2, price: 1810 }, { cls: 3, price: 4166 },
  { cls: 4, price: 4397 }, { cls: 5, price: 4640 }, { cls: 6, price: 4686 },
  { cls: 7, price: 5020 }, { cls: 8, price: 4801 }, { cls: 9, price: 4837 },
  { cls: 10, price: 3918 },
]

const testimonials = [
  { name: 'Priya S.', role: 'Class 12, DPS Chandigarh', text: 'Sold all my Class 11 books in 2 days! Got ₹800 back. So easy to use.', avatar: 'P', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', stars: 5 },
  { name: 'Arjun M.', role: 'B.Tech, Mohali', text: 'Found NCERT Physics for ₹180 instead of ₹320. The seller was nearby and we met the same day!', avatar: 'A', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', stars: 5 },
  { name: 'Sneha K.', role: 'JEE Aspirant, Panchkula', text: 'Got all my Arihant books at half price. Saved over ₹1,200 in one go. Total lifesaver.', avatar: 'S', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', stars: 5 },
  { name: 'Rahul T.', role: 'Class 10 parent, Sector 22', text: 'Ordered the Class 10 school kit for my son. Everything arrived perfectly packed in 2 days!', avatar: 'R', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', stars: 5 },
  { name: 'Divya N.', role: 'Class 8, Shivalik School', text: 'The school kit had every single book on the list. Saved us the trip to the market completely.', avatar: 'D', color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8', stars: 5 },
  { name: 'Karan B.', role: 'Commerce Student, Chandigarh', text: 'Listed 6 books and got WhatsApp messages within an hour. Super fast!', avatar: 'K', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', stars: 5 },
]

const faqs = [
  { q: 'Is BuddyBooks free to use?', a: 'Yes, completely free. Listing, browsing, and contacting sellers costs nothing. We never take commission.' },
  { q: 'How do school kits work?', a: 'Pick your class, customise which books and stationery you need, pay via Razorpay, and choose pickup from our Sector-40C store or home delivery (+₹99). We assemble and dispatch your kit.' },
  { q: 'How do I contact a seller?', a: "Every listing has a WhatsApp button. One tap opens a chat directly with the seller — no middlemen, no app required." },
  { q: 'What areas do you cover?', a: 'Chandigarh, Mohali, Panchkula and surrounding tricity areas for second-hand listings. School kits deliver anywhere.' },
  { q: 'Can I pay 30% now for a kit?', a: 'Yes! You can pay just 30% upfront to confirm your kit. The remaining balance is due at pickup or delivery.' },
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { ref: howRef, inView: howInView } = useInView()
  const { ref: testRef, inView: testInView } = useInView()
  const { ref: faqRef, inView: faqInView } = useInView()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(search.trim() ? '/marketplace?q=' + encodeURIComponent(search.trim()) : '/marketplace')
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #F7F6F3; --white: #fff; --card: #fff; --subtle: #F0EEE9;
      --border: #E5E2DA; --border-strong: #CCC9C0;
      --text: #1A1A1A; --text-2: #5C5C5C; --text-3: #9A9690;
      --green: #1D9E75; --green-dark: #157A5A; --green-bg: #E8F7F2; --green-border: #C0E8D8;
      --navy: #1B2A4A;
      --shadow: 0 2px 12px rgba(0,0,0,0.06); --shadow-lg: 0 8px 32px rgba(0,0,0,0.10); --r: 16px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --white: #1A1D27; --card: #1E2130; --subtle: #252840;
        --border: #2A2D3E; --border-strong: #3A3D52;
        --text: #F0EEE9; --text-2: #A0A0B0; --text-3: #666880;
        --green-bg: #0D2B22; --green-border: #1A4035;
        --shadow: 0 2px 12px rgba(0,0,0,0.4); --shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
    .k { font-family: 'Kalam', cursive; }
    .nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
    .btn-p { display: inline-flex; align-items: center; justify-content: center; background: var(--green); color: #fff; border: none; border-radius: 10px; padding: 11px 22px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; white-space: nowrap; }
    .btn-p:hover { background: var(--green-dark); transform: translateY(-1px); }
    .btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--text-2); border: none; border-radius: 10px; padding: 9px 14px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; white-space: nowrap; }
    .btn-ghost:hover { background: var(--subtle); color: var(--text); }
    .btn-kits { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#EFF6FF,#F5F3FF); color: #1D4ED8; border: 1.5px solid #BFDBFE; border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; white-space: nowrap; }
    .btn-kits:hover { transform: translateY(-1px); }
    .step-num { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
    .step-connector { width: 2px; height: 28px; background: var(--border); margin: 0 15px; }
    .kit-chip { border-radius: 12px; padding: 12px 8px; text-align: center; cursor: pointer; transition: all 0.15s; border: 1.5px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); }
    .kit-chip:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(255,255,255,0.1); background: rgba(255,255,255,0.15); }
    .test-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; box-shadow: var(--shadow); transition: transform 0.2s, box-shadow 0.2s; }
    .test-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .faq-btn { width: 100%; text-align: left; background: none; border: none; padding: 17px 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 600; color: var(--text); font-family: 'DM Sans', sans-serif; gap: 12px; }
    .search-bar { display: flex; width: 100%; background: var(--white); border: 2px solid var(--green); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(29,158,117,0.15); }
    .search-bar input { flex: 1; border: none; background: transparent; padding: 12px 16px; font-size: 14px; color: var(--text); font-family: 'DM Sans', sans-serif; outline: none; min-width: 0; }
    .search-bar input::placeholder { color: var(--text-3); }
    .search-bar button { background: var(--green); color: #fff; border: none; padding: 0 18px; font-size: 13px; cursor: pointer; font-weight: 700; font-family: 'DM Sans', sans-serif; white-space: nowrap; flex-shrink: 0; }
    @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .ticker-wrap { overflow: hidden; background: linear-gradient(90deg, #1D9E75, #0ea5e9, #8B5CF6, #F97316, #1D9E75); background-size: 300% 100%; animation: gradientShift 8s ease infinite; padding: 8px 0; }
    @keyframes gradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    .ticker-track { display: flex; animation: ticker 30s linear infinite; width: max-content; }
    .ticker-item { white-space: nowrap; padding: 0 24px; font-size: 11px; color: rgba(255,255,255,0.95); font-weight: 600; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
    .fu { animation: fadeUp 0.5s ease both; }
    .fu1 { animation-delay: 0.05s; } .fu2 { animation-delay: 0.1s; } .fu3 { animation-delay: 0.15s; } .fu4 { animation-delay: 0.22s; } .fu5 { animation-delay: 0.3s; }
    .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .reveal.in { opacity: 1; transform: none; }
    .r1 { transition-delay: 0s; } .r2 { transition-delay: 0.08s; } .r3 { transition-delay: 0.16s; } .r4 { transition-delay: 0.24s; } .r5 { transition-delay: 0.32s; } .r6 { transition-delay: 0.4s; }
    @media (max-width: 639px) {
      .nav-desktop-links { display: none !important; }
      .nav-second-row { display: flex !important; }
    }
    @media (min-width: 640px) {
      .nav-mobile-cta { display: none !important; }
      .split-grid { grid-template-columns: 1fr 1fr !important; }
      .how-steps { grid-template-columns: 1fr 1fr 1fr !important; }
      .test-grid { grid-template-columns: 1fr 1fr 1fr !important; }
    }
    .nav-second-row {
      display: none; background: var(--white); border-bottom: 1px solid var(--border);
      padding: 7px 12px; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch;
      scrollbar-width: none; position: sticky; top: 56px; z-index: 99;
    }
    .nav-second-row::-webkit-scrollbar { display: none; }
    .nav-pill { display: inline-flex; align-items: center; gap: 5px; padding: 6px 13px; border-radius: 99px; border: 1.5px solid var(--border); background: var(--white); color: var(--text-2); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
    .nav-pill.green { background: #E8F7F2; color: #1D9E75; border-color: #C0E8D8; }
    .nav-pill.blue { background: linear-gradient(135deg,#EFF6FF,#F5F3FF); color: #1D4ED8; border-color: #BFDBFE; }
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
            <span className="k" style={{ fontSize: '19px', color: 'var(--text)' }}>BuddyBooks</span>
          </div>
          <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn-ghost" onClick={() => router.push('/marketplace')}>Browse</button>
            <button className="btn-kits" onClick={() => router.push('/school-sets')}>🎒 School Sets</button>
            <button className="btn-ghost" onClick={() => router.push('/requests')}>📋 Requests</button>
            {isSignedIn
              ? <button className="btn-p" onClick={() => router.push('/sell')}>+ Sell</button>
              : <SignInButton mode="modal"><button className="btn-p">Get started</button></SignInButton>
            }
          </div>
          <div className="nav-mobile-cta" style={{ display: 'flex', alignItems: 'center' }}>
            {isSignedIn
              ? <button className="btn-p" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => router.push('/sell')}>+ Sell</button>
              : <SignInButton mode="modal"><button className="btn-p" style={{ padding: '8px 16px', fontSize: '13px' }}>Get started</button></SignInButton>
            }
          </div>
        </nav>

        {/* Mobile second row */}
        <div className="nav-second-row">
          <button className="nav-pill" onClick={() => router.push('/marketplace')}>🛒 Browse</button>
          <button className="nav-pill blue" onClick={() => router.push('/school-sets')}>🎒 School Sets</button>
          <button className="nav-pill" onClick={() => router.push('/requests')}>📋 Requests</button>
          {isSignedIn && <button className="nav-pill" onClick={() => router.push('/my-orders')}>📦 My Orders</button>}
          <button className="nav-pill green" onClick={() => router.push('/contact')}>📍 Contact</button>
        </div>

        {/* Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...Array(3)].map((_, j) =>
              ['🔍 Buy second-hand books near you', '🎒 School kits Class 1–10', '💸 Save up to 60%', '📍 Chandigarh · Mohali · Panchkula', '✅ 100% free · No commission', '📦 Kit delivery available', '💬 WhatsApp direct contact', '📗 NCERT books available'].map((t, i) => (
                <span key={j + '-' + i} className="ticker-item">{t}</span>
              ))
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            HALF + HALF HERO
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: 'calc(100vh - 90px)', maxHeight: '900px' }}>

          {/* LEFT — Marketplace */}
          <div style={{ background: 'linear-gradient(160deg, #1B2A4A 0%, #0F6E56 100%)', padding: 'clamp(36px,6vw,64px) clamp(20px,5vw,60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* BG blobs */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '99px', padding: '4px 14px', marginBottom: '16px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '700' }}>Second-hand marketplace</span>
              </div>

              <h1 className="k fu fu1" style={{ fontSize: 'clamp(28px,5vw,46px)', color: '#fff', lineHeight: 1.15, marginBottom: '12px' }}>
                Buy books cheap.<br />Sell the ones you're done with.
              </h1>
              <p className="fu fu2" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: '24px', maxWidth: '420px' }}>
                Browse hundreds of listings from students nearby. Save up to 60% on NCERT, JEE prep, novels, stationery and more. 100% free, no commission.
              </p>

              {/* Search */}
              <form className="fu fu3" onSubmit={handleSearch} style={{ marginBottom: '20px', maxWidth: '420px' }}>
                <div className="search-bar">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search NCERT, JEE books, novels…" />
                  <button type="submit">Search →</button>
                </div>
              </form>

              <div className="fu fu3" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => router.push('/marketplace')}
                  style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 16px rgba(29,158,117,0.4)' }}>
                  Browse listings →
                </button>
                {isSignedIn
                  ? <button onClick={() => router.push('/sell')} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', backdropFilter: 'blur(8px)' }}>
                      + Sell your books
                    </button>
                  : <SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', backdropFilter: 'blur(8px)' }}>+ Sell your books</button></SignInButton>
                }
              </div>

              {/* Stats row */}
              <div className="fu fu4" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '28px' }}>
                {[{ n: '500+', l: 'listings' }, { n: '₹250', l: 'avg saving' }, { n: 'Free', l: 'always' }].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div className="k" style={{ fontSize: '20px', color: '#4ADE80', fontWeight: '700' }}>{s.n}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — School Kits */}
          <div style={{ background: 'linear-gradient(160deg, #1B2A4A 0%, #1D4ED8 100%)', padding: 'clamp(36px,6vw,64px) clamp(20px,5vw,60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', bottom: '-60px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '99px', padding: '4px 14px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px' }}>🆕</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '700' }}>Shivalik Public School</span>
              </div>

              <h1 className="k fu fu1" style={{ fontSize: 'clamp(28px,5vw,46px)', color: '#fff', lineHeight: 1.15, marginBottom: '12px' }}>
                Order your full school kit.
              </h1>
              <p className="fu fu2" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: '20px', maxWidth: '420px' }}>
                Complete book + stationery kits for Class 1–10. Every item from the official book list. Customise, pay securely, and get it delivered.
              </p>

              {/* Class grid */}
              <div className="fu fu3" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '20px', maxWidth: '380px' }}>
                {classKits.map(k => (
                  <button key={k.cls} onClick={() => router.push('/school-sets')} className="kit-chip">
                    <div className="k" style={{ fontSize: '13px', color: '#fff', marginBottom: '2px' }}>Cl. {k.cls}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>₹{k.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>

              <div className="fu fu4" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => router.push('/school-sets')}
                  style={{ background: '#fff', color: '#1D4ED8', border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 16px rgba(255,255,255,0.2)' }}>
                  Order kit now →
                </button>
                <button onClick={() => router.push('/my-orders')}
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', backdropFilter: 'blur(8px)' }}>
                  📦 Track order
                </button>
              </div>

              {/* Kit trust badges */}
              <div className="fu fu5" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
                {['✅ Official book list', '💳 Pay 30% upfront', '🚚 Home delivery'].map(b => (
                  <span key={b} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.15)' }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════════════════════════════════════ */}
        <section ref={howRef} style={{ padding: 'clamp(48px,6vw,80px) 20px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className={'reveal' + (howInView ? ' in' : '')} style={{ display: 'inline-block', fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '8px' }}>How it works</div>
            <h2 className={'k reveal' + (howInView ? ' in' : '') + ' r2'} style={{ fontSize: 'clamp(24px,4vw,34px)', color: 'var(--text)', lineHeight: 1.2 }}>Simple for buyers. Simple for sellers.</h2>
          </div>

          {/* Two-column how it works */}
          <div className="split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>

            {/* Buyers */}
            <div className={'reveal' + (howInView ? ' in' : '') + ' r2'}
              style={{ background: 'linear-gradient(160deg, #EFF6FF, #E8F7F2)', border: '1.5px solid #BFDBFE', borderRadius: '20px', padding: '28px 24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🛒</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E3A8A' }}>For Buyers</div>
                  <div style={{ fontSize: '12px', color: '#3B82F6' }}>Find books. Save money.</div>
                </div>
              </div>
              {[
                { n: '1', icon: '🔍', title: 'Search near you', desc: 'Browse listings from students in your area. Filter by category, condition or price.', color: '#3B82F6' },
                { n: '2', icon: '💬', title: 'Contact on WhatsApp', desc: 'Tap WhatsApp to chat directly with the seller. No middlemen, no delays.', color: '#1D9E75' },
                { n: '3', icon: '🤝', title: 'Meet & save', desc: 'Meet locally, check the book, pay cash. Save up to 60%.', color: '#F97316' },
              ].map((s, i, arr) => (
                <div key={s.n}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="step-num" style={{ background: s.color, color: '#fff' }}>{s.n}</div>
                      {i < arr.length - 1 && <div className="step-connector" />}
                    </div>
                    <div style={{ paddingBottom: i < arr.length - 1 ? '16px' : '0', paddingTop: '4px' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: s.color, marginBottom: '4px' }}>{s.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => router.push('/marketplace')}
                style={{ marginTop: '20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%' }}>
                Find books near you →
              </button>
            </div>

            {/* Sellers */}
            <div className={'reveal' + (howInView ? ' in' : '') + ' r3'}
              style={{ background: 'linear-gradient(160deg, #F5F3FF, #FDF2F8)', border: '1.5px solid #DDD6FE', borderRadius: '20px', padding: '28px 24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📚</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#4C1D95' }}>For Sellers</div>
                  <div style={{ fontSize: '12px', color: '#8B5CF6' }}>Earn cash. 100% free.</div>
                </div>
              </div>
              {[
                { n: '1', icon: '📸', title: 'Post your listing', desc: 'Add photos and set a price in under 2 minutes. Completely free, no fees.', color: '#8B5CF6' },
                { n: '2', icon: '💬', title: 'Buyers contact you', desc: 'Interested buyers reach you on WhatsApp directly. No app needed.', color: '#1D9E75' },
                { n: '3', icon: '💰', title: 'Meet & collect cash', desc: 'Meet locally, hand over the book, collect the cash. Done.', color: '#F59E0B' },
              ].map((s, i, arr) => (
                <div key={s.n}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="step-num" style={{ background: s.color, color: '#fff' }}>{s.n}</div>
                      {i < arr.length - 1 && <div className="step-connector" />}
                    </div>
                    <div style={{ paddingBottom: i < arr.length - 1 ? '16px' : '0', paddingTop: '4px' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: s.color, marginBottom: '4px' }}>{s.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
              {isSignedIn
                ? <button onClick={() => router.push('/sell')} style={{ marginTop: '20px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%' }}>Post a listing →</button>
                : <SignInButton mode="modal"><button style={{ marginTop: '20px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%' }}>Start selling →</button></SignInButton>
              }
            </div>

            {/* School Kits how it works */}
            <div className={'reveal' + (howInView ? ' in' : '') + ' r4'}
              style={{ background: 'linear-gradient(160deg, #1B2A4A 0%, #1D4ED8 100%)', border: 'none', borderRadius: '20px', padding: '28px 24px', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎒</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>School Kits</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Shivalik Public School · Class 1–10</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[
                  { n: '1', emoji: '🏫', title: 'Pick your class', desc: 'Select Class 1–10 from the official Shivalik book list.' },
                  { n: '2', emoji: '✅', title: 'Customise', desc: 'Uncheck items you already have. Price updates live.' },
                  { n: '3', emoji: '📦', title: 'Pay & receive', desc: 'Secure Razorpay payment. Pickup or home delivery.' },
                ].map(s => (
                  <div key={s.n} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px 12px', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.emoji}</div>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', margin: '0 auto 8px' }}>{s.n}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{s.title}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/school-sets')}
                style={{ marginTop: '20px', background: '#fff', color: '#1D4ED8', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%' }}>
                Order your class kit →
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            REVIEWS
        ═══════════════════════════════════════════════════════════════════ */}
        <section ref={testRef} style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: 'clamp(48px,6vw,72px) 20px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div className={'reveal' + (testInView ? ' in' : '')} style={{ display: 'inline-block', fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#F97316', marginBottom: '8px' }}>Student reviews</div>
              <h2 className={'k reveal' + (testInView ? ' in' : '') + ' r2'} style={{ fontSize: 'clamp(22px,4vw,32px)', color: 'var(--text)', lineHeight: 1.2, marginBottom: '8px' }}>Real students. Real savings.</h2>
              <p className={'reveal' + (testInView ? ' in' : '') + ' r3'} style={{ fontSize: '14px', color: 'var(--text-3)' }}>From Chandigarh, Mohali and Panchkula</p>
            </div>

            <div className="test-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {testimonials.map((t, i) => (
                <div key={t.name} className={'test-card reveal' + (testInView ? ' in' : '') + ' r' + ((i % 6) + 1)} style={{ borderLeft: '4px solid ' + t.color }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
                    {[...Array(t.stars)].map((_, j) => <span key={j} style={{ color: '#F59E0B', fontSize: '13px' }}>★</span>)}
                  </div>
                  {/* Quote */}
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '14px', fontStyle: 'italic' }}>"{t.text}"</p>
                  {/* Author */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div className="k" style={{ width: '36px', height: '36px', borderRadius: '50%', background: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', flexShrink: 0, border: '2px solid ' + t.border }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.role}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: '700', color: t.color, background: t.bg, padding: '3px 10px', borderRadius: '99px', border: '1px solid ' + t.border, whiteSpace: 'nowrap' }}>
                      {i < 2 ? '📚 Marketplace' : i < 4 ? '🎒 School Kit' : i === 4 ? '🎒 School Kit' : '📚 Marketplace'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Aggregate rating */}
            <div className={'reveal' + (testInView ? ' in' : '') + ' r5'} style={{ marginTop: '32px', background: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)', border: '1.5px solid #FDE68A', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="k" style={{ fontSize: '36px', color: '#F59E0B', fontWeight: '700' }}>5.0</div>
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginBottom: '2px' }}>
                  {[...Array(5)].map((_, j) => <span key={j} style={{ color: '#F59E0B', fontSize: '14px' }}>★</span>)}
                </div>
                <div style={{ fontSize: '11px', color: '#92400E' }}>Average rating</div>
              </div>
              <div style={{ width: '1px', height: '50px', background: '#FDE68A' }} />
              <div style={{ textAlign: 'center' }}>
                <div className="k" style={{ fontSize: '36px', color: '#F59E0B', fontWeight: '700' }}>6</div>
                <div style={{ fontSize: '11px', color: '#92400E' }}>Reviews</div>
              </div>
              <div style={{ width: '1px', height: '50px', background: '#FDE68A' }} />
              <div style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.6, maxWidth: '260px' }}>
                Students in Chandigarh, Mohali and Panchkula are saving money every day on BuddyBooks.
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════════════════════════════ */}
        <section ref={faqRef} style={{ padding: 'clamp(48px,6vw,72px) 20px', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className={'reveal' + (faqInView ? ' in' : '')} style={{ display: 'inline-block', fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '8px' }}>FAQ</div>
            <h2 className={'k reveal' + (faqInView ? ' in' : '') + ' r2'} style={{ fontSize: 'clamp(22px,4vw,30px)', color: 'var(--text)', lineHeight: 1.2 }}>Common questions</h2>
          </div>
          <div className={'reveal' + (faqInView ? ' in' : '') + ' r3'} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0 20px', boxShadow: 'var(--shadow)' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--green)', fontSize: '20px', fontWeight: '300', transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, paddingBottom: '17px' }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 20px', background: 'var(--white)' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <img src="/logo.png" alt="BuddyBooks" style={{ height: '24px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="k" style={{ fontSize: '16px', color: 'var(--text)' }}>BuddyBooks</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Student marketplace · Chandigarh · Free</span>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              {[['Browse', '/marketplace'], ['School Sets', '/school-sets'], ['Sell', '/sell'], ['Requests', '/requests'], ['My Orders', '/my-orders'], ['Contact', '/contact']].map(([l, h]) => (
                <span key={l} onClick={() => router.push(h)} style={{ fontSize: '12px', color: 'var(--text-3)', cursor: 'pointer' }}
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