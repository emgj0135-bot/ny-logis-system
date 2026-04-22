"use client";
import './globals.css';
import Link from 'next/link';
import { createClient } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // 유저 메타데이터에서 role을 가져옴 (없으면 'user'로 기본값)
      setRole(user?.user_metadata?.role || 'user');
      setLoading(false);
    };
    getRole();
  }, [pathname]);

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

  return (
    <html lang="ko">
      <body className="flex bg-slate-50 min-h-screen font-sans">
        <nav className="w-64 h-screen bg-white border-r border-slate-200 p-8 sticky top-0 flex flex-col gap-10 shadow-sm shrink-0">
          <Link href="/" className="group flex justify-center p-2 rounded-2xl transition-all hover:bg-slate-50">
            <img src="/ny_logis_logo.jpg" alt="NY 로지스 로고" className="w-full h-auto group-hover:scale-105 transition-transform" />
          </Link>
          
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2 mb-2">메뉴</p>
            
            {/* 관리자(admin)만 볼 수 있는 메뉴 */}
            {role === 'admin' && (
              <>
                <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
                  <span className="text-xl">🏠</span> <span>대시보드</span>
                </Link>
                <Link href="/pallet" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
                  <span className="text-xl">📦</span> <span>파렛트 재고</span>
                </Link>
              </>
            )}

            {/* 용차업체(truck_vendor)와 관리자 둘 다 볼 수 있는 메뉴 */}
            {(role === 'admin' || role === 'truck_vendor') && (
              <Link href="/truck" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
                <span className="text-xl">🚚</span> <span>용차 배차</span>
              </Link>
            )}

            {/* 사고 접수 담당자(accident_manager) 또는 관리자(admin)만 보임 */}
{(role === 'admin' || role === 'accident_manager') && (
  <Link href="/accident" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-red-500 transition-all group">
    <span className="text-xl">⚠️</span> <span>사고 접수</span>
  </Link>

  {/* layout.tsx의 메뉴 리스트 부분에 추가 */}
<Link href="/bookmarks" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-500 transition-all group">
  <span className="text-xl">📌</span> <span>즐겨찾기</span>
</Link>
)}
            
          </div>

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase">관리자</p>
              <p className="text-sm font-bold text-slate-900 mt-1 tracking-tight">천안센터</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
              <span>🚪</span> <span className="text-sm">로그아웃</span>
            </button>
          </div>
        </nav>

        <main className="flex-1 h-screen overflow-y-auto bg-slate-50">{children}</main>
      </body>
    </html>
  );
}
