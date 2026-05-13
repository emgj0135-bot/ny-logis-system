"use client";
import './globals.css';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 초기 세션 확인
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
      setLoading(false);
    };
    initSession();

    // 2. 로그인 상태 변경 감지 (로그아웃이나 로그인 시 즉시 반영)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. 주희님 강제 튕기기 로직 (별도 효과로 분리)
  useEffect(() => {
    if (!loading && userEmail === 'joohee@nyil.co.kr') {
      const forbiddenPaths = ['/accident', '/cod'];
      if (forbiddenPaths.includes(pathname)) {
        alert("접근 권한이 없습니다.");
        router.push("/truck");
      }
    }
  }, [pathname, userEmail, loading, router]);

  // ✨ 로그아웃 함수 수정 (auth.signOut()으로 정확히 호출)
  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert("로그아웃 중 오류가 발생했습니다.");
      } else {
        // 확실하게 새로고침하면서 로그인 페이지로 이동
        window.location.href = "/login";
      }
    }
  };

  if (pathname === '/login') {
    return (
      <html lang="ko">
        <body className="bg-slate-50 min-h-screen font-sans">{children}</body>
      </html>
    );
  }

  // ✨ 주희님 체크 (이메일 앞뒤 공백 제거 및 소문자 변환으로 더 정확하게!)
  const isJoohee = userEmail?.trim().toLowerCase() === 'joohee@nyil.co.kr';

  return (
    <html lang="ko">
      <body className="flex bg-slate-50 min-h-screen font-sans font-black">
        <nav className="w-64 h-screen bg-white border-r border-slate-200 p-8 sticky top-0 flex flex-col gap-10 shadow-sm shrink-0">
          <Link href="/" className="group flex justify-center p-2 rounded-2xl transition-all hover:bg-slate-50">
            <img src="/ny_logis_logo.jpg" alt="NY 로지스 로고" className="w-full h-auto group-hover:scale-105 transition-transform" />
          </Link>
          
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2 mb-2">메뉴 시스템</p>
            
            <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
              <span className="text-xl group-hover:scale-110">🏠</span> <span>대시보드</span>
            </Link>

            <Link href="/pallet" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
              <span className="text-xl group-hover:scale-110">📦</span> <span>파렛트 전표</span>
            </Link>

            <Link href="/truck" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group">
              <span className="text-xl group-hover:scale-110">🚚</span> <span>용차 배차</span>
            </Link>

            {/* ✨ 주희님이 아닐 때만 노출 (로딩 중이 아닐 때 확실히 체크) */}
            {!loading && !isJoohee && (
              <>
                <Link href="/accident" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-red-500 transition-all group">
                  <span className="text-xl group-hover:scale-110">⚠️</span> <span>사고 접수</span>
                </Link>

                <Link href="/cod" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-500 transition-all group">
                  <span className="text-xl group-hover:scale-110">💰</span> <span>착불 관리</span>
                </Link>
              </>
            )}

            <Link href="/bookmarks" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-500 transition-all group">
              <span className="text-xl group-hover:scale-110">📌</span> <span>즐겨찾기</span>
            </Link>
            
            <Link href="/staff" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-green-600 transition-all group">
              <span className="text-xl group-hover:scale-110">👥</span> 
              <span className="whitespace-nowrap text-sm tracking-tighter">상차 담당자 관리</span>
            </Link>
          </div>

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">System Manager</p>
              <p className="text-sm font-bold text-slate-900 mt-1 tracking-tight">천안센터 / 임경민 대리</p>
            </div>
            {/* 로그아웃 버튼 */}
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
            >
              <span>🚪</span> <span className="text-sm uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </nav>

        <main className="flex-1 h-screen overflow-y-auto bg-slate-50">{children}</main>
      </body>
    </html>
  );
}
