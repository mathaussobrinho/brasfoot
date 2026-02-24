import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rotasPrivadas = ['/dashboard']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const pathname = request.nextUrl.pathname

  const isRotaPrivada = rotasPrivadas.some(r => pathname.startsWith(r))
  if (isRotaPrivada && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
