import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function decodeSession(cookieValue: string): { userId: string; role: string } | null {
  const lastDot = cookieValue.lastIndexOf('.')
  if (lastDot === -1) return null
  const b64url = cookieValue.slice(0, lastDot)
  try {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      b64url.length + (4 - (b64url.length % 4)) % 4, '='
    )
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const raw = request.cookies.get('eaze_session')?.value
  const session = raw ? decodeSession(raw) : null

  // Protect all dashboard and request API routes
  if (path.startsWith('/dashboard') || path.startsWith('/api/requests') || path.startsWith('/api/users')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url))

    // Admin-only area
    if (path.startsWith('/dashboard/admin') && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/om', request.url))
    }

    // OM-only area (OMs cannot access admin pages)
    if (path.startsWith('/dashboard/om') && session.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    }
  }

  // Redirect already-logged-in users away from /login
  if (path === '/login' && session) {
    const dest = session.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/om'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/api/requests/:path*', '/api/users/:path*'],
}
