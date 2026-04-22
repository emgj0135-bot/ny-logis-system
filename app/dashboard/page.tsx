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
      // 1. 파렛트 전표: 'status'가 '미확인'인 데이터만 카운트
      const { count: pCount } = await supabase
        .from('pallets')
        .select('*', { count: 'exact', head: true })
        .eq('status', '미확인');

      // 2. 용차 배차: 'status'가 '신청완료'인 데이터만 카운트
      const { count: tCount } = await supabase
        .from('truck_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', '신청완료');

      // 3. 사고 접수: 'status'가 '접수완료'인 데이터만 카운트
      const { count: aCount } = await supabase
        .from('accidents')
        .select('*', { count: 'exact', head: true })
        .eq('status', '접수완료');

      // 4. 착불 관리: 'status'가 '미확인'인 데이터만 카운트
      const { count: payCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', '미확인');

      // 가져온 값들로 상태 업데이트 (null일 경우 0으로 처리)
      setCounts({
        pallets: pCount || 0,
        trucks: tCount || 0,
        accidents: aCount || 0,
        payments: payCount || 0
      });
    } catch (error) {
      console.error("데이터를 불러오는 중 에러 발생:", error);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter uppercase">NY LOGIS 대시보드</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">천안센터 관리자용 실시간 현황판입니다.</p>
        </div>
        <button 
          onClick={fetchCounts} 
          className="text-xs font-black text-slate-400 bg-white px-4 py-2 rounded-xl shadow-sm hover:text-slate-800 transition-all"
        >
          🔄 새로고침
        </button>
      </div>

      {/* 상단 실시간 카운트 카드 섹션 */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest font-sans">파렛트 미확인 전표</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.pallets}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">개</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-blue-500 transition-all"></div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-orange-400 mb-2 uppercase tracking-widest font-sans">용차 배차 신청완료</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.trucks}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-orange-500 transition-all"></div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-red-400 mb-2 uppercase tracking-widest font-sans">미처리 사고접수</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.accidents}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-red-500 transition-all"></div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest font-sans">미확인 착불관리</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.payments}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-blue-400 transition-all"></div>
        </div>
      </div>

      {/* 하단 메뉴 이동 카드 섹션 */}
      <div className="grid grid-cols-2 gap-8">
        <Link href="/truck" className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group">
          <div className="bg-orange-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all">🚚</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">용차 배차관리</h2>
          <p className="text-slate-400 font-bold text-sm">현재 배차 진행 상황을 확인하고 기사님 정보를 등록합니다.</p>
        </Link>

        <Link href="/accidents" className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group">
          <div className="bg-red-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">사고 접수센터</h2>
          <p className="text-slate-400 font-bold text-sm">최근 발생한 사고 내역을 확인하고 처리 상태를 관리합니다.</p>
        </Link>

        <Link href="/pallets" className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group">
          <div className="bg-slate-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all">📦</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">파렛트 전표관리</h2>
          <p className="text-slate-400 font-bold text-sm">천안센터 내 전체 파렛트 입출고 데이터를 제어합니다.</p>
        </Link>

        <Link href="/payments" className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group">
          <div className="bg-blue-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all">💰</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">착불 정산관리</h2>
          <p className="text-slate-400 font-bold text-sm">미수금 정산 및 업체별 입금 내역을 최종 확인합니다.</p>
        </Link>
      </div>
    </div>
  );
}
