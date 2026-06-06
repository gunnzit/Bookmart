import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Run on app routes, skipping Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|map)).*)',
    // Always run on API routes — this is what makes auth() work in your routes
    '/(api|trpc)(.*)',
  ],
}