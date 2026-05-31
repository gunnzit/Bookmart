import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
import type { Metadata } from 'next'
import './globals.css'

const APP_URL = 'https://buddybooks.in'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'BuddyBooks — Buy & Sell Second-Hand Books in Chandigarh',
    template: '%s | BuddyBooks Chandigarh',
  },
  description: 'Buy and sell second-hand textbooks, novels, notebooks and stationery from students near you in Chandigarh, Mohali and Panchkula. Save up to 60% on school books.',
  keywords: [
    'buy books Chandigarh', 'sell books Chandigarh', 'second hand books Chandigarh',
    'used textbooks Chandigarh', 'NCERT books Chandigarh', 'second hand books Mohali',
    'buy sell books Panchkula', 'student marketplace Chandigarh', 'school books Chandigarh',
    'cheap books Chandigarh', 'BuddyBooks', 'Bedi Book Store', 'Sector 40 Chandigarh books',
    'DPS books Chandigarh', 'Shivalik Public School books', 'JEE books Chandigarh',
    'NEET books Chandigarh', 'school kit Chandigarh', 'notebook stationery Chandigarh',
  ],
  authors: [{ name: 'BuddyBooks', url: APP_URL }],
  creator: 'Bedi Book Store',
  publisher: 'BuddyBooks',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: 'BuddyBooks',
    title: 'BuddyBooks — Buy & Sell Second-Hand Books in Chandigarh',
    description: 'Student marketplace for second-hand books, notebooks and stationery in Chandigarh Tricity. Save up to 60% on school and college books.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuddyBooks — Buy & Sell Second-Hand Books in Chandigarh',
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
          {/* Structured data — Local Business */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'LocalBusiness',
                name: 'BuddyBooks — Bedi Book Store',
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
          {/* Structured data — Website with SearchAction */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'BuddyBooks',
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
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </body>
      </html>
    </ClerkProvider>
  )
}