import { NextResponse } from "next/server"

// Completely disabled middleware - no Clerk protection at all
// This stays the same until you're ready to enable authentication
export default function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
