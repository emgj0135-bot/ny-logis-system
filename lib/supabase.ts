import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,    // ✅ 중요: 브라우저에 로그인 정보 저장
    autoRefreshToken: true,  // ✅ 중요: 토큰 자동 갱신
    detectSessionInUrl: true,
    storageKey: 'ny-logis-auth-key' // ✅ 충돌 방지를 위한 고유 키
  }
})
