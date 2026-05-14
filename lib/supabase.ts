import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ✨ 싱글톤 패턴: 단 하나의 supabase 인스턴스만 생성하도록 설정
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,   // 세션을 브라우저(LocalStorage)에 저장해!
    autoRefreshToken: true, // 토큰 만료되면 알아서 갱신해!
    detectSessionInUrl: true // 이메일 확인 등 URL에 세션 정보 있으면 낚아채!
  }
})
