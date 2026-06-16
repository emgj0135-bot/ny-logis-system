"use client";
import { useEffect, useState } from "react";
// ✅ 1. createClient 함수 가져오기로 수정
import { createClient } from "@/lib/supabase"; 
import Link from "next/link";

export default function MainPage() {
  // ✅ 2. 컴포넌트 최상단에서 supabase 머신 딱 한 번만 돌리기!
  const [supabase] = useState(() => createClient());

  const [counts, setCounts] = useState({
    pallets: 0,
    trucks: 0,
    accidents: 0,
    payments: 0
  });

  // 🔔 HTS 알림 팝업을 위한 상태값 추가
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // 💡 최초에 한 번 전체 카운트 로드
    fetchCounts();

    // 📡 [HTS 실시간 엔진 장착]: DB 감시 카메라 가동 시작!
    const channel = supabase
      .channel('hts-realtime-monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public' }, // 어떤 테이블이든 신규 등록(INSERT)되면 감지!
        (payload) => {
          const tableName = payload.table;
          
          // 1. 테이블별 맞춤형 HTS 팝업 문구 생성
          if (tableName === 'truck_orders') {
            showHtsToast("🚚 용차 배차관리 신규 신청 건이 발생했습니다!");
          } else if (tableName === 'pallets') {
            showHtsToast("📦 파렛트 전표관리 신규 전표가 등록되었습니다!");
          } else if (tableName === 'accidents') {
            showHtsToast("⚠️ 사고 접수센터 신규 사고가 접수되었습니다!");
          } else if (tableName === 'cod_manage') {
            showHtsToast("💰 착불 정산관리 신규 내역이 기록되었습니다!");
          }

          // 2. 숫자를 새로고침 없이 실시간으로 +1 동기화!
          fetchCounts();
        }
      )
      .subscribe();

    // 🔌 화면 나갈 때 감시 카메라 안전하게 끄기 (메모리 누수 방지)
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ⏰ 팝업창을 3초 동안 띄웠다가 사라지게 하는 함수
  const showHtsToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000); // 3000ms = 3초
  };

  const fetchCounts = async () => {
    const getSafeCount = async (tableName: string, statusValue: string) => {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('id', { count: 'exact' })
          .eq('status', statusValue);
        
        if (error) throw error;
        return count || 0;
      } catch (err) {
        console.error(`${tableName} 데이터 로드 실패:`, err);
        return 0;
      }
    };

    try {
      const results = await Promise.allSettled([
        getSafeCount('pallets', '미확인'),
        getSafeCount('truck_orders', '신청완료'),
        getSafeCount('accidents', '접수완료'),
        getSafeCount('cod_manage', '미확인'),
      ]);

      const [p, t, a, pay] = results.map(res => res.status === 'fulfilled' ? res.value : 0);
      setCounts({ pallets: p, trucks: t, accidents: a, payments: pay });
    } catch (criticalError) {
      console.error("데이터 로딩 중 치명적 에러 발생:", criticalError);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans font-black relative overflow-hidden">
      
      {/* 🔵 상단 헤더 섹션 */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter uppercase leading-none">
            NY LOGIS <span className="text-blue-600">대시보드</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-tight">
            천안센터 실시간 업무 현황판 (HTS Real-time Mode)
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
        <DashboardCountCard title="파렛트 미확인" count={counts.pallets} color="blue" unit="개" />
        <DashboardCountCard title="용차 신청완료" count={counts.trucks} color="orange" unit="건" />
        <DashboardCountCard title="미처리 사고" count={counts.accidents} color="red" unit="건" />
        <DashboardCountCard title="미확인 착불" count={counts.payments} color="indigo" unit="건" />
      </div>

      {/* 🚀 하단 메인 메뉴 카드 섹션 */}
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

      {/* 📈 HTS 체결 스타일 실시간 토스트 팝업 컴포넌트 */}
      {toastMessage && (
        <div className="fixed bottom-10 right-10 z-[100] bg-slate-900 text-white px-8 py-5 rounded-[1.8rem] shadow-2xl border border-blue-500/30 backdrop-blur-md flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></div>
          <p className="text-sm font-black tracking-tight text-white font-sans">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}

// 🎴 카운트 카드 컴포넌트
function DashboardCountCard({ title, count, color, unit }: { title: string, count: number, color: string, unit: string }) {
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
        <span className="text-5xl font-black text-slate-900 tracking-tighter transition-all duration-300 group-hover:scale-105 inline-block">{count}</span>
        <span className="text-sm font-bold text-slate-400">{unit}</span>
      </div>
      <div className={`absolute top-0 right-0 w-2 h-full bg-slate-50 transition-all duration-300 ${colorMap[color].split(' ')[0]}`}></div>
    </div>
  );
}
