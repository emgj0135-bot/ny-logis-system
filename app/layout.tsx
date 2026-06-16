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
  
  // 📱 모바일 사이드바 토글 상태 상태 추가
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // 페이지 이동할 때마다 모바일 메뉴는 자동으로 닫히도록 가드
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // ✨ [보안 가드] 계정별 접근 제한 로직
  useEffect(() => {
    if (loading) return;

    if (role === 'truck_vendor') {
      const forbiddenPaths = ['/accident', '/cod', '/staff', '/pallet', '/bookmarks'];
      if (forbiddenPaths.includes(pathname)) {
        alert("접근 권한이 없습니다.");
        router.push("/truck");
      }
    }

    if (role === 'accident_manager') {
      const forbiddenPaths = ['/truck', '/cod', '/staff', '/pallet', '/bookmarks'];
      if (forbiddenPaths.includes(pathname)) {
        alert("사고 접수 메뉴만 접근 가능합니다.");
        router.push("/accident");
      }
    }

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

  const isAdmin = role === 'admin';
  const isTruckVendor = role === 'truck_vendor';
  const isAccidentManager = role === 'accident_manager';
  const isUser = role === 'user';

  // 공통 메뉴 링크 컴포넌트화 (중복 제거용)
  const MenuLinks = () => (
    <>
      <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
        <span className="text-xl group-hover:scale-110">🏠</span> <span>대시보드</span>
      </Link>

      {(isAdmin || isUser) && (
        <Link href="/pallet" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
          <span className="text-xl group-hover:scale-110">📦</span> <span>파렛트 전표</span>
        </Link>
      )}

      {(isAdmin || isTruckVendor || isUser) && (
        <Link href="/truck" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group">
          <span className="text-xl group-hover:scale-110">🚚</span> <span>용차 배차</span>
        </Link>
      )}

      {(isAdmin || isAccidentManager || isUser) && (
        <Link href="/accident" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-red-500 transition-all group">
          <span className="text-xl group-hover:scale-110">⚠️</span> <span>사고 접수</span>
        </Link>
      )}

      {(isAdmin || isUser) && (
        <Link href="/cod" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-500 transition-all group">
          <span className="text-xl group-hover:scale-110">💰</span> <span>착불 관리</span>
        </Link>
      )}

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
    </>
  );

  return (
    <html lang="ko">
      {/* 📱 모바일 구조를 위해 flex-col md:flex-row 로 유연하게 가드 */}
      <body className="flex flex-col md:flex-row bg-slate-50 min-h-screen font-sans font-black text-black">
        
        {/* 📟 [모바일 전용] 탑 헤더 바 (PC화면 숨김 / 모바일 노출) */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <Link href="/">
            <img src="/ny_logis_logo.jpg" alt="NY 로지스 로고" className="h-8 w-auto" />
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-xl text-slate-700 active:scale-95 transition-all"
          >
            {isMobileMenuOpen ? "❌" : "☰"}
          </button>
        </header>

        {/* 💻 [PC 전용 사이드바] (모바일 화면 hidden 처리로 이탈 방지) */}
        <nav className="hidden md:flex w-64 h-screen bg-white border-r border-slate-200 p-8 sticky top-0 flex-col gap-10 shadow-sm shrink-0">
          <Link href="/" className="group flex justify-center p-2 rounded-2xl transition-all hover:bg-slate-50">
            <img src="/ny_logis_logo.jpg" alt="NY 로지스 로고" className="w-full h-auto group-hover:scale-105 transition-transform" />
          </Link>
          
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2 mb-2">메뉴 시스템</p>
            <MenuLinks />
          </div>

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">System Manager</p>
              <p className="text-sm font-bold text-slate-900 mt-1 tracking-tight">
                {isAdmin ? "천안센터 / 임경민 대리" : isTruckVendor ? "배차 파트너" : isAccidentManager ? "사고 관리자" : "센터 사용자"}
              </p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
              <span>🚪</span> <span className="text-sm uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </nav>

        {/* 📱 [모바일 전용 슬라이딩 메뉴 서랍장] (토글 열릴 때 덮어씌움 가드) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-[57px] bg-white z-40 p-6 flex flex-col gap-6 overflow-y-auto animate-in fade-in duration-200 md:hidden">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">메뉴 시스템</p>
            <div className="flex flex-col gap-1">
              <MenuLinks />
            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">System Manager</p>
                <p className="text-sm font-bold text-slate-900 mt-1 tracking-tight">
                  {isAdmin ? "천안센터 / 임경민 대리" : isTruckVendor ? "배차 파트너" : isAccidentManager ? "사고 관리자" : "센터 사용자"}
                </p>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl font-black text-red-500 bg-red-50/50 transition-all">
                <span>🚪</span> <span className="text-sm uppercase tracking-widest">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* 📬 메인 알맹이 화면 (모바일 스크롤과 높이를 100vh가 아닌 가변형으로 완벽 복구) */}
        <main className="flex-1 min-h-[calc(100vh-57px)] md:h-screen overflow-y-auto bg-slate-50">
          {children}
        </main>
      </body>
    </html>
  );
}
