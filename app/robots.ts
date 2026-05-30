import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/profile', '/wishlist'],
      },
    ],
    sitemap: 'https://buddybooks.in/sitemap.xml',
    host: 'https://buddybooks.in',
  }
}