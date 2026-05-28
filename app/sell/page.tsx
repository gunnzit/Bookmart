'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const categories = ['textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const conditions = ['New', 'Good', 'Fair']
const emojis: Record<string, string> = {
  textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙'
}
const catDesc: Record<string, string> = {
  textbook: 'School & college books', novel: 'Fiction & literature',
  notebook: 'Ruled, plain, spiral', art: 'Supplies & materials',
  stationery: 'Pens, files & more', competitive: 'JEE, NEET & exams'
}

export default function SellPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [form, setForm] = useState({
    title: '', subtitle: '', price: '',
    origPrice: '', condition: 'Good',
    category: 'textbook', location: '',
  })

  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/')
    }
  }, [isSignedIn])

  if (!isSignedIn) return null

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

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < images.length; i++) {
      setUploadProgress(`Uploading ${i + 1} of ${images.length}…`)
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
    if (!form.title || !form.price || !form.location) {
      alert('Please fill in title, price and location')
      return
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
          sellerId: user?.id!,
          images: imageUrls,
        }),
      })
      if (res.ok) setDone(true)
      else alert('Something went wrong. Try again.')
    } catch (err: any) { alert(err.message || 'Could not connect.') }
    setLoading(false)
  }

  if (done) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      <div style={{ fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '48px 40px', textAlign: 'center', maxWidth: '380px', width: '100%', boxShadow: '0 4px 32px rgba(27,42,74,0.08)', border: '1.5px solid #EDE9E1' }}>
          <div style={{ width: '72px', height: '72px', background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>🎉</div>
          <h2 style={{ fontFamily: 'Kalam, cursive', color: '#1B2A4A', fontSize: '24px', marginBottom: '8px', fontWeight: '700' }}>Listing posted!</h2>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5' }}>Your item is now live on BookMart.</p>
          <button onClick={() => router.push('/marketplace')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', marginBottom: '10px', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.25)' }}>View marketplace</button>
          <button onClick={() => { setDone(false); setForm({ title: '', subtitle: '', price: '', origPrice: '', condition: 'Good', category: 'textbook', location: '' }); setImages([]); setPreviews([]) }}
            style={{ background: 'transparent', color: '#1D9E75', border: '1.5px solid #1D9E75', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
            Post another
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #FAFAF8; }
        input:focus, textarea:focus { outline: none !important; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1) !important; }
        .section-card { background: #FFFEF9; border-radius: 20px; border: 1.5px solid #EDE9E1; padding: 24px; margin-bottom: 14px; }
        .section-title { font-family: 'Kalam', cursive; font-size: 15px; font-weight: 700; color: #1B2A4A; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
      `}</style>
      <div style={{ background: '#FAFAF8', minHeight: '100vh' }}>
        <nav style={{ background: '#fff', borderBottom: '1.5px solid #EDE9E1', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(27,42,74,0.05)' }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: '#FAFAF8', border: '1.5px solid #EDE9E1', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B2A4A' }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="BookMart" style={{ height: '32px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span style={{ fontFamily: 'Kalam, cursive', fontSize: '16px', fontWeight: '700', color: '#1D9E75' }}>Post a listing</span>
          </div>
        </nav>

        <div style={{ maxWidth: '560px', margin: '24px auto', padding: '0 16px 40px' }}>

          {/* Photos */}
          <div className="section-card">
            <div className="section-title">📷 Photos <span style={{ fontSize: '11px', color: '#bbb', fontWeight: '400', fontFamily: 'DM Sans, sans-serif' }}>up to 3</span></div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: '96px', height: '96px' }}>
                  <img src={src} style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '12px', border: '1.5px solid #EDE9E1' }} />
                  {i === 0 && <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '9px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: '99px', fontWeight: '600' }}>COVER</span>}
                  <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#E24B4A', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                </div>
              ))}
              {images.length < 3 && (
                <label style={{ width: '96px', height: '96px', border: '2px dashed #EDE9E1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ccc', gap: '4px', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#EDE9E1')}>
                  <span style={{ fontSize: '28px', color: '#ddd' }}>+</span>
                  <span style={{ fontSize: '10px', fontWeight: '500' }}>Add photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <p style={{ fontSize: '11px', color: '#bbb', marginTop: '10px' }}>Good photos get 3× more inquiries. First photo is the cover.</p>
          </div>

          {/* Details */}
          <div className="section-card">
            <div className="section-title">📝 Item details</div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title *</label>
              <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. NCERT Physics Part 1 — Class 12"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #EDE9E1', fontSize: '14px', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtitle</label>
              <input value={form.subtitle} onChange={e => update('subtitle', e.target.value)} placeholder="e.g. 2023 edition, lightly used"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #EDE9E1', fontSize: '14px', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => update('category', cat)} style={{ padding: '10px 8px', borderRadius: '12px', border: form.category === cat ? '2px solid #1D9E75' : '1.5px solid #EDE9E1', background: form.category === cat ? '#E1F5EE' : '#fff', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                    <div style={{ fontSize: '18px', marginBottom: '2px' }}>{emojis[cat]}</div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: form.category === cat ? '#0F6E56' : '#1B2A4A', textTransform: 'capitalize', fontFamily: 'Kalam, cursive' }}>{cat}</div>
                    <div style={{ fontSize: '10px', color: '#bbb' }}>{catDesc[cat]}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {conditions.map(c => (
                  <button key={c} onClick={() => update('condition', c)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: form.condition === c ? '2px solid #1D9E75' : '1.5px solid #EDE9E1', background: form.condition === c ? '#E1F5EE' : '#fff', cursor: 'pointer', fontSize: '13px', color: form.condition === c ? '#0F6E56' : '#555', fontWeight: form.condition === c ? '600' : '400', transition: 'all 0.15s', fontFamily: 'Kalam, cursive' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="section-card">
            <div className="section-title">💰 Pricing</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your price (₹) *</label>
                <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="180"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #EDE9E1', fontSize: '14px', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original price (₹)</label>
                <input type="number" value={form.origPrice} onChange={e => update('origPrice', e.target.value)} placeholder="320"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #EDE9E1', fontSize: '14px', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8' }} />
              </div>
            </div>
            {form.price && form.origPrice && parseInt(form.price) < parseInt(form.origPrice) && (
              <div style={{ marginTop: '10px', background: '#E1F5EE', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#0F6E56', fontWeight: '500' }}>
                🎉 {Math.round((1 - parseInt(form.price) / parseInt(form.origPrice)) * 100)}% off — buyers love a good deal!
              </div>
            )}
          </div>

          {/* Location */}
          <div className="section-card">
            <div className="section-title">📍 Location</div>
            <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Sector 40, Chandigarh"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #EDE9E1', fontSize: '14px', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8' }} />
          </div>

          {uploadProgress && (
            <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px', color: '#0F6E56', textAlign: 'center', fontWeight: '500' }}>
              ⏳ {uploadProgress}
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{ width: '100%', background: loading ? '#aaa' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Kalam, cursive', transition: 'all 0.15s', boxShadow: loading ? 'none' : '0 4px 16px rgba(29,158,117,0.3)' }}>
            {loading ? 'Posting…' : '🚀 Post listing'}
          </button>
        </div>
      </div>
    </>
  )
}