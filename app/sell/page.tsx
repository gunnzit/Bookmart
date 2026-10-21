'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { PHONE_OTP_REQUIRED } from '@/lib/features'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MAX_PHOTOS = 3
const MAX_PHOTO_MB = 10
const DRAFT_KEY = 'pageplus_sell_draft'

const categories = ['textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const emojis: Record<string, string> = {
  textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙',
}
const catLabel: Record<string, string> = {
  textbook: 'Textbook', novel: 'Novel', notebook: 'Notebook',
  art: 'Art', stationery: 'Stationery', competitive: 'Competitive',
}

// Stored value must stay New / Good / Fair (the server only accepts these).
const GRADES = [
  { value: 'New', label: 'Like New', pct: 0.5, desc: 'Unmarked pages, crisp spine, unused feel' },
  { value: 'Good', label: 'Good', pct: 0.35, desc: 'Clean pages, light cover wear, fully intact binding' },
  { value: 'Fair', label: 'Fair', pct: 0.2, desc: 'Pencil notes, minor highlighting, complete text' },
]

const BOARDS = ['CBSE', 'ICSE', 'Punjab Board', 'Other']
const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Other']

const SLOTS = [
  { name: 'Front cover', hint: 'Required' },
  { name: 'MRP tag', hint: 'Required' },
  { name: 'Extra', hint: 'Optional' },
]

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

const CARD = 'bg-white rounded-[22px] p-4 shadow-[0_6px_20px_rgba(120,70,40,0.08)]'
const INPUT = 'w-full bg-[#FFF1EA] rounded-[16px] px-3.5 py-3 text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] outline-none focus:ring-2 focus:ring-[#FCE3D6]'
const LABEL = 'block text-[12px] text-[#5E5650] mb-1.5'
const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-[13px] active:scale-95 transition-transform ${
        on ? 'bg-[#E8632B] text-white font-semibold' : 'bg-[#FFF1EA] text-[#1E1B19] font-medium'
      }`}
    >
      {children}
    </button>
  )
}

function StepTitle({ n, children, right }: { n: number; children: React.ReactNode; right?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[#F8EDE6] text-[#5E5650] text-[12px] font-bold flex items-center justify-center">{n}</span>
        <h2 className="text-[17px] leading-[22px] font-bold text-[#1E1B19]">{children}</h2>
      </div>
      {right && <span className="text-[12px] text-[#5E5650]">{right}</span>}
    </div>
  )
}

export default function SellPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [priceTouched, setPriceTouched] = useState(false)
  const [donate, setDonate] = useState(false)

  // Phone gate
  const [phoneChecked, setPhoneChecked] = useState(false)
  const [hasPhone, setHasPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [otpStep, setOtpStep] = useState<'number' | 'code'>('number')
  const [code, setCode] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [otpMsg, setOtpMsg] = useState('')
  const [resendIn, setResendIn] = useState(0)

  const [form, setForm] = useState({
    title: '', board: '', grade: '', edition: '', note: '',
    price: '', origPrice: '', condition: 'Good',
    category: 'textbook', location: '',
  })

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        setForm(prev => ({ ...prev, ...d }))
        if (d.location) setLocationSearch(d.location)
        if (d.price) setPriceTouched(true)
        if (d.donate) setDonate(true)
      }
    } catch {}
  }, [])

  // Save draft
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, donate })) } catch {}
  }, [form, donate])

  useEffect(() => {
    if (isSignedIn === false) router.push('/')
  }, [isSignedIn, router])

  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch('/api/user')
      .then(r => r.json())
      .then(d => {
        if (d?.phone) setPhone(String(d.phone))
        // With the code check switched off, a saved number is enough
        if (d?.verified || (!PHONE_OTP_REQUIRED && d?.hasPhone)) setHasPhone(true)
        setPhoneChecked(true)
      })
      .catch(() => setPhoneChecked(true))
  }, [isSignedIn, user])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const grade = GRADES.find(g => g.value === form.condition) || GRADES[1]
  const mrp = parseInt(form.origPrice) || 0
  const suggested = mrp > 0 ? Math.max(1, Math.round(mrp * grade.pct)) : 0
  const bandLow = suggested ? Math.max(1, Math.round(suggested * 0.9)) : 0
  const bandHigh = suggested ? Math.round(suggested * 1.1) : 0
  const priceNum = parseInt(form.price) || 0

  // Auto-fill the suggested price until the seller types their own
  useEffect(() => {
    if (!priceTouched && suggested > 0) {
      setForm(prev => ({ ...prev, price: String(suggested) }))
    }
  }, [suggested, priceTouched])

  if (!isSignedIn) return null

  function update(field: string, value: string) {
    setError('')
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const OTP_ERRORS: Record<string, string> = {
    bad_number: 'Enter a valid 10-digit mobile number.',
    phone_taken: 'This number is already verified on another Pageplus account.',
    too_many: 'Too many codes sent. Please try again in an hour.',
    send_failed: 'We could not send the code. Check that this number is on WhatsApp and try again.',
    expired: 'That code has expired. Tap Resend to get a new one.',
    locked: 'Too many wrong tries. Tap Resend to get a new code.',
    no_code: 'Request a new code first.',
    bad_code: 'Enter the 6-digit code.',
  }

  async function sendCode() {
    if (phone.length < 10 || otpBusy) return
    setOtpBusy(true)
    setOtpMsg('')

    // Code check switched off: just save the number
    if (!PHONE_OTP_REQUIRED) {
      try {
        const res = await fetch('/api/user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        })
        if (res.ok) setHasPhone(true)
        else setOtpMsg('Enter a valid WhatsApp number.')
      } catch {
        setOtpMsg('Could not connect. Please try again.')
      }
      setOtpBusy(false)
      return
    }

    try {
      const res = await fetch('/api/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setOtpStep('code')
        setCode('')
        setResendIn(Number(d.resendIn) || 60)
      } else if (d.error === 'wait') {
        setOtpStep('code')
        setResendIn(Number(d.seconds) || 60)
        setOtpMsg('A code was just sent. Please wait before asking for another.')
      } else {
        setOtpMsg(OTP_ERRORS[d.error] || 'Something went wrong. Please try again.')
      }
    } catch {
      setOtpMsg('Could not connect. Please try again.')
    }
    setOtpBusy(false)
  }

  async function verifyCode() {
    if (code.length !== 6 || otpBusy) return
    setOtpBusy(true)
    setOtpMsg('')
    try {
      const res = await fetch('/api/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setHasPhone(true)
      } else if (d.error === 'wrong') {
        setOtpMsg('Wrong code. ' + (d.left > 0 ? d.left + (d.left === 1 ? ' try left.' : ' tries left.') : 'Tap Resend to get a new code.'))
      } else {
        setOtpMsg(OTP_ERRORS[d.error] || 'Something went wrong. Please try again.')
      }
    } catch {
      setOtpMsg('Could not connect. Please try again.')
    }
    setOtpBusy(false)
  }

  const filteredLocations = locationSearch.length > 0
    ? LOCATIONS.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase())).slice(0, 8)
    : LOCATIONS.slice(0, 8)

  function selectLocation(loc: string) {
    setForm(prev => ({ ...prev, location: loc }))
    setLocationSearch(loc)
    setShowLocationDropdown(false)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    const toAdd: File[] = []
    for (const f of files.slice(0, MAX_PHOTOS - images.length)) {
      if (f.size > MAX_PHOTO_MB * 1024 * 1024) { setError(`Each photo must be under ${MAX_PHOTO_MB} MB.`); continue }
      toAdd.push(f)
    }
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

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < images.length; i++) {
      setUploadProgress(`Uploading photo ${i + 1} of ${images.length}…`)
      const file = images[i]
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('Listings').upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (error) throw new Error('Photo upload failed: ' + error.message)
      const { data } = supabase.storage.from('Listings').getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }
    setUploadProgress('')
    return urls
  }

  function validate(): string {
    if (images.length < 2) return 'Add at least 2 photos: the front cover and the MRP tag.'
    if (!form.title.trim()) return 'Add the book title.'
    if (!donate) {
      if (!mrp) return 'Add the original MRP printed on the book.'
      if (!priceNum || priceNum <= 0) return 'Add your selling price.'
      if (priceNum > 10000) return 'Maximum price is ₹10,000.'
      if (mrp <= priceNum) return 'Selling price must be lower than the MRP.'
      if (Math.round((1 - priceNum / mrp) * 100) > 90) return 'Discount cannot be more than 90%.'
    }
    if (!form.location.trim()) return 'Choose where buyers can meet you.'
    return ''
  }

  function buildSubtitle() {
    const parts = [form.board, form.grade, form.edition.trim()].filter(Boolean)
    let s = parts.join(' · ')
    if (form.note.trim()) s = s ? `${s} · ${form.note.trim()}` : form.note.trim()
    return s.slice(0, 120)
  }

  async function submit() {
    const msg = validate()
    if (msg) { setError(msg); return }
    setLoading(true)
    setError('')
    try {
      const imageUrls = await uploadImages()
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: buildSubtitle(),
          price: donate ? 0 : priceNum,
          origPrice: donate ? (mrp > 0 ? mrp : null) : mrp,
          condition: form.condition,
          category: form.category,
          emoji: emojis[form.category],
          location: form.location,
          sellerId: user?.id!,
          images: imageUrls,
        }),
      })
      if (res.ok) {
        try { localStorage.removeItem(DRAFT_KEY) } catch {}
        setDone(true)
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'phone_not_verified') { setHasPhone(false); setOtpStep('number') }
        else if (data.error === 'listing_rejected') setError('Listing not approved. ' + (data.reason || ''))
        else setError('Something went wrong. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect. Please try again.')
    }
    setUploadProgress('')
    setLoading(false)
  }

  const shell = 'min-h-screen font-[family-name:Plus_Jakarta_Sans,sans-serif] text-[#1E1B19]'
  const bg = { background: 'linear-gradient(180deg,#FDEADF 0%,#FFF7F2 100%)' }

  if (!phoneChecked) return (
    <div className={`${shell} flex items-center justify-center`} style={bg}>
      <div className="w-6 h-6 rounded-full border-[3px] border-[#E8632B] border-t-transparent animate-spin" />
    </div>
  )

  if (!hasPhone) return (
    <div className={shell} style={bg}>
      <header className="px-5 pt-4 flex items-center gap-3">
        <button onClick={() => router.push('/marketplace')} aria-label="Back"
          className={`w-10 h-10 rounded-full bg-white ${SHADOW} flex items-center justify-center text-[18px] active:scale-95 transition-transform`}>←</button>
        <h1 className="text-[20px] font-bold">{PHONE_OTP_REQUIRED ? 'Verify your WhatsApp' : 'Your WhatsApp number'}</h1>
      </header>
      <div className="max-w-md mx-auto px-5 mt-6">
        <div className={CARD}>
          {otpStep === 'number' ? (
            <>
              <p className="text-[14px] text-[#5E5650] leading-[20px] mb-4">
                {PHONE_OTP_REQUIRED
                  ? 'We will send a 6-digit code on WhatsApp to confirm this number. Buyers and our team use it to reach you about your books.'
                  : 'Buyers and our team use this number to reach you about your books. Add it once and you are set.'}
              </p>
              <div className="flex gap-2">
                <div className="flex items-center bg-[#FFF1EA] rounded-[16px] px-3.5 text-[14px] text-[#5E5650] font-medium shrink-0">+91</div>
                <input
                  value={phone}
                  inputMode="numeric"
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpMsg('') }}
                  placeholder="98765 43210"
                  className={INPUT}
                />
              </div>
              {phone.length > 0 && phone.length < 10 && (
                <p className="text-[12px] text-[#D64545] mt-2">Enter a 10-digit number.</p>
              )}
              {otpMsg && <p className="text-[12px] text-[#D64545] mt-2">{otpMsg}</p>}
              <button onClick={sendCode} disabled={otpBusy || phone.length < 10}
                className="mt-5 w-full h-[52px] rounded-full bg-[#E8632B] text-white text-[17px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform">
                {otpBusy ? (PHONE_OTP_REQUIRED ? 'Sending…' : 'Saving…') : (PHONE_OTP_REQUIRED ? 'Send code on WhatsApp' : 'Save and continue')}
              </button>
            </>
          ) : (
            <>
              <p className="text-[14px] text-[#5E5650] leading-[20px] mb-4">
                We sent a 6-digit code on WhatsApp to +91 {phone}. It is valid for 10 minutes.
              </p>
              <input
                value={code}
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpMsg('') }}
                placeholder="------"
                className={`${INPUT} text-center !text-[28px] tracking-[0.4em] font-bold`}
              />
              {otpMsg && <p className="text-[12px] text-[#D64545] mt-2">{otpMsg}</p>}
              <button onClick={verifyCode} disabled={otpBusy || code.length !== 6}
                className="mt-5 w-full h-[52px] rounded-full bg-[#E8632B] text-white text-[17px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform">
                {otpBusy ? 'Checking…' : 'Verify and continue'}
              </button>
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => { setOtpStep('number'); setOtpMsg(''); setCode('') }} className="py-2 text-[14px] text-[#5E5650]">Change number</button>
                <button onClick={sendCode} disabled={resendIn > 0 || otpBusy} className="py-2 text-[14px] font-semibold text-[#C4501A] disabled:text-[#9A908A]">
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </div>
              <a href="https://wa.me/919914735738" className="block text-center text-[12px] text-[#5E5650] mt-2">Not getting the code? Chat with us</a>
            </>
          )}
          <button onClick={() => router.push('/marketplace')} className="w-full mt-2 py-3 text-[14px] text-[#5E5650]">Not now</button>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div className={`${shell} flex items-center justify-center px-5`} style={bg}>
      <div className={`${CARD} max-w-sm w-full text-center !p-8`}>
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF1EA] flex items-center justify-center text-[28px] mb-4">⏳</div>
        <h2 className="text-[20px] font-bold mb-2">Listing submitted</h2>
        <p className="text-[14px] text-[#5E5650] leading-[20px] mb-6">
          We are checking it now. It goes live once approved, usually within a few hours.
        </p>
        <button onClick={() => router.push('/marketplace')}
          className="w-full h-[52px] rounded-full bg-[#E8632B] text-white text-[17px] font-semibold active:scale-[0.98] transition-transform">
          Back to marketplace
        </button>
        <button
          onClick={() => {
            setDone(false)
            setForm({ title: '', board: '', grade: '', edition: '', note: '', price: '', origPrice: '', condition: 'Good', category: 'textbook', location: '' })
            setImages([]); setPreviews([]); setLocationSearch(''); setPriceTouched(false); setDonate(false)
          }}
          className={`w-full h-11 mt-3 rounded-full bg-white text-[14px] font-semibold ${SHADOW} active:scale-[0.98] transition-transform`}>
          List another book
        </button>
      </div>
    </div>
  )

  return (
    <div className={shell} style={bg}>
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#FDEADF]/80">
        <div className="h-16 px-5 flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => router.back()} aria-label="Back"
            className={`w-10 h-10 rounded-full bg-white ${SHADOW} flex items-center justify-center text-[18px] active:scale-95 transition-transform`}>←</button>
          <h1 className="text-[20px] font-bold">Sell a book</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-20 pb-40 flex flex-col gap-7">
        <p className="text-[14px] text-[#5E5650] -mb-2">Free to list. You keep the full price.</p>

        {/* 1 Photos */}
        <section>
          <StepTitle n={1} right={`${images.length} of ${MAX_PHOTOS} added`}>Photos</StepTitle>
          <div className={CARD}>
            <div className="grid grid-cols-3 gap-3">
              {SLOTS.map((slot, i) => {
                const src = previews[i]
                if (src) {
                  return (
                    <div key={i} className="relative aspect-[3/4] rounded-[18px] overflow-hidden bg-[#F8EDE6]">
                      <img src={src} alt={slot.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-[#1E1B19]/75 rounded-full px-2 py-0.5 text-center text-[11px] text-white font-medium">{slot.name}</span>
                      <button onClick={() => removeImage(i)} aria-label="Remove photo"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-[#5E5650] text-[14px] flex items-center justify-center">×</button>
                    </div>
                  )
                }
                const isNext = i === images.length
                return (
                  <button key={i} type="button"
                    onClick={() => isNext && fileRef.current?.click()}
                    className={`aspect-[3/4] rounded-[18px] bg-[#FFF1EA] flex flex-col items-center justify-center gap-1 text-center p-2 transition-transform ${isNext ? 'active:scale-95' : 'opacity-60'}`}>
                    <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[16px] shadow-[0_2px_8px_rgba(120,70,40,0.06)]">+</span>
                    <span className="text-[12px] font-medium text-[#1E1B19] leading-tight">{slot.name}</span>
                    <span className="text-[12px] text-[#9A908A] leading-none">{slot.hint}</span>
                  </button>
                )
              })}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            <p className="text-[12px] text-[#5E5650] mt-3">
              {images.length < 2
                ? 'Add the front cover first, then a clear photo of the price tag.'
                : 'Looks good. Clear photos sell faster.'}
            </p>
          </div>
        </section>

        {/* 2 Details */}
        <section>
          <StepTitle n={2}>Book details</StepTitle>
          <div className={`${CARD} flex flex-col gap-4`}>
            <div>
              <label className={LABEL}>Book title</label>
              <input value={form.title} onChange={e => update('title', e.target.value)}
                placeholder="e.g. NCERT Mathematics Class 10" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
                {categories.map(c => (
                  <Chip key={c} on={form.category === c} onClick={() => update('category', c)}>{catLabel[c]}</Chip>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Education board (optional)</label>
              <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
                {BOARDS.map(b => (
                  <Chip key={b} on={form.board === b} onClick={() => update('board', form.board === b ? '' : b)}>{b}</Chip>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Class (optional)</label>
              <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
                {CLASSES.map(c => (
                  <Chip key={c} on={form.grade === c} onClick={() => update('grade', form.grade === c ? '' : c)}>{c}</Chip>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Edition (optional)</label>
              <input value={form.edition} onChange={e => update('edition', e.target.value)}
                placeholder="e.g. 2025-26 edition" className={INPUT} />
            </div>
          </div>
        </section>

        {/* 3 Condition */}
        <section>
          <StepTitle n={3} right="An honest rating sells faster">Condition</StepTitle>
          <div className={`${CARD} flex flex-col gap-3`}>
            {GRADES.map(g => {
              const on = !donate && form.condition === g.value
              return (
                <button key={g.value} type="button" onClick={() => { setDonate(false); update('condition', g.value) }}
                  className={`flex items-start gap-3 p-3 rounded-[16px] text-left active:scale-[0.99] transition-transform ${on ? 'bg-[#FCE3D6]' : 'bg-[#FFF1EA]'}`}>
                  <span className={`w-5 h-5 mt-0.5 rounded-full shrink-0 flex items-center justify-center text-[12px] ${on ? 'bg-[#E8632B] text-white' : 'bg-white'}`}>{on ? '✓' : ''}</span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold">{g.label}</span>
                      <span className={`text-[12px] font-medium ${on ? 'text-[#C4501A]' : 'text-[#9A908A]'}`}>{Math.round(g.pct * 100)}% of MRP</span>
                    </span>
                    <span className="block text-[12px] text-[#5E5650] mt-0.5">{g.desc}</span>
                  </span>
                </button>
              )
            })}
            <button type="button" onClick={() => { setError(''); setDonate(true) }}
              className={`flex items-start gap-3 p-3 rounded-[16px] text-left active:scale-[0.99] transition-transform ${donate ? 'bg-[#FCE3D6]' : 'bg-[#FFF1EA]'}`}>
              <span className={`w-5 h-5 mt-0.5 rounded-full shrink-0 flex items-center justify-center text-[12px] ${donate ? 'bg-[#E8632B] text-white' : 'bg-white'}`}>{donate ? '✓' : ''}</span>
              <span className="flex-1">
                <span className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold">Donate / Free to community</span>
                  <span className={`text-[12px] font-medium ${donate ? 'text-[#C4501A]' : 'text-[#9A908A]'}`}>Free</span>
                </span>
                <span className="block text-[12px] text-[#5E5650] mt-0.5">Pass it forward to help local students and juniors</span>
              </span>
            </button>
            {donate && (
              <p className="text-[12px] text-[#5E5650] -mt-1">
                Condition is saved as {grade.label}. Tap a condition above to change it, or leave it as is.
              </p>
            )}
            <div className="mt-1">
              <label className={LABEL}>Note for buyers (optional)</label>
              <textarea value={form.note} onChange={e => update('note', e.target.value.slice(0, 80))} rows={2}
                placeholder="e.g. Cover has clear laminate, no missing pages"
                className={`${INPUT} resize-none`} />
            </div>
          </div>
        </section>

        {/* 4 Price */}
        <section>
          <StepTitle n={4}>{donate ? 'Price' : 'Fair resale price'}</StepTitle>
          {donate ? (
            <div className={`${CARD} flex items-start gap-3`}>
              <span className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center text-[18px] shrink-0">🎁</span>
              <div>
                <p className="text-[15px] font-semibold">Free to the community</p>
                <p className="text-[12px] text-[#5E5650] mt-0.5">No price needed. Buyers will see this book as free, and you choose who to hand it to in chat.</p>
                <button type="button" onClick={() => setDonate(false)}
                  className={`mt-3 px-3 py-1.5 rounded-full bg-white text-[12px] font-semibold ${SHADOW} active:scale-95 transition-transform`}>
                  I want to sell it instead
                </button>
              </div>
            </div>
          ) : (
          <div className={`${CARD} flex flex-col gap-4`}>
            <div>
              <label className={LABEL}>Original MRP</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[15px] font-semibold text-[#5E5650]">₹</span>
                <input type="number" inputMode="numeric" value={form.origPrice}
                  onChange={e => update('origPrice', e.target.value)}
                  placeholder="190" className={`${INPUT} !pl-9`} />
              </div>
            </div>

            {suggested > 0 && (
              <div className="bg-[#FFF1EA] rounded-[16px] p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] text-[#5E5650]">Fair resale band ({Math.round(grade.pct * 100)}%)</p>
                  <p className="text-[15px] font-semibold">₹{bandLow} – ₹{bandHigh}</p>
                </div>
                <button type="button"
                  onClick={() => { setPriceTouched(false); setForm(prev => ({ ...prev, price: String(suggested) })) }}
                  className={`px-3 py-1.5 rounded-full bg-white text-[12px] font-semibold ${SHADOW} active:scale-95 transition-transform`}>
                  Use ₹{suggested}
                </button>
              </div>
            )}

            <div>
              <label className={LABEL}>Your selling price</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[28px] font-bold leading-[34px]">₹</span>
                <input type="number" inputMode="numeric" value={form.price}
                  onChange={e => { setPriceTouched(true); update('price', e.target.value) }}
                  placeholder="0"
                  className="w-full bg-[#FFF1EA] rounded-[16px] py-3 pl-11 pr-4 text-[28px] leading-[34px] font-bold text-[#1E1B19] outline-none focus:ring-2 focus:ring-[#FCE3D6]" />
              </div>
              {suggested > 0 && priceNum > 0 && (
                <p className="text-[12px] mt-1.5 text-[#5E5650]">
                  {priceNum >= bandLow && priceNum <= bandHigh
                    ? 'In the fair range for this condition.'
                    : priceNum > bandHigh
                      ? 'A little above the fair range. It may take longer to sell.'
                      : 'Below the fair range. You may be leaving money on the table.'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[12px] text-[#5E5650]">You receive</span>
              <span className="text-[16px] font-bold">₹{priceNum || 0}</span>
            </div>
          </div>
          )}
        </section>

        {/* 5 Meet */}
        <section>
          <StepTitle n={5}>Where can buyers meet you?</StepTitle>
          <div className={CARD}>
            <div ref={locationRef} className="relative">
              <div className="relative">
                <input value={locationSearch}
                  onChange={e => { setLocationSearch(e.target.value); setForm(prev => ({ ...prev, location: e.target.value })); setShowLocationDropdown(true) }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="Type your sector or area"
                  className={`${INPUT} ${form.location ? '!pr-10' : ''}`} />
                {form.location && (
                  <button onClick={() => { setForm(prev => ({ ...prev, location: '' })); setLocationSearch(''); setShowLocationDropdown(true) }}
                    aria-label="Clear"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9A908A]">×</button>
                )}
              </div>
              {showLocationDropdown && filteredLocations.length > 0 && (
                <div className={`absolute top-[52px] left-0 right-0 bg-white rounded-[18px] ${SHADOW} z-40 overflow-hidden max-h-60 overflow-y-auto`}>
                  {filteredLocations.map(loc => (
                    <button key={loc} type="button" onClick={() => selectLocation(loc)}
                      className="w-full text-left px-4 py-3 text-[14px] hover:bg-[#FFF1EA]">
                      <span className="font-semibold">{loc.split(',')[0]}</span>
                      <span className="text-[#9A908A]">{loc.includes(',') ? ', ' + loc.split(',').slice(1).join(',').trim() : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[12px] text-[#5E5650] mt-3">
              You and the buyer agree on a time and a nearby spot in chat. The buyer pays you when they have checked the book.
            </p>
          </div>
        </section>
      </main>

      {/* Publish bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FFF7F2]/95 backdrop-blur-md px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(120,70,40,0.06)]">
        <div className="max-w-md mx-auto">
          {error && <p className="text-[12px] text-[#D64545] mb-2 text-center">{error}</p>}
          {uploadProgress && <p className="text-[12px] text-[#5E5650] mb-2 text-center">{uploadProgress}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full h-[52px] rounded-full bg-[#E8632B] text-white text-[17px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform">
            {loading ? 'Publishing…' : <>{donate ? 'Publish as free' : 'Publish listing'}{!donate && priceNum > 0 && <span className="opacity-70">• ₹{priceNum}</span>}</>}
          </button>
        </div>
      </div>
    </div>
  )
}