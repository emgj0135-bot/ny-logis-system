import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 로그인 여부를 판단하는 쿠키가 있는지 확인 (수파베이스 기본 쿠키 이름)
  const authCookie = request.cookies.get('sb-access-token') || request.cookies.get('supabase-auth-token');

  const { pathname } = request.nextUrl;

  // 1. 로그인이 안 됐는데 메인 화면('/')이나 다른 관리 페이지에 가려고 하면 로그인 페이지로!
  if (!authCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. 이미 로그인했는데 로그인 페이지('/login')에 가려고 하면 메인으로!
  if (authCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'], // 메인과 로그인 페이지에서만 작동
}
