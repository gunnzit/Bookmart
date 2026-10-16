import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/profile', '/wishlist', '/messages', '/my-orders'],
      },
    ],
    sitemap: 'https://pageplus.in/sitemap.xml',
    host: 'https://pageplus.in',
  }
}