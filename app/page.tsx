"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 실시간 건수 상태 (나중에 DB랑 연결하면 자동으로 바뀔 숫자들!)
  const [stats, setStats] = useState({
    pallet: 0,
    truck: 0,
    accident: 0,
    cod: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setRole(user?.user_metadata?.role || 'user');
      
      // 여기서 나중에 각 테이블 건수를 count해서 넣어줄 거야!
      // 우선 갱미가 보기 편하게 기본 숫자 세팅해둘게.
      setStats({
        pallet: 12, // 예시
        truck: 5,
        accident: 1,
        cod: 8
      });
      
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-slate-500 font-bold">데이터 로딩 중...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* 헤더 섹션 */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">NY LOGIS 대시보드</h1>
        <p className="text-slate-500 font-bold mt-1">천안센터 {role === 'admin' ? '관리자용' : '파트너용'} 실시간 현황판입니다.</p>
      </div>

      {/* 1. 상단 요약 카드 (숫자가 보이는 곳!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase mb-1">파렛트 전표</p>
          <p className="text-3xl font-black text-slate-900">{stats.pallet}<span className="text-sm ml-1 text-slate-400">개</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-orange-400 uppercase mb-1">용차 배차대기</p>
          <p className="text-3xl font-black text-slate-900">{stats.truck}<span className="text-sm ml-1 text-slate-400">건</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-red-400 uppercase mb-1">미처리 사고</p>
          <p className="text-3xl font-black text-slate-900">{stats.accident}<span className="text-sm ml-1 text-slate-400">건</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-[11px] font-black text-blue-400 uppercase mb-1">미확인 착불</p>
          <p className="text-3xl font-black text-slate-900">{stats.cod}<span className="text-sm ml-1 text-slate-400">건</span></p>
        </div>
      </div>

      {/* 2. 하단 상세 관리 박스 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 용차 관리 (admin, truck_vendor) */}
        {(role === 'admin' || role === 'truck_vendor') && (
          <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-orange-50 p-4 rounded-2xl text-2xl">🚚</div>
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Real-time</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">용차 배차관리</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">현재 배차 진행 상황을 확인하고 기사님 정보를 등록합니다.</p>
          </div>
        )}

        {/* 사고 접수 (admin, accident_manager) */}
        {(role === 'admin' || role === 'accident_manager') && (
          <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-red-50 p-4 rounded-2xl text-2xl">⚠️</div>
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Emergency</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">사고 접수센터</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">최근 발생한 사고 내역을 확인하고 처리 상태를 관리합니다.</p>
          </div>
        )}

        {/* 파렛트 관리 (admin 전용) */}
        {role === 'admin' && (
          <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl text-2xl">📦</div>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">파렛트 전표관리</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">천안센터 내 전체 파렛트 입출고 데이터를 제어합니다.</p>
          </div>
        )}

        {/* 착불 관리 (admin 전용) */}
        {role === 'admin' && (
          <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-blue-50 p-4 rounded-2xl text-2xl">💰</div>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">착불 정산관리</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">미수금 정산 및 업체별 입금 내역을 최종 확인합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
