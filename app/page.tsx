'use client'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'

const categories = [
  { name: 'Textbooks', desc: 'NCERT & reference', bg: '#E1F5EE', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/></svg> },
  { name: 'Novels', desc: 'Fiction & literature', bg: '#EFF6FF', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { name: 'Notebooks', desc: 'Ruled, plain, spiral', bg: '#FEF9C3', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#854D0E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg> },
  { name: 'Art supplies', desc: 'Colors & brushes', bg: '#FBEAF0', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#993556" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg> },
  { name: 'Stationery', desc: 'Pens, files & more', bg: '#F1EFE8', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5F5E5A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/><path d="M8 21h8"/></svg> },
  { name: 'Competitive', desc: 'JEE, NEET & exams', bg: '#FAECE7', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#993C1D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
]

const testimonials = [
  { name: 'Priya S.', role: 'Class 12, DPS Chandigarh', text: 'Sold all my Class 11 books in 2 days! Got ₹800 back. So easy to use.', avatar: 'P', color: '#E1F5EE', textColor: '#0F6E56' },
  { name: 'Arjun M.', role: 'B.Tech Student, Mohali', text: 'Found NCERT Physics for ₹180 instead of ₹320. Saved so much money!', avatar: 'A', color: '#EFF6FF', textColor: '#185FA5' },
  { name: 'Sneha K.', role: 'JEE Aspirant, Panchkula', text: 'Got all my Arihant books at half price. BookMart is a lifesaver.', avatar: 'S', color: '#FBEAF0', textColor: '#993556' },
  { name: 'Rahul T.', role: 'Class 10, Sector 22', text: 'Super easy to list. Posted photos, got WhatsApp messages in an hour!', avatar: 'R', color: '#FEF9C3', textColor: '#854D0E' },
]

const sampleListings = [
  { title: 'NCERT Physics Pt. 1', price: 180, origPrice: 320, location: 'Sector 40', emoji: '📗', condition: 'Good' },
  { title: 'Atomic Habits', price: 220, origPrice: 399, location: 'Sector 22', emoji: '📘', condition: 'New' },
  { title: 'Arihant JEE Maths', price: 280, origPrice: 450, location: 'Panchkula', emoji: '📙', condition: 'Fair' },
  { title: 'Classmate Notebook', price: 120, origPrice: 180, location: 'Sector 40-C', emoji: '📓', condition: 'New' },
]

function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect() }
    }, { threshold })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

export default function LandingPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const { ref: statsRef, inView: statsInView } = useInView()
  const { ref: howRef, inView: howInView } = useInView()
  const { ref: testimonialRef, inView: testimonialInView } = useInView()
  const { ref: categoryRef, inView: categoryInView } = useInView()

  const listings500 = useCountUp(500, 1200, statsInView)
  const savings250 = useCountUp(250, 1200, statsInView)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-img: #F5F2ED;
          --bg-section: #fff; --bg-cat: #FAFAF8; --nav-bg: #fff;
          --border: #EDE9E1; --text-primary: #1B2A4A; --text-secondary: #777;
          --text-muted: #aaa; --text-link: #888;
          --btn-outline-bg: #fff; --btn-outline-hover: #F5F2ED; --btn-outline-border-hover: #D4CFC6;
          --shadow-card: 0 2px 8px rgba(27,42,74,0.05);
          --shadow-card-hover: 0 12px 32px rgba(27,42,74,0.10);
          --shadow-nav: 0 2px 12px rgba(27,42,74,0.05);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0F1117; --bg-card: #1A1D27; --bg-img: #242736;
            --bg-section: #13151F; --bg-cat: #1A1D27; --nav-bg: #13151F;
            --border: #2A2D3E; --text-primary: #E8E6F0; --text-secondary: #8B8FA8;
            --text-muted: #555878; --text-link: #6B6F88;
            --btn-outline-bg: #1A1D27; --btn-outline-hover: #242736; --btn-outline-border-hover: #3A3D5E;
            --shadow-card: 0 2px 8px rgba(0,0,0,0.2);
            --shadow-card-hover: 0 12px 32px rgba(0,0,0,0.35);
            --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
          }
        }

        body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
        .kalam { font-family: 'Kalam', cursive; }

        /* Buttons */
        .btn-green { background: #1D9E75; color: #fff; border: none; border-radius: 14px; padding: 14px 32px; font-size: 16px; font-family: 'Kalam', cursive; font-weight: 700; cursor: pointer; box-shadow: 0 6px 20px rgba(29,158,117,0.28); transition: all 0.2s; }
        .btn-green:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 32px rgba(29,158,117,0.38); }
        .btn-outline { background: var(--btn-outline-bg); color: var(--text-primary); border: 1.5px solid var(--border); border-radius: 14px; padding: 13px 28px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .btn-outline:hover { background: var(--btn-outline-hover); border-color: var(--btn-outline-border-hover); }
        .browse-btn { background: none; border: none; cursor: pointer; font-size: 14px; color: var(--text-secondary); font-family: 'DM Sans', sans-serif; font-weight: 500; padding: 8px 12px; border-radius: 8px; transition: all 0.15s; }
        .browse-btn:hover { background: var(--btn-outline-hover) !important; }

        /* Cards */
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px) scale(1.01); box-shadow: var(--shadow-card-hover) !important; }
        .step-card { transition: all 0.25s ease; background: var(--bg-card); border: 1.5px solid var(--border); }
        .step-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(27,42,74,0.12) !important; }
        .cat-item { transition: all 0.2s ease; cursor: pointer; background: var(--bg-cat); border: 1.5px solid var(--border); }
        .cat-item:hover { border-color: #1D9E75 !important; transform: translateY(-3px) scale(1.03); box-shadow: 0 8px 24px rgba(29,158,117,0.15) !important; }
        .testimonial-card { transition: all 0.2s ease; }
        .testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(27,42,74,0.12) !important; }

        /* Scroll animations */
        .scroll-fade { opacity: 0; transform: translateY(32px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .scroll-fade.visible { opacity: 1; transform: translateY(0); }
        .scroll-fade-left { opacity: 0; transform: translateX(-32px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .scroll-fade-left.visible { opacity: 1; transform: translateX(0); }
        .scroll-fade-right { opacity: 0; transform: translateX(32px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .scroll-fade-right.visible { opacity: 1; transform: translateX(0); }
        .scroll-scale { opacity: 0; transform: scale(0.92); transition: opacity 0.5s ease, transform 0.5s ease; }
        .scroll-scale.visible { opacity: 1; transform: scale(1); }

        /* Animations */
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
        .float { animation: float 4s ease-in-out infinite; }
        @keyframes float2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        .float2 { animation: float2 3s ease-in-out infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up-delay-1 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-up-delay-2 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-up-delay-3 { animation: fadeUp 0.6s 0.3s ease both; }
        @keyframes pulse-green { 0%, 100% { box-shadow: 0 0 0 0 rgba(29,158,117,0.3); } 50% { box-shadow: 0 0 0 12px rgba(29,158,117,0); } }
        .pulse { animation: pulse-green 2.5s ease-in-out infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-inner { animation: marquee 18s linear infinite; display: flex; gap: 24px; }
        .marquee-inner:hover { animation-play-state: paused; }

        /* Gradient text */
        .gradient-text { background: linear-gradient(135deg, #1D9E75, #0F6E56); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* Ticker strip */
        .ticker { background: #1D9E75; overflow: hidden; padding: 10px 0; }
        .ticker-item { white-space: nowrap; font-size: '13px'; color: #fff; font-family: 'Kalam', cursive; padding: 0 32px; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BookMart" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: '700' }}>BookMart</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="browse-btn" onClick={() => router.push('/marketplace')}>Browse listings</button>
            {isSignedIn ? (
              <button className="btn-green pulse" style={{ padding: '9px 20px', fontSize: '14px' }} onClick={() => router.push('/sell')}>+ Sell now</button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-green pulse" style={{ padding: '9px 20px', fontSize: '14px' }}>Get started</button>
              </SignInButton>
            )}
          </div>
        </nav>

        {/* Ticker strip */}
        <div className="ticker">
          <div className="marquee-inner">
            {[...Array(2)].map((_, j) => (
              ['📚 Buy books at half price', '✏️ Free to list', '💬 WhatsApp contact', '📍 Chandigarh & Mohali', '🎉 500+ listings', '📗 NCERT books available', '📙 JEE & NEET prep books', '🤝 Meet locally & exchange'].map((item, i) => (
                <span key={`${j}-${i}`} className="ticker-item" style={{ fontSize: '13px', color: '#fff', fontFamily: 'Kalam, cursive', padding: '0 32px', whiteSpace: 'nowrap' }}>
                  {item}
                </span>
              ))
            ))}
          </div>
        </div>

        {/* Hero */}
        <section style={{ padding: '80px 32px 64px', textAlign: 'center', maxWidth: '760px', margin: '0 auto', position: 'relative' }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: '20px', left: '-40px', width: '180px', height: '180px', background: 'rgba(29,158,117,0.06)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '40px', right: '-60px', width: '220px', height: '220px', background: 'rgba(27,42,74,0.05)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />

          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E1F5EE', color: '#0F6E56', fontSize: '12px', fontWeight: '600', padding: '6px 16px', borderRadius: '99px', marginBottom: '28px', letterSpacing: '0.3px', border: '1px solid rgba(29,158,117,0.2)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
            Chandigarh's student marketplace
          </div>

          <h1 className="kalam fade-up-delay-1" style={{ fontSize: 'clamp(44px, 7vw, 68px)', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '22px' }}>
            Buy & sell books<br />
            <span className="gradient-text">the smart way</span>
          </h1>

          <p className="fade-up-delay-2" style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.75 }}>
            Find second-hand textbooks, novels, notebooks and stationery from students near you — at a fraction of the price.
          </p>

          <div className="fade-up-delay-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
            <button className="btn-green" onClick={() => router.push('/marketplace')}>Browse listings →</button>
            {isSignedIn ? (
              <button className="btn-outline" onClick={() => router.push('/sell')}>Sell your books</button>
            ) : (
              <SignInButton mode="modal"><button className="btn-outline">Sell your books</button></SignInButton>
            )}
          </div>

          {/* Animated stats */}
          <div ref={statsRef} style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
            {[
              { num: `${listings500}+`, label: 'listings posted', delay: '0s' },
              { num: `₹${savings250}`, label: 'avg. savings', delay: '0.1s' },
              { num: '100%', label: 'free to use', delay: '0.2s' },
            ].map(s => (
              <div key={s.label} className={`scroll-scale${statsInView ? ' visible' : ''}`} style={{ textAlign: 'center', transitionDelay: s.delay }}>
                <div className="kalam" style={{ fontSize: '34px', color: '#1D9E75', fontWeight: '700', lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.3px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sample cards — floating */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', maxWidth: '680px', margin: '0 auto' }}>
            {sampleListings.map((l, i) => (
              <div key={i} className={`card-hover fade-up`} style={{ animationDelay: `${i * 0.1}s`, background: 'var(--bg-card)', borderRadius: '18px', border: '1.5px solid var(--border)', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}
                onClick={() => router.push('/marketplace')}>
                <div style={{ height: '100px', background: 'var(--bg-img)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', position: 'relative' }}>
                  <span className="float2" style={{ animationDelay: `${i * 0.3}s` }}>{l.emoji}</span>
                  <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', background: l.condition === 'New' ? 'rgba(220,252,231,0.95)' : 'rgba(239,246,255,0.95)', color: l.condition === 'New' ? '#166534' : '#1D4ED8', padding: '2px 7px', borderRadius: '99px', fontWeight: '600' }}>{l.condition}</span>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                    <span className="kalam" style={{ fontSize: '16px', color: '#1D9E75', fontWeight: '700' }}>₹{l.price}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>📍 {l.location}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section ref={categoryRef} style={{ padding: '64px 32px', background: 'var(--bg-section)', borderTop: '1.5px solid var(--border)', borderBottom: '1.5px solid var(--border)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className={`kalam scroll-fade${categoryInView ? ' visible' : ''}`} style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '8px' }}>Browse by category</h2>
            <p className={`scroll-fade${categoryInView ? ' visible' : ''}`} style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '36px', transitionDelay: '0.1s' }}>Find exactly what you need</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {categories.map((cat, i) => (
                <div key={cat.name} className={`cat-item scroll-scale${categoryInView ? ' visible' : ''}`}
                  onClick={() => router.push('/marketplace')}
                  style={{ borderRadius: '16px', padding: '20px 12px', textAlign: 'center', transitionDelay: `${i * 0.07}s` }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', transition: 'transform 0.2s' }}>
                    {cat.icon}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px' }}>{cat.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{cat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section ref={howRef} style={{ padding: '72px 32px', textAlign: 'center', background: 'var(--bg)' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <h2 className={`kalam scroll-fade${howInView ? ' visible' : ''}`} style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '8px' }}>How it works</h2>
            <p className={`scroll-fade${howInView ? ' visible' : ''}`} style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '48px', transitionDelay: '0.1s' }}>Three steps. No fees. No friction.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {[
                { icon: '📸', step: '01', title: 'Post a listing', desc: 'Add photos, set your price and location in under 2 minutes.' },
                { icon: '💬', step: '02', title: 'Get contacted', desc: 'Interested buyers reach you directly on WhatsApp.' },
                { icon: '🤝', step: '03', title: 'Meet & exchange', desc: 'Meet locally, hand over the item, pocket the cash.' },
              ].map((s, i) => (
                <div key={s.step} className={`step-card scroll-fade${howInView ? ' visible' : ''}`}
                  style={{ borderRadius: '24px', padding: '32px 24px', textAlign: 'center', boxShadow: 'var(--shadow-card)', transitionDelay: `${i * 0.15}s`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(29,158,117,0.04)', borderRadius: '50%' }} />
                  <div className="float2" style={{ fontSize: '40px', marginBottom: '16px', animationDelay: `${i * 0.5}s` }}>{s.icon}</div>
                  <div className="kalam" style={{ fontSize: '11px', color: '#1D9E75', marginBottom: '6px', letterSpacing: '1.5px', fontWeight: '700' }}>STEP {s.step}</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px' }}>{s.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section ref={testimonialRef} style={{ padding: '72px 32px', background: 'var(--bg-section)', borderTop: '1.5px solid var(--border)', borderBottom: '1.5px solid var(--border)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 className={`kalam scroll-fade${testimonialInView ? ' visible' : ''}`} style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>What students say</h2>
            <p className={`scroll-fade${testimonialInView ? ' visible' : ''}`} style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '40px', textAlign: 'center', transitionDelay: '0.1s' }}>Real students, real savings</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {testimonials.map((t, i) => (
                <div key={t.name} className={`testimonial-card scroll-fade${testimonialInView ? ' visible' : ''}`}
                  style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)', padding: '22px', boxShadow: 'var(--shadow-card)', transitionDelay: `${i * 0.1}s` }}>
                  <div style={{ fontSize: '24px', color: '#1D9E75', marginBottom: '12px', fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px', fontStyle: 'italic' }}>{t.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="kalam" style={{ width: '36px', height: '36px', borderRadius: '50%', background: t.color, color: t.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '72px 32px 80px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', background: '#1B2A4A', borderRadius: '32px', padding: '64px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', background: 'rgba(29,158,117,0.1)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '200px', height: '200px', background: 'rgba(29,158,117,0.07)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }} className="float">📚</div>
              <h2 className="kalam" style={{ fontSize: '36px', color: '#fff', marginBottom: '12px' }}>Ready to declutter?</h2>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)', marginBottom: '32px', lineHeight: 1.7, maxWidth: '440px', margin: '0 auto 32px' }}>Your old books are worth more than gathering dust. List them today and earn extra cash.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {isSignedIn ? (
                  <button className="btn-green" onClick={() => router.push('/sell')}>Start selling for free →</button>
                ) : (
                  <SignInButton mode="modal"><button className="btn-green">Start selling for free →</button></SignInButton>
                )}
                <button onClick={() => router.push('/marketplace')}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '13px 24px', fontSize: '15px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', transition: 'all 0.15s', backdropFilter: 'blur(8px)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
                  Browse first
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1.5px solid var(--border)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="BookMart" style={{ height: '28px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '700' }}>BookMart</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chandigarh's student marketplace · Free to use</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span onClick={() => router.push('/marketplace')} style={{ fontSize: '12px', color: 'var(--text-link)', cursor: 'pointer', textDecoration: 'underline' }}>Browse</span>
            <span onClick={() => router.push('/sell')} style={{ fontSize: '12px', color: 'var(--text-link)', cursor: 'pointer', textDecoration: 'underline' }}>Sell</span>
            <span onClick={() => router.push('/wishlist')} style={{ fontSize: '12px', color: 'var(--text-link)', cursor: 'pointer', textDecoration: 'underline' }}>Wishlist</span>
          </div>
        </footer>

      </div>
    </>
  )
}