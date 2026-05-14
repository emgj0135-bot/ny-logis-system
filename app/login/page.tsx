"use client";
import { useState } from "react";
// ✅ 우리가 미리 만들어둔 단일 통로(supabase)를 불러와!
import { supabase } from '@/lib/supabase'; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✅ 공용 supabase 인스턴스로 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("로그인 실패: " + error.message);
      setLoading(false);
    } else {
      // ✅ 1번 문제 해결 핵심: 세션이 브라우저 저장소(LocalStorage)에 
      // 완전히 기록될 시간을 0.15초 정도 주고 이동합니다.
      alert("로그인 성공! 메인으로 이동합니다.");
      
      setTimeout(() => {
        // window.location.href를 써야 모든 상태가 초기화되면서 
        // 새로운 세션을 레이아웃이 정확히 읽어올 수 있어!
        window.location.href = "/"; 
      }, 150);
    }
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
        
        <input 
          type="email" 
          placeholder="이메일" 
          value={email} 
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
          autoComplete="current-password"
          value={password} 
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
          disabled={loading} 
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            backgroundColor: loading ? '#9ca3af' : '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold' 
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
