import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'

const APP_URL = 'https://buddybooks.in'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Pageplus — Buy & Sell Second-Hand Books in Chandigarh',
    template: '%s | Pageplus Chandigarh',
  },
  description: 'Buy and sell second-hand textbooks, novels, notebooks and stationery from students near you in Chandigarh, Mohali and Panchkula. Save up to 60% on school books.',
  keywords: [
    'buy books Chandigarh', 'sell books Chandigarh', 'second hand books Chandigarh',
    'used textbooks Chandigarh', 'NCERT books Chandigarh', 'second hand books Mohali',
    'buy sell books Panchkula', 'student marketplace Chandigarh', 'school books Chandigarh',
    'cheap books Chandigarh', 'Pageplus', 'BuddyBooks', 'Bedi Book Store', 'Sector 40 Chandigarh books',
    'DPS books Chandigarh', 'Shivalik Public School books', 'JEE books Chandigarh',
    'NEET books Chandigarh', 'school kit Chandigarh', 'notebook stationery Chandigarh',
  ],
  authors: [{ name: 'Pageplus', url: APP_URL }],
  creator: 'Bedi Book Store',
  publisher: 'Pageplus',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: 'Pageplus',
    title: 'Pageplus — Buy & Sell Second-Hand Books in Chandigarh',
    description: 'Student marketplace for second-hand books, notebooks and stationery in Chandigarh Tricity. Save up to 60% on school and college books.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pageplus — Buy & Sell Second-Hand Books in Chandigarh',
    description: 'Student marketplace for second-hand books in Chandigarh Tricity. Free to list, no commission.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: APP_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'LocalBusiness',
                name: 'Pageplus — Bedi Book Store',
                description: 'Student marketplace for buying and selling second-hand books, notebooks and stationery in Chandigarh.',
                url: APP_URL,
                telephone: '+919914735738',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Sector 40-C',
                  addressLocality: 'Chandigarh',
                  addressRegion: 'Punjab',
                  postalCode: '160036',
                  addressCountry: 'IN',
                },
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: 30.7046,
                  longitude: 76.7179,
                },
                openingHoursSpecification: [
                  { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '09:00', closes: '19:00' },
                  { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '10:00', closes: '17:00' },
                ],
                sameAs: [`https://wa.me/919914735738`],
                priceRange: '₹',
                currenciesAccepted: 'INR',
                paymentAccepted: 'Cash, UPI, Credit Card',
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Pageplus',
                url: APP_URL,
                potentialAction: {
                  '@type': 'SearchAction',
                  target: { '@type': 'EntryPoint', urlTemplate: `${APP_URL}/marketplace?q={search_term_string}` },
                  'query-input': 'required name=search_term_string',
                },
              }),
            }}
          />
        </head>
        <body>
          {children}
          <Analytics />
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </body>
      </html>
    </ClerkProvider>
  )
}