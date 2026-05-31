'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const categories = ['textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const conditions = ['New', 'Good', 'Fair']
const conditionDesc: Record<string, string> = {
  New: 'Unused, sealed', Good: 'Minor wear only', Fair: 'Used but readable'
}
const emojis: Record<string, string> = {
  textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙'
}
const catDesc: Record<string, string> = {
  textbook: 'School & college', novel: 'Fiction & lit',
  notebook: 'Ruled, plain', art: 'Supplies',
  stationery: 'Pens, files', competitive: 'JEE, NEET'
}

const LOCATIONS = [
  'Sector 1, Chandigarh', 'Sector 2, Chandigarh', 'Sector 3, Chandigarh',
  'Sector 4, Chandigarh', 'Sector 5, Chandigarh', 'Sector 6, Chandigarh',
  'Sector 7, Chandigarh', 'Sector 8, Chandigarh', 'Sector 9, Chandigarh',
  'Sector 10, Chandigarh', 'Sector 11, Chandigarh', 'Sector 12, Chandigarh',
  'Sector 14, Chandigarh', 'Sector 15, Chandigarh', 'Sector 16, Chandigarh',
  'Sector 17, Chandigarh', 'Sector 18, Chandigarh', 'Sector 19, Chandigarh',
  'Sector 20, Chandigarh', 'Sector 21, Chandigarh', 'Sector 22, Chandigarh',
  'Sector 23, Chandigarh', 'Sector 24, Chandigarh', 'Sector 25, Chandigarh',
  'Sector 26, Chandigarh', 'Sector 27, Chandigarh', 'Sector 28, Chandigarh',
  'Sector 29, Chandigarh', 'Sector 30, Chandigarh', 'Sector 31, Chandigarh',
  'Sector 32, Chandigarh', 'Sector 33, Chandigarh', 'Sector 34, Chandigarh',
  'Sector 35, Chandigarh', 'Sector 36, Chandigarh', 'Sector 37, Chandigarh',
  'Sector 38, Chandigarh', 'Sector 39, Chandigarh', 'Sector 40, Chandigarh',
  'Sector 40-C, Chandigarh', 'Sector 41, Chandigarh', 'Sector 42, Chandigarh',
  'Sector 43, Chandigarh', 'Sector 44, Chandigarh', 'Sector 45, Chandigarh',
  'Sector 46, Chandigarh', 'Sector 47, Chandigarh', 'Sector 48, Chandigarh',
  'Sector 49, Chandigarh', 'Sector 50, Chandigarh', 'Sector 51, Chandigarh',
  'Sector 52, Chandigarh', 'Sector 53, Chandigarh', 'Sector 54, Chandigarh',
  'Sector 55, Chandigarh', 'Sector 56, Chandigarh',
  'Manimajra, Chandigarh', 'Burail, Chandigarh', 'Dhanas, Chandigarh',
  'Sector 1, Panchkula', 'Sector 2, Panchkula', 'Sector 4, Panchkula',
  'Sector 5, Panchkula', 'Sector 6, Panchkula', 'Sector 7, Panchkula',
  'Sector 8, Panchkula', 'Sector 9, Panchkula', 'Sector 10, Panchkula',
  'Sector 11, Panchkula', 'Sector 12, Panchkula', 'Sector 14, Panchkula',
  'Sector 15, Panchkula', 'Sector 20, Panchkula', 'Sector 21, Panchkula',
  'Sector 25, Panchkula', 'Kalka, Panchkula',
  'Phase 1, Mohali', 'Phase 2, Mohali', 'Phase 3B1, Mohali', 'Phase 3B2, Mohali',
  'Phase 4, Mohali', 'Phase 5, Mohali', 'Phase 6, Mohali', 'Phase 7, Mohali',
  'Phase 8, Mohali', 'Phase 9, Mohali', 'Phase 10, Mohali', 'Phase 11, Mohali',
  'Sector 58, Mohali', 'Sector 59, Mohali', 'Sector 60, Mohali',
  'Sector 61, Mohali', 'Sector 62, Mohali', 'Sector 63, Mohali',
  'Sector 64, Mohali', 'Sector 65, Mohali', 'Sector 66, Mohali',
  'Sector 67, Mohali', 'Sector 68, Mohali', 'Sector 70, Mohali',
  'Sector 71, Mohali', 'Sector 72, Mohali', 'Aerocity, Mohali',
  'Kharar, Mohali', 'Zirakpur', 'Derabassi', 'Dera Bassi',
]

const STEPS = ['Photos', 'Details', 'Pricing & Location']

export default function SellPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationRef = useRef<HTMLDivElement>(null)

  // WhatsApp gate
  const [phoneChecked, setPhoneChecked] = useState(false)
  const [hasPhone, setHasPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const [form, setForm] = useState({
    title: '', subtitle: '', price: '',
    origPrice: '', condition: 'Good',
    category: 'textbook', location: '',
  })

  useEffect(() => {
    if (isSignedIn === false) router.push('/')
  }, [isSignedIn])

  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch('/api/listings?admin=false')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mine = data.find((l: any) => l.sellerId === user.id)
          if (mine?.seller?.phone) { setHasPhone(true); setPhone(mine.seller.phone) }
        }
        setPhoneChecked(true)
      })
      .catch(() => setPhoneChecked(true))
  }, [isSignedIn, user])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!isSignedIn) return null

  async function sendOtp() {
    setSendingOtp(true)
    setOtpError('')
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    setSendingOtp(false)
    if (res.ok) setOtpSent(true)
    else setOtpError('Failed to send OTP. Try again.')
  }

  async function verifyOtp() {
    setVerifyingOtp(true)
    setOtpError('')
    const res = await fetch(`/api/otp/send?phone=${phone}&otp=${otp}`)
    const data = await res.json()
    if (data.valid) {
      await savePhone()
    } else {
      setOtpError(data.reason === 'Expired' ? '⏰ OTP expired. Request a new one.' : '❌ Wrong OTP. Try again.')
    }
    setVerifyingOtp(false)
  }

  async function savePhone() {
    setSavingPhone(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user?.id, phone: phone.trim() }),
    })
    setSavingPhone(false)
    setHasPhone(true)
  }

  const filteredLocations = locationSearch.length > 0
    ? LOCATIONS.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase())).slice(0, 8)
    : LOCATIONS.slice(0, 8)

  function selectLocation(loc: string) {
    setForm(prev => ({ ...prev, location: loc }))
    setLocationSearch(loc)
    setShowLocationDropdown(false)
  }

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const toAdd = files.slice(0, 3 - images.length)
    setImages(prev => [...prev, ...toAdd])
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function nextStep() {
    if (step === 0) {
      if (images.length < 2) { alert('Please add at least 2 photos. One must show the MRP/price tag.'); return }
      setStep(1); return
    }
    if (step === 1) {
      if (!form.title) { alert('Please enter a title'); return }
      setStep(2); return
    }
  }

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < images.length; i++) {
      setUploadProgress(`Uploading image ${i + 1} of ${images.length}…`)
      const file = images[i]
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('Listings').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (error) throw new Error('Image upload failed: ' + error.message)
      const { data } = supabase.storage.from('Listings').getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }
    setUploadProgress('')
    return urls
  }

  async function submit() {
    if (!form.title || !form.price || !form.location) { alert('Please fill in title, price and location'); return }
    const price = parseInt(form.price)
    const origPrice = form.origPrice ? parseInt(form.origPrice) : null
    if (price <= 0) { alert('Price must be greater than ₹0'); return }
    if (price > 10000) { alert('Maximum price is ₹10,000'); return }
    if (origPrice !== null) {
      if (origPrice <= price) { alert('Original price must be higher than selling price'); return }
      if (Math.round((1 - price / origPrice) * 100) > 90) { alert('Discount cannot exceed 90%'); return }
    }
    setLoading(true)
    try {
      const imageUrls = images.length > 0 ? await uploadImages() : []
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, subtitle: form.subtitle,
          price: parseInt(form.price),
          origPrice: form.origPrice ? parseInt(form.origPrice) : null,
          condition: form.condition, category: form.category,
          emoji: emojis[form.category], location: form.location,
          sellerId: user?.id!, images: imageUrls,
        }),
      })
      if (res.ok) { setDone(true) }
      else {
        const data = await res.json()
        if (data.error === 'listing_rejected') alert('❌ Listing not approved\n\n' + data.reason)
        else alert('Something went wrong. Try again.')
      }
    } catch (err: any) { alert(err.message || 'Could not connect.') }
    setLoading(false)
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-input: #FAFAF8;
      --bg-cat-active: #E1F5EE; --bg-cat: #fff;
      --bg-condition: #fff; --bg-condition-active: #E1F5EE;
      --nav-bg: #fff; --border: #EDE9E1;
      --text-primary: #1B2A4A; --text-secondary: #666;
      --text-muted: #bbb; --text-label: #999;
      --shadow-nav: 0 2px 12px rgba(27,42,74,0.06);
      --shadow-card: 0 2px 16px rgba(27,42,74,0.06);
      --dropdown-bg: #fff; --dropdown-border: #F0EDE7;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --bg-input: #1A1D27;
        --bg-cat-active: #0F2D1F; --bg-cat: #242736;
        --bg-condition: #242736; --bg-condition-active: #0F2D1F;
        --nav-bg: #13151F; --border: #2A2D3E;
        --text-primary: #E8E6F0; --text-secondary: #8B8FA8;
        --text-muted: #555878; --text-label: #6B6F88;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
        --shadow-card: 0 2px 16px rgba(0,0,0,0.25);
        --dropdown-bg: #1A1D27; --dropdown-border: #2A2D3E;
      }
    }
    body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text-primary); }
    .kalam { font-family: 'Kalam', cursive; }
    input { color: var(--text-primary) !important; font-weight: 500; background: var(--bg-input) !important; }
    input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
    input:focus { outline: none !important; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1) !important; }
    .card { background: var(--bg-card); border-radius: 20px; border: 1.5px solid var(--border); padding: 24px; margin-bottom: 16px; box-shadow: var(--shadow-card); }
    .label { font-size: 11px; color: var(--text-label); display: block; margin-bottom: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; }
    .input { width: 100%; padding: 11px 14px; border-radius: 12px; border: 1.5px solid var(--border); font-size: 14px; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
    .cat-btn { padding: 12px 8px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--bg-cat); cursor: pointer; transition: all 0.15s; text-align: left; }
    .cat-btn.active { border: 2px solid #1D9E75; background: var(--bg-cat-active); }
    .cat-btn:hover { border-color: #1D9E75; transform: translateY(-1px); }
    .cond-btn { flex: 1; padding: 12px 8px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--bg-condition); cursor: pointer; transition: all 0.15s; text-align: center; }
    .cond-btn.active { border: 2px solid #1D9E75; background: var(--bg-condition-active); }
    .loc-item:hover { background: #F0FDF8 !important; }
    @media (prefers-color-scheme: dark) { .loc-item:hover { background: #0F2D1F !important; } }
    .add-photo:hover { border-color: #1D9E75 !important; background: #E1F5EE !important; }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .step-content { animation: slideIn 0.3s ease; }
    @keyframes pulse { 0%,100% { box-shadow: 0 4px 16px rgba(29,158,117,0.3); } 50% { box-shadow: 0 6px 24px rgba(29,158,117,0.5); } }
    .submit-btn:not(:disabled) { animation: pulse 2.5s ease-in-out infinite; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s ease; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .photo-slot { width: 100px; height: 100px; }
    @media (max-width: 400px) { .photo-slot { width: 85px; height: 85px; } }
  `

  const discount = form.price && form.origPrice && parseInt(form.price) < parseInt(form.origPrice)
    ? Math.round((1 - parseInt(form.price) / parseInt(form.origPrice)) * 100) : 0

  if (!phoneChecked) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid #1D9E75', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </>
  )

  // OTP gate
  if (!hasPhone) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>←</button>
          <span className="kalam" style={{ fontSize: '16px', fontWeight: '700', color: '#1D9E75' }}>
            {otpSent ? 'Enter your OTP' : 'Verify your number'}
          </span>
        </nav>
        <div style={{ maxWidth: '460px', margin: '48px auto', padding: '0 16px' }}>
          <div className="card fade-in">
            <div style={{ width: '64px', height: '64px', background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>
              {otpSent ? '🔐' : '💬'}
            </div>
            <h2 className="kalam" style={{ fontSize: '22px', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '8px' }}>
              {otpSent ? 'Enter verification code' : 'Verify your WhatsApp'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.6', marginBottom: '24px' }}>
              {otpSent
                ? `We sent a 6-digit code to +91 ${phone} on WhatsApp`
                : 'We\'ll send a one-time code to verify your number is real'}
            </p>

            {!otpSent ? (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 12px', fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0, gap: '4px' }}>🇮🇳 +91</div>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    style={{ flex: 1, padding: '11px 13px', borderRadius: '10px', border: `1.5px solid ${phone.length === 10 ? '#1D9E75' : 'var(--border)'}`, fontSize: '14px', fontFamily: 'DM Sans, sans-serif', background: 'var(--bg-input)', color: 'var(--text-primary)', transition: 'all 0.15s' }}
                  />
                </div>
                {phone.length > 0 && phone.length < 10 && (
                  <div style={{ fontSize: '11px', color: '#E24B4A', marginBottom: '8px' }}>⚠️ Enter a 10-digit number</div>
                )}
                {otpError && (
                  <div style={{ fontSize: '12px', color: '#E24B4A', marginBottom: '8px' }}>{otpError}</div>
                )}
                <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', border: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <div>✅ Required to receive buyer inquiries</div>
                    <div>✅ Only shown when someone contacts you</div>
                    <div>✅ Verified numbers only — keeps fakes out</div>
                  </div>
                </div>
                <button
                  onClick={sendOtp}
                  disabled={sendingOtp || phone.length < 10}
                  style={{ width: '100%', background: phone.length === 10 ? '#1D9E75' : '#ccc', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: phone.length < 10 ? 'not-allowed' : 'pointer', fontFamily: 'Kalam, cursive', marginTop: '4px', transition: 'all 0.2s', boxShadow: phone.length === 10 ? '0 4px 16px rgba(29,158,117,0.3)' : 'none' }}>
                  {sendingOtp ? 'Sending…' : 'Send OTP on WhatsApp →'}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <input
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    style={{ width: '200px', padding: '14px', borderRadius: '12px', border: `1.5px solid ${otp.length === 6 ? '#1D9E75' : 'var(--border)'}`, fontSize: '26px', fontFamily: 'Kalam, cursive', textAlign: 'center', letterSpacing: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)', transition: 'all 0.15s' }}
                  />
                </div>
                {otpError && (
                  <div style={{ fontSize: '12px', color: '#E24B4A', textAlign: 'center', marginBottom: '8px' }}>{otpError}</div>
                )}
                <button
                  onClick={verifyOtp}
                  disabled={verifyingOtp || savingPhone || otp.length < 6}
                  style={{ width: '100%', background: otp.length === 6 ? '#1D9E75' : '#ccc', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: otp.length < 6 ? 'not-allowed' : 'pointer', fontFamily: 'Kalam, cursive', marginTop: '8px', transition: 'all 0.2s', boxShadow: otp.length === 6 ? '0 4px 16px rgba(29,158,117,0.3)' : 'none' }}>
                  {verifyingOtp || savingPhone ? 'Verifying…' : 'Verify & continue →'}
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(''); setOtpError('') }}
                  style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                  ← Change number
                </button>
                <button
                  onClick={sendOtp}
                  disabled={sendingOtp}
                  style={{ width: '100%', background: 'transparent', color: '#1D9E75', border: 'none', padding: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  {sendingOtp ? 'Resending…' : 'Resend OTP'}
                </button>
              </>
            )}

            <button onClick={() => router.push('/marketplace')} style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '12px', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
              Cancel — go back to marketplace
            </button>
          </div>
        </div>
      </div>
    </>
  )

  // Success — under review screen
  if (done) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '28px', padding: '48px 36px', textAlign: 'center', maxWidth: '400px', width: '100%', border: '1.5px solid var(--border)', boxShadow: '0 8px 40px rgba(27,42,74,0.10)' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 24px', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}>⏳</div>
          <h2 className="kalam" style={{ color: 'var(--text-primary)', fontSize: '26px', marginBottom: '8px' }}>Listing submitted!</h2>
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FEF3C7', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#92400E', fontWeight: '600', marginBottom: '6px' }}>🔍 Under review</div>
            <div style={{ fontSize: '12px', color: '#A16207', lineHeight: '1.7' }}>
              Your listing is being reviewed and will go live once approved — usually within a few hours. You will be notified on WhatsApp.
            </div>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8', textAlign: 'left' }}>
            <div>✅ AI content check passed</div>
            <div>⏳ Awaiting manual approval</div>
            <div>📱 You will receive WhatsApp confirmation</div>
          </div>
          <button onClick={() => router.push('/marketplace')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', width: '100%', marginBottom: '10px', fontFamily: 'Kalam, cursive', boxShadow: '0 6px 20px rgba(29,158,117,0.3)' }}>
            Browse marketplace →
          </button>
          <button onClick={() => { setDone(false); setStep(0); setForm({ title: '', subtitle: '', price: '', origPrice: '', condition: 'Good', category: 'textbook', location: '' }); setImages([]); setPreviews([]); setLocationSearch('') }}
            style={{ background: 'transparent', color: '#1D9E75', border: '1.5px solid #1D9E75', borderRadius: '14px', padding: '13px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
            Post another listing
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : router.push('/marketplace')}
            style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <img src="/logo.png" alt="BuddyBooks" style={{ height: '26px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="kalam" style={{ fontSize: '15px', fontWeight: '700', color: '#1D9E75' }}>Post a listing</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>Step {step + 1} of 3</span>
            </div>
            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((step + 1) / 3) * 100}%`, background: 'linear-gradient(90deg, #1D9E75, #0F6E56)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </nav>

        {/* Step indicators */}
        <div style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '12px 20px', display: 'flex', gap: '4px' }}>
          {STEPS.map((s, i) => (
            <div key={s} onClick={() => i < step ? setStep(i) : null}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', cursor: i < step ? 'pointer' : 'default', opacity: i > step ? 0.4 : 1 }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: i <= step ? '#1D9E75' : 'var(--border)', color: i <= step ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0, transition: 'all 0.2s' }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '11px', fontWeight: i === step ? '600' : '400', color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: '1px', background: i < step ? '#1D9E75' : 'var(--border)', marginLeft: '4px', transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: '560px', margin: '24px auto', padding: '0 16px 40px' }}>

          {/* STEP 0 — Photos */}
          {step === 0 && (
            <div className="step-content">
              <div className="card">
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>📷 Add photos</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Minimum 2 photos required. Must include MRP/price tag.</p>
                <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>📋</span>
                  <div style={{ fontSize: '12px', color: '#92400E', lineHeight: '1.7' }}>
                    <div style={{ fontWeight: '700', marginBottom: '3px' }}>Required photos:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: images.length >= 1 ? '#1D9E75' : '#D97706' }}>{images.length >= 1 ? '✅' : '⏺'}</span> Photo 1 — front cover of the book
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: images.length >= 2 ? '#1D9E75' : '#D97706' }}>{images.length >= 2 ? '✅' : '⏺'}</span> Photo 2 — MRP / price tag clearly visible
                    </div>
                    {images.length >= 3 && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1D9E75' }}>✅</span> Photo 3 — optional extra</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {previews.map((src, i) => (
                    <div key={i} className="photo-slot" style={{ position: 'relative' }}>
                      <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px', border: i === 0 ? '2.5px solid #1D9E75' : i === 1 ? '2.5px solid #F59E0B' : '1.5px solid var(--border)' }} />
                      <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '8px', background: i === 0 ? '#1D9E75' : i === 1 ? '#F59E0B' : 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>
                        {i === 0 ? 'COVER' : i === 1 ? 'MRP TAG' : 'EXTRA'}
                      </span>
                      <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '-7px', right: '-7px', width: '24px', height: '24px', borderRadius: '50%', background: '#E24B4A', color: '#fff', border: '2.5px solid var(--bg-card)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="add-photo photo-slot" style={{ border: `2px dashed ${images.length < 2 ? '#F59E0B' : 'var(--border)'}`, borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', gap: '4px', transition: 'all 0.15s', background: images.length < 2 ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span style={{ fontSize: '10px', fontWeight: '600', color: images.length === 0 ? '#D97706' : images.length === 1 ? '#D97706' : 'var(--text-muted)' }}>
                        {images.length === 0 ? 'Cover photo' : images.length === 1 ? 'MRP tag photo' : 'Add photo'}
                      </span>
                      <input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ height: '4px', flex: 1, borderRadius: '99px', background: images.length > i ? (i < 2 ? '#1D9E75' : '#8B8FA8') : 'var(--border)', transition: 'background 0.3s' }} />
                  ))}
                  <span style={{ fontSize: '11px', color: images.length >= 2 ? '#1D9E75' : '#D97706', fontWeight: '600', flexShrink: 0 }}>{images.length}/3 {images.length < 2 ? `(${2 - images.length} more needed)` : '✓'}</span>
                </div>
              </div>
              {images.length < 2 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '12px', color: '#E24B4A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span>
                  <span>Add at least 2 photos — cover + MRP tag. Listings without price proof may be rejected.</span>
                </div>
              )}
              <button onClick={nextStep} disabled={images.length < 2}
                style={{ width: '100%', background: images.length >= 2 ? '#1D9E75' : '#ccc', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: '700', cursor: images.length < 2 ? 'not-allowed' : 'pointer', fontFamily: 'Kalam, cursive', boxShadow: images.length >= 2 ? '0 4px 16px rgba(29,158,117,0.3)' : 'none', transition: 'all 0.2s' }}>
                {images.length < 2 ? `Add ${2 - images.length} more photo${2 - images.length > 1 ? 's' : ''} to continue` : 'Continue → Item details'}
              </button>
            </div>
          )}

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div className="step-content">
              <div className="card">
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>📝 Item details</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Tell buyers what you are selling.</p>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Title *</label>
                  <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. NCERT Physics Part 1 — Class 12" className="input" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Subtitle <span style={{ color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                  <input value={form.subtitle} onChange={e => update('subtitle', e.target.value)} placeholder="e.g. 2023 edition, lightly used" className="input" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Category *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => update('category', cat)} className={`cat-btn${form.category === cat ? ' active' : ''}`}>
                        <div style={{ fontSize: '22px', marginBottom: '4px' }}>{emojis[cat]}</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: form.category === cat ? '#0F6E56' : 'var(--text-primary)', fontFamily: 'Kalam, cursive', textTransform: 'capitalize' }}>{cat}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{catDesc[cat]}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Condition *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {conditions.map(c => (
                      <button key={c} onClick={() => update('condition', c)} className={`cond-btn${form.condition === c ? ' active' : ''}`}>
                        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{c === 'New' ? '✨' : c === 'Good' ? '👍' : '📖'}</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: form.condition === c ? '#0F6E56' : 'var(--text-primary)', fontFamily: 'Kalam, cursive' }}>{c}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{conditionDesc[c]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={nextStep} disabled={!form.title}
                style={{ width: '100%', background: form.title ? '#1D9E75' : '#ccc', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: '700', cursor: form.title ? 'pointer' : 'not-allowed', fontFamily: 'Kalam, cursive', boxShadow: form.title ? '0 4px 16px rgba(29,158,117,0.3)' : 'none', transition: 'all 0.2s' }}>
                Continue → Pricing & Location
              </button>
            </div>
          )}

          {/* STEP 2 — Pricing + Location */}
          {step === 2 && (
            <div className="step-content">
              <div className="card">
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>💰 Pricing</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Set a fair price — buyers are students too!</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="label">Your price (₹) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1D9E75', fontWeight: '700', fontSize: '15px', fontFamily: 'Kalam, cursive' }}>₹</span>
                      <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="180" className="input" style={{ paddingLeft: '28px' }} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Original price (₹)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px', fontFamily: 'Kalam, cursive' }}>₹</span>
                      <input type="number" value={form.origPrice} onChange={e => update('origPrice', e.target.value)} placeholder="320" className="input" style={{ paddingLeft: '28px' }} />
                    </div>
                  </div>
                </div>
                {discount > 0 && (
                  <div style={{ background: 'linear-gradient(135deg, #E1F5EE, #D1FAE5)', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#0F6E56', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(29,158,117,0.2)' }}>
                    🎉 <span>{discount}% off — buyers love a great deal!</span>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>📍 Location</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Where can the buyer meet you?</p>
                <div ref={locationRef} style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>📍</span>
                    <input value={locationSearch}
                      onChange={e => { setLocationSearch(e.target.value); setForm(prev => ({ ...prev, location: e.target.value })); setShowLocationDropdown(true) }}
                      onFocus={() => setShowLocationDropdown(true)}
                      placeholder="Type your sector or area…"
                      className="input" style={{ paddingLeft: '42px', paddingRight: form.location ? '36px' : '14px', border: `1.5px solid ${form.location ? '#1D9E75' : 'var(--border)'}` }} />
                    {form.location && (
                      <button onClick={() => { setForm(prev => ({ ...prev, location: '' })); setLocationSearch(''); setShowLocationDropdown(true) }}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)', padding: 0 }}>×</button>
                    )}
                  </div>
                  {showLocationDropdown && filteredLocations.length > 0 && (
                    <div style={{ position: 'absolute', top: '48px', left: 0, right: 0, background: 'var(--dropdown-bg)', border: '1.5px solid var(--border)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(27,42,74,0.12)', zIndex: 100, overflow: 'hidden', maxHeight: '240px', overflowY: 'auto' }}>
                      {filteredLocations.map(loc => (
                        <div key={loc} className="loc-item" onClick={() => selectLocation(loc)}
                          style={{ padding: '11px 16px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--dropdown-border)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.1s' }}>
                          <span style={{ fontSize: '14px' }}>📍</span>
                          <div>
                            <span style={{ fontWeight: '600' }}>{loc.split(',')[0]}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{loc.includes(',') ? ', ' + loc.split(',').slice(1).join(',').trim() : ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showLocationDropdown && locationSearch.length > 0 && filteredLocations.length === 0 && (
                    <div style={{ position: 'absolute', top: '48px', left: 0, right: 0, background: 'var(--dropdown-bg)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', zIndex: 100 }}>
                      No matches. Try "Sector 22" or "Mohali".
                    </div>
                  )}
                </div>
              </div>

              {form.title && form.price && form.location && (
                <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid #1D9E75', padding: '18px 20px', marginBottom: '16px', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>✅ Ready to submit for review</div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', overflow: 'hidden', flexShrink: 0, border: '1.5px solid var(--border)' }}>
                      {previews[0] ? <img src={previews[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emojis[form.category]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{form.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 {form.location} · 📷 {images.length} photos</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="kalam" style={{ fontSize: '20px', color: '#1D9E75', fontWeight: '700' }}>₹{form.price}</div>
                      {form.origPrice && <div style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{form.origPrice}</div>}
                    </div>
                  </div>
                </div>
              )}

              {uploadProgress && (
                <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px', color: '#0F6E56', textAlign: 'center', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', border: '2px solid #1D9E75', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  {uploadProgress}
                </div>
              )}

              <button onClick={submit} disabled={loading || !form.title || !form.price || !form.location} className="submit-btn"
                style={{ width: '100%', background: loading || !form.title || !form.price || !form.location ? '#ccc' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: loading || !form.title || !form.price || !form.location ? 'not-allowed' : 'pointer', fontFamily: 'Kalam, cursive', transition: 'all 0.2s' }}>
                {loading ? '⏳ Uploading…' : '🚀 Submit for review'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>Free to post · Usually approved within a few hours</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}