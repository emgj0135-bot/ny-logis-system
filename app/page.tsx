"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 수파베이스 클라이언트 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // 유저 메타데이터에서 role을 가져옴 (기본값 'user')
      setRole(user?.user_metadata?.role || 'user');
      setLoading(false);
    };
    getRole();
  }, []);

  // 로딩 중일 때 잠깐 보여줄 화면 (깜빡임 방지)
  if (loading) {
    return <div className="p-8 text-slate-500 font-bold">데이터 로딩 중...</div>;
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">NY LOGIS 대시보드</h1>
        <p className="text-slate-500 font-medium mt-1">
          {role === 'truck_vendor' ? '용차업체 파트너용 화면입니다.' : '천안센터 관리자용 화면입니다.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* --- 🚚 용차 배차관리 (관리자 & 용차업체 공통) --- */}
        {(role === 'admin' || role === 'truck_vendor') && (
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🚚</span>
              <h2 className="text-lg font-bold text-slate-800">용차 배차관리</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              현재 진행 중인 배차 리스트를 확인하고 관리합니다.
            </p>
            {/* 여기에 실제 배차 리스트나 요약 숫자를 넣으면 돼! */}
          </div>
        )}

        {/* --- ⏳ 배차대기 현황 (관리자 & 용차업체 공통) --- */}
        {(role === 'admin' || role === 'truck_vendor') && (
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⏳</span>
              <h2 className="text-lg font-bold text-slate-800">배차대기 현황</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              새로 등록된 배차 요청 건을 확인하고 배차를 확정하세요.
            </p>
          </div>
        )}

        {/* --- 📦 파렛트 재고 현황 (관리자전용) --- */}
        {role === 'admin' && (
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📦</span>
              <h2 className="text-lg font-bold text-slate-800">파렛트 재고관리</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              전체 파렛트 입출고 및 현재 재고 데이터를 관리합니다.
            </p>
          </div>
        )}

        {/* --- ⚠️ 사고 및 정산 현황 (관리자전용) --- */}
        {role === 'admin' && (
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💰</span>
              <h2 className="text-lg font-bold text-slate-800">정산 및 사고현황</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              미수금 관리, 착불 정산 및 사고 접수 내역을 확인합니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
