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

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setRole(user?.user_metadata?.role || 'user');
      setLoading(false);
    };
    getRole();
  }, []);

  if (loading) return <div className="p-8 text-slate-500 font-bold">데이터 로딩 중...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">NY LOGIS 대시보드</h1>
        <p className="text-slate-500 font-medium mt-1">
          {role === 'accident_manager' ? '사고접수 담당자용 화면입니다.' : 
           role === 'truck_vendor' ? '용차업체 파트너용 화면입니다.' : '천안센터 관리자용 화면입니다.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* --- ⚠️ 사고 접수 및 현황 (관리자 & 사고담당자 공통) --- */}
        {(role === 'admin' || role === 'accident_manager') && (
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-bold text-slate-800">사고 접수현황</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              최근 발생한 사고 내역을 확인하고 조치 상태를 관리합니다.
            </p>
          </div>
        )}

        {/* --- 🚚 용차 배차 관련 (관리자 & 용차업체 공통) --- */}
        {(role === 'admin' || role === 'truck_vendor') && (
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🚚</span>
              <h2 className="text-lg font-bold text-slate-800">용차 배차관리</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">현재 배차 진행 상황을 확인합니다.</p>
          </div>
        )}

        {/* --- 📦 파렛트 및 정산 (오직 관리자만) --- */}
        {role === 'admin' && (
          <>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📦</span>
                <h2 className="text-lg font-bold text-slate-800">파렛트 재고관리</h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">전체 재고 데이터를 관리합니다.</p>
            </div>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💰</span>
                <h2 className="text-lg font-bold text-slate-800">정산 관리</h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">미수금 및 정산 데이터를 확인합니다.</p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
