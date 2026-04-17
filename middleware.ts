import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 로그인 여부를 판단하는 쿠키 확인 (Supabase 기본 인증 쿠키)
  const authCookie = request.cookies.get('sb-access-token') || request.cookies.get('supabase-auth-token');

  const { pathname } = request.nextUrl;

  // 1. 로그인이 안 된 상태에서 '로그인 페이지(/login)'가 아닌 다른 곳을 가려고 하면
  // 무조건 로그인 페이지로 쫓아냄 (리다이렉트)
  if (!authCookie && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. 이미 로그인이 된 상태인데 '로그인 페이지(/login)'에 머물려고 하면
  // 메인 화면('/')으로 보내줌
  if (authCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// 이 부분이 핵심! 감시할 범위를 정함
export const config = {
  /*
   * 아래의 경로들을 제외한 모든 페이지 접속을 감시함:
   * - api (데이터 통신용 주소)
   * - _next/static (사이트 구동용 정적 파일)
   * - _next/image (이미지 파일)
   * - favicon.ico (아이콘 파일)
   * - public 폴더 내의 파일들
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
