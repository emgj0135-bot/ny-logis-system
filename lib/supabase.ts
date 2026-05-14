import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// URL이나 Key가 비어있으면 콘솔에 에러를 띄워서 바로 알 수 있게 하자
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
