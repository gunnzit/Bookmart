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

  // Phone — no OTP, just collect and save directly
  const [phoneChecked, setPhoneChecked] = useState(false)
  const [hasPhone, setHasPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneSaved, setPhoneSaved] = useState(false)

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

  async function savePhone() {
    if (phone.length < 10) return
    setSavingPhone(true)
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user?.id, phone: phone.trim() }),
    })
    setSavingPhone(false)
    setPhoneSaved(true)
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
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FFF9F0; --bg-card: #fff; --bg-input: #FFF9F0;
      --bg-cat-active: #DFFFEF; --bg-cat: #fff;
      --bg-condition: #fff; --bg-condition-active: #DFFFEF;
      --nav-bg: #fff; --border: #FFE2C2; --border-strong: #FFCB94;
      --text-primary: #1A1330; --text-secondary: #6B6280;
      --text-muted: #A89FC0; --text-label: #A89FC0;
      --shadow-nav: 0 2px 12px rgba(124,92,252,0.06);
      --shadow-card: 0 2px 16px rgba(124,92,252,0.08);
      --dropdown-bg: #fff; --dropdown-border: #FFE2C2;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #14101F; --bg-card: #221C3A; --bg-input: #1C1730;
        --bg-cat-active: #0A3A26; --bg-cat: #2A2342;
        --bg-condition: #2A2342; --bg-condition-active: #0A3A26;
        --nav-bg: #1C1730; --border: #352C52; --border-strong: #463A6B;
        --text-primary: #F3EEFF; --text-secondary: #B0A8CC;
        --text-muted: #6E6590; --text-label: #6E6590;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
        --shadow-card: 0 2px 16px rgba(0,0,0,0.25);
        --dropdown-bg: #221C3A; --dropdown-border: #352C52;
      }
    }
    body { font-family: 'Poppins', sans-serif; background: var(--bg); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
    .kalam { font-family: 'Poppins', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
    input { color: var(--text-primary) !important; font-weight: 500; background: var(--bg-input) !important; font-family: 'Poppins', sans-serif; }
    input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
    input:focus { outline: none !important; border-color: #00B86B !important; box-shadow: 0 0 0 3px rgba(0,184,107,0.12) !important; }
    .card { background: var(--bg-card); border-radius: 20px; border: 2px solid var(--border); padding: 24px; margin-bottom: 16px; box-shadow: var(--shadow-card); }
    .label { font-size: 11px; color: var(--text-label); display: block; margin-bottom: 7px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; }
    .input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 2px solid var(--border); font-size: 14px; transition: all 0.15s; font-family: 'Poppins', sans-serif; }
    .cat-btn { padding: 12px 8px; border-radius: 14px; border: 2px solid var(--border); background: var(--bg-cat); cursor: pointer; transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1), border-color 0.15s, background 0.15s; text-align: left; }
    .cat-btn.active { border: 2px solid #00B86B; background: var(--bg-cat-active); }
    .cat-btn:hover { border-color: #00B86B; transform: translateY(-2px); }
    .cat-btn:active { transform: scale(0.96); }
    .cond-btn { flex: 1; padding: 12px 8px; border-radius: 12px; border: 2px solid var(--border); background: var(--bg-condition); cursor: pointer; transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1), border-color 0.15s, background 0.15s; text-align: center; }
    .cond-btn.active { border: 2px solid #00B86B; background: var(--bg-condition-active); }
    .cond-btn:active { transform: scale(0.96); }
    .loc-item:hover { background: #F0FDF8 !important; }
    @media (prefers-color-scheme: dark) { .loc-item:hover { background: #0A3A26 !important; } }
    .add-photo:hover { border-color: #00B86B !important; background: #DFFFEF !important; }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .step-content { animation: slideIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s ease; }
    @keyframes spin { to { transform: rotate(360deg); } }
    /* Candy 3D primary button */
    .btn-3d { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; }
    .btn-3d:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 6px 0 #009957, 0 12px 28px rgba(0,184,107,0.4) !important; }
    .btn-3d:not(:disabled):active { transform: translateY(2px); box-shadow: 0 1px 0 #009957 !important; }
    .photo-slot { width: 100px; height: 100px; }
    @media (max-width: 400px) { .photo-slot { width: 85px; height: 85px; } }
  `

  const discount = form.price && form.origPrice && parseInt(form.price) < parseInt(form.origPrice)
    ? Math.round((1 - parseInt(form.price) / parseInt(form.origPrice)) * 100) : 0

  if (!phoneChecked) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid #00B86B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </>
  )

  // Phone number gate — no OTP, just collect and save
  if (!hasPhone) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '2px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>←</button>
          <span className="kalam" style={{ fontSize: '16px', color: '#00B86B' }}>Add your WhatsApp number</span>
        </nav>
        <div style={{ maxWidth: '460px', margin: '48px auto', padding: '0 16px' }}>
          <div className="card fade-in">
            <div style={{ width: '64px', height: '64px', background: '#DFFFEF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>💬</div>
            <h2 className="kalam" style={{ fontSize: '22px', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '8px' }}>Your WhatsApp number</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, marginBottom: '24px', fontWeight: '500' }}>
              Buyers will contact you on this number. Add it once and you're good to go.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '2px solid var(--border)', borderRadius: '10px', padding: '0 12px', fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0, gap: '4px', fontWeight: '600' }}>🇮🇳 +91</div>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                style={{ flex: 1, padding: '12px 13px', borderRadius: '10px', border: `2px solid ${phone.length === 10 ? '#00B86B' : 'var(--border)'}`, fontSize: '14px', fontFamily: 'Poppins, sans-serif', background: 'var(--bg-input)', color: 'var(--text-primary)', transition: 'all 0.15s' }}
              />
            </div>

            {phone.length > 0 && phone.length < 10 && (
              <div style={{ fontSize: '11px', color: '#E24B4A', marginBottom: '10px', fontWeight: '600' }}>⚠️ Enter a 10-digit number</div>
            )}

            <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', border: '2px dashed var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8, fontWeight: '500' }}>
                <div>✅ Buyers contact you directly on WhatsApp</div>
                <div>✅ Only shown when someone taps "Contact seller"</div>
                <div>✅ You only need to add this once</div>
              </div>
            </div>

            <button
              onClick={savePhone}
              disabled={savingPhone || phone.length < 10}
              className="btn-3d"
              style={{ width: '100%', background: phone.length === 10 ? 'linear-gradient(135deg,#00B86B,#2D7FF9)' : '#ccc', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '800', cursor: phone.length < 10 ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: phone.length === 10 ? '0 4px 0 #009957' : 'none' }}>
              {savingPhone ? 'Saving…' : 'Save & continue →'}
            </button>

            <button onClick={() => router.push('/marketplace')} style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '12px', fontSize: '13px', cursor: 'pointer', marginTop: '4px', fontWeight: '600' }}>
              Cancel — go back to marketplace
            </button>
          </div>
        </div>
      </div>
    </>
  )

  // Success screen
  if (done) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '28px', padding: '48px 36px', textAlign: 'center', maxWidth: '400px', width: '100%', border: '2px solid var(--border)', boxShadow: '0 12px 40px rgba(124,92,252,0.16)' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #FFF6DD, #FFC83D)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 24px', boxShadow: '0 4px 20px rgba(255,200,61,0.3)' }}>⏳</div>
          <h2 className="kalam" style={{ color: 'var(--text-primary)', fontSize: '26px', marginBottom: '8px' }}>Listing submitted!</h2>
          <div style={{ background: '#FFF6DD', border: '2px solid #FDE68A', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#92400E', fontWeight: '700', marginBottom: '6px' }}>🔍 Under review</div>
            <div style={{ fontSize: '12px', color: '#A16207', lineHeight: 1.7, fontWeight: '500' }}>
              Your listing is being reviewed and will go live once approved — usually within a few hours.
            </div>
          </div>
          <button onClick={() => router.push('/marketplace')} className="btn-3d" style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px 24px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', width: '100%', marginBottom: '10px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 #009957' }}>
            Browse marketplace →
          </button>
          <button onClick={() => { setDone(false); setStep(0); setForm({ title: '', subtitle: '', price: '', origPrice: '', condition: 'Good', category: 'textbook', location: '' }); setImages([]); setPreviews([]); setLocationSearch('') }}
            style={{ background: 'transparent', color: '#00B86B', border: '2px solid #00B86B', borderRadius: '14px', padding: '13px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>
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
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '2px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : router.push('/marketplace')}
            style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <img src="/logo.png" alt="BuddyBooks" style={{ height: '26px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="kalam" style={{ fontSize: '15px', color: '#00B86B' }}>Post a listing</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: '600' }}>Step {step + 1} of 3</span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((step + 1) / 3) * 100}%`, background: 'linear-gradient(90deg, #00B86B, #2D7FF9)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </nav>

        {/* Step indicators */}
        <div style={{ background: 'var(--nav-bg)', borderBottom: '2px solid var(--border)', padding: '12px 20px', display: 'flex', gap: '4px' }}>
          {STEPS.map((s, i) => (
            <div key={s} onClick={() => i < step ? setStep(i) : null}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', cursor: i < step ? 'pointer' : 'default', opacity: i > step ? 0.4 : 1 }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: i <= step ? '#00B86B' : 'var(--border)', color: i <= step ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', flexShrink: 0, transition: 'all 0.2s' }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '11px', fontWeight: i === step ? '700' : '500', color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: '2px', background: i < step ? '#00B86B' : 'var(--border)', marginLeft: '4px', transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: '560px', margin: '24px auto', padding: '0 16px 40px' }}>

          {/* STEP 0 — Photos */}
          {step === 0 && (
            <div className="step-content">
              <div className="card">
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>📷 Add photos</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: '500' }}>Minimum 2 photos required. Must include MRP/price tag.</p>
                <div style={{ background: '#FFF6DD', border: '2px solid #FDE68A', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>📋</span>
                  <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.7, fontWeight: '500' }}>
                    <div style={{ fontWeight: '800', marginBottom: '3px' }}>Required photos:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: images.length >= 1 ? '#00B86B' : '#D97706' }}>{images.length >= 1 ? '✅' : '⏺'}</span> Photo 1 — front cover of the book
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: images.length >= 2 ? '#00B86B' : '#D97706' }}>{images.length >= 2 ? '✅' : '⏺'}</span> Photo 2 — MRP / price tag clearly visible
                    </div>
                    {images.length >= 3 && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#00B86B' }}>✅</span> Photo 3 — optional extra</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {previews.map((src, i) => (
                    <div key={i} className="photo-slot" style={{ position: 'relative' }}>
                      <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px', border: i === 0 ? '3px solid #00B86B' : i === 1 ? '3px solid #FF6B2C' : '2px solid var(--border)' }} />
                      <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '8px', background: i === 0 ? '#00B86B' : i === 1 ? '#FF6B2C' : 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 6px', borderRadius: '99px', fontWeight: '800' }}>
                        {i === 0 ? 'COVER' : i === 1 ? 'MRP TAG' : 'EXTRA'}
                      </span>
                      <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '-7px', right: '-7px', width: '24px', height: '24px', borderRadius: '50%', background: '#E24B4A', color: '#fff', border: '2.5px solid var(--bg-card)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="add-photo photo-slot" style={{ border: `2px dashed ${images.length < 2 ? '#FF6B2C' : 'var(--border)'}`, borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', gap: '4px', transition: 'all 0.15s', background: images.length < 2 ? 'rgba(255,107,44,0.05)' : 'transparent' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: images.length === 0 ? '#D97706' : images.length === 1 ? '#D97706' : 'var(--text-muted)' }}>
                        {images.length === 0 ? 'Cover photo' : images.length === 1 ? 'MRP tag photo' : 'Add photo'}
                      </span>
                      <input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ height: '4px', flex: 1, borderRadius: '99px', background: images.length > i ? (i < 2 ? '#00B86B' : '#A89FC0') : 'var(--border)', transition: 'background 0.3s' }} />
                  ))}
                  <span style={{ fontSize: '11px', color: images.length >= 2 ? '#00B86B' : '#D97706', fontWeight: '700', flexShrink: 0 }}>{images.length}/3 {images.length < 2 ? `(${2 - images.length} more needed)` : '✓'}</span>
                </div>
              </div>
              {images.length < 2 && (
                <div style={{ background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '12px', color: '#E24B4A', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                  <span>⚠️</span>
                  <span>Add at least 2 photos — cover + MRP tag. Listings without price proof may be rejected.</span>
                </div>
              )}
              <button onClick={nextStep} disabled={images.length < 2} className="btn-3d"
                style={{ width: '100%', background: images.length >= 2 ? 'linear-gradient(135deg,#00B86B,#2D7FF9)' : '#ccc', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: '800', cursor: images.length < 2 ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: images.length >= 2 ? '0 4px 0 #009957' : 'none' }}>
                {images.length < 2 ? `Add ${2 - images.length} more photo${2 - images.length > 1 ? 's' : ''} to continue` : 'Continue → Item details'}
              </button>
            </div>
          )}

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div className="step-content">
              <div className="card">
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>📝 Item details</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', fontWeight: '500' }}>Tell buyers what you are selling.</p>
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
                        <div style={{ fontSize: '12px', fontWeight: '700', color: form.category === cat ? '#009957' : 'var(--text-primary)', fontFamily: 'Poppins, sans-serif', textTransform: 'capitalize' }}>{cat}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px', fontWeight: '500' }}>{catDesc[cat]}</div>
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
                        <div style={{ fontSize: '12px', fontWeight: '700', color: form.condition === c ? '#009957' : 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}>{c}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '500' }}>{conditionDesc[c]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={nextStep} disabled={!form.title} className="btn-3d"
                style={{ width: '100%', background: form.title ? 'linear-gradient(135deg,#00B86B,#2D7FF9)' : '#ccc', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: '800', cursor: form.title ? 'pointer' : 'not-allowed', fontFamily: 'Poppins, sans-serif', boxShadow: form.title ? '0 4px 0 #009957' : 'none' }}>
                Continue → Pricing & Location
              </button>
            </div>
          )}

          {/* STEP 2 — Pricing + Location */}
          {step === 2 && (
            <div className="step-content">
              <div className="card">
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>💰 Pricing</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', fontWeight: '500' }}>Set a fair price — buyers are students too!</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="label">Your price (₹) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#00B86B', fontWeight: '800', fontSize: '15px' }}>₹</span>
                      <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="180" className="input" style={{ paddingLeft: '28px' }} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Original price (₹)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '700' }}>₹</span>
                      <input type="number" value={form.origPrice} onChange={e => update('origPrice', e.target.value)} placeholder="320" className="input" style={{ paddingLeft: '28px' }} />
                    </div>
                  </div>
                </div>
                {discount > 0 && (
                  <div style={{ background: 'linear-gradient(135deg, #DFFFEF, #B6F5D8)', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#009957', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid rgba(0,184,107,0.2)' }}>
                    🎉 <span>{discount}% off — buyers love a great deal!</span>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>📍 Location</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '500' }}>Where can the buyer meet you?</p>
                <div ref={locationRef} style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>📍</span>
                    <input value={locationSearch}
                      onChange={e => { setLocationSearch(e.target.value); setForm(prev => ({ ...prev, location: e.target.value })); setShowLocationDropdown(true) }}
                      onFocus={() => setShowLocationDropdown(true)}
                      placeholder="Type your sector or area…"
                      className="input" style={{ paddingLeft: '42px', paddingRight: form.location ? '36px' : '14px', border: `2px solid ${form.location ? '#00B86B' : 'var(--border)'}` }} />
                    {form.location && (
                      <button onClick={() => { setForm(prev => ({ ...prev, location: '' })); setLocationSearch(''); setShowLocationDropdown(true) }}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)', padding: 0 }}>×</button>
                    )}
                  </div>
                  {showLocationDropdown && filteredLocations.length > 0 && (
                    <div style={{ position: 'absolute', top: '50px', left: 0, right: 0, background: 'var(--dropdown-bg)', border: '2px solid var(--border)', borderRadius: '16px', boxShadow: '0 12px 40px rgba(124,92,252,0.16)', zIndex: 100, overflow: 'hidden', maxHeight: '240px', overflowY: 'auto' }}>
                      {filteredLocations.map(loc => (
                        <div key={loc} className="loc-item" onClick={() => selectLocation(loc)}
                          style={{ padding: '11px 16px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--dropdown-border)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.1s' }}>
                          <span style={{ fontSize: '14px' }}>📍</span>
                          <div>
                            <span style={{ fontWeight: '700' }}>{loc.split(',')[0]}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{loc.includes(',') ? ', ' + loc.split(',').slice(1).join(',').trim() : ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showLocationDropdown && locationSearch.length > 0 && filteredLocations.length === 0 && (
                    <div style={{ position: 'absolute', top: '50px', left: 0, right: 0, background: 'var(--dropdown-bg)', border: '2px solid var(--border)', borderRadius: '16px', padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', zIndex: 100 }}>
                      No matches. Try "Sector 22" or "Mohali".
                    </div>
                  )}
                </div>
              </div>

              {form.title && form.price && form.location && (
                <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '2px solid #00B86B', padding: '18px 20px', marginBottom: '16px', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ fontSize: '11px', color: '#00B86B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>✅ Ready to submit for review</div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border)' }}>
                      {previews[0] ? <img src={previews[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emojis[form.category]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{form.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>📍 {form.location} · 📷 {images.length} photos</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="kalam" style={{ fontSize: '20px', color: '#00B86B' }}>₹{form.price}</div>
                      {form.origPrice && <div style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{form.origPrice}</div>}
                    </div>
                  </div>
                </div>
              )}

              {uploadProgress && (
                <div style={{ background: '#DFFFEF', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px', color: '#009957', textAlign: 'center', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', border: '2px solid #00B86B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  {uploadProgress}
                </div>
              )}

              <button onClick={submit} disabled={loading || !form.title || !form.price || !form.location} className="btn-3d"
                style={{ width: '100%', background: loading || !form.title || !form.price || !form.location ? '#ccc' : 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '800', cursor: loading || !form.title || !form.price || !form.location ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: loading || !form.title || !form.price || !form.location ? 'none' : '0 4px 0 #009957' }}>
                {loading ? '⏳ Uploading…' : '🚀 Submit for review'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', fontWeight: '500' }}>Free to post · Usually approved within a few hours</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}