"use client";
import './globals.css';
import Link from 'next/link';
// ✅ 1. supabase 대신 createClient 가져오기
import { createClient } from '@/lib/supabase';
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ✅ 2. 여기서 supabase 머신 돌려주기 (useState로 감싸서 안정성 확보)
  const [supabase] = useState(() => createClient());

  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setRole(profile?.role || 'user');
      } else {
        setRole(null);
      }
      setLoading(false);
    };
    getRole();
  }, [pathname, supabase]);

  // ✨ [보안 가드] 계정별 접근 제한 로직 (업데이트됨!)
  useEffect(() => {
    if (loading) return;

    // 1. 용차 업체(truck_vendor) 가드
    if (role === 'truck_vendor') {
      const forbiddenPaths = ['/accident', '/cod', '/staff', '/pallet', '/bookmarks'];
      if (forbiddenPaths.includes(pathname)) {
        alert("접근 권한이 없습니다.");
        router.push("/truck");
      }
    }

    // 2. 사고 접수 담당자(accident_manager) 가드
    if (role === 'accident_manager') {
      const forbiddenPaths = ['/truck', '/cod', '/staff', '/pallet', '/bookmarks'];
      if (forbiddenPaths.includes(pathname)) {
        alert("사고 접수 메뉴만 접근 가능합니다.");
        router.push("/accident");
      }
    }

    // 3. 일반 사용자(user) 가드 (✨ 새로 추가!)
    // 즐겨찾기(/bookmarks)와 담당자 관리(/staff) 접근 차단
    if (role === 'user') {
      const forbiddenPaths = ['/bookmarks', '/staff'];
      if (forbiddenPaths.includes(pathname)) {
        alert("관리자 전용 메뉴입니다. 접근 권한이 없습니다.");
        router.push("/");
      }
    }
  }, [pathname, role, loading, router]);

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

  // 권한 변수 설정
  const isAdmin = role === 'admin';
  const isTruckVendor = role === 'truck_vendor';
  const isAccidentManager = role === 'accident_manager';
  const isUser = role === 'user'; // 일반 사용자 여부

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

            {/* 관리자 또는 일반 유저 노출 (파렛트) */}
            {(isAdmin || isUser) && (
              <Link href="/pallet" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
                <span className="text-xl group-hover:scale-110">📦</span> <span>파렛트 전표</span>
              </Link>
            )}

            {/* 관리자, 용차업체, 또는 일반 유저 노출 (용차 배차) */}
            {(isAdmin || isTruckVendor || isUser) && (
              <Link href="/truck" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group">
                <span className="text-xl group-hover:scale-110">🚚</span> <span>용차 배차</span>
              </Link>
            )}

            {/* 관리자, 사고접수 담당자, 또는 일반 유저 노출 (사고 접수) */}
            {(isAdmin || isAccidentManager || isUser) && (
              <Link href="/accident" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-red-500 transition-all group">
                <span className="text-xl group-hover:scale-110">⚠️</span> <span>사고 접수</span>
              </Link>
            )}

            {/* 관리자 또는 일반 유저 노출 (착불 관리) */}
            {(isAdmin || isUser) && (
              <Link href="/cod" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-500 transition-all group">
                <span className="text-xl group-hover:scale-110">💰</span> <span>착불 관리</span>
              </Link>
            )}

            {/* ✨ 오직 관리자(admin)에게만 노출되는 메뉴 (즐겨찾기, 담당자 관리) */}
            {isAdmin && (
              <>
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
              <p className="text-sm font-bold text-slate-900 mt-1 tracking-tight">
                {isAdmin ? "천안센터 / 임경민 대리" : 
                 isTruckVendor ? "배차 파트너" : 
                 isAccidentManager ? "사고 관리자" : "센터 사용자"}
              </p>
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
