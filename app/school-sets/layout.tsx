import type { Metadata } from 'next'
import ComingSoon from '@/components/ComingSoon'
import { SETS_OPEN } from '@/lib/features'

export const metadata: Metadata = SETS_OPEN ? {} : { robots: { index: false, follow: false } }

export default function SetsLayout({ children }: { children: React.ReactNode }) {
  if (!SETS_OPEN) {
    return (
      <ComingSoon
        icon="menu_book"
        title="School sets"
        text="Ready-made school book sets are coming soon. Until then, buy and sell second-hand books near you in the marketplace."
      />
    )
  }
  return <>{children}</>
}