// Completely disable Clerk middleware to prevent handshake redirects
export default function middleware() {
  // No middleware processing - let all requests pass through
  return
}

export const config = {
  matcher: [],
}
