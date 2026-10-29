import type { Metadata } from 'next'
import AuthShell from '@/components/AuthShell'

export const metadata: Metadata = {
  title: 'Create your account',
  robots: { index: false, follow: false },
}

export default function SignUpPage() {
  return <AuthShell mode="up" />
}