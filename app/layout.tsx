"use client";
import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex bg-slate-50 min-h-screen font-sans">
        {/* 사이드바 */}
        <nav className="w-64 h-screen bg-white border-r border-slate-200 p-8 sticky top-0 flex flex-col gap-10 shadow-sm shrink-0">
          <Link href="/" className="group flex justify-center p-2 rounded-2xl transition-all hover:bg-slate-50">
            <img 
              src="/ny_logis_logo.jpg" 
              alt="NY 로지스 로고" 
              className="w-full h-auto group-hover:scale-105 transition-transform"
            />
          </Link>
          
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2 mb-2">메뉴</p>
            <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
              <span className="text-xl group-hover:scale-110">🏠</span> <span>대시보드</span>
            </Link>
            <Link href="/pallet" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
              <span className="text-xl group-hover:scale-110">📦</span> <span>파렛트 재고</span>
            </Link>
            <Link href="/truck" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-all group">
              <span className="text-xl group-hover:scale-110">🚚</span> <span>용차 배차</span>
            </Link>
            <Link href="/accident" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-red-500 transition-all group">
              <span className="text-xl group-hover:scale-110">⚠️</span> <span>사고 접수</span>
            </Link>
            <Link href="/cod" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-500 transition-all group">
              <span className="text-xl group-hover:scale-110">💰</span> <span>착불 관리</span>
            </Link>
          </div>

          <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase">관리자</p>
            <p className="text-xs font-black text-slate-900 mt-1 italic uppercase tracking-tighter">Gaeng-mi Partner</p>
          </div>
        </nav>

        <main className="flex-1 h-screen overflow-y-auto bg-slate-50">
          {children}
        </main>
      </body>
    </html>
  );
}