"use client";
import './globals.css';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // ✨ 상태 관리: DB에서 가져온 권한(role) 저장
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      
      // 1. 현재 로그인한 유저 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        // 2. ✨ 핵심: DB의 profiles 테이블에서 이 유저의 role을 직접 조회!
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!error && profile) {
          setUserRole(profile.role); // 'admin', 'truck_vendor', 'accident_manager' 등
        } else {
          setUserRole('user'); // 기본 권한
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchUserRole();

    // 로그인 상태가 변하면 권한 다시 가져오기
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. ✨ 보안 가드: 권한이 없는 페이지 접속 시 튕겨내기
  useEffect(() => {
    if (!loading && userRole) {
      // 용차 배차 업체(truck_vendor)는 사고접수, 착불관리, 담당자관리 금지
      if (userRole === 'truck_vendor') {
        const forbidden = ['/accident', '/cod', '/staff'];
        if (forbidden.includes(pathname)) {
          alert("접근 권한이 없습니다.");
          router.push("/truck");
        }
      }
      // 사고 담당자(accident_manager)는 사고접수만 가능하고 나머지는 금지 (필요시 추가)
      if (userRole === 'accident_manager') {
        const forbidden = ['/pallet', '/truck', '/cod', '/staff'];
        if (forbidden.includes(pathname)) {
          alert("사고 접수 권한만 있습니다.");
          router.push("/accident");
        }
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

  // ✨ 권한별 노출 조건 정의
  const isAdmin = userRole === 'admin';
  const isTruckVendor = userRole === 'truck_vendor';
  const isAccidentManager = userRole === 'accident_manager';

  return (
    <html lang="ko">
      <body className="flex bg-slate-50 min-h-screen font-sans font-black">
        <nav className="w-64 h-screen bg-white border-r border-slate-200 p-8 sticky top-0 flex flex-col gap-10 shadow-sm shrink-0">
          <Link href="/" className="group flex justify-center p-2 rounded-2xl transition-all hover:bg-slate-50">
            <img src="/ny_logis_logo.jpg" alt="NY 로지스 로고" className="w-full h-auto group-hover:scale-105 transition-transform" />
          </Link>
          
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2 mb-2">메뉴 시스템</p>
            
            {/* 공통 메뉴: 대시보드 (또는 관리자만 보게 수정 가능) */}
            <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
              <span className="text-xl group-hover:scale-110">🏠</span> <span>대시보드</span>
            </Link>

            {/* 관리자만 보는 메뉴 */}
            {isAdmin && (
              <Link href="/pallet" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
                <span className="text-xl group-hover:scale-110">📦</span> <span>파렛트 전표</span>
              </Link>
            )}

            {/* 관리자 또는 용차업체만 보는 메뉴 */}
            {(isAdmin || isTruckVendor) && (
              <Link href="/truck" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group">
                <span className="text-xl group-hover:scale-110">🚚</span> <span>용차 배차</span>
              </Link>
            )}

            {/* 관리자 또는 사고담당자만 보는 메뉴 */}
            {(isAdmin || isAccidentManager) && (
              <Link href="/accident" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-red-500 transition-all group">
                <span className="text-xl group-hover:scale-110">⚠️</span> <span>사고 접수</span>
              </Link>
            )}

            {/* 관리자만 보는 메뉴들 */}
            {isAdmin && (
              <>
                <Link href="/cod" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-500 transition-all group">
                  <span className="text-xl group-hover:scale-110">💰</span> <span>착불 관리</span>
                </Link>

                <Link href="/bookmarks" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-500 transition-all group">
                  <span className="text-xl group-hover:scale-110">📌</span> <span>즐겨찾기</span>
                </Link>
                
                <Link href="/staff" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-green-600 transition-all group">
                  <span className="text-xl group-hover:scale-110">👥</span> 
                  <span className="whitespace-nowrap text-sm tracking-tighter">상차 담당자 관리</span>
                </Link>
              </>
            )}
          </div>

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">System Manager</p>
              <p className="text-sm font-bold text-slate-900 mt-1 tracking-tight">천안센터 / 임경민 대리</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
              <span>🚪</span> <span className="text-sm uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </nav>

        <main className="flex-1 h-screen overflow-y-auto bg-slate-50">{children}</main>
      </body>
    </html>
  );
}
