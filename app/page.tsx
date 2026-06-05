'use client'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'

const classKits = [
  { cls: 1, price: 2035 }, { cls: 2, price: 1810 }, { cls: 3, price: 4166 },
  { cls: 4, price: 4397 }, { cls: 5, price: 4640 }, { cls: 6, price: 4686 },
  { cls: 7, price: 5020 }, { cls: 8, price: 4801 }, { cls: 9, price: 4837 },
  { cls: 10, price: 3918 },
]

const cats = [
  { emoji: '📗', name: 'Textbooks', c: '#2D7FF9', bg: '#E3F0FF' },
  { emoji: '📘', name: 'Novels', c: '#7C5CFC', bg: '#EFEAFF' },
  { emoji: '📓', name: 'Notebooks', c: '#E0A800', bg: '#FFF6DD' },
  { emoji: '🎨', name: 'Art', c: '#FF3D81', bg: '#FFE5EF' },
  { emoji: '✏️', name: 'Stationery', c: '#00B86B', bg: '#DFFFEF' },
  { emoji: '📙', name: 'JEE/NEET', c: '#FF6B2C', bg: '#FFEDE2' },
]

const testimonials = [
  { name: 'Priya S.', role: 'Class 12 · DPS', text: 'Sold all my Class 11 books in 2 days! Got ₹800 back 🤑', avatar: 'P', c: '#FF3D81', tag: '📚 Sold' },
  { name: 'Arjun M.', role: 'B.Tech · Mohali', text: 'NCERT Physics for ₹180 instead of ₹320. Met same day!', avatar: 'A', c: '#2D7FF9', tag: '🛒 Bought' },
  { name: 'Sneha K.', role: 'JEE · Panchkula', text: 'All my Arihant books at half price. Saved ₹1,200! 🎉', avatar: 'S', c: '#7C5CFC', tag: '🛒 Bought' },
  { name: 'Rahul T.', role: 'Parent · Sec 22', text: 'Class 10 kit arrived perfectly packed in 2 days!', avatar: 'R', c: '#FF6B2C', tag: '🎒 Kit' },
  { name: 'Divya N.', role: 'Class 8 · Shivalik', text: 'Every single book on the list. No market trips! 🙌', avatar: 'D', c: '#00B86B', tag: '🎒 Kit' },
  { name: 'Karan B.', role: 'Commerce · Chd', text: 'Listed 6 books, got WhatsApp messages in an hour ⚡', avatar: 'K', c: '#E0A800', tag: '📚 Sold' },
]

const faqs = [
  { q: 'Is BuddyBooks free?', a: 'Yes! 100% free. Listing, browsing, and contacting sellers costs nothing. We never take commission.' },
  { q: 'How do school kits work?', a: 'Pick your class, customise which books you need, pay via Razorpay, and choose pickup from Sector-40C or home delivery (+₹99).' },
  { q: 'How do I contact a seller?', a: 'Every listing has a WhatsApp button. One tap opens a chat directly with the seller.' },
  { q: 'Can I pay 30% now for a kit?', a: 'Yes! Pay just 30% upfront to confirm. The rest is due at pickup or delivery.' },
  { q: 'What areas do you cover?', a: 'Chandigarh, Mohali, Panchkula and tricity for listings. Kits deliver anywhere.' },
]

function useInView(threshold = 0.08) {
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
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { ref: catRef, inView: catIn } = useInView()
  const { ref: howRef, inView: howIn } = useInView()
  const { ref: testRef, inView: testIn } = useInView()
  const { ref: faqRef, inView: faqIn } = useInView()
  const { ref: parentRef, inView: parentIn } = useInView()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(search.trim() ? '/marketplace?q=' + encodeURIComponent(search.trim()) : '/marketplace')
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FFF9F0; --white: #fff; --card: #fff; --subtle: #FFF3E0;
      --border: #FFE2C2; --border-strong: #FFCB94;
      --text: #1A1330; --text-2: #6B6280; --text-3: #A89FC0;
      --green: #00B86B; --green-dark: #009957;
      --shadow: 0 2px 14px rgba(124,92,252,0.08); --shadow-lg: 0 12px 40px rgba(124,92,252,0.16);
      --r: 18px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #14101F; --white: #1C1730; --card: #221C3A; --subtle: #2A2342;
        --border: #352C52; --border-strong: #463A6B;
        --text: #F3EEFF; --text-2: #B0A8CC; --text-3: #6E6590;
        --shadow: 0 2px 14px rgba(0,0,0,0.4); --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
      }
    }
    body { background: var(--bg); font-family: 'Poppins', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
    h1,h2,h3 { font-family: 'Poppins', sans-serif; letter-spacing: -0.02em; }
    .nav { background: var(--white); border-bottom: 2px solid var(--border); padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: var(--shadow); }
    .logo-txt { font-size: 21px; font-weight: 800; background: linear-gradient(135deg,#FF6B2C,#FF3D81); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.03em; }
    .btn-pop { display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: linear-gradient(135deg,#00B86B,#2D7FF9); color: #fff; border: none; border-radius: 14px; padding: 11px 22px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif; white-space: nowrap; box-shadow: 0 4px 0 #009957, 0 8px 20px rgba(0,184,107,0.3); transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; }
    .btn-pop:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #009957, 0 12px 28px rgba(0,184,107,0.4); }
    .btn-pop:active { transform: translateY(2px); box-shadow: 0 1px 0 #009957; }
    .btn-ghost { display: inline-flex; align-items: center; gap: 5px; background: transparent; color: var(--text-2); border: none; border-radius: 12px; padding: 9px 14px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; transition: all 0.15s; }
    .btn-ghost:hover { background: var(--subtle); color: var(--text); transform: translateY(-1px); }
    .btn-kits { display: inline-flex; align-items: center; gap: 5px; background: linear-gradient(135deg,#FFC83D,#FF6B2C); color: #fff; border: none; border-radius: 12px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif; white-space: nowrap; box-shadow: 0 3px 0 #E0851F; transition: all 0.12s cubic-bezier(0.34,1.56,0.64,1); }
    .btn-kits:hover { transform: translateY(-2px); box-shadow: 0 5px 0 #E0851F; }
    @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .floaty { animation: floaty 4s ease-in-out infinite; }
    @keyframes wiggle { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
    .wiggle { animation: wiggle 2.5s ease-in-out infinite; display: inline-block; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
    .su { animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) both; }
    /* reveal: visible by default, animates IN when .in is added — never leaves blank space */
    .reveal { opacity: 1; transform: none; }
    .reveal.anim { opacity: 0; transform: translateY(28px); transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1); }
    .reveal.anim.in { opacity: 1; transform: none; }
    .d1{transition-delay:.05s}.d2{transition-delay:.12s}.d3{transition-delay:.19s}.d4{transition-delay:.26s}.d5{transition-delay:.33s}.d6{transition-delay:.4s}
    @keyframes gradientMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    .grad-animate { background-size: 300% 300%; animation: gradientMove 12s ease infinite; }
    @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .ticker-wrap { overflow: hidden; background: linear-gradient(90deg,#FF6B2C,#FF3D81,#7C5CFC,#2D7FF9,#00B86B,#FF6B2C); background-size: 300% 100%; animation: gradientMove 8s ease infinite; padding: 9px 0; }
    .ticker-track { display: flex; animation: ticker 28s linear infinite; width: max-content; }
    .ticker-item { white-space: nowrap; padding: 0 22px; font-size: 12px; color: #fff; font-weight: 600; }
    .pop-card { background: var(--card); border: 2px solid var(--border); border-radius: var(--r); transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s, border-color 0.18s; cursor: pointer; }
    .pop-card:hover { transform: translateY(-6px) rotate(-0.5deg); box-shadow: var(--shadow-lg); border-color: #7C5CFC; }
    .cat-tile { border-radius: 18px; padding: 18px 10px; text-align: center; cursor: pointer; border: 2px solid transparent; transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s; }
    .cat-tile:hover { transform: translateY(-5px) scale(1.03); box-shadow: 0 10px 24px rgba(0,0,0,0.12); }
    .kit-chip { border-radius: 14px; padding: 11px 6px; text-align: center; cursor: pointer; border: 2px solid var(--border); background: var(--white); transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1); }
    .kit-chip:hover { transform: translateY(-3px) scale(1.04); border-color: #FF6B2C; box-shadow: 0 6px 16px rgba(255,107,44,0.2); }
    .path-card { border-radius: 24px; padding: 28px 26px; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s; color: #fff; min-height: 200px; display: flex; flex-direction: column; justify-content: space-between; }
    .path-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
    .search-bar { display: flex; width: 100%; background: var(--white); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
    .search-bar input { flex: 1; border: none; background: transparent; padding: 16px 20px; font-size: 15px; color: var(--text); font-family: 'Poppins', sans-serif; outline: none; min-width: 0; font-weight: 500; }
    .search-bar input::placeholder { color: var(--text-3); font-weight: 400; }
    .search-bar button { background: linear-gradient(135deg,#00B86B,#009957); color: #fff; border: none; padding: 0 24px; font-size: 14px; cursor: pointer; font-weight: 700; font-family: 'Poppins', sans-serif; white-space: nowrap; flex-shrink: 0; }
    .faq-btn { width: 100%; text-align: left; background: none; border: none; padding: 18px 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 600; color: var(--text); font-family: 'Poppins', sans-serif; gap: 12px; }
    @media (max-width: 639px) { .nav-links { display: none !important; } .nav2 { display: flex !important; } }
    @media (min-width: 640px) {
      .nav-mob { display: none !important; }
      .paths { grid-template-columns: 1fr 1fr !important; }
      .cat-grid { grid-template-columns: repeat(6,1fr) !important; }
      .test-grid { grid-template-columns: repeat(3,1fr) !important; }
      .how-grid { grid-template-columns: repeat(3,1fr) !important; }
      .parent-grid { grid-template-columns: repeat(3,1fr) !important; }
    }
    .nav2 { display: none; background: var(--white); border-bottom: 2px solid var(--border); padding: 8px 12px; gap: 8px; overflow-x: auto; scrollbar-width: none; position: sticky; top: 60px; z-index: 99; }
    .nav2::-webkit-scrollbar { display: none; }
    .pill { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 99px; border: 2px solid var(--border); background: var(--white); color: var(--text-2); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; font-family: 'Poppins', sans-serif; transition: all 0.15s; }
    .pill:active { transform: scale(0.95); }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
  `

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav className="nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '32px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="logo-txt">BuddyBooks</span>
          </div>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn-ghost" onClick={() => router.push('/marketplace')}>🛒 Browse</button>
            <button className="btn-kits" onClick={() => router.push('/school-sets')}>🎒 School Sets</button>
            <button className="btn-ghost" onClick={() => router.push('/requests')}>📋 Requests</button>
            {isSignedIn
              ? <button className="btn-pop" onClick={() => router.push('/sell')}>+ Sell</button>
              : <SignInButton mode="modal"><button className="btn-pop">Get started</button></SignInButton>}
          </div>
          <div className="nav-mob" style={{ display: 'flex', alignItems: 'center' }}>
            {isSignedIn
              ? <button className="btn-pop" style={{ padding: '9px 16px', fontSize: '13px' }} onClick={() => router.push('/sell')}>+ Sell</button>
              : <SignInButton mode="modal"><button className="btn-pop" style={{ padding: '9px 16px', fontSize: '13px' }}>Get started</button></SignInButton>}
          </div>
        </nav>

        <div className="nav2">
          <button className="pill" onClick={() => router.push('/marketplace')}>🛒 Browse</button>
          <button className="pill" style={{ background: 'linear-gradient(135deg,#FFF6DD,#FFEDE2)', color: '#FF6B2C', borderColor: '#FFCB94' }} onClick={() => router.push('/school-sets')}>🎒 School Sets</button>
          <button className="pill" onClick={() => router.push('/requests')}>📋 Requests</button>
          {isSignedIn && <button className="pill" onClick={() => router.push('/my-orders')}>📦 My Orders</button>}
          <button className="pill" style={{ background: '#DFFFEF', color: '#00B86B', borderColor: '#9DEAC4' }} onClick={() => router.push('/contact')}>📍 Contact</button>
        </div>

        {/* Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...Array(3)].map((_, j) =>
              ['🔥 Save up to 60% on books', '🎒 School kits Class 1–10', '⚡ Same-day pickup', '📍 Chandigarh · Mohali · Panchkula', '✅ 100% free · No commission', '🚚 Home delivery available', '💬 Direct WhatsApp contact', '🤑 Avg saving ₹250'].map((t, i) => (
                <span key={j + '-' + i} className="ticker-item">{t}</span>
              )))}
          </div>
        </div>

        {/* ─── SINGLE BOLD HERO ─── */}
        <section style={{ padding: 'clamp(40px,7vw,80px) 20px clamp(32px,5vw,56px)', maxWidth: '820px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div className="floaty" style={{ position: 'absolute', top: '8%', left: '6%', fontSize: '40px', opacity: 0.5 }}>📚</div>
          <div className="floaty" style={{ position: 'absolute', top: '14%', right: '8%', fontSize: '34px', opacity: 0.5, animationDelay: '1s' }}>✏️</div>
          <div className="floaty" style={{ position: 'absolute', bottom: '6%', right: '14%', fontSize: '30px', opacity: 0.4, animationDelay: '1.6s' }}>🎒</div>

          <div className="su" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--white)', border: '2px solid var(--border)', borderRadius: '99px', padding: '6px 16px', marginBottom: '20px', boxShadow: 'var(--shadow)' }}>
            <span className="wiggle">⚡</span>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '700' }}>Chandigarh's student book platform</span>
          </div>

          <h1 className="su d1" style={{ fontSize: 'clamp(32px,6.5vw,58px)', fontWeight: '800', lineHeight: 1.05, marginBottom: '18px' }}>
            Books for students,<br />
            <span style={{ background: 'linear-gradient(135deg,#FF6B2C,#FF3D81)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>made ridiculously easy.</span> 🚀
          </h1>

          <p className="su d2" style={{ fontSize: 'clamp(15px,2.5vw,18px)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '28px', maxWidth: '560px', margin: '0 auto 28px', fontWeight: '500' }}>
            Buy & sell second-hand books with students nearby, or order a ready-made school kit delivered to your door. 100% free.
          </p>

          <form className="su d3" onSubmit={handleSearch} style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div className="search-bar">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search NCERT, JEE books, novels…" />
              <button type="submit">Search 🔍</button>
            </div>
          </form>

          <div className="su d4" style={{ display: 'flex', gap: '18px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            {[{ n: '500+', l: 'listings' }, { n: '₹250', l: 'avg saving' }, { n: '10', l: 'kit classes' }, { n: 'Free', l: 'always' }].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#FF6B2C' }}>{s.n}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── TWO PATH CARDS ─── */}
        <section style={{ padding: '0 20px clamp(40px,5vw,64px)', maxWidth: '900px', margin: '0 auto' }}>
          <div className="paths" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>

            {/* Marketplace path */}
            <div className="path-card su d2 grad-animate" onClick={() => router.push('/marketplace')}
              style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)' }}>
              <div className="floaty" style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '90px', opacity: 0.18 }}>🛒</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', opacity: 0.9, marginBottom: '6px' }}>SECOND-HAND MARKETPLACE</div>
                <h2 style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: '800', lineHeight: 1.15, marginBottom: '8px' }}>Buy & sell books 📚</h2>
                <p style={{ fontSize: '14px', opacity: 0.92, lineHeight: 1.55, maxWidth: '320px' }}>Save up to 60% on textbooks, novels & prep books from students near you.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                <span style={{ background: '#fff', color: '#00B86B', borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '800' }}>Browse now →</span>
                {isSignedIn
                  ? <span onClick={e => { e.stopPropagation(); router.push('/sell') }} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '700', backdropFilter: 'blur(6px)' }}>+ Sell yours</span>
                  : <SignInButton mode="modal"><span onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '700', backdropFilter: 'blur(6px)' }}>+ Sell yours</span></SignInButton>}
              </div>
            </div>

            {/* Kits path */}
            <div className="path-card su d3 grad-animate" onClick={() => router.push('/school-sets')}
              style={{ background: 'linear-gradient(135deg,#FF6B2C,#FFC83D)' }}>
              <div className="floaty" style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '90px', opacity: 0.18, animationDelay: '0.8s' }}>🎒</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', opacity: 0.9, marginBottom: '6px' }}>🆕 SHIVALIK PUBLIC SCHOOL</div>
                <h2 style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: '800', lineHeight: 1.15, marginBottom: '8px' }}>Order a school kit 🎒</h2>
                <p style={{ fontSize: '14px', opacity: 0.95, lineHeight: 1.55, maxWidth: '320px' }}>Complete book + stationery kits for Class 1–10. Customise, pay 30%, delivered.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                <span style={{ background: '#fff', color: '#FF6B2C', borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '800' }}>Order now →</span>
                <span onClick={e => { e.stopPropagation(); router.push('/my-orders') }} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: '700', backdropFilter: 'blur(6px)' }}>📦 Track order</span>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section ref={catRef} style={{ padding: 'clamp(36px,5vw,56px) 20px', maxWidth: '1000px', margin: '0 auto' }}>
          <h2 className={'reveal anim' + (catIn ? ' in' : '')} style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: '800', textAlign: 'center', marginBottom: '4px' }}>What are you looking for? 👀</h2>
          <p className={'reveal anim d1' + (catIn ? ' in' : '')} style={{ fontSize: '14px', color: 'var(--text-3)', textAlign: 'center', marginBottom: '28px', fontWeight: '500' }}>Tap a category to explore</p>
          <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {cats.map((c, i) => (
              <div key={c.name} onClick={() => router.push('/marketplace')}
                className={'cat-tile reveal anim d' + ((i % 6) + 1) + (catIn ? ' in' : '')}
                style={{ background: c.bg, border: '2px solid ' + c.c + '33' }}>
                <div className="floaty" style={{ fontSize: '34px', marginBottom: '8px', animationDelay: i * 0.2 + 's' }}>{c.emoji}</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: c.c }}>{c.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PARENT SECTION */}
        <section ref={parentRef} style={{ background: 'var(--white)', borderTop: '2px solid var(--border)', borderBottom: '2px solid var(--border)', padding: 'clamp(44px,6vw,72px) 20px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg,#FFF6DD,#FFEDE2)', color: '#FF6B2C', fontSize: '11px', fontWeight: '800', padding: '6px 16px', borderRadius: '99px', marginBottom: '14px', border: '2px solid #FFCB94', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                🏫 For Parents · Shivalik Public School
              </div>
              <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: '800', lineHeight: 1.15, marginBottom: '12px' }}>
                Child's books sorted in<br />3 minutes. From home! 🏠
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.65, maxWidth: '520px', margin: '0 auto', fontWeight: '500' }}>
                No more market hunting. Every book on the official Shivalik list, assembled & delivered — or ready for pickup at Sector-40C.
              </p>
            </div>
            <div className="parent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '36px' }}>
              {[
                { icon: '📋', c: '#2D7FF9', bg: '#E3F0FF', t: 'Official book list', b: 'Sourced directly from the school list, Class 1–10. Nothing missing.' },
                { icon: '✏️', c: '#00B86B', bg: '#DFFFEF', t: 'Customise first', b: 'Already have books? Uncheck them. Price updates live.' },
                { icon: '🚚', c: '#7C5CFC', bg: '#EFEAFF', t: 'Pickup or delivery', b: 'Collect from Sector-40C or get it home for ₹99.' },
                { icon: '💳', c: '#FF6B2C', bg: '#FFEDE2', t: 'Pay just 30%', b: 'Confirm with 30% upfront. Rest at delivery.' },
                { icon: '🔒', c: '#FF3D81', bg: '#FFE5EF', t: 'Secure payment', b: 'All payments via Razorpay. Completely safe.' },
                { icon: '📦', c: '#E0A800', bg: '#FFF6DD', t: 'Track live', b: 'Confirmed → Assembling → Ready → Delivered.' },
              ].map((c, i) => (
                <div key={c.t} className="pop-card" style={{ background: c.bg, border: '2px solid ' + c.c + '33', padding: 'clamp(14px,3vw,20px)' }}>
                  <div className="floaty" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '10px', animationDelay: i * 0.15 + 's' }}>{c.icon}</div>
                  <div style={{ fontSize: 'clamp(13px,2.5vw,15px)', fontWeight: '800', color: c.c, marginBottom: '5px' }}>{c.t}</div>
                  <div style={{ fontSize: 'clamp(11px,2vw,13px)', color: 'var(--text-2)', lineHeight: 1.55, fontWeight: '500' }}>{c.b}</div>
                </div>
              ))}
            </div>
            <div className="grad-animate" style={{ background: 'linear-gradient(135deg,#1A1330,#FF6B2C,#FFC83D)', backgroundSize: '300% 300%', borderRadius: '24px', padding: 'clamp(24px,4vw,36px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '28px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Our store</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>Bedi Book Store</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, fontWeight: '500' }}>
                  📍 Booth 48, Sector-40C, Chandigarh<br />🕐 Mon–Sat · 9am–7pm
                </div>
                <a href="https://wa.me/918872235738?text=Hi%2C+I+want+to+order+a+school+kit" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '14px', background: '#25D366', color: '#fff', borderRadius: '12px', padding: '11px 20px', fontSize: '13px', fontWeight: '800', textDecoration: 'none', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #1da851' }}>
                  💬 Chat on WhatsApp
                </a>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Kit prices</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px', marginBottom: '14px' }}>
                  {classKits.map(k => (
                    <button key={k.cls} onClick={() => router.push('/school-sets')} style={{ borderRadius: '12px', padding: '10px 4px', textAlign: 'center', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', fontFamily: 'Poppins, sans-serif' }}>
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: '800' }}>Cl.{k.cls}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>₹{k.price.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => router.push('/school-sets')} style={{ width: '100%', background: '#fff', color: '#FF6B2C', border: 'none', borderRadius: '14px', padding: '13px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 rgba(0,0,0,0.12)' }}>
                  Order your kit now →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section ref={howRef} style={{ padding: 'clamp(44px,6vw,72px) 20px', maxWidth: '1000px', margin: '0 auto' }}>
          <h2 className={'reveal anim' + (howIn ? ' in' : '')} style={{ fontSize: 'clamp(24px,4vw,32px)', fontWeight: '800', textAlign: 'center', marginBottom: '4px' }}>How it works ⚡</h2>
          <p className={'reveal anim d1' + (howIn ? ' in' : '')} style={{ fontSize: '14px', color: 'var(--text-3)', textAlign: 'center', marginBottom: '32px', fontWeight: '500' }}>Three taps to save money</p>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {[
              { n: '1', icon: '🔍', t: 'Search near you', b: 'Browse listings from students in your area. Filter by category & price.', c: '#2D7FF9', bg: '#E3F0FF' },
              { n: '2', icon: '💬', t: 'Tap WhatsApp', b: 'Chat directly with the seller. No middlemen, no delays.', c: '#00B86B', bg: '#DFFFEF' },
              { n: '3', icon: '🤝', t: 'Meet & save', b: 'Meet locally, check the book, pay cash. Save up to 60%!', c: '#FF6B2C', bg: '#FFEDE2' },
            ].map((s, i) => (
              <div key={s.n} className="pop-card" style={{ background: s.bg, border: '2px solid ' + s.c + '33', padding: '26px 22px', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '14px', right: '18px', fontSize: '40px', fontWeight: '900', color: s.c + '22' }}>{s.n}</div>
                <div className="floaty" style={{ fontSize: '44px', marginBottom: '12px', animationDelay: i * 0.2 + 's' }}>{s.icon}</div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: s.c, marginBottom: '8px' }}>{s.t}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: '500' }}>{s.b}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
            <button className="btn-pop" onClick={() => router.push('/marketplace')}>🛒 Browse books</button>
            {isSignedIn
              ? <button className="btn-kits" style={{ padding: '13px 24px', fontSize: '15px' }} onClick={() => router.push('/sell')}>📚 Sell yours</button>
              : <SignInButton mode="modal"><button className="btn-kits" style={{ padding: '13px 24px', fontSize: '15px' }}>📚 Start selling</button></SignInButton>}
          </div>
        </section>

        {/* REVIEWS */}
        <section ref={testRef} style={{ background: 'var(--white)', borderTop: '2px solid var(--border)', borderBottom: '2px solid var(--border)', padding: 'clamp(44px,6vw,72px) 20px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 className={'reveal anim' + (testIn ? ' in' : '')} style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: '800', textAlign: 'center', marginBottom: '4px' }}>Students love it 💛</h2>
            <p className={'reveal anim d1' + (testIn ? ' in' : '')} style={{ fontSize: '14px', color: 'var(--text-3)', textAlign: 'center', marginBottom: '32px', fontWeight: '500' }}>Real reviews from Chandigarh tricity</p>
            <div className="test-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {testimonials.map((t, i) => (
                <div key={t.name} className="pop-card" style={{ padding: '20px', borderTop: '4px solid ' + t.c }}>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>{[...Array(5)].map((_, j) => <span key={j} style={{ color: '#FFC83D', fontSize: '14px' }}>★</span>)}</div>
                  <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '14px', fontWeight: '500' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: t.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 }}>{t.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text)' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '500' }}>{t.role}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: t.c, background: t.c + '18', padding: '4px 10px', borderRadius: '99px', whiteSpace: 'nowrap' }}>{t.tag}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '28px', background: 'linear-gradient(135deg,#FFF6DD,#FFEDE2)', border: '2px solid #FFCB94', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', color: '#FF6B2C', fontWeight: '900' }}>5.0</div>
                <div>{[...Array(5)].map((_, j) => <span key={j} style={{ color: '#FFC83D', fontSize: '13px' }}>★</span>)}</div>
              </div>
              <div style={{ fontSize: '14px', color: '#92400E', lineHeight: 1.6, maxWidth: '320px', fontWeight: '600' }}>
                Students across Chandigarh, Mohali & Panchkula are saving money every single day on BuddyBooks! 🎉
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section ref={faqRef} style={{ padding: 'clamp(44px,6vw,72px) 20px', maxWidth: '680px', margin: '0 auto' }}>
          <h2 className={'reveal anim' + (faqIn ? ' in' : '')} style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: '800', textAlign: 'center', marginBottom: '28px' }}>Questions? 🤔</h2>
          <div className="reveal" style={{ background: 'var(--card)', border: '2px solid var(--border)', borderRadius: '20px', padding: '0 22px', boxShadow: 'var(--shadow)' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '2px solid var(--border)' : 'none' }}>
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span style={{ color: '#FF6B2C', fontSize: '24px', fontWeight: '400', transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block', transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)', flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && <div className="su" style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, paddingBottom: '18px', fontWeight: '500' }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '2px solid var(--border)', padding: '28px 20px', background: 'var(--white)' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <img src="/logo.png" alt="BuddyBooks" style={{ height: '26px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="logo-txt" style={{ fontSize: '17px' }}>BuddyBooks</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '500' }}>Student marketplace · Chandigarh · Free 💛</span>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[['Browse', '/marketplace'], ['School Sets', '/school-sets'], ['Sell', '/sell'], ['Requests', '/requests'], ['My Orders', '/my-orders'], ['Contact', '/contact']].map(([l, h]) => (
                <span key={l} onClick={() => router.push(h)} style={{ fontSize: '12px', color: 'var(--text-3)', cursor: 'pointer', fontWeight: '600' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FF6B2C')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>{l}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}