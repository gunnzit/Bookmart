'use client'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

const categories = [
  {
    name: 'Textbooks', desc: 'NCERT & reference', bg: '#E1F5EE', stroke: '#0F6E56',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/></svg>
  },
  {
    name: 'Novels', desc: 'Fiction & literature', bg: '#EFF6FF', stroke: '#185FA5',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  },
  {
    name: 'Notebooks', desc: 'Ruled, plain, spiral', bg: '#FEF9C3', stroke: '#854D0E',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#854D0E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>
  },
  {
    name: 'Art supplies', desc: 'Colors & brushes', bg: '#FBEAF0', stroke: '#993556',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#993556" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
  },
  {
    name: 'Stationery', desc: 'Pens, files & more', bg: '#F1EFE8', stroke: '#5F5E5A',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5F5E5A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/><path d="M8 21h8"/></svg>
  },
  {
    name: 'Competitive', desc: 'JEE, NEET & exams', bg: '#FAECE7', stroke: '#993C1D',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#993C1D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
  },
]

const sampleListings = [
  { title: 'NCERT Physics Pt. 1', price: 180, origPrice: 320, location: 'Sector 40', emoji: '📗', condition: 'Good' },
  { title: 'Atomic Habits', price: 220, origPrice: 399, location: 'Sector 22', emoji: '📘', condition: 'New' },
  { title: 'Arihant JEE Maths', price: 280, origPrice: 450, location: 'Panchkula', emoji: '📙', condition: 'Fair' },
  { title: 'Classmate Notebook', price: 120, origPrice: 180, location: 'Sector 40-C', emoji: '📓', condition: 'New' },
]

export default function LandingPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAFAF8; font-family: 'DM Sans', sans-serif; color: #1B2A4A; }
        .kalam { font-family: 'Kalam', cursive; }
        .btn-green { background: #1D9E75; color: #fff; border: none; border-radius: 14px; padding: 14px 32px; font-size: 16px; font-family: 'Kalam', cursive; font-weight: 700; cursor: pointer; box-shadow: 0 6px 20px rgba(29,158,117,0.28); transition: all 0.15s; }
        .btn-green:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(29,158,117,0.35); }
        .btn-outline { background: #fff; color: #1B2A4A; border: 1.5px solid #EDE9E1; border-radius: 14px; padding: 13px 28px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .btn-outline:hover { background: #F5F2ED; border-color: #D4CFC6; }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(27,42,74,0.10) !important; }
        .step-card { transition: all 0.2s ease; }
        .step-card:hover { transform: translateY(-4px); }
        .cat-item { transition: all 0.15s; cursor: pointer; }
        .cat-item:hover { background: #F0FDF8 !important; border-color: #1D9E75 !important; transform: translateY(-2px); }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .float { animation: float 3s ease-in-out infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>

        {/* Nav */}
        <nav style={{ background: '#fff', borderBottom: '1.5px solid #EDE9E1', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BookMart" style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '22px', color: '#1B2A4A', fontWeight: '700' }}>BookMart</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => router.push('/marketplace')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#555', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F2ED')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              Browse listings
            </button>
            {isSignedIn ? (
              <button className="btn-green" style={{ padding: '9px 20px', fontSize: '14px' }} onClick={() => router.push('/sell')}>+ Sell now</button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-green" style={{ padding: '9px 20px', fontSize: '14px' }}>Get started</button>
              </SignInButton>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section style={{ padding: '72px 32px 56px', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: '#E1F5EE', color: '#0F6E56', fontSize: '12px', fontWeight: '600', padding: '5px 16px', borderRadius: '99px', marginBottom: '24px', letterSpacing: '0.3px' }}>
            ✦ Chandigarh's student marketplace
          </div>
          <h1 className="kalam fade-up" style={{ fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: '700', color: '#1B2A4A', lineHeight: 1.15, marginBottom: '20px' }}>
            Buy & sell books<br /><span style={{ color: '#1D9E75' }}>the smart way</span>
          </h1>
          <p style={{ fontSize: '17px', color: '#777', maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            Find second-hand textbooks, novels, notebooks and stationery from students near you — at a fraction of the price.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '56px' }}>
            <button className="btn-green" onClick={() => router.push('/marketplace')}>Browse listings →</button>
            {isSignedIn ? (
  <button className="btn-outline" onClick={() => router.push('/sell')}>Sell your books</button>
) : (
  <SignInButton mode="modal" afterSignInUrl="/sell">
    <button className="btn-outline">Sell your books</button>
  </SignInButton>
)}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '56px' }}>
            {[['500+', 'listings posted'], ['₹250', 'avg. savings'], ['100%', 'free to use']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="kalam" style={{ fontSize: '30px', color: '#1B2A4A', fontWeight: '700' }}>{num}</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Sample cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', maxWidth: '680px', margin: '0 auto' }}>
            {sampleListings.map((l, i) => (
              <div key={i} className="card-hover" onClick={() => router.push('/marketplace')}
                style={{ background: '#FFFEF9', borderRadius: '18px', border: '1.5px solid #EDE9E1', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(27,42,74,0.05)' }}>
                <div style={{ height: '100px', background: '#F5F2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', position: 'relative' }}>
                  {l.emoji}
                  <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', background: l.condition === 'New' ? 'rgba(220,252,231,0.95)' : 'rgba(239,246,255,0.95)', color: l.condition === 'New' ? '#166534' : '#1D4ED8', padding: '2px 7px', borderRadius: '99px', fontWeight: '600' }}>{l.condition}</span>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1B2A4A', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                    <span className="kalam" style={{ fontSize: '16px', color: '#1D9E75', fontWeight: '700' }}>₹{l.price}</span>
                    <span style={{ fontSize: '10px', color: '#ddd', textDecoration: 'line-through' }}>₹{l.origPrice}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#bbb', marginTop: '3px' }}>📍 {l.location}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section style={{ padding: '56px 32px', background: '#fff', borderTop: '1.5px solid #EDE9E1', borderBottom: '1.5px solid #EDE9E1' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className="kalam" style={{ fontSize: '32px', color: '#1B2A4A', marginBottom: '8px' }}>Browse by category</h2>
            <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '36px' }}>Find exactly what you need</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {categories.map(cat => (
                <div key={cat.name} className="cat-item"
                  onClick={() => router.push('/marketplace')}
                  style={{ background: '#FAFAF8', border: '1.5px solid #EDE9E1', borderRadius: '16px', padding: '20px 12px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    {cat.icon}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1B2A4A', marginBottom: '3px' }}>{cat.name}</div>
                  <div style={{ fontSize: '10px', color: '#bbb' }}>{cat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: '64px 32px', textAlign: 'center' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <h2 className="kalam" style={{ fontSize: '32px', color: '#1B2A4A', marginBottom: '8px' }}>How it works</h2>
            <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '40px' }}>Three steps. No fees. No friction.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { icon: '📸', step: '01', title: 'Post a listing', desc: 'Add photos, set your price and location in under 2 minutes.' },
                { icon: '💬', step: '02', title: 'Get contacted', desc: 'Interested buyers reach you directly on WhatsApp.' },
                { icon: '🤝', step: '03', title: 'Meet & exchange', desc: 'Meet locally, hand over the item, pocket the cash.' },
              ].map(s => (
                <div key={s.step} className="step-card" style={{ background: '#FFFEF9', border: '1.5px solid #EDE9E1', borderRadius: '20px', padding: '28px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(27,42,74,0.04)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '14px' }}>{s.icon}</div>
                  <div className="kalam" style={{ fontSize: '11px', color: '#bbb', marginBottom: '4px', letterSpacing: '1px' }}>STEP {s.step}</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1B2A4A', marginBottom: '8px' }}>{s.title}</div>
                  <div style={{ fontSize: '13px', color: '#999', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '0 32px 64px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', background: '#1B2A4A', borderRadius: '28px', padding: '56px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(29,158,117,0.08)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '-20px', width: '160px', height: '160px', background: 'rgba(29,158,117,0.06)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }} className="float">📚</div>
              <h2 className="kalam" style={{ fontSize: '32px', color: '#fff', marginBottom: '10px' }}>Ready to declutter?</h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', marginBottom: '28px', lineHeight: 1.6 }}>Your old books are worth more than gathering dust. List them today and earn extra cash.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {isSignedIn ? (
                 <button className="btn-green" onClick={() => router.push('/sell')}>Start selling for free →</button>
                 ) : (
                  <SignInButton mode="modal" afterSignInUrl="/sell">
                  <button className="btn-green">Start selling for free →</button>
                 </SignInButton>
                  )}
                <button onClick={() => router.push('/marketplace')}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '13px 24px', fontSize: '15px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
                  Browse first
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1.5px solid #EDE9E1', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span className="kalam" style={{ fontSize: '18px', color: '#1B2A4A', fontWeight: '700' }}>📚 BookMart</span>
          <span style={{ fontSize: '12px', color: '#bbb' }}>Chandigarh's student marketplace · Free to use</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span onClick={() => router.push('/marketplace')} style={{ fontSize: '12px', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>Browse</span>
            <span onClick={() => router.push('/sell')} style={{ fontSize: '12px', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>Sell</span>
          </div>
        </footer>

      </div>
    </>
  )
}