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
  { name: 'Rahul T.', role: 'Class 10, Sector 22', text: 'Posted photos, got WhatsApp messages within the hour!', avatar: 'R', color: '#F97316', bg: '#FFF7ED' },
]

const sampleListings = [
  { title: 'NCERT Physics Pt. 1', price: 180, origPrice: 320, location: 'Sector 40', emoji: '📗', condition: 'Good', color: '#3B82F6', bg: '#EFF6FF' },
  { title: 'Atomic Habits', price: 220, origPrice: 399, location: 'Sector 22', emoji: '📘', condition: 'New', color: '#8B5CF6', bg: '#F5F3FF' },
  { title: 'Arihant JEE Maths', price: 280, origPrice: 450, location: 'Panchkula', emoji: '📙', condition: 'Fair', color: '#F97316', bg: '#FFF7ED' },
  { title: 'Classmate Notebook', price: 120, origPrice: 180, location: 'Sector 40-C', emoji: '📓', condition: 'New', color: '#F59E0B', bg: '#FFFBEB' },
]

const faqs = [
  { q: 'Is BuddyBooks free to use?', a: 'Yes, completely free. Listing, browsing, and contacting sellers costs nothing.' },
  { q: 'How do I contact a seller?', a: "Every listing has a WhatsApp button. One tap and you're chatting directly with the seller." },
  { q: 'Is it safe to buy here?', a: 'We recommend meeting in a public place like a cafe or school campus. Never share OTPs or pay in advance.' },
  { q: 'What areas do you cover?', a: 'Chandigarh, Mohali, Panchkula and surrounding tricity areas.' },
]

const trustItems = [
  { icon: '🔒', title: 'Safe & local', desc: 'Meet in person. No prepayment needed.', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { icon: '💸', title: 'Always free', desc: 'No listing fees. No commission.', color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8' },
  { icon: '⚡', title: 'Fast & simple', desc: 'Find a book in minutes. Buy same day.', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { icon: '📍', title: 'Tricity only', desc: 'Chandigarh, Mohali & Panchkula.', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
]

// ── SVG ILLUSTRATIONS ──

function HeroIllustration() {
  return (
    <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '340px', height: 'auto' }}>
      {/* Background blobs */}
      <ellipse cx="200" cy="140" rx="110" ry="110" fill="#EFF6FF" opacity="0.7"/>
      <ellipse cx="160" cy="160" rx="80" ry="70" fill="#E8F7F2" opacity="0.5"/>

      {/* Floating decorative dots */}
      <circle cx="40" cy="40" r="6" fill="#3B82F6" opacity="0.3"/>
      <circle cx="290" cy="60" r="4" fill="#EC4899" opacity="0.4"/>
      <circle cx="30" cy="200" r="5" fill="#F59E0B" opacity="0.3"/>
      <circle cx="300" cy="220" r="7" fill="#8B5CF6" opacity="0.25"/>
      <circle cx="70" cy="250" r="4" fill="#1D9E75" opacity="0.4"/>

      {/* Stack of books — bottom */}
      <rect x="80" y="190" width="100" height="16" rx="3" fill="#3B82F6"/>
      <rect x="82" y="188" width="96" height="4" rx="2" fill="#60A5FA"/>
      <rect x="75" y="174" width="110" height="18" rx="3" fill="#8B5CF6"/>
      <rect x="77" y="172" width="106" height="4" rx="2" fill="#A78BFA"/>
      <rect x="85" y="158" width="94" height="18" rx="3" fill="#1D9E75"/>
      <rect x="87" y="156" width="90" height="4" rx="2" fill="#34D399"/>

      {/* Book spines detail */}
      <line x1="120" y1="158" x2="120" y2="176" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <line x1="140" y1="174" x2="140" y2="192" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>

      {/* Open book center */}
      <path d="M90 140 Q130 120 160 130 Q190 120 230 140 L230 158 Q190 138 160 148 Q130 138 90 158 Z" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5"/>
      <path d="M160 130 L160 148" stroke="#FDE68A" strokeWidth="1.5"/>
      {/* Book lines */}
      <line x1="105" y1="138" x2="155" y2="133" stroke="#FCD34D" strokeWidth="1" opacity="0.6"/>
      <line x1="105" y1="143" x2="155" y2="138" stroke="#FCD34D" strokeWidth="1" opacity="0.4"/>
      <line x1="165" y1="133" x2="215" y2="138" stroke="#FCD34D" strokeWidth="1" opacity="0.6"/>
      <line x1="165" y1="138" x2="215" y2="143" stroke="#FCD34D" strokeWidth="1" opacity="0.4"/>

      {/* Student character */}
      {/* Body */}
      <rect x="148" y="72" width="24" height="32" rx="4" fill="#3B82F6"/>
      {/* Head */}
      <circle cx="160" cy="58" r="16" fill="#FBBF24"/>
      {/* Hair */}
      <path d="M144 52 Q150 40 160 38 Q170 40 176 52 Q170 44 160 42 Q150 44 144 52Z" fill="#92400E"/>
      {/* Eyes */}
      <circle cx="154" cy="56" r="2.5" fill="#1A1A1A"/>
      <circle cx="166" cy="56" r="2.5" fill="#1A1A1A"/>
      <circle cx="155" cy="55" r="1" fill="#fff"/>
      <circle cx="167" cy="55" r="1" fill="#fff"/>
      {/* Smile */}
      <path d="M155 62 Q160 67 165 62" stroke="#92400E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Arms */}
      <rect x="130" y="75" width="18" height="8" rx="4" fill="#FBBF24" transform="rotate(-15 130 75)"/>
      <rect x="172" y="72" width="18" height="8" rx="4" fill="#FBBF24" transform="rotate(15 172 72)"/>
      {/* Backpack strap */}
      <path d="M152 72 Q148 80 150 92" stroke="#1E40AF" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Legs */}
      <rect x="150" y="102" width="9" height="24" rx="4" fill="#1B2A4A"/>
      <rect x="161" y="102" width="9" height="24" rx="4" fill="#1B2A4A"/>
      {/* Shoes */}
      <ellipse cx="154" cy="127" rx="7" ry="4" fill="#1A1A1A"/>
      <ellipse cx="166" cy="127" rx="7" ry="4" fill="#1A1A1A"/>

      {/* Floating tags */}
      <g transform="translate(220, 80)">
        <rect width="72" height="28" rx="8" fill="#E8F7F2" stroke="#C0E8D8" strokeWidth="1.5"/>
        <text x="10" y="19" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#1D9E75">Save 60%</text>
      </g>
      <g transform="translate(20, 100)">
        <rect width="68" height="28" rx="8" fill="#FDF2F8" stroke="#FBCFE8" strokeWidth="1.5"/>
        <text x="8" y="19" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#EC4899">100% Free</text>
      </g>
      <g transform="translate(225, 150)">
        <rect width="72" height="28" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
        <text x="8" y="19" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#3B82F6">500+ Books</text>
      </g>

      {/* Stars floating */}
      <text x="48" y="145" fontSize="14" opacity="0.5">✨</text>
      <text x="268" y="110" fontSize="12" opacity="0.4">⭐</text>
      <text x="240" y="240" fontSize="10" opacity="0.3">✨</text>
    </svg>
  )
}

function SearchIllustration() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px' }}>
      <circle cx="24" cy="24" r="22" fill="#EFF6FF"/>
      <circle cx="21" cy="20" r="8" stroke="#3B82F6" strokeWidth="2.5"/>
      <line x1="27" y1="26" x2="34" y2="33" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="17" y1="18" x2="19" y2="16" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function WhatsAppIllustration() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px' }}>
      <circle cx="24" cy="24" r="22" fill="#E8F7F2"/>
      <path d="M24 12C17.4 12 12 17.4 12 24c0 2.1.6 4.1 1.6 5.8L12 36l6.4-1.6C20 35.4 22 36 24 36c6.6 0 12-5.4 12-12S30.6 12 24 12z" fill="#1D9E75"/>
      <path d="M20 18c-.3-.8-1.2-.8-1.6 0l-.8 1.6c-.2.4-.1.8.2 1.1 1 1 2.2 2.8 4.2 4.8 2 2 3.8 3.2 4.8 4.2.3.3.7.4 1.1.2l1.6-.8c.8-.4.8-1.3 0-1.6l-1.8-.8c-.4-.2-.8-.1-1.1.2l-.6.6c-.2.2-.4.2-.6.1-1-.5-2.4-1.8-3.4-2.8-1-1-2.3-2.4-2.8-3.4-.1-.2-.1-.4.1-.6l.6-.6c.3-.3.4-.7.2-1.1L20 18z" fill="white"/>
    </svg>
  )
}

function HandshakeIllustration() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px' }}>
      <circle cx="24" cy="24" r="22" fill="#FFF7ED"/>
      <path d="M10 26 L18 20 L22 22 L26 20 L38 26" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M18 20 L22 22 L26 20" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M16 28 L20 24 L24 26 L28 24 L32 28" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="24" cy="24" r="3" fill="#F97316"/>
      <circle cx="24" cy="24" r="1.5" fill="#FFF7ED"/>
    </svg>
  )
}

function CameraIllustration() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px' }}>
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

function EmptyBooksIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '180px', height: 'auto', margin: '0 auto', display: 'block' }}>
      <ellipse cx="100" cy="140" rx="70" ry="12" fill="#E5E2DA" opacity="0.5"/>
      {/* Books tilted */}
      <rect x="55" y="50" width="30" height="80" rx="3" fill="#BFDBFE" transform="rotate(-8 55 50)"/>
      <rect x="57" y="48" width="26" height="6" rx="2" fill="#93C5FD" transform="rotate(-8 57 48)"/>
      <rect x="88" y="45" width="30" height="85" rx="3" fill="#DDD6FE"/>
      <rect x="90" y="43" width="26" height="6" rx="2" fill="#C4B5FD"/>
      <rect x="118" y="52" width="30" height="78" rx="3" fill="#FDE68A" transform="rotate(6 118 52)"/>
      <rect x="120" y="50" width="26" height="6" rx="2" fill="#FCD34D" transform="rotate(6 120 50)"/>
      {/* Magnifying glass */}
      <circle cx="100" cy="75" r="22" stroke="#9CA3AF" strokeWidth="2.5" fill="rgba(255,255,255,0.8)"/>
      <line x1="116" y1="91" x2="128" y2="103" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round"/>
      <text x="88" y="80" fontFamily="sans-serif" fontSize="18">😔</text>
    </svg>
  )
}

function NoResultsIllustration() {
  return (
    <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '140px', height: 'auto', margin: '0 auto', display: 'block' }}>
      <ellipse cx="80" cy="118" rx="50" ry="8" fill="#E5E2DA" opacity="0.5"/>
      <rect x="30" y="30" width="100" height="80" rx="8" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="2"/>
      <line x1="45" y1="52" x2="115" y2="52" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round"/>
      <line x1="45" y1="64" x2="95" y2="64" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round"/>
      <line x1="45" y1="76" x2="105" y2="76" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round"/>
      <line x1="45" y1="88" x2="80" y2="88" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="110" cy="30" r="22" fill="#FEF2F2" stroke="#FECACA" strokeWidth="2"/>
      <line x1="102" y1="22" x2="118" y2="38" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="118" y1="22" x2="102" y2="38" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
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
  const { ref: howRef, inView: howInView } = useInView()
  const { ref: sellRef, inView: sellInView } = useInView()
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
    .btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--text-2); border: none; border-radius: 10px; padding: 11px 16px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; white-space: nowrap; }
    .btn-ghost:hover { background: var(--subtle); color: var(--text); }
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
    .search-bar input { flex: 1; border: none; background: transparent; padding: 13px 16px; font-size: 15px; color: var(--text); font-family: 'DM Sans', sans-serif; outline: none; }
    .search-bar input::placeholder { color: var(--text-3); }
    .search-bar button { background: var(--green); color: #fff; border: none; padding: 0 20px; font-size: 15px; cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: background 0.15s; white-space: nowrap; }
    .search-bar button:hover { background: var(--green-dark); }
    .faq-btn { width: 100%; text-align: left; background: none; border: none; padding: 17px 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 600; color: var(--text); font-family: 'DM Sans', sans-serif; gap: 12px; }
    .faq-body { font-size: 14px; color: var(--text-2); line-height: 1.7; padding-bottom: 17px; }
    .lcard { background: var(--card); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .lcard:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .step-card { transition: transform 0.2s, box-shadow 0.2s; }
    .step-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg) !important; }
    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    .hero-illo { animation: float 4s ease-in-out infinite; }
    @media (min-width: 640px) {
      .nav { padding: 0 32px; } .section { padding: 72px 32px; }
      .hero-inner { flex-direction: row !important; align-items: center !important; }
      .hero-text { max-width: 480px !important; }
      .stats-row { flex-direction: row !important; gap: 40px !important; }
      .listings-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .steps-grid { grid-template-columns: repeat(3, 1fr) !important; }
      .cat-grid { grid-template-columns: repeat(6, 1fr) !important; }
      .trust-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .test-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .cta-grid { grid-template-columns: repeat(2, 1fr) !important; }
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
            <button className="btn-ghost" onClick={() => router.push('/requests')}>📋 Requests</button>
            {isSignedIn
              ? <button className="btn-p" onClick={() => router.push('/sell')}>+ Sell</button>
              : <SignInButton mode="modal"><button className="btn-p">Get started</button></SignInButton>
            }
          </div>
        </nav>

        {/* Rainbow ticker */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...Array(3)].map((_, j) =>
              ['🔍 Find books near you', '💸 Save up to 60%', '📍 Chandigarh · Mohali · Panchkula', '📗 NCERT books available', '📙 JEE & NEET prep books', '✅ 100% free · No commission', '💬 WhatsApp direct contact', '🎨 Art supplies too', '📓 Notebooks & stationery'].map((t, i) => (
                <span key={j + '-' + i} className="ticker-item">{t}</span>
              ))
            )}
          </div>
        </div>

        {/* Hero — with illustration */}
        <section style={{ padding: 'clamp(36px, 6vw, 72px) 20px clamp(32px, 5vw, 56px)', maxWidth: '960px', margin: '0 auto' }}>
          <div className="hero-inner" style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'flex-start' }}>

            {/* Left: text */}
            <div className="hero-text" style={{ flex: 1 }}>
              <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #E8F7F2, #EFF6FF)', color: '#1D9E75', fontSize: '11px', fontWeight: '700', padding: '6px 14px', borderRadius: '99px', marginBottom: '18px', border: '1px solid #C0E8D8' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', display: 'inline-block', boxShadow: '0 0 0 2px rgba(29,158,117,0.3)' }} />
                Chandigarh's student book marketplace
              </div>

              <h1 className="k fu fu1" style={{ fontSize: 'clamp(34px, 7vw, 58px)', color: 'var(--text)', lineHeight: 1.15, marginBottom: '16px' }}>
                Find books near you<br />
                <span style={{ background: 'linear-gradient(135deg, #1D9E75, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>at half the price</span>
              </h1>

              <p className="fu fu2" style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.75, marginBottom: '28px', maxWidth: '440px' }}>
                Buy second-hand textbooks, novels and stationery from students in Chandigarh, Mohali and Panchkula. Save up to 60%.
              </p>

              <form className="fu fu2" onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
                <div className="search-bar">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for NCERT, JEE books, novels…" />
                  <button type="submit">Search →</button>
                </div>
              </form>

              <div className="fu fu3" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <button className="btn-p" style={{ fontSize: '15px', padding: '12px 24px' }} onClick={() => router.push('/marketplace')}>Browse all listings →</button>
                {isSignedIn
                  ? <button className="btn-o" style={{ fontSize: '15px', padding: '11px 22px' }} onClick={() => router.push('/sell')}>Sell your books</button>
                  : <SignInButton mode="modal"><button className="btn-o" style={{ fontSize: '15px', padding: '11px 22px' }}>Sell your books</button></SignInButton>
                }
              </div>

              <div className="fu fu4 stats-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { n: '500+', l: 'Books available', color: '#3B82F6', bg: '#EFF6FF' },
                  { n: '₹250', l: 'Avg. savings per book', color: '#1D9E75', bg: '#E8F7F2' },
                  { n: 'Free', l: 'No commission ever', color: '#8B5CF6', bg: '#F5F3FF' },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="k" style={{ fontSize: '21px', color: s.color, fontWeight: '700', background: s.bg, padding: '3px 12px', borderRadius: '99px' }}>{s.n}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: hero illustration */}
            <div className="hero-illo fu fu2" style={{ flexShrink: 0, width: '100%', maxWidth: '340px', alignSelf: 'center' }}>
              <img
  src="/hero-illustration.png"
  alt="Student with books on BuddyBooks"
  style={{ width: '100%', maxWidth: '420px', height: 'auto', borderRadius: '16px' }}
/>
            </div>
          </div>
        </section>

        {/* Sample listings */}
        <section style={{ padding: '0 20px 48px', maxWidth: '960px', margin: '0 auto' }}>
          <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {sampleListings.map((l, i) => {
              const disc = Math.round((1 - l.price / l.origPrice) * 100)
              return (
                <div key={i} className="lcard" onClick={() => router.push('/marketplace')}>
                  <div style={{ height: '80px', background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', position: 'relative', borderBottom: '3px solid ' + l.color }}>
                    {l.emoji}
                    <span style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '9px', background: l.condition === 'New' ? '#D1FAE5' : '#DBEAFE', color: l.condition === 'New' ? '#065F46' : '#1E40AF', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>{l.condition}</span>
                    <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '9px', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>-{disc}%</span>
                  </div>
                  <div style={{ padding: '10px 11px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '3px' }}>
                      <span className="k" style={{ fontSize: '15px', color: l.color, fontWeight: '700' }}>₹{l.price}</span>
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
        <section ref={trustRef} style={{ padding: '0 20px 56px', maxWidth: '960px', margin: '0 auto' }}>
          <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {trustItems.map((t, i) => (
              <div key={t.title} className={'reveal' + (trustInView ? ' in' : '') + ' r' + (i + 1)}
                style={{ background: t.bg, borderRadius: 'var(--r)', border: '1.5px solid ' + t.border, padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', boxShadow: 'var(--shadow)', opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.5s ease ' + (i * 0.08) + 's, transform 0.5s ease ' + (i * 0.08) + 's' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: t.color, marginBottom: '3px' }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — BUYERS with illustrations */}
        <section ref={howRef} style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section max">
            <div style={{ marginBottom: '32px' }}>
              <div className={'section-tag reveal' + (howInView ? ' in' : '')} style={{ color: '#3B82F6' }}>For buyers</div>
              <h2 className={'section-h reveal' + (howInView ? ' in' : '') + ' r2'}>How to find a book</h2>
              <p className={'section-p reveal' + (howInView ? ' in' : '') + ' r3'} style={{ maxWidth: '480px' }}>Three steps to save up to 60% on your next book.</p>
            </div>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {buyerSteps.map((s, i) => {
                const Illo = stepIllustrations[i]
                return (
                  <div key={s.num} className={'step-card reveal' + (howInView ? ' in' : '') + ' r' + (i + 1)}
                    style={{ background: s.bg, borderRadius: 'var(--r)', border: '1.5px solid ' + s.border, padding: '24px 20px', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <Illo />
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{s.num}</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: s.color, marginBottom: '7px' }}>{s.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7 }}>{s.desc}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '24px' }}>
              <button className="btn-p" style={{ fontSize: '15px', padding: '13px 28px', background: '#3B82F6' }} onClick={() => router.push('/marketplace')}>Find books near you →</button>
            </div>
          </div>
        </section>

        {/* How it works — SELLERS with illustrations */}
        <section ref={sellRef} style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="section max">
            <div style={{ marginBottom: '32px' }}>
              <div className={'section-tag reveal' + (sellInView ? ' in' : '')} style={{ color: '#8B5CF6' }}>For sellers</div>
              <h2 className={'section-h reveal' + (sellInView ? ' in' : '') + ' r2'}>How to sell a book</h2>
              <p className={'section-p reveal' + (sellInView ? ' in' : '') + ' r3'} style={{ maxWidth: '480px' }}>List in 2 minutes. Earn cash from books collecting dust.</p>
            </div>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {sellerSteps.map((s, i) => {
                const Illo = sellerIllustrations[i]
                return (
                  <div key={s.num} className={'step-card reveal' + (sellInView ? ' in' : '') + ' r' + (i + 1)}
                    style={{ background: s.bg, borderRadius: 'var(--r)', border: '1.5px solid ' + s.border, padding: '24px 20px', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <Illo />
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{s.num}</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: s.color, marginBottom: '7px' }}>{s.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7 }}>{s.desc}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '24px' }}>
              {isSignedIn
                ? <button className="btn-p" style={{ fontSize: '15px', padding: '13px 28px', background: '#8B5CF6' }} onClick={() => router.push('/sell')}>Post a listing →</button>
                : <SignInButton mode="modal"><button className="btn-p" style={{ fontSize: '15px', padding: '13px 28px', background: '#8B5CF6' }}>Start selling →</button></SignInButton>
              }
            </div>
          </div>
        </section>

        {/* Categories */}
        <section ref={catRef} className="section max">
          <div style={{ marginBottom: '28px' }}>
            <div className={'section-tag reveal' + (catInView ? ' in' : '')}>Categories</div>
            <h2 className={'section-h reveal' + (catInView ? ' in' : '') + ' r2'}>What you can find here</h2>
          </div>
          <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {categories.map((cat, i) => (
              <div key={cat.name}
                className={'card-hover reveal' + (catInView ? ' in' : '') + ' r' + ((i % 4) + 1)}
                onClick={() => router.push('/marketplace')}
                style={{ background: cat.bg, border: '1.5px solid ' + cat.border, borderRadius: 'var(--r)', padding: '20px 12px', textAlign: 'center', boxShadow: 'var(--shadow)', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{cat.emoji}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: cat.color, marginBottom: '3px' }}>{cat.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section ref={testRef} style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section max">
            <div style={{ marginBottom: '28px' }}>
              <div className={'section-tag reveal' + (testInView ? ' in' : '')} style={{ color: '#F97316' }}>Testimonials</div>
              <h2 className={'section-h reveal' + (testInView ? ' in' : '') + ' r2'}>Students love it</h2>
              <p className={'section-p reveal' + (testInView ? ' in' : '') + ' r3'}>Real students saving real money across Chandigarh.</p>
            </div>
            <div className="test-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {testimonials.map((t, i) => (
                <div key={t.name} className={'card reveal' + (testInView ? ' in' : '') + ' r' + ((i % 4) + 1)} style={{ padding: '20px', borderLeft: '4px solid ' + t.color }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
                    {[...Array(5)].map((_, j) => <span key={j} style={{ color: '#F59E0B', fontSize: '13px' }}>★</span>)}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '14px' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <div className="k" style={{ width: '36px', height: '36px', borderRadius: '50%', background: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0, border: '2px solid ' + t.color }}>{t.avatar}</div>
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

        {/* CTA banners */}
        <section className="section" style={{ maxWidth: '920px', margin: '0 auto', paddingTop: '0' }}>
          <div className="cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #3B82F6 100%)', borderRadius: '20px', padding: 'clamp(28px, 5vw, 44px) clamp(24px, 5vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ fontSize: '36px' }}>🔍</div>
              <h2 className="k" style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', color: '#fff', lineHeight: 1.2 }}>Find your next book</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: '340px' }}>Hundreds of listings from students near you. Save up to 60%.</p>
              <button onClick={() => router.push('/marketplace')} style={{ background: '#fff', color: '#1D9E75', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Browse listings →</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #F97316 100%)', borderRadius: '20px', padding: 'clamp(28px, 5vw, 44px) clamp(24px, 5vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: '-20px', right: '20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ fontSize: '36px' }}>📚</div>
              <h2 className="k" style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', color: '#fff', lineHeight: 1.2 }}>Turn old books into cash</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: '340px' }}>List in 2 minutes. Completely free. Buyers already looking.</p>
              {isSignedIn
                ? <button onClick={() => router.push('/sell')} style={{ background: '#fff', color: '#8B5CF6', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Post a listing →</button>
                : <SignInButton mode="modal"><button style={{ background: '#fff', color: '#8B5CF6', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Start selling →</button></SignInButton>
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
              {[['Browse', '/marketplace'], ['Sell', '/sell'], ['Requests', '/requests'], ['Wishlist', '/wishlist'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', '/contact']].map(([l, h]) => (
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