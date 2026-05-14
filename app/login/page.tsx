"use client";
import { useState } from "react";
import { supabase } from '@/lib/supabase'; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // 중복 클릭 방지

    console.log("🚀 1. 로그인 시도 시작:", email);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ 2. 로그인 실패 에러:", error.message);
        alert("로그인 실패: " + error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        console.log("✅ 3. 로그인 성공, 세션 획득!");
        
        // 브라우저가 "나 이제 페이지 옮길게!"라고 Supabase에 신호를 보내고
        // 확실히 저장될 때까지 0.3초만 기다려주자.
        // 이 짧은 대기가 'message channel closed' 에러를 방지해줘.
        
        const timer = setTimeout(() => {
          console.log("🚀 4. 페이지 강제 이동 실행");
          window.location.replace("/"); // href보다 더 강력한 이동 방식
        }, 300);

        return () => clearTimeout(timer);
      }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '320px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1f2937', fontWeight: 'bold' }}>NY LOGIS 로그인</h2>
        <input 
          type="email" 
          placeholder="이메일" 
          value={email} 
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)} 
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #d1d5db', borderRadius: '4px' }} 
          required 
        />
        <input 
          type="password" 
          placeholder="비밀번호" 
          value={password} 
          autoComplete="current-password" // ✨ 크롬 에러 방지용
          onChange={(e) => setPassword(e.target.value)} 
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} 
          required 
        />
        <button 
          type="submit" 
          disabled={loading} 
          style={{ width: '100%', padding: '0.75rem', backgroundColor: loading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? "통신 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
