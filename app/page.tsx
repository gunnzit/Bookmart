'use client'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'

const buyerSteps = [
  { icon: '🔍', num: '1', title: 'Search near you', desc: 'Browse hundreds of listings from students in your area. Filter by category, condition or price.', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { icon: '💬', num: '2', title: 'Contact the seller', desc: 'Tap WhatsApp to chat directly with the seller. No middlemen, no delays.', color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8' },
  { icon: '🤝', num: '3', title: 'Meet & save', desc: 'Meet locally, check the book, pay cash. Save up to 60% on every purchase.', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
]

const sellerSteps = [
  { icon: '📸', num: '1', title: 'Post your listing', desc: 'Add photos and set a price in under 2 minutes. Completely free.', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { icon: '💬', num: '2', title: 'Buyers contact you', desc: 'Interested buyers reach you directly on WhatsApp. No middlemen.', color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8' },
  { icon: '🤝', num: '3', title: 'Meet & exchange', desc: 'Meet locally, hand over the book, collect the cash.', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
]

const kitSteps = [
  { num: '1', title: 'Pick your class', desc: 'Select Class 1–10 for Shivalik Public School.', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', emoji: '🏫' },
  { num: '2', title: 'Customise your kit', desc: 'Uncheck any books or stationery you already have.', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', emoji: '✅' },
  { num: '3', title: 'Pay & receive', desc: 'Pay securely via Razorpay. Pickup or home delivery.', color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8', emoji: '📦' },
]

const categories = [
  { name: 'Textbooks', desc: 'NCERT & reference', emoji: '📗', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { name: 'Novels', desc: 'Fiction & literature', emoji: '📘', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { name: 'Notebooks', desc: 'Ruled, plain, spiral', emoji: '📓', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { name: 'Art Supplies', desc: 'Colors & brushes', emoji: '🎨', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
  { name: 'Stationery', desc: 'Pens, files & more', emoji: '✏️', color: '#06B6D4', bg: '#ECFEFF', border: '#A5F3FC' },
  { name: 'Competitive', desc: 'JEE, NEET & exams', emoji: '📙', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
]

const testimonials = [
  { name: 'Priya S.', role: 'Class 12, DPS Chandigarh', text: 'Sold all my Class 11 books in 2 days! Got ₹800 back. So easy to use.', avatar: 'P', color: '#EC4899', bg: '#FDF2F8' },
  { name: 'Arjun M.', role: 'B.Tech Student, Mohali', text: 'Found NCERT Physics for ₹180 instead of ₹320. Saved so much!', avatar: 'A', color: '#3B82F6', bg: '#EFF6FF' },
  { name: 'Sneha K.', role: 'JEE Aspirant, Panchkula', text: 'Got all my Arihant books at half price. Total lifesaver.', avatar: 'S', color: '#8B5CF6', bg: '#F5F3FF' },
  { name: 'Rahul T.', role: 'Class 10, Sector 22', text: 'Ordered the Class 10 kit — everything arrived perfectly packed!', avatar: 'R', color: '#F97316', bg: '#FFF7ED' },
]

const sampleListings = [
  { title: 'NCERT Physics Pt. 1', price: 180, origPrice: 320, location: 'Sector 40', emoji: '📗', condition: 'Good', color: '#3B82F6', bg: '#EFF6FF' },
  { title: 'Atomic Habits', price: 220, origPrice: 399, location: 'Sector 22', emoji: '📘', condition: 'New', color: '#8B5CF6', bg: '#F5F3FF' },
  { title: 'Arihant JEE Maths', price: 280, origPrice: 450, location: 'Panchkula', emoji: '📙', condition: 'Fair', color: '#F97316', bg: '#FFF7ED' },
  { title: 'Classmate Notebook', price: 120, origPrice: 180, location: 'Sector 40-C', emoji: '📓', condition: 'New', color: '#F59E0B', bg: '#FFFBEB' },
]

const faqs = [
  { q: 'Is BuddyBooks free to use?', a: 'Yes, completely free. Listing, browsing, and contacting sellers costs nothing.' },
  { q: 'How do school kits work?', a: 'Pick your class, customise which books and stationery you need, pay via Razorpay, and choose pickup from Sector-40C or home delivery (+₹99). We assemble and send your kit.' },
  { q: 'How do I contact a seller?', a: "Every listing has a WhatsApp button. One tap and you're chatting directly with the seller." },
  { q: 'Is it safe to buy here?', a: 'We recommend meeting in a public place. For kits, payment is handled securely via Razorpay.' },
  { q: 'What areas do you cover?', a: 'Chandigarh, Mohali, Panchkula and surrounding tricity areas.' },
]

const trustItems = [
  { icon: '🔒', title: 'Safe & local', desc: 'Meet in person. No prepayment needed.', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { icon: '💸', title: 'Always free', desc: 'No listing fees. No commission.', color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8' },
  { icon: '⚡', title: 'Fast & simple', desc: 'Find a book in minutes. Buy same day.', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { icon: '📍', title: 'Tricity only', desc: 'Chandigarh, Mohali & Panchkula.', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
]

const classKits = [
  { cls: 1,  price: 2035 },
  { cls: 2,  price: 1810 },
  { cls: 3,  price: 4166 },
  { cls: 4,  price: 4397 },
  { cls: 5,  price: 4640 },
  { cls: 6,  price: 4686 },
  { cls: 7,  price: 5020 },
  { cls: 8,  price: 4801 },
  { cls: 9,  price: 4837 },
  { cls: 10, price: 3918 },
]

function SearchIllustration() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
      <circle cx="24" cy="24" r="22" fill="#EFF6FF"/>
      <circle cx="21" cy="20" r="8" stroke="#3B82F6" strokeWidth="2.5"/>
      <line x1="27" y1="26" x2="34" y2="33" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="17" y1="18" x2="19" y2="16" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function WhatsAppIllustration() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
      <circle cx="24" cy="24" r="22" fill="#E8F7F2"/>
      <path d="M24 12C17.4 12 12 17.4 12 24c0 2.1.6 4.1 1.6 5.8L12 36l6.4-1.6C20 35.4 22 36 24 36c6.6 0 12-5.4 12-12S30.6 12 24 12z" fill="#1D9E75"/>
      <path d="M20 18c-.3-.8-1.2-.8-1.6 0l-.8 1.6c-.2.4-.1.8.2 1.1 1 1 2.2 2.8 4.2 4.8 2 2 3.8 3.2 4.8 4.2.3.3.7.4 1.1.2l1.6-.8c.8-.4.8-1.3 0-1.6l-1.8-.8c-.4-.2-.8-.1-1.1.2l-.6.6c-.2.2-.4.2-.6.1-1-.5-2.4-1.8-3.4-2.8-1-1-2.3-2.4-2.8-3.4-.1-.2-.1-.4.1-.6l.6-.6c.3-.3.4-.7.2-1.1L20 18z" fill="white"/>
    </svg>
  )
}

function HandshakeIllustration() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
      <circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
      <path d="M10 26 L18 20 L22 22 L26 20 L38 26" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M16 28 L20 24 L24 26 L28 24 L32 28" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="24" cy="24" r="3" fill="#F97316"/>
      <circle cx="24" cy="24" r="1.5" fill="#FFF7ED"/>
    </svg>
  )
}

function CameraIllustration() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
      <circle cx="24" cy="24" r="22" fill="#F5F3FF"/>
      <rect x="12" y="18" width="24" height="18" rx="3" fill="#8B5CF6"/>
      <rect x="20" y="14" width="8" height="6" rx="2" fill="#7C3AED"/>
      <circle cx="24" cy="27" r="5" fill="#EDE9FE"/>
      <circle cx="24" cy="27" r="3" fill="#8B5CF6"/>
      <circle cx="24" cy="27" r="1.5" fill="#EDE9FE"/>
      <circle cx="33" cy="21" r="1.5" fill="#EDE9FE"/>
    </svg>
  )
}

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
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'marketplace' | 'kits'>('marketplace')
  const { ref: howRef, inView: howInView } = useInView()
  const { ref: sellRef, inView: sellInView } = useInView()
  const { ref: kitsRef, inView: kitsInView } = useInView()
  const { ref: catRef, inView: catInView } = useInView()
  const { ref: trustRef, inView: trustInView } = useInView()
  const { ref: testRef, inView: testInView } = useInView()
  const { ref: faqRef, inView: faqInView } = useInView()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(search.trim() ? '/marketplace?q=' + encodeURIComponent(search.trim()) : '/marketplace')
  }

  const stepIllustrations = [SearchIllustration, WhatsAppIllustration, HandshakeIllustration]
  const sellerIllustrations = [CameraIllustration, WhatsAppIllustration, HandshakeIllustration]

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #F7F6F3; --white: #FFFFFF; --card: #FFFFFF; --subtle: #F0EEE9;
      --border: #E5E2DA; --border-strong: #CCC9C0;
      --text: #1A1A1A; --text-2: #5C5C5C; --text-3: #9A9690;
      --green: #1D9E75; --green-dark: #157A5A; --green-bg: #E8F7F2; --green-border: #C0E8D8;
      --navy: #1B2A4A;
      --shadow: 0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.10); --r: 14px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --white: #1A1D27; --card: #1E2130; --subtle: #252840;
        --border: #2A2D3E; --border-strong: #3A3D52;
        --text: #F0EEE9; --text-2: #A0A0B0; --text-3: #666880;
        --green-bg: #0D2B22; --green-border: #1A4035;
        --shadow: 0 1px 4px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3);
        --shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
    .k { font-family: 'Kalam', cursive; }
    .nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
    .btn-p { display: inline-flex; align-items: center; justify-content: center; background: var(--green); color: #fff; border: none; border-radius: 10px; padding: 11px 22px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s, transform 0.15s; white-space: nowrap; }
    .btn-p:hover { background: var(--green-dark); transform: translateY(-1px); }
    .btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--text-2); border: none; border-radius: 10px; padding: 9px 14px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; white-space: nowrap; }
    .btn-ghost:hover { background: var(--subtle); color: var(--text); }
    .btn-kits { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#EFF6FF,#F5F3FF); color: #1D4ED8; border: 1.5px solid #BFDBFE; border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; white-space: nowrap; }
    .btn-kits:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.2); }
    .btn-o { display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--text); border: 1.5px solid var(--border-strong); border-radius: 10px; padding: 10px 22px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; white-space: nowrap; }
    .btn-o:hover { border-color: var(--green); color: var(--green); }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--r); box-shadow: var(--shadow); }
    .card-hover { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
    .reveal.in { opacity: 1; transform: none; }
    .r1 { transition-delay: 0s; } .r2 { transition-delay: 0.08s; } .r3 { transition-delay: 0.16s; } .r4 { transition-delay: 0.24s; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
    .fu { animation: fadeUp 0.5s ease both; }
    .fu1 { animation-delay: 0.05s; } .fu2 { animation-delay: 0.1s; } .fu3 { animation-delay: 0.15s; } .fu4 { animation-delay: 0.22s; }
    @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .ticker-wrap { overflow: hidden; background: linear-gradient(90deg, #1D9E75, #0ea5e9, #8B5CF6, #F97316, #1D9E75); background-size: 300% 100%; animation: gradientShift 8s ease infinite; padding: 9px 0; }
    @keyframes gradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    .ticker-track { display: flex; animation: ticker 28s linear infinite; width: max-content; }
    .ticker-item { white-space: nowrap; padding: 0 24px; font-size: 12px; color: rgba(255,255,255,0.95); font-weight: 600; }
    .section { padding: 56px 20px; }
    .max { max-width: 920px; margin: 0 auto; }
    .section-tag { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--green); margin-bottom: 8px; }
    .section-h { font-family: 'Kalam', cursive; font-size: clamp(24px, 4vw, 34px); color: var(--text); margin-bottom: 10px; line-height: 1.2; }
    .section-p { font-size: 15px; color: var(--text-2); line-height: 1.7; }
    .search-bar { display: flex; width: 100%; max-width: 480px; background: var(--white); border: 2px solid var(--green); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(29,158,117,0.15); }
    .search-bar input { flex: 1; border: none; background: transparent; padding: 13px 16px; font-size: 15px; color: var(--text); font-family: 'DM Sans', sans-serif; outline: none; min-width: 0; }
    .search-bar input::placeholder { color: var(--text-3); }
    .search-bar button { background: var(--green); color: #fff; border: none; padding: 0 20px; font-size: 14px; cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: background 0.15s; white-space: nowrap; flex-shrink: 0; }
    .search-bar button:hover { background: var(--green-dark); }
    .faq-btn { width: 100%; text-align: left; background: none; border: none; padding: 17px 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 600; color: var(--text); font-family: 'DM Sans', sans-serif; gap: 12px; }
    .faq-body { font-size: 14px; color: var(--text-2); line-height: 1.7; padding-bottom: 17px; }
    .lcard { background: var(--card); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .lcard:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .step-card { transition: transform 0.2s, box-shadow 0.2s; }
    .step-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg) !important; }
    .kit-chip { transition: all 0.2s; cursor: pointer; }
    .kit-chip:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(29,158,117,0.2) !important; }
    .tab-btn { padding: 9px 20px; border-radius: 99px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; border: 2px solid transparent; }
    .tab-btn.active-mp { background: #1D9E75; color: #fff; border-color: #1D9E75; box-shadow: 0 4px 14px rgba(29,158,117,0.3); }
    .tab-btn.active-kits { background: #3B82F6; color: #fff; border-color: #3B82F6; box-shadow: 0 4px 14px rgba(59,130,246,0.3); }
    .tab-btn.inactive { background: var(--card); color: var(--text-2); border-color: var(--border); }
    .tab-btn.inactive:hover { border-color: var(--border-strong); color: var(--text); }
    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    .hero-illo { animation: float 4s ease-in-out infinite; }
    @media (min-width: 640px) {
      .nav { padding: 0 32px; }
      .section { padding: 72px 32px; }
      .hero-inner { flex-direction: row !important; align-items: center !important; }
      .hero-text { max-width: 520px !important; }
      .listings-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .steps-grid { grid-template-columns: repeat(3, 1fr) !important; }
      .cat-grid { grid-template-columns: repeat(6, 1fr) !important; }
      .trust-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .test-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .cta-grid { grid-template-columns: repeat(3, 1fr) !important; }
      .kits-grid { grid-template-columns: repeat(5, 1fr) !important; }
    }
    @media (min-width: 900px) { .test-grid { grid-template-columns: repeat(4, 1fr) !important; } }
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
            <button className="btn-kits" onClick={() => router.push('/school-sets')}>🎒 School Sets</button>
            <button className="btn-ghost" onClick={() => router.push('/requests')}>📋 Requests</button>
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
              ['🔍 Buy second-hand books near you', '🎒 School kits Class 1–10 available', '💸 Save up to 60%', '📍 Chandigarh · Mohali · Panchkula', '📗 NCERT books available', '📙 JEE & NEET prep books', '✅ 100% free · No commission', '📦 Kit delivery available', '💬 WhatsApp direct contact'].map((t, i) => (
                <span key={j + '-' + i} className="ticker-item">{t}</span>
              ))
            )}
          </div>
        </div>

        {/* Hero */}
        <section style={{ padding: 'clamp(32px, 5vw, 64px) 20px 24px', maxWidth: '960px', margin: '0 auto' }}>
          <div className="hero-inner" style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'flex-start' }}>

            <div className="hero-text" style={{ flex: 1, width: '100%' }}>
              <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #E8F7F2, #EFF6FF)', color: '#1D9E75', fontSize: '11px', fontWeight: '700', padding: '6px 14px', borderRadius: '99px', marginBottom: '16px', border: '1px solid #C0E8D8' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
                Chandigarh's student book platform
              </div>

              <h1 className="k fu fu1" style={{ fontSize: 'clamp(30px, 7vw, 54px)', color: 'var(--text)', lineHeight: 1.15, marginBottom: '14px' }}>
                Buy books cheap.<br />
                <span style={{ background: 'linear-gradient(135deg, #1D9E75, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Or order your full kit.</span>
              </h1>

              <p className="fu fu2" style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.75, marginBottom: '20px', maxWidth: '480px' }}>
                Two ways to get your books sorted — browse second-hand listings from students, or order a ready-made school kit for Class 1–10 delivered to your door.
              </p>

              {/* Tab switcher */}
              <div className="fu fu2" style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
                <button className={'tab-btn' + (activeTab === 'marketplace' ? ' active-mp' : ' inactive')} onClick={() => setActiveTab('marketplace')}>
                  🛒 Buy second-hand
                </button>
                <button className={'tab-btn' + (activeTab === 'kits' ? ' active-kits' : ' inactive')} onClick={() => setActiveTab('kits')}>
                  🎒 Order school kit
                </button>
              </div>

              {activeTab === 'marketplace' ? (
                <div className="fu fu2">
                  <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
                    <div className="search-bar">
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search NCERT, JEE books, novels…" />
                      <button type="submit">Search →</button>
                    </div>
                  </form>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="btn-p" style={{ fontSize: '15px', padding: '12px 22px' }} onClick={() => router.push('/marketplace')}>Browse listings →</button>
                    {isSignedIn
                      ? <button className="btn-o" style={{ fontSize: '15px', padding: '11px 20px' }} onClick={() => router.push('/sell')}>Sell your books</button>
                      : <SignInButton mode="modal"><button className="btn-o" style={{ fontSize: '15px', padding: '11px 20px' }}>Sell your books</button></SignInButton>
                    }
                  </div>
                </div>
              ) : (
                <div className="fu fu2">
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '12px', fontWeight: '600' }}>🏫 Shivalik Public School — pick your class:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px', maxWidth: '340px' }}>
                    {classKits.map(k => (
                      <button key={k.cls} onClick={() => router.push('/school-sets')}
                        style={{ background: 'linear-gradient(135deg, #EFF6FF, #E8F7F2)', border: '1.5px solid #BFDBFE', borderRadius: '10px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(59,130,246,0.2)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1D4ED8' }}>Cl. {k.cls}</div>
                        <div style={{ fontSize: '10px', color: '#3B82F6', fontWeight: '600' }}>₹{k.price.toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                  <button className="btn-p" style={{ background: '#3B82F6', fontSize: '15px', padding: '12px 22px' }} onClick={() => router.push('/school-sets')}>
                    Order kit now →
                  </button>
                </div>
              )}

              {/* Stats */}
              <div className="fu fu4" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
                {[
                  { n: '500+', l: 'Books', color: '#3B82F6', bg: '#EFF6FF' },
                  { n: '₹250', l: 'Avg. saving', color: '#1D9E75', bg: '#E8F7F2' },
                  { n: '10', l: 'Kit classes', color: '#8B5CF6', bg: '#F5F3FF' },
                  { n: 'Free', l: 'Marketplace', color: '#F97316', bg: '#FFF7ED' },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span className="k" style={{ fontSize: '17px', color: s.color, fontWeight: '700', background: s.bg, padding: '3px 10px', borderRadius: '99px', whiteSpace: 'nowrap' }}>{s.n}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero illustration */}
            <div className="hero-illo fu fu2" style={{ flexShrink: 0, width: '100%', maxWidth: '360px', alignSelf: 'center' }}>
              <img src="/hero-illustration.png" alt="Student with books on BuddyBooks" style={{ width: '100%', height: 'auto', borderRadius: '16px' }} />
            </div>
          </div>
        </section>

        {/* Sample listings */}
        <section style={{ padding: '0 20px 32px', maxWidth: '960px', margin: '0 auto' }}>
          <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {sampleListings.map((l, i) => {
              const disc = Math.round((1 - l.price / l.origPrice) * 100)
              return (
                <div key={i} className="lcard" onClick={() => router.push('/marketplace')}>
                  <div style={{ height: '76px', background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', position: 'relative', borderBottom: '3px solid ' + l.color }}>
                    {l.emoji}
                    <span style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '9px', background: l.condition === 'New' ? '#D1FAE5' : '#DBEAFE', color: l.condition === 'New' ? '#065F46' : '#1E40AF', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>{l.condition}</span>
                    <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '9px', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>-{disc}%</span>
                  </div>
                  <div style={{ padding: '9px 11px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '2px' }}>
                      <span className="k" style={{ fontSize: '14px', color: l.color, fontWeight: '700' }}>₹{l.price}</span>
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
        <section ref={trustRef} style={{ padding: '0 20px 48px', maxWidth: '960px', margin: '0 auto' }}>
          <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {trustItems.map((t, i) => (
              <div key={t.title} className={'reveal' + (trustInView ? ' in' : '') + ' r' + (i + 1)}
                style={{ background: t.bg, borderRadius: 'var(--r)', border: '1.5px solid ' + t.border, padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', boxShadow: 'var(--shadow)' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: t.color, marginBottom: '3px' }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* School Kits section */}
        <section ref={kitsRef} style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #1D4ED8 100%)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '56px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div className="max" style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '99px', padding: '4px 14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>🆕 New feature</span>
            </div>
            <h2 className={'k reveal' + (kitsInView ? ' in' : '')} style={{ fontSize: 'clamp(24px, 4vw, 36px)', color: '#fff', marginBottom: '10px', lineHeight: 1.2 }}>School Kits 🎒</h2>
            <p className={'reveal' + (kitsInView ? ' in' : '') + ' r2'} style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: '500px', marginBottom: '28px' }}>
              Complete book + stationery kits for Shivalik Public School, assembled for you. Pick your class, remove what you don't need, and order in minutes.
            </p>

            {/* Kit class grid */}
            <div className={'kits-grid reveal' + (kitsInView ? ' in' : '') + ' r3'} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '28px' }}>
              {classKits.map(k => (
                <div key={k.cls} className="kit-chip" onClick={() => router.push('/school-sets')}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '14px', padding: '14px 8px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                  <div className="k" style={{ fontSize: '15px', color: '#fff', marginBottom: '4px' }}>Class {k.cls}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>₹{k.price.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Kit steps */}
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '28px' }}>
              {kitSteps.map((s, i) => (
                <div key={s.num} className={'reveal' + (kitsInView ? ' in' : '') + ' r' + (i + 1)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '18px 20px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{s.emoji}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{s.num}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{s.title}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => router.push('/school-sets')}
              style={{ background: '#fff', color: '#1D4ED8', border: 'none', borderRadius: '12px', padding: '13px 28px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(255,255,255,0.2)' }}>
              Order your class kit →
            </button>
          </div>
        </section>

        {/* How it works — BUYERS */}
        <section ref={howRef} style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
          <div className="section max">
            <div style={{ marginBottom: '28px' }}>
              <div className={'section-tag reveal' + (howInView ? ' in' : '')} style={{ color: '#3B82F6' }}>For buyers</div>
              <h2 className={'section-h reveal' + (howInView ? ' in' : '') + ' r2'}>How to find a second-hand book</h2>
              <p className={'section-p reveal' + (howInView ? ' in' : '') + ' r3'} style={{ maxWidth: '480px' }}>Three steps to save up to 60% on your next book.</p>
            </div>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {buyerSteps.map((s, i) => {
                const Illo = stepIllustrations[i]
                return (
                  <div key={s.num} className={'step-card reveal' + (howInView ? ' in' : '') + ' r' + (i + 1)}
                    style={{ background: s.bg, borderRadius: 'var(--r)', border: '1.5px solid ' + s.border, padding: '22px 20px', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <Illo />
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{s.num}</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: s.color, marginBottom: '6px' }}>{s.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="btn-p" style={{ fontSize: '15px', padding: '12px 26px', background: '#3B82F6' }} onClick={() => router.push('/marketplace')}>Find books near you →</button>
            </div>
          </div>
        </section>

        {/* How it works — SELLERS */}
        <section ref={sellRef} style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="section max">
            <div style={{ marginBottom: '28px' }}>
              <div className={'section-tag reveal' + (sellInView ? ' in' : '')} style={{ color: '#8B5CF6' }}>For sellers</div>
              <h2 className={'section-h reveal' + (sellInView ? ' in' : '') + ' r2'}>How to sell a book</h2>
              <p className={'section-p reveal' + (sellInView ? ' in' : '') + ' r3'} style={{ maxWidth: '480px' }}>List in 2 minutes. Earn cash from books collecting dust.</p>
            </div>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {sellerSteps.map((s, i) => {
                const Illo = sellerIllustrations[i]
                return (
                  <div key={s.num} className={'step-card reveal' + (sellInView ? ' in' : '') + ' r' + (i + 1)}
                    style={{ background: s.bg, borderRadius: 'var(--r)', border: '1.5px solid ' + s.border, padding: '22px 20px', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <Illo />
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{s.num}</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: s.color, marginBottom: '6px' }}>{s.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '20px' }}>
              {isSignedIn
                ? <button className="btn-p" style={{ fontSize: '15px', padding: '12px 26px', background: '#8B5CF6' }} onClick={() => router.push('/sell')}>Post a listing →</button>
                : <SignInButton mode="modal"><button className="btn-p" style={{ fontSize: '15px', padding: '12px 26px', background: '#8B5CF6' }}>Start selling →</button></SignInButton>
              }
            </div>
          </div>
        </section>

        {/* Categories */}
        <section ref={catRef} className="section max">
          <div style={{ marginBottom: '24px' }}>
            <div className={'section-tag reveal' + (catInView ? ' in' : '')}>Categories</div>
            <h2 className={'section-h reveal' + (catInView ? ' in' : '') + ' r2'}>What you can find here</h2>
          </div>
          <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {categories.map((cat, i) => (
              <div key={cat.name} className={'card-hover reveal' + (catInView ? ' in' : '') + ' r' + ((i % 4) + 1)}
                onClick={() => router.push('/marketplace')}
                style={{ background: cat.bg, border: '1.5px solid ' + cat.border, borderRadius: 'var(--r)', padding: '18px 10px', textAlign: 'center', boxShadow: 'var(--shadow)', cursor: 'pointer' }}>
                <div style={{ fontSize: '28px', marginBottom: '7px' }}>{cat.emoji}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: cat.color, marginBottom: '2px' }}>{cat.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section ref={testRef} style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section max">
            <div style={{ marginBottom: '24px' }}>
              <div className={'section-tag reveal' + (testInView ? ' in' : '')} style={{ color: '#F97316' }}>Testimonials</div>
              <h2 className={'section-h reveal' + (testInView ? ' in' : '') + ' r2'}>Students love it</h2>
            </div>
            <div className="test-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {testimonials.map((t, i) => (
                <div key={t.name} className={'card reveal' + (testInView ? ' in' : '') + ' r' + ((i % 4) + 1)} style={{ padding: '18px', borderLeft: '4px solid ' + t.color }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                    {[...Array(5)].map((_, j) => <span key={j} style={{ color: '#F59E0B', fontSize: '12px' }}>★</span>)}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '12px' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div className="k" style={{ width: '34px', height: '34px', borderRadius: '50%', background: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', flexShrink: 0, border: '2px solid ' + t.color }}>{t.avatar}</div>
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
          <div style={{ marginBottom: '24px' }}>
            <div className={'section-tag reveal' + (faqInView ? ' in' : '')}>FAQ</div>
            <h2 className={'section-h reveal' + (faqInView ? ' in' : '') + ' r2'}>Common questions</h2>
          </div>
          <div className={'reveal' + (faqInView ? ' in' : '') + ' r3'} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0 20px', boxShadow: 'var(--shadow)' }}>
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

        {/* 3 CTA banners */}
        <section className="section" style={{ maxWidth: '960px', margin: '0 auto', paddingTop: '0' }}>
          <div className="cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #3B82F6 100%)', borderRadius: '20px', padding: 'clamp(24px, 5vw, 36px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ fontSize: '28px' }}>🔍</div>
              <h2 className="k" style={{ fontSize: 'clamp(18px, 3vw, 22px)', color: '#fff', lineHeight: 1.2 }}>Browse second-hand books</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>Hundreds of listings. Save up to 60%.</p>
              <button onClick={() => router.push('/marketplace')} style={{ background: '#fff', color: '#1D9E75', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Browse →</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #3B82F6 100%)', borderRadius: '20px', padding: 'clamp(24px, 5vw, 36px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: '-20px', right: '10px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ fontSize: '28px' }}>🎒</div>
              <h2 className="k" style={{ fontSize: 'clamp(18px, 3vw, 22px)', color: '#fff', lineHeight: 1.2 }}>Order a school kit</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>Class 1–10 kits. Customisable. Delivered.</p>
              <button onClick={() => router.push('/school-sets')} style={{ background: '#fff', color: '#1D4ED8', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Order kit →</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #F97316 100%)', borderRadius: '20px', padding: 'clamp(24px, 5vw, 36px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ fontSize: '28px' }}>📚</div>
              <h2 className="k" style={{ fontSize: 'clamp(18px, 3vw, 22px)', color: '#fff', lineHeight: 1.2 }}>Sell your old books</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>List in 2 minutes. 100% free. Cash in hand.</p>
              {isSignedIn
                ? <button onClick={() => router.push('/sell')} style={{ background: '#fff', color: '#8B5CF6', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Start selling →</button>
                : <SignInButton mode="modal"><button style={{ background: '#fff', color: '#8B5CF6', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Start selling →</button></SignInButton>
              }
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
              {[['Browse', '/marketplace'], ['School Sets', '/school-sets'], ['Sell', '/sell'], ['Requests', '/requests'], ['Wishlist', '/wishlist'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', '/contact']].map(([l, h]) => (
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