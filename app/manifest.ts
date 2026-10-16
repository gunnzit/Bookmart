import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pageplus — School Books & Pre-Loved Books',
    short_name: 'Pageplus',
    description: 'School book sets, stationery and a pre-loved book marketplace for Chandigarh, Mohali and Panchkula.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fef8f4',
    theme_color: '#c4501a',
    lang: 'en-IN',
    categories: ['shopping', 'education'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'School Sets', short_name: 'Sets', url: '/school-sets', icons: [{ src: '/pwa-icon/192', sizes: '192x192', type: 'image/png' }] },
      { name: 'Marketplace', short_name: 'Market', url: '/marketplace', icons: [{ src: '/pwa-icon/192', sizes: '192x192', type: 'image/png' }] },
      { name: 'Sell a book', short_name: 'Sell', url: '/sell', icons: [{ src: '/pwa-icon/192', sizes: '192x192', type: 'image/png' }] },
    ],
  }
}