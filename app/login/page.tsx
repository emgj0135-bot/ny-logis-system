"use client";

import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // React 작동 확인용

  // 컴포넌트가 브라우저에 정상적으로 연결(Mount)되었는지 확인
  useEffect(() => {
    setIsMounted(true);
    console.log("✅ React 정상 마운트됨! (자바스크립트 살아있음)");
    console.log("🔧 URL 환경변수:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "존재함" : "없음");
    console.log("🔧 KEY 환경변수:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "존재함" : "없음");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

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
        window.location.href = "/"; 
      }
    } catch (err) {
      console.error("❌ 4. 시스템 에러 발생:", err);
      alert("시스템 에러 발생! 콘솔을 확인해.");
      setLoading(false);
    }
  };

  // 폼 제출과 무관하게 버튼 클릭 이벤트 자체가 먹히는지 테스트
  const handleTestClick = () => {
    alert("✅ 버튼 클릭 정상 작동! React가 안 죽고 살아있어.");
    console.log("버튼 클릭 테스트 완료");
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f3f4f6' 
    }}>
      <form onSubmit={handleLogin} style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
        width: '320px' 
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '1.5rem', 
          color: '#1f2937', 
          fontWeight: 'bold' 
        }}>NY LOGIS 로그인</h2>

        {!isMounted && (
          <p style={{ color: 'red', textAlign: 'center', fontSize: '12px', marginBottom: '1rem' }}>
            ⚠️ 자바스크립트 로딩 중이거나 에러 발생...
          </p>
        )}
        
        <input 
          type="email" 
          placeholder="이메일" 
          value={email} 
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            marginBottom: '1rem', 
            border: '1px solid #d1d5db', 
            borderRadius: '4px' 
          }} 
          required 
        />
        
        <input 
          type="password" 
          placeholder="비밀번호" 
          value={password} 
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            marginBottom: '1.5rem', 
            border: '1px solid #d1d5db', 
            borderRadius: '4px' 
          }} 
          required 
        />
        
        <button 
          type="submit" 
          disabled={loading || !isMounted} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            backgroundColor: (loading || !isMounted) ? '#9ca3af' : '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: (loading || !isMounted) ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}
        >
          {loading ? "통신 중..." : "로그인"}
        </button>

        <button 
          type="button" 
          onClick={handleTestClick}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontWeight: 'bold' 
          }}
        >
          🛠️ 클릭 테스트 (먼저 눌러봐)
        </button>
      </form>
    </div>
  );
}
