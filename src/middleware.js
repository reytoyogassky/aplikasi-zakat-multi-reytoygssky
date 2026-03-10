import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }
  const masjidId = request.cookies.get('amilin_masjid_id')?.value
  if (!masjidId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  const headers = new Headers(request.headers)
  headers.set('x-masjid-id', masjidId)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}