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
    // 1. // dashboard/page.tsx의 fetchCounts 함수 중 일부
const fetchCounts = async () => {
  // 파렛트 전표: '미확인' 상태인 것만 카운트!
  const { count: pCount, error } = await supabase
    .from('pallets')
    .select('*', { count: 'exact', head: true })
    .eq('status', '미확인');

  if (error) console.error("에러 발생:", error); // 혹시 에러 나면 로그로 확인

  setCounts(prev => ({
    ...prev,
    pallets: pCount || 0
  }));
};

    // 2. 용차 배차: '신청완료' 상태만 카운트
    const { count: tCount } = await supabase
      .from('truck_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', '신청완료');

    // 3. 사고 접수: '접수완료' 상태만 카운트
    const { count: aCount } = await supabase
      .from('accidents')
      .select('*', { count: 'exact', head: true })
      .eq('status', '접수완료');

    // 4. 착불 관리: '미확인' 상태만 카운트
    const { count: payCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', '미확인');

    setCounts({
      pallets: pCount || 0,
      trucks: tCount || 0,
      accidents: aCount || 0,
      payments: payCount || 0
    });
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter uppercase">NY LOGIS 대시보드</h1>
        <p className="text-sm font-bold text-slate-400 mt-1">천안센터 관리자용 실시간 현황판입니다.</p>
      </div>

      {/* 상단 실시간 카운트 카드 섹션 */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">파렛트 전표</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.pallets}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">개</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-blue-500 transition-all"></div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-orange-400 mb-2 uppercase tracking-widest">용차 배차대기</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.trucks}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-orange-500 transition-all"></div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-red-400 mb-2 uppercase tracking-widest">미처리 사고</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-slate-800">{counts.accidents}</span>
            <span className="text-sm font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-slate-100 group-hover:bg-red-500 transition-all"></div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest">미확인 착불</p>
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
