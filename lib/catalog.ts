// lib/catalog.ts
// One list of every book, notebook and stationery item the shop sells.
// It is built from lib/kit-prices.ts, so the Sets page and the Books page
// always show the same items and the same prices. Change a price in
// kit-prices.ts and both pages follow.

import { schools, isRegister } from '@/lib/kit-prices'

export type CatalogSection = 'textbook' | 'notebook' | 'stationery'

export type CatalogItem = {
  id: string                 // lowercase name, used as a key
  name: string               // name shown to the customer
  names: string[]            // every spelling of this item in kit-prices.ts (used for stock checks)
  section: CatalogSection
  kind: 'NCERT' | 'Prescribed' | 'Notebook' | 'Register' | 'Stationery'
  price: number | null       // null when the shop has no price yet
  priceFrom: boolean         // true for notebooks, whose price depends on brand
  dataOos: boolean           // out of stock in the data itself
  classes: number[]          // classes this item is on a list for
  schools: string[]          // schools this item is on a list for
  firstSchool: string        // where "see in kit" should open
  firstClass: number
  slug: string
}

// Notebook prices start at the Buddy price (the same numbers the order check uses)
const NOTEBOOK_FROM = 50
const REGISTER_FROM = 68

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function classLabel(classes: number[]): string {
  if (classes.length === 0) return ''
  if (classes.length === 1) return 'Class ' + classes[0]
  const sorted = [...classes].sort((a, b) => a - b)
  const contiguous = sorted.every((c, i) => i === 0 || c === sorted[i - 1] + 1)
  if (contiguous) return 'Class ' + sorted[0] + '–' + sorted[sorted.length - 1]
  if (sorted.length <= 3) return 'Class ' + sorted.join(', ')
  return 'Class ' + sorted[0] + '–' + sorted[sorted.length - 1]
}

function build(): CatalogItem[] {
  const map = new Map<string, CatalogItem & { _anyInStock: boolean }>()

  function add(
    name: string,
    section: CatalogSection,
    kind: CatalogItem['kind'],
    price: number,
    oos: boolean,
    school: string,
    cls: number,
    fromNotebook: boolean,
  ) {
    const id = name.trim().toLowerCase()
    let it = map.get(id)
    if (!it) {
      it = {
        id, name: name.trim(), names: [], section, kind,
        price: null, priceFrom: fromNotebook, dataOos: true,
        classes: [], schools: [], firstSchool: school, firstClass: cls,
        slug: slugify(name),
        _anyInStock: false,
      }
      map.set(id, it)
    }
    if (!it.names.includes(name)) it.names.push(name)
    if (!it.classes.includes(cls)) it.classes.push(cls)
    if (!it.schools.includes(school)) it.schools.push(school)
    if (!oos) {
      it._anyInStock = true
      if (price > 0 && (it.price === null || price < it.price)) it.price = price
    }
  }

  for (const school of Object.keys(schools)) {
    const classes = schools[school]
    for (const key of Object.keys(classes)) {
      const cls = Number(key)
      const kit = classes[cls]
      for (const it of kit.ncert) add(it.name, 'textbook', 'NCERT', it.price, !!it.oos || it.price <= 0, school, cls, false)
      for (const it of kit.pvt) add(it.name, 'textbook', 'Prescribed', it.price, !!it.oos || it.price <= 0, school, cls, false)
      for (const it of kit.stationery) add(it.name, 'stationery', 'Stationery', it.price, !!it.oos || it.price <= 0, school, cls, false)
      for (const nb of kit.notebooks) {
        const reg = isRegister(nb.name)
        add(nb.name, 'notebook', reg ? 'Register' : 'Notebook', reg ? REGISTER_FROM : NOTEBOOK_FROM, !!nb.oos, school, cls, true)
      }
    }
  }

  return Array.from(map.values()).map(it => {
    const { _anyInStock, ...rest } = it
    return { ...rest, dataOos: !_anyInStock, classes: [...it.classes].sort((a, b) => a - b) }
  })
}

export const catalog: CatalogItem[] = build()

// Every class that has at least one item, for the class chips
export const catalogClasses: number[] = Array.from(new Set(catalog.flatMap(i => i.classes))).sort((a, b) => a - b)