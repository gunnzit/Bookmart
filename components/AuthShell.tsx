'use client'
import { SignIn, SignUp, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

// The wrap&read sign-in / sign-up page. Clerk does the real work (Google, email, codes,
// new accounts); this file only gives it the wrap&read look.

const CSS = `
@keyframes wrAuPop{0%{opacity:0;transform:translateY(20px) scale(.92)}60%{opacity:1;transform:translateY(-3px) scale(1.02)}100%{opacity:1;transform:none}}
@keyframes wrAuUp{0%{opacity:0;transform:translateY(40px)}100%{opacity:1;transform:none}}
@keyframes wrAuBob{0%,100%{translate:0 0}50%{translate:0 -5px}}
@keyframes wrAuGlow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.9;transform:scale(1.15)}}
@keyframes wrAuSk{0%{background-position:100% 0}100%{background-position:-100% 0}}
@keyframes wrAuReveal{0%{opacity:0;transform:translateY(14px) scale(.97)}100%{opacity:1;transform:none}}
@keyframes wrAuShine{0%{transform:translateX(-130%)}45%,100%{transform:translateX(130%)}}
.wrau-pop{animation:wrAuPop .6s cubic-bezier(.22,1,.36,1) var(--d,0ms) backwards}
.wrau-up{animation:wrAuUp .7s cubic-bezier(.22,1,.36,1) var(--d,0ms) backwards}
.wrau-bob{animation:wrAuBob 3.4s ease-in-out infinite}
.wrau-glow{animation:wrAuGlow 5s ease-in-out infinite}
.wrau-sk{background:linear-gradient(90deg,#f1ede6 25%,#fbf8f1 40%,#f1ede6 60%);background-size:300% 100%;animation:wrAuSk 1.4s ease-in-out infinite}
.wrau-reveal{animation:wrAuReveal .55s cubic-bezier(.22,1,.36,1) both}
.wrau-card [class*="astAuthentication"]{display:none!important}
.wrau-back{transition:transform .15s ease}
.wrau-back:active{transform:scale(.9)}
.wrau-tile{transition:transform .2s ease,box-shadow .2s ease}
.wrau-tile:active{transform:scale(.98)}
@media (hover:hover){.wrau-tile:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(120,70,40,.1)}}
.wrau-card .cl-formButtonPrimary{position:relative;overflow:hidden;isolation:isolate}
.wrau-card .cl-formButtonPrimary::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);transform:translateX(-130%);animation:wrAuShine 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
.wrau-pop,.wrau-up,.wrau-bob,.wrau-glow,.wrau-sk,.wrau-reveal,.wrau-card .cl-formButtonPrimary::after{animation:none!important}
}
`

// Gives Clerk's own pieces the wrap&read look. These are direct styles (not Tailwind classes),
// because Clerk's own styles would otherwise win over Tailwind.
const none = { boxShadow: 'none', border: 'none', background: 'transparent', backgroundColor: 'transparent', backgroundImage: 'none' }
const appearance = {
  variables: {
    colorPrimary: '#fbbf24',
    colorText: '#1c1c19',
    colorTextSecondary: '#4f4633',
    colorTextOnPrimaryBackground: '#6c4f00',
    colorBackground: '#ffffff',
    colorInputBackground: '#fcf9f4',
    colorInputText: '#1c1c19',
    borderRadius: '1rem',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '15px',
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', ...none },
    card: { width: '100%', padding: 0, gap: '16px', borderRadius: 0, overflow: 'visible', ...none },
    header: { display: 'none' },
    headerTitle: { display: 'none' },
    headerSubtitle: { display: 'none' },
    socialButtonsBlockButton: {
      height: '48px', borderRadius: '9999px', backgroundColor: '#ffffff', border: 'none',
      boxShadow: '0 1px 3px rgba(30,27,25,.12)', transition: 'transform .15s ease',
      '&:active': { transform: 'scale(.98)' },
    },
    socialButtonsBlockButtonText: { fontWeight: 700, fontSize: '14px' },
    dividerLine: { backgroundColor: '#e5e2dd' },
    dividerText: { textTransform: 'uppercase', letterSpacing: '.08em', fontSize: '12px', fontWeight: 600, color: '#817661' },
    formFieldLabel: { fontSize: '12px', fontWeight: 600, color: '#4f4633' },
    formFieldInput: {
      height: '48px', borderRadius: '9999px', backgroundColor: '#fcf9f4', border: 'none',
      boxShadow: 'inset 0 1px 3px rgba(30,27,25,.08)', padding: '0 20px',
      '&:focus': { backgroundColor: '#ffffff', boxShadow: '0 0 0 2px #F7CF65' },
    },
    formButtonPrimary: {
      height: '48px', borderRadius: '9999px', textTransform: 'none', fontWeight: 700, fontSize: '14px',
      backgroundColor: '#fbbf24 !important', backgroundImage: 'none !important', color: '#6c4f00 !important',
      boxShadow: '0 4px 12px rgba(251,191,36,.4) !important', border: 'none !important',
      '&:hover': { backgroundColor: '#f9bd22 !important' },
      '&:active': { transform: 'scale(.98)' },
    },
    footer: { ...none },
    footerAction: { ...none },
    footerActionText: { color: '#4f4633' },
    footerActionLink: { color: '#795900', fontWeight: 700, '&:hover': { color: '#5c4300' } },
    formResendCodeLink: { color: '#795900', fontWeight: 700 },
    otpCodeFieldInput: { borderRadius: '16px', backgroundColor: '#fcf9f4', border: 'none', boxShadow: 'inset 0 1px 3px rgba(30,27,25,.08)' },
    identityPreview: { borderRadius: '9999px', backgroundColor: '#fcf9f4', border: 'none' },
    alert: { borderRadius: '16px' },
  },
}

export default function AuthShell({ mode }: { mode: 'in' | 'up' }) {
  const router = useRouter()
  const { isLoaded } = useAuth()
  const isIn = mode === 'in'

  // Back goes to the page the person came from (only our own pages), else Home
  function goBack() {
    let to = '/'
    try {
      const r = new URLSearchParams(window.location.search).get('redirect_url') || ''
      if (r.startsWith('/') && !r.startsWith('//')) to = r
    } catch {}
    router.push(to)
  }
  const delay = (ms: number) => ({ ['--d' as any]: ms + 'ms' })

  return (
    <div className="min-h-screen bg-[#ECEAE5] flex justify-center font-['Plus_Jakarta_Sans',sans-serif] text-[#1c1c19] antialiased">
      <style>{CSS}</style>
      <main className="w-full max-w-[430px] bg-[#fcf9f4] min-h-screen relative shadow-2xl border-x border-stone-200 overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="wrau-pop wrau-back absolute left-4 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-stone-200 flex items-center justify-center text-[#1c1c19]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', ...delay(0) }}
        >
          <i className="fa-solid fa-arrow-left text-sm" />
        </button>

        <div className="flex flex-col w-full px-5 pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0px)' }}>

          {/* Brand header */}
          <header className="flex flex-col items-center pt-5 pb-2 text-center">
            <div className="wrau-pop inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbbf24]/30 text-[#5c4300] mb-4 shadow-sm" style={delay(0)}>
              <i className="fa-solid fa-book-open-reader text-[13px] text-[#fd651e]" />
              <span className="text-xs font-semibold tracking-wide">Students&apos; book community</span>
            </div>
            <a href="/" aria-label="wrap&read home" className="wrau-pop py-2" style={delay(80)}>
              <div className="wrau-bob">
                <Logo height={52} className="drop-shadow-sm" />
              </div>
            </a>
            <h1 className="wrau-pop text-[30px] leading-9 font-extrabold tracking-tight mt-2 mb-1" style={delay(160)}>
              {isIn ? 'Welcome back, reader.' : 'Join the readers.'}
            </h1>
            <p className="wrau-pop text-[15px] text-[#4f4633] max-w-[310px] leading-relaxed" style={delay(240)}>
              Your neighbourhood student bookstore &amp; peer-to-peer exchange.
            </p>
          </header>

          {/* Sign-in card (Clerk inside) */}
          <section className="wrau-up wrau-card mt-4 w-full bg-white rounded-[2rem] p-6 shadow-xl shadow-[#1c1c19]/5 relative" style={delay(300)}>
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="wrau-glow absolute -top-12 -right-12 w-32 h-32 bg-[#fbbf24]/25 rounded-full blur-2xl" />
            </div>
            <div className="relative z-10">
              {isLoaded ? (
                <div className="wrau-reveal">
                  {isIn
                    ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={appearance} />
                    : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={appearance} />}
                </div>
              ) : (
                /* shows the same shapes while Clerk loads, so nothing jumps in */
                <div className="flex flex-col gap-4" aria-hidden>
                  <div className="wrau-sk h-12 rounded-full" />
                  <div className="wrau-sk h-3 w-24 rounded-full self-center" />
                  <div className="wrau-sk h-12 rounded-full" />
                  <div className="wrau-sk h-12 rounded-full" />
                  <div className="wrau-sk h-4 w-40 rounded-full self-center" />
                </div>
              )}
            </div>
          </section>

          {/* Perks */}
          <section className="mt-6 w-full flex flex-col gap-2 px-1">
            <div className="wrau-pop wrau-tile flex items-center gap-3 p-3 rounded-2xl bg-[#f6f3ee]" style={delay(560)}>
              <div className="w-9 h-9 rounded-full bg-[#ffdbce] flex items-center justify-center text-[#370e00] shrink-0">
                <i className="fa-solid fa-arrow-right-arrow-left text-sm" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#1c1c19]">Circular Textbook Exchange</span>
                <span className="text-[13px] font-medium text-[#4f4633] truncate">Pass your books on to the next student</span>
              </div>
            </div>
            <div className="wrau-pop wrau-tile flex items-center gap-3 p-3 rounded-2xl bg-[#f6f3ee]" style={delay(640)}>
              <div className="w-9 h-9 rounded-full bg-[#dec870] flex items-center justify-center text-[#625301] shrink-0">
                <i className="fa-solid fa-store text-sm" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#1c1c19]">Pickup from Sector 40-C</span>
                <span className="text-[13px] font-medium text-[#4f4633] truncate">Collect free from our store, Booth 48</span>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="wrau-pop mt-6 flex flex-col items-center text-center px-2" style={delay(720)}>
            <p className="text-[13px] font-medium text-[#817661] leading-normal max-w-[320px]">
              By {isIn ? 'signing in' : 'signing up'}, you agree to wrap&amp;read&apos;s{' '}
              <a href="/terms" className="text-[#1c1c19] underline hover:text-[#795900]">Terms of Service</a> &amp;{' '}
              <a href="/privacy" className="text-[#1c1c19] underline hover:text-[#795900]">Privacy Policy</a>.
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[#817661]">
              <i className="fa-solid fa-store text-[12px]" />
              <span className="text-[13px] font-medium">Bedi Book Store • Sector 40-C, Chandigarh</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}