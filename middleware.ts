import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Clerk middleware is used ONLY to make auth() and currentUser() work in API routes
// It does NOT protect routes - all authorization is handled at the component/API level
// This is a passive configuration that enables Clerk's auth functions without enforcing protection

export default clerkMiddleware((auth, request: NextRequest) => {
  // This middleware is passive - it doesn't protect routes
  // It just makes Clerk's auth functions available in API routes
  // All authorization decisions are made in our application code, not here
  return NextResponse.next()
})

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths including API routes
     * This is necessary for Clerk's auth() and currentUser() to work in API routes
     * Note: We're NOT protecting routes here - just enabling Clerk auth functions
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
