import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 💡 [가장 중요!]: 용차업체 및 잔디 웹훅용 API(/api로 시작하는 모든 요청)는 
  // 로그인 체크(보안 감시)를 받지 않고 바로 통과하게 만든다!
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Supabase 클라이언트 생성 (환경변수 사용)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession()

  // 로그인이 안 되어 있는데 로그인 페이지가 아니면 리다이렉트
  if (!session && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  // api 경로 및 기본 빌드 파일, 파비콘 등은 감시망에서 완전히 제외(Bypass)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
