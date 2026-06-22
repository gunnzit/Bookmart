export const DELIVERY_FEE = 99

type FlatItem = { name: string; price: number }
type Notebook = { name: string; unitPrice: number; qty: number }
type Kit = {
  ncert: FlatItem[]
  pvt: FlatItem[]
  notebooks: Notebook[]
  stationery: FlatItem[]
}

// Verbatim copy of the price data from app/school-sets/page.tsx
export const kits: Record<number, Kit> = {
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
      { name: 'Four-Lined Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Square-Lined Notebooks (half inch)', unitPrice: 62, qty: 2 },
      { name: 'Five-Lined Notebooks', unitPrice: 62, qty: 2 },
    ],
    stationery: [
      { name: 'Drawing File (spiral binded)', price: 90 },
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
      { name: 'Four-Lined Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Square-Lined Notebooks (half inch)', unitPrice: 62, qty: 2 },
      { name: 'Double-Lined Notebooks', unitPrice: 62, qty: 2 },
    ],
    stationery: [
      { name: 'Drawing File (spiral binded)', price: 90 },
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
      { name: 'Four-Lined Notebooks', unitPrice: 62, qty: 6 },
      { name: 'Four-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Double-Lined Notebooks', unitPrice: 62, qty: 4 },
      { name: 'Square-Lined Notebooks', unitPrice: 62, qty: 4 },
      { name: 'Test Copies', unitPrice: 25, qty: 5 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 Packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 Packet', price: 65 },
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
      { name: 'Four-Lined Notebooks', unitPrice: 62, qty: 6 },
      { name: 'Four-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Double-Lined Notebooks', unitPrice: 62, qty: 4 },
      { name: 'Square-Lined Notebooks', unitPrice: 62, qty: 4 },
      { name: 'Test Copies', unitPrice: 25, qty: 5 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 Packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 Packet', price: 65 },
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
      { name: 'Single-Lined Notebooks', unitPrice: 62, qty: 11 },
      { name: 'Single-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Test Copies', unitPrice: 25, qty: 5 },
    ],
    stationery: [
      { name: 'Drawing Copy', price: 65 },
      { name: 'Black Sketch Pen', price: 5 },
      { name: 'Origami Sheets - 1 Packet', price: 20 },
      { name: 'Plastic Crayons (24 Shades)', price: 100 },
      { name: 'Pencil Colours (12 Shades)', price: 35 },
      { name: 'Oxford English Mini Dictionary', price: 285 },
      { name: 'Scrap Sheets - 1 Packet', price: 65 },
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
      { name: 'Single-Lined Notebooks', unitPrice: 62, qty: 14 },
      { name: 'Single-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Maths Registers', unitPrice: 110, qty: 2 },
      { name: 'Test Copies', unitPrice: 25, qty: 8 },
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
      { name: 'Single-Lined Notebooks', unitPrice: 62, qty: 14 },
      { name: 'Single-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Maths Registers', unitPrice: 110, qty: 2 },
      { name: 'Test Copies', unitPrice: 25, qty: 8 },
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
      { name: 'Single-Lined Notebooks', unitPrice: 62, qty: 14 },
      { name: 'Single-Line Inter Leaf Notebooks', unitPrice: 62, qty: 2 },
      { name: 'Maths Registers', unitPrice: 110, qty: 2 },
      { name: 'Test Copies', unitPrice: 25, qty: 8 },
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
      { name: 'Registers (11")', unitPrice: 110, qty: 11 },
      { name: 'Single Line Unit Test Notebooks', unitPrice: 62, qty: 7 },
    ],
    stationery: [
      { name: 'Blank Laboratory Manual', price: 85 },
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
      { name: 'Registers (11")', unitPrice: 110, qty: 11 },
      { name: 'Single Line Unit Test Notebooks', unitPrice: 62, qty: 7 },
    ],
    stationery: [
      { name: 'Blank Laboratory Manual', price: 85 },
    ],
  },
}

// ── Binding charge ────────────────────────────────────────────────────────
// Every NCERT book carries a compulsory binding charge. The bare prices in
// `kits` above already include the OLD ₹20 binding. Binding is now ₹25, so we
// add ₹5 to every NCERT item — in ONE place. If binding changes again, change
// only BINDING_INCREASE here (and the identical block in school-sets/page.tsx).
export const BINDING_CHARGE = 25
const BINDING_INCREASE = 5
for (const key of Object.keys(kits)) {
  for (const it of kits[Number(key)].ncert) it.price += BINDING_INCREASE
}

// Legal notebook unit prices, derived from nbUnitPrice() in school-sets:
//   Regular:  Buddy 50, Classmate 55
//   Register: Buddy slim 68 / thick 88, Classmate slim 85 / thick 105
const REGULAR_UNIT_PRICES = new Set([50, 55])
const REGISTER_UNIT_PRICES = new Set([68, 88, 85, 105])

export function isRegister(name: string): boolean {
  return name.toLowerCase().includes('register')
}

// Global lookup of every legitimate flat-item price across all classes.
// name -> set of legal prices (an item can appear in several classes; price is
// the same, but we use a Set to be safe).
const flatPriceLookup: Map<string, Set<number>> = (() => {
  const m = new Map<string, Set<number>>()
  for (const key of Object.keys(kits)) {
    const kit = kits[Number(key)]
    for (const section of ['ncert', 'pvt', 'stationery'] as const) {
      for (const item of kit[section]) {
        if (!m.has(item.name)) m.set(item.name, new Set())
        m.get(item.name)!.add(item.price)
      }
    }
  }
  return m
})()

// Every legitimate notebook name (across all classes).
const notebookNames: Set<string> = (() => {
  const s = new Set<string>()
  for (const key of Object.keys(kits)) {
    for (const n of kits[Number(key)].notebooks) s.add(n.name)
  }
  return s
})()

export type ParsedItem =
  | { kind: 'flat'; name: string; claimed: number; ok: boolean }
  | { kind: 'notebook'; name: string; brand: string; qty: number; claimedTotal: number; unit: number; ok: boolean }
  | { kind: 'unparseable'; raw: string; ok: false }

// Parse a single item string as produced by getSelectedItems() in school-sets.
//   Flat:     "Mridang - 1 ₹85"
//   Notebook: "Four-Lined Notebooks [Buddy] x2 ₹100"
//             "Registers (11\") [Buddy (196pg)] x11 ₹748"
export function parseItemLine(raw: string): ParsedItem {
  // Notebook format: <name> [<brand...>] x<qty> ₹<total>
  const nb = raw.match(/^(.+?)\s+\[([^\]]+)\]\s+x(\d+)\s+₹(\d+)$/)
  if (nb) {
    const name = nb[1].trim()
    const bracket = nb[2].trim()             // "Buddy" | "Buddy (196pg)" | "Classmate (240pg)"
    const qty = parseInt(nb[3], 10)
    const claimedTotal = parseInt(nb[4], 10)
    const brand = bracket.split(' ')[0]      // "Buddy" | "Classmate"
    const reg = isRegister(name)
    const legalSet = reg ? REGISTER_UNIT_PRICES : REGULAR_UNIT_PRICES

    let ok = false
    let unit = 0
    if (qty > 0 && claimedTotal > 0 && claimedTotal % qty === 0 && notebookNames.has(name)) {
      unit = claimedTotal / qty
      if (legalSet.has(unit)) {
        if (reg) {
          ok =
            (brand === 'Buddy' && (unit === 68 || unit === 88)) ||
            (brand === 'Classmate' && (unit === 85 || unit === 105))
        } else {
          ok =
            (brand === 'Buddy' && unit === 50) ||
            (brand === 'Classmate' && unit === 55)
        }
      }
    }
    return { kind: 'notebook', name, brand, qty, claimedTotal, unit, ok }
  }

  // Flat format: <name> ₹<price>
  const flat = raw.match(/^(.+?)\s+₹(\d+)$/)
  if (flat) {
    const name = flat[1].trim()
    const claimed = parseInt(flat[2], 10)
    const legalPrices = flatPriceLookup.get(name)
    const ok = !!legalPrices && legalPrices.has(claimed)
    return { kind: 'flat', name, claimed, ok }
  }

  return { kind: 'unparseable', raw, ok: false }
}

export type ValidateResult = {
  ok: boolean
  itemsSubtotal: number   // server-trusted sum of legitimate item prices
  badItems: string[]      // raw strings that failed validation
}

// Validate a flat list of item strings (across all kits in the order) and
// return the server-trusted subtotal. Every item must match a legitimate price.
export function validateItems(items: string[]): ValidateResult {
  let subtotal = 0
  const badItems: string[] = []
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, itemsSubtotal: 0, badItems: ['(no items)'] }
  }
  for (const raw of items) {
    const p = parseItemLine(String(raw))
    if (!p.ok) { badItems.push(String(raw)); continue }
    if (p.kind === 'flat') subtotal += p.claimed
    else if (p.kind === 'notebook') subtotal += p.claimedTotal
  }
  return { ok: badItems.length === 0, itemsSubtotal: subtotal, badItems }
}

export type ChargeBreakdown = {
  total: number
  payNow: number
  payLater: number
  siblingDiscount: number
  deliveryFee: number
}

// Given the legitimate items subtotal + order params, compute what the
// customer SHOULD be charged "now". This mirrors the checkout math:
//   - 5% sibling discount when 2+ kits
//   - delivery fee added after discount
//   - full  -> pay the whole total now
//   - partial -> ceil(30% of the discounted item subtotal) + delivery fee now
export function computeExpectedCharge(opts: {
  itemsSubtotal: number
  numKits: number
  deliveryMode: 'pickup' | 'delivery'
  paymentMode: 'full' | 'partial'
}): ChargeBreakdown {
  const { itemsSubtotal, numKits, deliveryMode, paymentMode } = opts
  const siblingDiscount = numKits >= 2 ? Math.round(itemsSubtotal * 0.05) : 0
  const afterDiscount = itemsSubtotal - siblingDiscount
  const deliveryFee = deliveryMode === 'delivery' ? DELIVERY_FEE : 0
  const total = afterDiscount + deliveryFee
  const payNow = paymentMode === 'full' ? total : Math.ceil(afterDiscount * 0.3) + deliveryFee
  const payLater = total - payNow
  return { total, payNow, payLater, siblingDiscount, deliveryFee }
}

export type KitOrderValidation = {
  ok: boolean
  reason?: string
  itemsSubtotal: number        // server-trusted, pre-discount
  expectedPayNowPaise: number  // what Razorpay should have charged "now"
  breakdown: ChargeBreakdown
}

// One-call validator for the payment routes. Parses + price-checks every item,
// then computes what the customer should have been charged now (in paise).
// The route compares expectedPayNowPaise against the amount actually charged.
//
// NOTE on the 5% sibling discount: numKits comes from the browser. Splitting a
// single child's items into "2 kits" to claim 5% off is a possible (minor)
// business-logic leak — but the core "₹1 for a full kit" exploit is fully
// closed here, because no item price is ever trusted from the browser.
export function validateKitOrder(opts: {
  items: string[]
  numKits: number
  deliveryMode: 'pickup' | 'delivery'
  paymentMode: 'full' | 'partial'
}): KitOrderValidation {
  const numKits = Number.isFinite(opts.numKits) && opts.numKits > 0 ? Math.floor(opts.numKits) : 1
  const deliveryMode = opts.deliveryMode === 'delivery' ? 'delivery' : 'pickup'
  const paymentMode = opts.paymentMode === 'partial' ? 'partial' : 'full'

  const v = validateItems(opts.items)
  const breakdown = computeExpectedCharge({ itemsSubtotal: v.itemsSubtotal, numKits, deliveryMode, paymentMode })

  if (!v.ok) {
    return {
      ok: false,
      reason: 'Invalid or tampered items: ' + v.badItems.join(' | '),
      itemsSubtotal: v.itemsSubtotal,
      expectedPayNowPaise: breakdown.payNow * 100,
      breakdown,
    }
  }
  return {
    ok: true,
    itemsSubtotal: v.itemsSubtotal,
    expectedPayNowPaise: breakdown.payNow * 100,
    breakdown,
  }
}

// ── Stock helpers (used by the out-of-stock / notify-me feature) ──────────
// Every unique item name across all classes (books, stationery, notebooks).
export function allItemNames(): string[] {
  const s = new Set<string>()
  for (const key of Object.keys(kits)) {
    const kit = kits[Number(key)]
    for (const it of [...kit.ncert, ...kit.pvt, ...kit.stationery]) s.add(it.name)
    for (const nb of kit.notebooks) s.add(nb.name)
  }
  return Array.from(s).sort()
}

export function isKnownItem(name: string): boolean {
  return allItemNames().includes(name)
}