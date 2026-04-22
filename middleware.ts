import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // 1. Supabase 미들웨어 클라이언트 생성
  const supabase = createMiddlewareClient({ req, res })

  // 2. 현재 브라우저에 저장된 세션(로그인 정보)을 확인
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 3. 로그인이 안 되어 있는데, 로그인 페이지('/login')가 아닌 곳으로 접속하려고 하면
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 4. 로그인이 되어 있는 상태에서 로그인 페이지로 가려고 하면 메인으로 보낼 수도 있어 (선택사항)
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return res
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * 아래 경로들을 제외한 모든 페이지에서 미들웨어 작동:
     * - api (백엔드 로직)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (아이콘)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
