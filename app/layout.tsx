"use client";
import './globals.css';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 권한 가져오기 로직 (더 확실하게 수정)
  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle(); // single() 대신 maybeSingle()로 에러 방지

        if (!error && profile) {
          console.log("🔥 현재 유저 권한:", profile.role); // 확인용 로그
          setUserRole(profile.role);
        } else {
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchUserRole();
      else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 보안 가드 (직접 진입 차단 로직 강화)
  useEffect(() => {
    if (loading) return; // 권한 로딩 중에는 판단 유보

    if (userRole === 'truck_vendor') {
      // 용차업체가 가면 안 되는 곳들
      const forbidden = ['/accident', '/cod', '/staff', '/pallet'];
      if (forbidden.some(path => pathname.startsWith(path))) {
        alert("접근 권한이 없습니다.");
        router.replace("/truck"); // push 대신 replace로 기록 삭제
      }
    }

    if (userRole === 'accident_manager') {
      // 사고담당자가 가면 안 되는 곳들
      const forbidden = ['/truck', '/cod', '/staff', '/pallet'];
      if (forbidden.some(path => pathname.startsWith(path))) {
        alert("사고 접수 전용 계정입니다.");
        router.replace("/accident");
      }
    }
  }, [pathname, userRole, loading, router]);

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  if (pathname === '/login') {
    return (
      <html lang="ko">
        <body className="bg-slate-50 min-h-screen font-sans">{children}</body>
      </html>
    );
  }

  // 권한 변수
  const isAdmin = userRole === 'admin';
  const isTruckVendor = userRole === 'truck_vendor';
  const isAccidentManager = userRole === 'accident_manager';

  return (
    <html lang="ko">
      <body className="flex bg-slate-50 min-h-screen font-sans font-black">
        <nav className="w-64 h-screen bg-white border-r border-slate-200 p-8 sticky top-0 flex flex-col gap-10 shadow-sm shrink-0">
          <Link href="/" className="group flex justify-center p-2 rounded-2xl transition-all hover:bg-slate-50">
            <img src="/ny_logis_logo.jpg" alt="NY 로지스 로고" className="w-full h-auto" />
          </Link>
          
          {/* ✨ 권한 로딩 중에는 메뉴를 아예 안 보여주거나 로딩 메시지 출력 */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">권한 확인 중...</div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2 mb-2">메뉴 시스템</p>
              
              <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                <span>🏠</span> <span>대시보드</span>
              </Link>

              {isAdmin && (
                <Link href="/pallet" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  <span>📦</span> <span>파렛트 전표</span>
                </Link>
              )}

              {(isAdmin || isTruckVendor) && (
                <Link href="/truck" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  <span>🚚</span> <span>용차 배차</span>
                </Link>
              )}

              {(isAdmin || isAccidentManager) && (
                <Link href="/accident" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  <span>⚠️</span> <span>사고 접수</span>
                </Link>
              )}

              {isAdmin && (
                <>
                  <Link href="/cod" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <span>💰</span> <span>착불 관리</span>
                  </Link>
                  <Link href="/bookmarks" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <span>📌</span> <span>즐겨찾기</span>
                  </Link>
                  <Link href="/staff" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <span>👥</span> <span className="text-sm">상차 담당자 관리</span>
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <p className="text-slate-400 uppercase">Manager</p>
              <p className="font-bold text-slate-900 mt-1">임경민 대리 ({userRole || '확인불가'})</p>
            </div>
            <button onClick={handleLogout} className="w-full p-3 rounded-2xl font-black text-red-500 hover:bg-red-50 border border-transparent">
              Logout
            </button>
          </div>
        </nav>

        <main className="flex-1 h-screen overflow-y-auto bg-slate-50">{children}</main>
      </body>
    </html>
  );
}
