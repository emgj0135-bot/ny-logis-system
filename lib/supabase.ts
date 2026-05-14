import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // ✨ 보안 통신 타입을 명시해서 브라우저 간섭을 줄여!
  },
  // ✨ 통신 실패 시 자동으로 다시 시도하게 설정
  global: {
    fetch: (...args) => fetch(...args),
  }
})
