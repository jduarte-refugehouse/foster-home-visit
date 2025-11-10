import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware is completely passive and does nothing.
// NO CLERK MIDDLEWARE AT ALL.
// All authentication is handled at the component/API level using @clerk/backend directly.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - signature (public signature pages - token-based, no auth required)
     * - sign-in, sign-up (authentication pages)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|signature|sign-in|sign-up).*)",
  ],
}
