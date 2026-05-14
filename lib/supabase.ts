import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,    // 세션 유지!
    autoRefreshToken: true,  // 토큰 자동 갱신!
    detectSessionInUrl: true,
    storageKey: 'ny-logis-auth', // 고유 저장소 키 지정 (충돌 방지)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined, // 브라우저 저장소 명시
  }
})
