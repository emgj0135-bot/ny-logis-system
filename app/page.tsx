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

  // app/page.tsx

useEffect(() => {
  const fetchData = async () => {
    setLoading(true); // 로딩 시작
    
    const { data: { user } } = await supabase.auth.getUser();
    setRole(user?.user_metadata?.role || 'user');
    
    // 1. 파렛트 미확인 건수
    const { count: pCount } = await supabase.from('pallets').select('*', { count: 'exact', head: true }).eq('status', '미확인');
    // 2. 용차 배차대기 건수
    const { count: tCount } = await supabase.from('truck_orders').select('*', { count: 'exact', head: true }).eq('status', '신청완료');
    // 3. 미처리 사고 건수
    const { count: aCount } = await supabase.from('accidents').select('*', { count: 'exact', head: true }).eq('status', '접수완료');
    // 4. 미확인 착불 건수 (우리가 방금 고친 녀석!)
    const { count: payCount } = await supabase.from('cod_manage').select('*', { count: 'exact', head: true }).eq('status', '미확인');

    setStats({
      pallet: pCount || 0,
      truck: tCount || 0,
      accident: aCount || 0,
      cod: payCount || 0
    });
    
    setLoading(false);
  };

  fetchData();
  
  // 💡 잼민이의 꿀팁: 페이지에 다시 들어올 때마다 새로고침하게 만들고 싶다면?
  // 브라우저 탭을 왔다갔다 할 때 숫자를 다시 세게 하려면 아래 코드를 추가해!
  window.addEventListener('focus', fetchData);
  return () => window.removeEventListener('focus', fetchData);

}, []);

  if (loading) return <div className="p-8 text-slate-500 font-bold animate-pulse text-center mt-20 text-xl">🚀 NY LOGIS 데이터 로딩 중...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* 헤더 섹션 */}
<div className="mb-12 flex justify-between items-center">
  <div className="flex items-center gap-4">
    {/* 왼쪽 파란색 포인트 기둥 */}
    <div className="w-2 h-12 bg-blue-600 rounded-full"></div> 
    
    <div>
      <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
        NY LOGIS <span className="text-blue-600">대시보드</span>
      </h1>
      <p className="text-slate-400 font-bold mt-2 tracking-tight text-sm">
        천안센터 <span className="text-slate-600">{role === 'admin' ? '관리자용' : '파트너용'}</span> 실시간 현황판입니다.
      </p>
    </div>
  </div>

  {/* 온라인 상태 표시창도 좀 더 깔끔하게 다듬었어! */}
  <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-[10px] font-black text-slate-500 tracking-widest uppercase">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
    System Online
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
            <h2 className="text-2xl font-black text-slate-800 mb-3">용차 배차</h2>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">배차 진행 상황 확인 및 기사 정보를 등록하세요.</p>
          </Link>
        )}

        {/* 사고 접수 */}
        {(role === 'admin' || role === 'accident_manager') && (
          <Link href="/accident" className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-2xl hover:-translate-y-2 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-red-50 p-5 rounded-3xl text-3xl group-hover:scale-110 transition-all">⚠️</div>
              <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Accident</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">사고 접수</h2>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">사고 내역 확인 및 처리 상태를 실시간 관리합니다.</p>
          </Link>
        )}

        {/* 파렛트 관리 */}
        {role === 'admin' && (
          <Link href="/pallet" className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-2xl hover:-translate-y-2 transition-all">
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
          <Link href="/cod" className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-2xl hover:-translate-y-2 transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-blue-50 p-5 rounded-3xl text-3xl group-hover:scale-110 transition-all">💰</div>
              <span className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Finance</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">착불 입고</h2>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">미수금 정산 및 업체별 입금 내역을 확인합니다.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
