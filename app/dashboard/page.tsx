"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function DashboardPage() {
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
    try {
      // 💡 테이블명 확인: 갱미의 DB 테이블명에 맞춰서 pallets -> pallet 등으로 수정 필요할 수 있음
      const { count: pCount } = await supabase.from('pallet').select('*', { count: 'exact', head: true }).eq('status', '미확인');
      const { count: tCount } = await supabase.from('truck_orders').select('*', { count: 'exact', head: true }).eq('status', '신청완료');
      const { count: aCount } = await supabase.from('accidents').select('*', { count: 'exact', head: true }).eq('status', '접수완료');
      const { count: payCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', '미확인');

      setCounts({
        pallets: pCount || 0,
        trucks: tCount || 0,
        accidents: aCount || 0,
        payments: payCount || 0
      });
    } catch (error) {
      console.error("데이터 로드 에러:", error);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans font-black">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter uppercase">NY LOGIS 대시보드</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">천안센터 파트너용 실시간 현황판입니다.</p>
        </div>
        <button onClick={fetchCounts} className="text-xs font-black text-slate-400 bg-white px-4 py-2 rounded-xl shadow-sm hover:text-slate-800 transition-all">🔄 새로고침</button>
      </div>

      {/* 상단 실시간 카운트 카드 */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {/* 파렛트 */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">파렛트 미확인</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.pallets}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">개</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-blue-500 transition-all"></div>
        </div>
        {/* 용차 */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-orange-400 mb-2 uppercase tracking-widest">용차 신청완료</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.trucks}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-orange-500 transition-all"></div>
        </div>
        {/* 사고 */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-red-400 mb-2 uppercase tracking-widest">미처리 사고</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.accidents}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-red-500 transition-all"></div>
        </div>
        {/* 착불 */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest">미확인 착불</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.payments}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-blue-400 transition-all"></div>
        </div>
      </div>

      {/* 하단 메뉴 카드 - ✨ Link href 경로 수정 완료 */}
      <div className="grid grid-cols-2 gap-8">
        <Link href="/truck" className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group font-black">
          <div className="bg-orange-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all">🚚</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 text-left">용차 배차</h2>
          <p className="text-slate-400 font-bold text-sm text-left font-sans">배차 진행 상황 확인 및 기사 정보를 등록하세요.</p>
        </Link>

        {/* 💡 /accidents -> /accident 로 수정 */}
        <Link href="/accident" className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group font-black">
          <div className="bg-red-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 text-left">사고 접수</h2>
          <p className="text-slate-400 font-bold text-sm text-left font-sans">사고 내역 확인 및 처리 상태를 실시간 관리합니다.</p>
        </Link>

        {/* 💡 /pallets -> /pallet 으로 수정 */}
        <Link href="/pallet" className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group font-black">
          <div className="bg-slate-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all">📦</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 text-left">파렛트 전표관리</h2>
          <p className="text-slate-400 font-bold text-sm text-left font-sans">천안센터 내 전체 파렛트 입출고 데이터를 제어합니다.</p>
        </Link>

        {/* 💡 /payments -> /cod 로 수정 (사이드바와 통일) */}
        <Link href="/cod" className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group font-black">
          <div className="bg-blue-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all">💰</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 text-left">착불 입고</h2>
          <p className="text-slate-400 font-bold text-sm text-left font-sans">미수금 정산 및 업체별 입금 내역을 확인합니다.</p>
        </Link>
      </div>
    </div>
  );
}
