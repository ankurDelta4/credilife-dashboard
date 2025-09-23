import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard, /admin)
  const path = request.nextUrl.pathname

  // Define paths that are public (don't require authentication)
  const isPublicPath = path === '/login'

  // Define paths that are protected (require authentication)
  const isProtectedPath = !isPublicPath

  // Get the token from the request cookies/headers (if implementing server-side auth)
  // For now, we'll handle this on the client side

  // If it's a protected path and we're not on login, we could redirect here
  // But we'll handle authentication on the client side for this implementation
  
  return NextResponse.next()
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}