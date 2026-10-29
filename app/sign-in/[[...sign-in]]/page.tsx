import type { Metadata } from 'next'
import AuthShell from '@/components/AuthShell'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return <AuthShell mode="in" />
}