import LoadingScreen from '@/components/LoadingScreen'

// Shown by Next.js when a page has to wait for the server.
// The 150 ms delay stops it flashing on very quick changes.
export default function Loading() {
  return <LoadingScreen delayMs={150} />
}