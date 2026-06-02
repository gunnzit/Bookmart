'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'

const SCHOOL = 'Shivalik Public School'

const kits: Record<number, {
  ncert: { name: string; price: number }[]
  pvt: { name: string; price: number }[]
  notebooks: { name: string; price: number }[]
  stationery: { name: string; price: number }[]
}> = {
  1: {
    ncert: [
      { name: 'Mridang - 1', price: 85 },
      { name: 'Joyful Maths - 1', price: 85 },
    ],
    pvt: [
      { name: 'Grammar Way - 1', price: 299 },
      { name: 'Joyful Maths Workbook - 1', price: 229 },
      { name: 'Bhasha Setu Praveshika', price: 340 },
    ],
    notebooks: [
      { name: 'Four-Lined Notebooks (×2)', price: 124 },
      { name: 'Square-Lined Notebooks (×2)', price: 124 },
      { name: 'Five-Lined Notebooks (×2)', price: 124 },
    ],
    stationery: [
      { name: 'Drawing File (spiral)', price: 90 },
      { name: 'Drawing Sheets - 1 packet', price: 30 },
      { name: 'Origami Sheets - 1 packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Clay', price: 60 },
      { name: 'Slate', price: 80 },
      { name: 'Duster', price: 20 },
      { name: 'Pastel Sheets - 1 packet', price: 65 },
      { name: 'Fevicol', price: 60 },
      { name: 'Ice Cream Sticks - 1 packet', price: 40 },
      { name: 'Fevistick', price: 25 },
      { name: 'Pencil Colours', price: 35 },
    ],
  },
  2: {
    ncert: [
      { name: 'Mridang - 2', price: 85 },
      { name: 'Joyful Maths - 2', price: 85 },
      { name: 'Sarangi - 2', price: 85 },
    ],
    pvt: [
      { name: 'Grammar Way - 2', price: 319 },
      { name: 'Joyful Maths Workbook - 2', price: 239 },
    ],
    notebooks: [
      { name: 'Four-Lined Notebooks (×2)', price: 124 },
      { name: 'Square-Lined Notebooks (×2)', price: 124 },
      { name: 'Double-Lined Notebooks (×2)', price: 124 },
    ],
    stationery: [
      { name: 'Drawing File (spiral)', price: 90 },
      { name: 'Drawing Sheets - 1 packet', price: 30 },
      { name: 'Origami Sheets - 1 packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Clay', price: 60 },
      { name: 'Slate', price: 80 },
      { name: 'Duster', price: 20 },
      { name: 'Pastel Sheets - 1 packet', price: 65 },
      { name: 'Fevicol', price: 60 },
      { name: 'Ice Cream Sticks - 1 packet', price: 40 },
      { name: 'Fevistick', price: 25 },
      { name: 'Pencil Colours', price: 35 },
    ],
  },
  3: {
    ncert: [
      { name: 'Santoor - 3', price: 85 },
      { name: 'Math Mela - 3', price: 85 },
      { name: 'Veena - 3', price: 85 },
      { name: 'Our Wondrous World - 4', price: 85 },
      { name: 'Bansuri', price: 85 },
      { name: 'Khel Yoga', price: 85 },
    ],
    pvt: [
      { name: 'Essen of Eng Gram & Comp - 3', price: 290 },
      { name: 'Sugam Hindi Vyakaran - 3', price: 405 },
      { name: 'Our Wondrous Workbook - 3', price: 160 },
      { name: 'ACCEL-AI & Coding - 3', price: 545 },
      { name: 'Math Mela Workbook - 3', price: 239 },
      { name: 'Parvaz Punjabi - 0', price: 325 },
    ],
    notebooks: [
      { name: 'Four-Lined Notebooks (×6)', price: 372 },
      { name: 'Four-Line Inter Leaf Notebooks (×2)', price: 124 },
      { name: 'Double-Lined Notebooks (×4)', price: 248 },
      { name: 'Square-Lined Notebooks (×4)', price: 248 },
      { name: 'Test Copies (×5)', price: 125 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 packet', price: 65 },
    ],
  },
  4: {
    ncert: [
      { name: 'Santoor - 3', price: 85 },
      { name: 'Math Mela - 3', price: 85 },
      { name: 'Veena - 3', price: 85 },
      { name: 'Our Wondrous World - 4', price: 85 },
    ],
    pvt: [
      { name: 'Essen of Eng Gram & Comp - 4', price: 320 },
      { name: 'Sugam Hindi Vyakaran - 4', price: 445 },
      { name: 'Our Wondrous Workbook - 4', price: 180 },
      { name: 'ACCEL-AI & Coding - 4', price: 545 },
      { name: 'Parvaz Punjabi - 1', price: 355 },
      { name: 'Knowledge Connect - 4', price: 280 },
      { name: 'My Moral Values - 4', price: 240 },
    ],
    notebooks: [
      { name: 'Four-Lined Notebooks (×6)', price: 372 },
      { name: 'Four-Line Inter Leaf Notebooks (×2)', price: 124 },
      { name: 'Double-Lined Notebooks (×4)', price: 248 },
      { name: 'Square-Lined Notebooks (×4)', price: 248 },
      { name: 'Test Copies (×5)', price: 125 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 packet', price: 65 },
    ],
  },
  5: {
    ncert: [
      { name: 'Santoor - 5', price: 85 },
      { name: 'Math Mela - 5', price: 85 },
      { name: 'Veena - 5', price: 85 },
      { name: 'Our Wondrous World - 5', price: 85 },
    ],
    pvt: [
      { name: 'Essen of Eng Gram & Comp - 5', price: 425 },
      { name: 'Sugam Hindi Vyakaran - 5', price: 465 },
      { name: 'Our Wondrous Workbook - 5', price: 180 },
      { name: 'ACCEL-AI & Coding - 5', price: 545 },
      { name: 'Math Mela Workbook - 5', price: 269 },
      { name: 'Parvaz Punjabi - 2', price: 360 },
      { name: 'Knowledge Connect - 5', price: 300 },
      { name: 'My Moral Values - 5', price: 250 },
    ],
    notebooks: [
      { name: 'Single-Lined Notebooks (×11)', price: 682 },
      { name: 'Single-Line Inter Leaf Notebooks (×2)', price: 124 },
      { name: 'Test Copies (×5)', price: 125 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 packet', price: 65 },
    ],
  },
  6: {
    ncert: [
      { name: 'Poorvi', price: 85 },
      { name: 'Ganita Prakash Math - 6', price: 85 },
      { name: 'Malhar', price: 85 },
      { name: 'Exploring Society India', price: 85 },
      { name: 'Curiosity', price: 85 },
      { name: 'Punjabi Path Pustak - 6', price: 66 },
    ],
    pvt: [
      { name: 'BBC Compacta Basic - 6', price: 532 },
      { name: 'Pratham Hindi Vyakaran - 6', price: 512 },
      { name: 'Knowledge Connect - 6', price: 305 },
      { name: 'My Moral Values - 6', price: 260 },
      { name: 'Byte Code - 6', price: 515 },
      { name: 'Ganita Prakash Workbook - 6', price: 249 },
    ],
    notebooks: [
      { name: 'Single-Lined Notebooks (×14)', price: 868 },
      { name: 'Single-Line Inter Leaf Notebooks (×2)', price: 124 },
      { name: 'Maths Registers (×2)', price: 220 },
      { name: 'Test Copies (×8)', price: 200 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Oil Pastels', price: 60 },
      { name: 'Oxford Mini Dictionary', price: 285 },
    ],
  },
  7: {
    ncert: [
      { name: 'Poorvi - 7', price: 85 },
      { name: 'Ganita Prakash Math - 7 (Part 1)', price: 85 },
      { name: 'Ganita Prakash Math - 7 (Part 2)', price: 85 },
      { name: 'Malhar - 7', price: 85 },
      { name: 'Exploring Society - 7 (Part 1)', price: 85 },
      { name: 'Exploring Society - 7 (Part 2)', price: 85 },
      { name: 'Curiosity - 7', price: 85 },
      { name: 'Punjabi Path Pustak - 7', price: 87 },
      { name: 'Bikhre Phool', price: 125 },
      { name: 'Shivalik Punjabi Grammar', price: 220 },
    ],
    pvt: [
      { name: 'Pratham Hindi Vyakaran - 7', price: 524 },
      { name: 'Knowledge Connect - 7', price: 315 },
      { name: 'My Moral Values - 7', price: 270 },
      { name: 'Byte Code - 7', price: 530 },
      { name: 'BBC Compacta Basic - 7', price: 532 },
    ],
    notebooks: [
      { name: 'Single-Lined Notebooks (×14)', price: 868 },
      { name: 'Single-Line Inter Leaf Notebooks (×2)', price: 124 },
      { name: 'Maths Registers (×2)', price: 220 },
      { name: 'Test Copies (×8)', price: 200 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Oil Pastels', price: 60 },
      { name: 'Oxford Mini Dictionary', price: 285 },
    ],
  },
  8: {
    ncert: [
      { name: 'Poorvi - 8', price: 85 },
      { name: 'Ganita Prakash Math - 8 (Part 1)', price: 85 },
      { name: 'Ganita Prakash Math - 8 (Part 2)', price: 85 },
      { name: 'Malhar - 8', price: 85 },
      { name: 'Exploring Society - 8 (Part 1)', price: 85 },
      { name: 'Curiosity - 8', price: 85 },
      { name: 'Punjabi Path Pustak - 8', price: 87 },
      { name: 'Akashdeep', price: 125 },
    ],
    pvt: [
      { name: 'BBC Compacta Basic - 8', price: 532 },
      { name: 'Pratham Hindi Vyakaran - 8', price: 580 },
      { name: 'Knowledge Connect - 8', price: 320 },
      { name: 'My Moral Values - 8', price: 280 },
      { name: 'Byte Code - 8', price: 545 },
    ],
    notebooks: [
      { name: 'Single-Lined Notebooks (×14)', price: 868 },
      { name: 'Single-Line Inter Leaf Notebooks (×2)', price: 124 },
      { name: 'Maths Registers (×2)', price: 220 },
      { name: 'Test Copies (×8)', price: 200 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Oil Pastels', price: 60 },
      { name: 'Oxford Mini Dictionary', price: 285 },
    ],
  },
  9: {
    ncert: [
      { name: 'Beehive', price: 105 },
      { name: 'Moments', price: 70 },
      { name: 'Words & Expression - 1', price: 165 },
      { name: 'Math - 9', price: 130 },
      { name: 'Sparsh - 1', price: 75 },
      { name: 'Sanchyan - 1', price: 50 },
      { name: 'Democratic Pol. - 1', price: 120 },
      { name: 'Contemporary India - 1', price: 90 },
      { name: 'Economics - 9', price: 85 },
      { name: 'India and Conte. World - 1', price: 145 },
      { name: 'A- Employability Skill - 9', price: 225 },
      { name: 'Science - 9', price: 175 },
    ],
    pvt: [
      { name: 'Punjabi Grammar - 9&10', price: 565 },
      { name: 'Lab Manual Science - 9', price: 415 },
      { name: 'Activity and Project - 9', price: 164 },
      { name: 'Vyakaran - B - 9&10', price: 529 },
    ],
    notebooks: [
      { name: 'Register - 11×110', price: 1210 },
      { name: 'Single Line Unit Test Notebooks (×7)', price: 434 },
    ],
    stationery: [
      { name: 'Blank Laboratory Manual (×1)', price: 85 },
    ],
  },
  10: {
    ncert: [
      { name: 'First Flight', price: 95 },
      { name: 'Footprints without Feet', price: 60 },
      { name: 'Words & Expression - 2', price: 195 },
      { name: 'Math - 10', price: 145 },
      { name: 'Sparsh - 2', price: 90 },
      { name: 'Sanchyan - 2', price: 55 },
      { name: 'Democratic Pol. - 2', price: 85 },
      { name: 'Contemporary India - 2', price: 95 },
      { name: 'Economics - 10', price: 100 },
      { name: 'India and Conte. World - 2', price: 125 },
      { name: 'Science - 10', price: 180 },
      { name: 'B- Data Entry - 10', price: 215 },
      { name: 'A- Employability Skill - 10', price: 170 },
    ],
    pvt: [
      { name: 'Lab Manual Science - 10', price: 415 },
      { name: 'Activity and Project - 10', price: 164 },
    ],
    notebooks: [
      { name: 'Register - 11×110', price: 1210 },
      { name: 'Single Line Unit Test Notebooks (×7)', price: 434 },
    ],
    stationery: [
      { name: 'Blank Laboratory Manual (×1)', price: 85 },
    ],
  },
}

type Section = 'ncert' | 'pvt' | 'notebooks' | 'stationery'

const sectionLabels: Record<Section, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  ncert:      { label: 'NCERT Books',    emoji: '📗', color: '#1D9E75', bg: '#E8F7F2', border: '#C0E8D8' },
  pvt:        { label: 'Private Books',  emoji: '📘', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  notebooks:  { label: 'Notebooks',      emoji: '📓', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  stationery: { label: 'Stationery',     emoji: '✏️', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
}

export default function SchoolSetsPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()

  const [selectedClass, setSelectedClass] = useState<number>(1)
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({ ncert: true, pvt: true, notebooks: true, stationery: true })
  const [checked, setChecked] = useState<Record<Section, boolean[]>>({} as any)
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)

  // Init checked state when class changes
  useEffect(() => {
    const kit = kits[selectedClass]
    setChecked({
      ncert: kit.ncert.map(() => true),
      pvt: kit.pvt.map(() => true),
      notebooks: kit.notebooks.map(() => true),
      stationery: kit.stationery.map(() => true),
    })
    setOrdered(false)
  }, [selectedClass])

  const kit = kits[selectedClass]

  function toggleSection(s: Section) {
    setOpenSections(prev => ({ ...prev, [s]: !prev[s] }))
  }

  function toggleItem(s: Section, i: number) {
    setChecked(prev => {
      const arr = [...prev[s]]
      arr[i] = !arr[i]
      return { ...prev, [s]: arr }
    })
  }

  function toggleAll(s: Section, val: boolean) {
    setChecked(prev => ({ ...prev, [s]: prev[s].map(() => val) }))
  }

  function calcTotal() {
    if (!checked.ncert) return 0
    let total = 0
    const sections: Section[] = ['ncert', 'pvt', 'notebooks', 'stationery']
    sections.forEach(s => {
      kit[s].forEach((item, i) => {
        if (checked[s]?.[i]) total += item.price
      })
    })
    if (deliveryMode === 'delivery') total += 99
    return total
  }

  function getSelectedItems() {
    const sections: Section[] = ['ncert', 'pvt', 'notebooks', 'stationery']
    const items: string[] = []
    sections.forEach(s => {
      kit[s].forEach((item, i) => {
        if (checked[s]?.[i]) items.push(item.name + ' ₹' + item.price)
      })
    })
    return items
  }

  function billTotal() {
    const sections: Section[] = ['ncert', 'pvt', 'notebooks', 'stationery']
    return sections.reduce((sum, s) => sum + kit[s].reduce((a, b) => a + b.price, 0), 0)
  }

  async function handleOrder() {
    if (!isSignedIn) { openSignIn(); return }
    if (deliveryMode === 'delivery' && !address.trim()) { alert('Please enter delivery address'); return }
    if (!phone.trim()) { alert('Please enter your phone number'); return }

    setOrdering(true)
    try {
      const total = calcTotal()
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total * 100, currency: 'INR', receipt: 'kit_class_' + selectedClass }),
      })
      const order = await res.json()
      if (order.error) { alert('Payment failed: ' + JSON.stringify(order.error)); setOrdering(false); return }

      const items = getSelectedItems()
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'BuddyBooks',
        description: 'School Kit — Class ' + selectedClass + ' (' + SCHOOL + ')',
        image: '/logo.png',
        order_id: order.id,
        handler: async (response: any) => {
          // Send WhatsApp to admin
          const msg = '📦 NEW KIT ORDER\nClass ' + selectedClass + ' — ' + SCHOOL + '\nStudent: ' + (user?.fullName || '') + '\nPhone: ' + phone + '\nMode: ' + deliveryMode + (deliveryMode === 'delivery' ? '\nAddress: ' + address : '') + '\nItems:\n' + items.join('\n') + '\nTotal: ₹' + total + '\nPayment ID: ' + response.razorpay_payment_id
          window.open('https://wa.me/919914735738?text=' + encodeURIComponent(msg), '_blank')
          setOrdered(true)
        },
        prefill: { name: user?.fullName, email: user?.primaryEmailAddress?.emailAddress, contact: phone },
        theme: { color: '#1D9E75' },
        modal: { ondismiss: () => setOrdering(false) },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (e) {
      alert('Something went wrong. Try again.')
    }
    setOrdering(false)
  }

  const total = calcTotal()
  const bill = billTotal()

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #F7F6F3; --white: #fff; --card: #fff; --border: #E5E2DA;
      --text: #1B2A4A; --text-2: #666; --text-3: #999;
      --green: #1D9E75; --green-dark: #157A5A; --green-bg: #E8F7F2; --green-border: #C0E8D8;
      --shadow: 0 2px 12px rgba(27,42,74,0.07); --shadow-lg: 0 8px 32px rgba(27,42,74,0.12);
      --r: 16px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --white: #1A1D27; --card: #1E2130; --border: #2A2D3E;
        --text: #E8E6F0; --text-2: #A0A0B0; --text-3: #666880;
        --green-bg: #0D2B22; --green-border: #1A4035;
        --shadow: 0 2px 12px rgba(0,0,0,0.3); --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
    .k { font-family: 'Kalam', cursive; }
    .nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 100; box-shadow: var(--shadow); }
    .class-btn { padding: 8px 0; border-radius: 10px; border: 2px solid var(--border); background: var(--white); color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; text-align: center; }
    .class-btn.active { background: var(--green); color: #fff; border-color: var(--green); box-shadow: 0 4px 12px rgba(29,158,117,0.3); }
    .class-btn:hover:not(.active) { border-color: var(--green); color: var(--green); }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; cursor: pointer; user-select: none; transition: background 0.15s; border-radius: var(--r); }
    .section-header:hover { background: var(--bg) !important; }
    .item-row { display: flex; align-items: center; gap: 12px; padding: 9px 18px; transition: background 0.1s; cursor: pointer; }
    .item-row:hover { background: var(--bg); }
    .checkbox { width: 18px; height: 18px; border-radius: 5px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; cursor: pointer; }
    .checkbox.checked { background: var(--green); border-color: var(--green); }
    .delivery-btn { flex: 1; padding: 10px; border-radius: 10px; border: 2px solid var(--border); background: var(--white); color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
    .delivery-btn.active { border-color: var(--green); background: var(--green-bg); color: var(--green); }
    input[type="text"], textarea { color: var(--text) !important; background: var(--bg) !important; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border 0.15s; }
    input[type="text"]:focus, textarea:focus { border-color: var(--green) !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1); }
    .order-btn { width: 100%; background: var(--green); color: #fff; border: none; border-radius: 14px; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Kalam', cursive; transition: all 0.2s; box-shadow: 0 6px 20px rgba(29,158,117,0.3); }
    .order-btn:hover { background: var(--green-dark); transform: translateY(-2px); box-shadow: 0 10px 28px rgba(29,158,117,0.4); }
    .order-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .sticky-summary { position: sticky; top: 72px; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .slide-down { animation: slideDown 0.2s ease; }
    @media (min-width: 900px) { .layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; } }
    @media (max-width: 640px) { .sticky-summary { position: static !important; } }
  `

  return (
    <>
      <style>{css}</style>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav className="nav">
          <button onClick={() => router.push('/marketplace')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '28px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>BuddyBooks</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3)', fontWeight: '600' }}>🏫 {SCHOOL}</div>
        </nav>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #1D9E75 100%)', padding: '28px 20px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '99px', padding: '4px 12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>📦 Pre-assembled school kits · Delivery available</span>
            </div>
            <h1 className="k" style={{ fontSize: 'clamp(24px, 5vw, 38px)', color: '#fff', marginBottom: '8px', lineHeight: 1.2 }}>School Sets 🎒</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '480px' }}>
              Complete book + stationery kits for {SCHOOL}. Pick your class, customise what you need, and order in minutes.
            </p>
          </div>
        </div>

        {/* Class selector */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '16px 20px', position: 'sticky', top: '56px', zIndex: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Select Class</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(c => (
                <button key={c} className={'class-btn' + (selectedClass === c ? ' active' : '')} onClick={() => setSelectedClass(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px 80px' }}>
          <div className="layout">

            {/* LEFT: Kit customizer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h2 className="k" style={{ fontSize: '20px', color: 'var(--text)' }}>Class {selectedClass} Kit</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Bill total: ₹{bill.toLocaleString()}</span>
              </div>

              {(Object.keys(sectionLabels) as Section[]).map(s => {
                const sec = sectionLabels[s]
                const items = kit[s]
                const checkedItems = checked[s] || []
                const allChecked = checkedItems.every(Boolean)
                const anyChecked = checkedItems.some(Boolean)
                const secTotal = items.reduce((sum, item, i) => sum + (checkedItems[i] ? item.price : 0), 0)
                const isOpen = openSections[s]

                return (
                  <div key={s} style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '1.5px solid ' + sec.border, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>

                    {/* Section header */}
                    <div className="section-header" style={{ background: sec.bg }} onClick={() => toggleSection(s)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{sec.emoji}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: sec.color }}>{sec.label}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>{items.length} items · ₹{secTotal.toLocaleString()} selected</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={e => { e.stopPropagation(); toggleAll(s, !allChecked) }}
                          style={{ fontSize: '11px', color: sec.color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontFamily: 'DM Sans, sans-serif' }}>
                          {allChecked ? 'Deselect all' : 'Select all'}
                        </button>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: sec.color }}>
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {/* Items list */}
                    {isOpen && (
                      <div className="slide-down" style={{ borderTop: '1px solid ' + sec.border }}>
                        {items.map((item, i) => (
                          <div key={i} className="item-row" onClick={() => toggleItem(s, i)}
                            style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div className={'checkbox' + (checkedItems[i] ? ' checked' : '')}>
                              {checkedItems[i] && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <div style={{ flex: 1, fontSize: '13px', color: checkedItems[i] ? 'var(--text)' : 'var(--text-3)', fontWeight: checkedItems[i] ? '500' : '400', textDecoration: checkedItems[i] ? 'none' : 'line-through' }}>{item.name}</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: checkedItems[i] ? sec.color : 'var(--text-3)', fontFamily: 'Kalam, cursive' }}>₹{item.price}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* RIGHT: Order summary */}
            <div className="sticky-summary">
              {ordered ? (
                <div style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '2px solid #1D9E75', padding: '28px 24px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                  <h3 className="k" style={{ fontSize: '22px', color: '#1D9E75', marginBottom: '8px' }}>Order Placed!</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>Your kit order has been confirmed. We've opened WhatsApp to send the details to our team.</p>
                  <button onClick={() => { setOrdered(false) }} style={{ background: 'var(--green-bg)', color: '#1D9E75', border: '1.5px solid var(--green-border)', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Order another class →
                  </button>
                </div>
              ) : (
                <div style={{ background: 'var(--card)', borderRadius: 'var(--r)', border: '1.5px solid var(--border)', padding: '22px', boxShadow: 'var(--shadow-lg)' }}>
                  <h3 className="k" style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>Order Summary</h3>

                  {/* Selected count per section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {(Object.keys(sectionLabels) as Section[]).map(s => {
                      const sec = sectionLabels[s]
                      const checkedItems = checked[s] || []
                      const count = checkedItems.filter(Boolean).length
                      const secTotal = kit[s].reduce((sum, item, i) => sum + (checkedItems[i] ? item.price : 0), 0)
                      if (count === 0) return null
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px' }}>{sec.emoji}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{sec.label} <span style={{ color: 'var(--text-3)' }}>({count})</span></span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: sec.color }}>₹{secTotal.toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginBottom: '16px' }}>
                    {/* Delivery mode */}
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Delivery option</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button className={'delivery-btn' + (deliveryMode === 'pickup' ? ' active' : '')} onClick={() => setDeliveryMode('pickup')}>
                        🏪 Pickup
                      </button>
                      <button className={'delivery-btn' + (deliveryMode === 'delivery' ? ' active' : '')} onClick={() => setDeliveryMode('delivery')}>
                        🚚 Delivery +₹99
                      </button>
                    </div>

                    {deliveryMode === 'pickup' && (
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', background: 'var(--bg)', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', lineHeight: 1.5 }}>
                        📍 Pickup from Bedi Book Store, Booth No. 48, Sec-40C, Chandigarh
                      </div>
                    )}

                    {deliveryMode === 'delivery' && (
                      <textarea
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Enter delivery address…"
                        rows={2}
                        style={{ marginBottom: '10px', resize: 'none' }}
                      />
                    )}

                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your WhatsApp number" style={{ marginBottom: '12px' }} />
                  </div>

                  {/* Total */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>Kit subtotal</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>₹{(total - (deliveryMode === 'delivery' ? 99 : 0)).toLocaleString()}</span>
                  </div>
                  {deliveryMode === 'delivery' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Delivery</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>₹99</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1.5px solid var(--border)', paddingTop: '10px', marginBottom: '16px' }}>
                    <span className="k" style={{ fontSize: '18px', color: 'var(--text)' }}>Total</span>
                    <span className="k" style={{ fontSize: '28px', color: '#1D9E75' }}>₹{total.toLocaleString()}</span>
                  </div>

                  {isSignedIn ? (
                    <button className="order-btn" onClick={handleOrder} disabled={ordering || total === 0}>
                      {ordering ? 'Processing…' : '🎒 Order Class ' + selectedClass + ' Kit'}
                    </button>
                  ) : (
                    <SignInButton mode="modal">
                      <button className="order-btn">Sign in to order →</button>
                    </SignInButton>
                  )}

                  <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', marginTop: '10px', lineHeight: 1.5 }}>
                    Secure payment via Razorpay · No returns policy · Exchange within 10 days with bill
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}