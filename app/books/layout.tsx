import type { Metadata } from 'next'
import ComingSoon from '@/components/ComingSoon'
import { BOOKS_OPEN } from '@/lib/features'

export const metadata: Metadata = BOOKS_OPEN ? {} : { robots: { index: false, follow: false } }

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  if (!BOOKS_OPEN) {
    return (
      <ComingSoon
        icon="edit"
        title="Books and stationery"
        text="Our books and stationery shop is coming soon. Until then, buy and sell second-hand books near you in the marketplace."
      />
    )
  }
  return <>{children}</>
}