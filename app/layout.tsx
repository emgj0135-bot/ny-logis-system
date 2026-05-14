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

  useEffect(() => {
    const fetchUserRole = async () => {
      console.log("🛠️ 권한 확인 시작...");
      setLoading(true);
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          console.log("✅ 세션 확인됨:", session.user.email);
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) throw profileError;

          if (profile) {
            console.log("🔥 최종 권한 획득:", profile.role);
            setUserRole(profile.role);
          } else {
            console.warn("⚠️ 프로필 데이터가 없음 (profiles 테이블 확인 필요)");
            setUserRole('user');
          }
        } else {
          console.log("ℹ️ 로그인 세션 없음");
          setUserRole(null);
        }
      } catch (err) {
        console.error("❌ 권한 조회 중 오류 발생:", err);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // 상태 변경 감지 (로그인/로그아웃 시)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  // 보안 가드: 권한별 페이지 접근 차단
  useEffect(() => {
    if (loading) return;

    if (userRole === 'truck_vendor') {
      const forbidden = ['/accident', '/cod', '/staff', '/pallet'];
      if (forbidden.some(path => pathname.startsWith(path))) {
        alert("접근 권한이 없습니다.");
        router.replace("/truck");
      }
    }

    if (userRole === 'accident_manager') {
      const forbidden = ['/truck', '/cod', '/staff', '/pallet', '/pallet'];
      if (forbidden.some(path => pathname.startsWith(path))) {
        alert("사고 접수 권한만 있습니다.");
        router.replace("/accident");
      }
    }
  }, [pathname, userRole, loading, router]);

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Logout Error:", error);
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
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">시스템 확인 중...</div>
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
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px]">
              <p className="text-slate-400 uppercase tracking-tighter">System Manager</p>
              <p className="font-bold text-slate-900 mt-1 tracking-tighter">
                {isAdmin ? "천안센터 / 임경민 대리" : (userRole || "사용자")}
              </p>
            </div>
            <button onClick={handleLogout} className="w-full p-3 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 text-sm">
              LOGOUT
            </button>
          </div>
        </nav>

        <main className="flex-1 h-screen overflow-y-auto bg-slate-50">{children}</main>
      </body>
    </html>
  );
}
