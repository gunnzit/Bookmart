'use client'
import { useEffect, useState } from 'react'

// "Continue with WhatsApp" under the Clerk box on /sign-in and /sign-up.
// Number, then a 6-digit code on WhatsApp, then a one-time Clerk sign-in pass that the
// /sign-in page uses to sign the person in (Clerk reads it from ?__clerk_ticket=).
// Works only for numbers already verified on an account; see lib/whatsapp-login.ts.

const ERRORS: Record<string, string> = {
  bad_number: 'Enter a 10-digit Indian mobile number.',
  too_many: 'Too many codes asked for. Please try again in an hour.',
  send_failed: 'We could not send the code. Please try again in a minute.',
  bad_code: 'Enter the 6-digit code.',
  no_code: 'Ask for a new code.',
  expired: 'That code has expired. Ask for a new one.',
  locked: 'Too many wrong tries. Ask for a new code.',
  no_account: 'This number is not linked to an account. Sign in with Google or email above.',
  failed: 'Something went wrong. Please try again.',
}

function redirectTarget() {
  try {
    const r = new URLSearchParams(window.location.search).get('redirect_url') || ''
    if (r.startsWith('/') && !r.startsWith('//')) return r
  } catch {}
  return '/'
}

export default function WhatsAppLogin() {
  const [step, setStep] = useState<'closed' | 'number' | 'code'>('closed')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  async function send() {
    setErr('')
    const digits = phone.replace(/\D/g, '').slice(-10)
    if (!/^[6-9]\d{9}$/.test(digits)) { setErr(ERRORS.bad_number); return }
    setBusy(true)
    try {
      const res = await fetch('/api/whatsapp-login/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })
      const d = await res.json().catch(() => ({}))
      if (d.ok) { setPhone(digits); setCode(''); setStep('code'); setResendIn(d.resendIn || 60) }
      else if (d.error === 'wait') { setStep('code'); setResendIn(d.seconds || 60) }
      else setErr(ERRORS[d.error] || ERRORS.failed)
    } catch {
      setErr('Could not connect. Please check your internet.')
    }
    setBusy(false)
  }

  async function verify() {
    setErr('')
    if (code.length !== 6) { setErr(ERRORS.bad_code); return }
    setBusy(true)
    try {
      const res = await fetch('/api/whatsapp-login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const d = await res.json().catch(() => ({}))
      if (d.ok && d.ticket) {
        // Clerk's sign-in page signs the person in with this pass, then sends them on
        window.location.href = '/sign-in?__clerk_ticket=' + encodeURIComponent(d.ticket) + '&redirect_url=' + encodeURIComponent(redirectTarget())
        return
      }
      if (d.error === 'wrong') setErr(d.left > 0 ? `That code is not right. ${d.left} ${d.left === 1 ? 'try' : 'tries'} left.` : ERRORS.locked)
      else setErr(ERRORS[d.error] || ERRORS.failed)
    } catch {
      setErr('Could not connect. Please check your internet.')
    }
    setBusy(false)
  }

  const input = 'w-full h-12 rounded-full bg-[#f6f3ee] border border-stone-200 px-4 text-[15px] outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20'
  const primary = 'w-full h-12 rounded-full bg-[#25D366] text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60'

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 mb-4" aria-hidden>
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-[12px] font-semibold text-[#817661]">or</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {step === 'closed' && (
        <button type="button" onClick={() => setStep('number')}
          className="w-full h-12 rounded-full bg-white border border-stone-200 shadow-sm text-[15px] font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform">
          <i className="fa-brands fa-whatsapp text-[20px] text-[#25D366]" />Continue with WhatsApp
        </button>
      )}

      {step === 'number' && (
        <form onSubmit={e => { e.preventDefault(); send() }} className="flex flex-col gap-3">
          <label htmlFor="wa-phone" className="text-[13px] font-semibold">Your WhatsApp number</label>
          <div className="flex items-center gap-2">
            <span className="h-12 px-4 rounded-full bg-[#f6f3ee] border border-stone-200 flex items-center text-[15px] font-semibold shrink-0">+91</span>
            <input id="wa-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" maxLength={14}
              value={phone} onChange={e => setPhone(e.target.value)} className={input} autoFocus />
          </div>
          {err && <p className="text-[12px] text-[#ba1a1a]">{err}</p>}
          <button type="submit" disabled={busy} className={primary}>
            <i className="fa-brands fa-whatsapp text-[18px]" />{busy ? 'Sending…' : 'Send code on WhatsApp'}
          </button>
          <button type="button" onClick={() => { setStep('closed'); setErr('') }} className="text-[13px] text-[#4f4633] py-1">Cancel</button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={e => { e.preventDefault(); verify() }} className="flex flex-col gap-3">
          <p className="text-[13px] leading-[19px] text-[#4f4633]">
            If <span className="font-semibold text-[#1c1c19]">+91 {phone}</span> is linked to a wrap&amp;read account, we have sent it a 6-digit code on WhatsApp. It is valid for 10 minutes.
          </p>
          <input type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" maxLength={6} aria-label="6-digit code"
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={input + ' text-center tracking-[0.4em] font-bold'} autoFocus />
          {err && <p className="text-[12px] text-[#ba1a1a]">{err}</p>}
          <button type="submit" disabled={busy || code.length !== 6} className={primary}>{busy ? 'Checking…' : 'Verify and sign in'}</button>
          <div className="flex items-center justify-between text-[13px]">
            <button type="button" onClick={() => { setStep('number'); setErr(''); setCode('') }} className="text-[#4f4633] py-1">Change number</button>
            <button type="button" onClick={send} disabled={busy || resendIn > 0} className="font-semibold text-[#795900] py-1 disabled:text-[#817661]">
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
          <p className="text-[12px] text-center text-[#817661]">No code? Your number may not be on an account yet. Sign in with Google or email above, then verify your number when you sell.</p>
        </form>
      )}
    </div>
  )
}
