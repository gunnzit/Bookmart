'use client'
import { useEffect, useState } from 'react'

// "How your book will look" preview inside the Feature sheet.
// The sheet loads Home or Marketplace in a small window with ?featurePreview=<listingId>.
// The page then shows that book as featured, for its own seller only, in that window only.
// Nothing is saved, and other people never see it.

export function useFeaturePreview() {
  const [previewId, setPreviewId] = useState('')

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('featurePreview')
    if (id) setPreviewId(id)
  }, [])

  // A look-only window: scrolling works, taps and forms do nothing
  useEffect(() => {
    if (!previewId) return
    const stop = (e: Event) => { e.preventDefault(); e.stopPropagation() }
    document.addEventListener('click', stop, true)
    document.addEventListener('submit', stop, true)
    return () => {
      document.removeEventListener('click', stop, true)
      document.removeEventListener('submit', stop, true)
    }
  }, [previewId])

  return previewId
}

// Marks the seller's own book as featured (and "yours") for the preview
export function withFeaturePreview<T extends { id: string; sellerId?: string; featured?: boolean }>(list: T[], previewId: string, userId?: string | null): (T & { yours?: boolean })[] {
  if (!previewId || !userId) return list
  return list.map(l => (l.id === previewId && l.sellerId === userId ? { ...l, featured: true, yours: true } : l))
}

// Once the book is on screen, bring it into view
export function useScrollToYours(ready: boolean, previewId: string) {
  useEffect(() => {
    if (!ready || !previewId) return
    // Scrolls this page only (scrollIntoView would also scroll the sheet around the window)
    const t = setTimeout(() => {
      const el = document.querySelector('[data-yours]')
      if (!el) return
      const r = el.getBoundingClientRect()
      window.scrollTo({ top: window.scrollY + r.top - (window.innerHeight - r.height) / 2 })
      // Home shows featured books in a sideways row: bring the card into that row's view too
      const row = el.parentElement
      if (row && row.scrollWidth > row.clientWidth) row.scrollLeft = (el as HTMLElement).offsetLeft - 8
    }, 400)
    return () => clearTimeout(t)
  }, [ready, previewId])
}
