"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 진짜 실시간 건수 상태!
  const [stats, setStats] = useState({
    pallet: 0,
    truck: 0,
    accident: 0,
    cod: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      // 1. 유저 권한 확인
      const { data: { user } } = await supabase.auth.getUser();
      setRole(user?.user_metadata?.role || 'user');
      
      // 2. 실시간 카운트 쿼리 (갱미가 요청한 조건들!)
      const { count: pCount } = await supabase.from('pallets').select('*', { count: 'exact', head: true }).eq('status', '미확인');
      const { count: tCount } = await supabase.from('truck_orders').select('*', { count: 'exact', head: true }).eq('status', '신청완료');
      const { count: aCount } = await supabase.from('accidents').select('*', { count: 'exact', head: true }).eq('status', '접수완료');
      const { count: payCount } = await supabase.from('cod_manage') // 테이블 이름 확인!.select('*', { count: 'exact', head: true }).eq('status', '미확인');

      setStats({
        pallet: pCount || 0,
        truck: tCount || 0,
        accident: aCount || 0,
        cod: payCount || 0
      });
      
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-slate-500 font-bold animate-pulse text-center mt-20 text-xl">🚀 NY LOGIS 데이터 로딩 중...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* 헤더 섹션 */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">NY LOGIS DASHBOARD</h1>
          <p className="text-slate-400 font-bold mt-1 tracking-tight">천안센터 {role === 'admin' ? '관리자용' : '파트너용'} 실시간 현황판입니다.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 text-[10px] font-black text-slate-400">
           ONLINE <span className="text-green-500 ml-1">●</span>
        </div>
      </div>

      {/* 1. 상단 요약 카드 (이제 진짜 숫자가 보임!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest font-sans">파렛트 미확인</p>
          <p className="text-4xl font-black text-slate-900">{stats.pallet}<span className="text-sm ml-1 text-slate-300">개</span></p>
          <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 opacity-20"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[11px] font-black text-orange-400 uppercase mb-2 tracking-widest font-sans">용차 신청완료</p>
          <p className="text-4xl font-black text-slate-900">{stats.truck}<span className="text-sm ml-1 text-slate-300">건</span></p>
          <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 opacity-20"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[11px] font-black text-red-400 uppercase mb-2 tracking-widest font-sans">미처리 사고</p>
          <p className="text-4xl font-black text-slate-900">{stats.accident}<span className="text-sm ml-1 text-slate-300">건</span></p>
          <div className="absolute top-0 right-0 w-2 h-full bg-red-500 opacity-20"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[11px] font-black text-blue-400 uppercase mb-2 tracking-widest font-sans">미확인 착불</p>
          <p className="text-4xl font-black text-slate-900">{stats.cod}<span className="text-sm ml-1 text-slate-300">건</span></p>
          <div className="absolute top-0 right-0 w-2 h-full bg-blue-400 opacity-20"></div>
        </div>
      </div>

      {/* 2. 하단 상세 관리 박스 (Link 연결까지 완료!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 용차 관리 */}
        {(role === 'admin' || role === 'truck_vendor') && (
          <Link href="/truck" className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-2xl hover:-translate-y-2 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-orange-50 p-5 rounded-3xl text-3xl group-hover:scale-110 transition-all">🚚</div>
              <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Dispatch</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">용차 배차관리</h2>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">배차 진행 상황 확인 및 기사 정보를 등록하세요.</p>
          </Link>
        )}

        {/* 사고 접수 */}
        {(role === 'admin' || role === 'accident_manager') && (
          <Link href="/accidents" className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-2xl hover:-translate-y-2 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-red-50 p-5 rounded-3xl text-3xl group-hover:scale-110 transition-all">⚠️</div>
              <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Accident</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">사고 접수센터</h2>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">사고 내역 확인 및 처리 상태를 실시간 관리합니다.</p>
          </Link>
        )}

        {/* 파렛트 관리 */}
        {role === 'admin' && (
          <Link href="/pallets" className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-2xl hover:-translate-y-2 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-slate-50 p-5 rounded-3xl text-3xl group-hover:scale-110 transition-all">📦</div>
              <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Pallet</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">파렛트 전표관리</h2>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">천안센터 내 전체 파렛트 입출고 데이터를 제어합니다.</p>
          </Link>
        )}

        {/* 착불 관리 */}
        {role === 'admin' && (
          <Link href="/payments" className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-2xl hover:-translate-y-2 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-blue-50 p-5 rounded-3xl text-3xl group-hover:scale-110 transition-all">💰</div>
              <span className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Finance</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">착불 정산관리</h2>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">미수금 정산 및 업체별 입금 내역을 확인합니다.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
