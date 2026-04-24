"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // ✨ lib/supabase.ts 경로가 맞는지 확인!
import Link from "next/link";

export default function MainPage() {
  const [counts, setCounts] = useState({
    pallets: 0,
    trucks: 0,
    accidents: 0,
    payments: 0
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    // 💡 개별 카운트 함수: 하나가 실패해도 전체가 멈추지 않도록 설계
    const getSafeCount = async (tableName: string, statusValue: string) => {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('status', statusValue);
        
        if (error) throw error;
        return count || 0;
      } catch (err) {
        console.error(`${tableName} 데이터 로드 실패:`, err);
        return 0;
      }
    };

    try {
      // ✨ Promise.allSettled로 비동기 에러 완벽 방어
      const results = await Promise.allSettled([
        getSafeCount('pallets', '미확인'),
        getSafeCount('truck_orders', '신청완료'),
        getSafeCount('accidents', '접수완료'),
        getSafeCount('payments', '미확인'),
      ]);

      const [p, t, a, pay] = results.map(res => res.status === 'fulfilled' ? res.value : 0);
      setCounts({ pallets: p, trucks: t, accidents: a, payments: pay });
    } catch (criticalError) {
      console.error("데이터 로딩 중 치명적 에러 발생:", criticalError);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans font-black">
      {/* 🔵 상단 헤더 섹션 */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
            NY LOGIS <span className="text-blue-600">대시보드</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-tight">
            천안센터 실시간 업무 현황판 (Partner Mode)
          </p>
        </div>
        <button 
          onClick={fetchCounts} 
          className="text-xs font-black text-slate-400 bg-white px-5 py-2.5 rounded-2xl shadow-sm hover:text-slate-800 hover:shadow-md transition-all border border-slate-100"
        >
          🔄 REFRESH DATA
        </button>
      </div>

      {/* 📊 상단 실시간 카운트 카드 섹션 */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <DashboardCountCard title="파렛트 미확인" count={counts.pallets} color="blue" />
        <DashboardCountCard title="용차 신청완료" count={counts.trucks} color="orange" />
        <DashboardCountCard title="미처리 사고" count={counts.accidents} color="red" />
        <DashboardCountCard title="미확인 착불" count={counts.payments} color="indigo" />
      </div>

      {/* 🚀 하단 메인 메뉴 카드 섹션 (무조건 렌더링) */}
      <div className="grid grid-cols-2 gap-8 text-left">
        <Link href="/truck" className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 hover:shadow-2xl hover:-translate-y-2 transition-all group">
          <div className="bg-orange-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 group-hover:bg-orange-100 transition-all">🚚</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 font-sans">용차 배차관리</h2>
          <p className="text-slate-400 font-bold text-sm leading-relaxed">배차 상황을 실시간으로 확인하고 기사 정보를 신속하게 등록하세요.</p>
        </Link>

        <Link href="/accident" className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 hover:shadow-2xl hover:-translate-y-2 transition-all group">
          <div className="bg-red-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 group-hover:bg-red-100 transition-all">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 font-sans">사고 접수센터</h2>
          <p className="text-slate-400 font-bold text-sm leading-relaxed">최근 발생한 사고 내역을 확인하고 처리 상태를 투명하게 관리합니다.</p>
        </Link>

        <Link href="/pallet" className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 hover:shadow-2xl hover:-translate-y-2 transition-all group">
          <div className="bg-slate-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 group-hover:bg-slate-200 transition-all">📦</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 font-sans">파렛트 전표관리</h2>
          <p className="text-slate-400 font-bold text-sm leading-relaxed">천안센터 내 전체 파렛트 입출고 데이터를 정밀하게 제어합니다.</p>
        </Link>

        <Link href="/cod" className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 hover:shadow-2xl hover:-translate-y-2 transition-all group">
          <div className="bg-blue-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 group-hover:bg-blue-100 transition-all">💰</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 font-sans">착불 정산관리</h2>
          <p className="text-slate-400 font-bold text-sm leading-relaxed">미수금 정산 현황과 업체별 입금 내역을 최종 확인하고 관리합니다.</p>
        </Link>
      </div>
    </div>
  );
}

// 🎴 카운트 카드 컴포넌트
function DashboardCountCard({ title, count, color }: { title: string, count: number, color: string }) {
  const colorMap: any = {
    blue: "group-hover:bg-blue-500 text-blue-500",
    orange: "group-hover:bg-orange-500 text-orange-500",
    red: "group-hover:bg-red-500 text-red-500",
    indigo: "group-hover:bg-indigo-500 text-indigo-500",
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group transition-all hover:shadow-md">
      <p className={`text-[10px] font-black mb-3 uppercase tracking-widest font-sans ${colorMap[color].split(' ')[1]}`}>{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-black text-slate-900 tracking-tighter">{count}</span>
        <span className="text-sm font-bold text-slate-400">건</span>
      </div>
      <div className={`absolute top-0 right-0 w-2 h-full bg-slate-50 transition-all duration-300 ${colorMap[color].split(' ')[0]}`}></div>
    </div>
  );
}
