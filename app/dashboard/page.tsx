"use client";
import { useEffect, useState } from "react";
// ✅ 1. 만들어둔 머신 가져오기
import { createClient } from "@/lib/supabase"; 
import Link from "next/link";

export default function DashboardPage() {
  // ✅ 2. Supabase 머신 안전하게 생성 (무한 생성 및 세션 끊김 방지 가드)
  const [supabase] = useState(() => createClient());

  const [counts, setCounts] = useState({
    pallets: 0,
    trucks: 0,
    accidents: 0,
    payments: 0
  });

  // 🔔 HTS 알림 팝업 전용 상태값 추가
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // ⏰ 타이머 혼선 방지용 관리 변수
  const [toastTimeoutId, setToastTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 💡 초기 카운트 데이터 로드
    fetchCounts();

    // 📡 [HTS 실시간 엔진 가동]: DB 실시간 무전 안테나 개통!
    const channel = supabase
      .channel('hts-realtime-monitor', {
        config: {
          broadcast: { self: true },
          presence: { key: 'dashboard' }
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public' }, // 퍼블릭 스키마 내 모든 신규 INSERT 감지
        (payload) => {
          console.log("🚀 실시간 DB 신호 캐치 완료! 대상 테이블:", payload.table);
          const tableName = payload.table;
          
          // 테이블별 HTS 맞춤형 팝업 문구 지정
          if (tableName === 'truck_orders') {
            showHtsToast("🚚 용차 배차관리 신규 신청 건이 발생했습니다!");
          } else if (tableName === 'pallets') {
            showHtsToast("📦 파렛트 전표관리 신규 전표가 등록되었습니다!");
          } else if (tableName === 'accidents') {
            showHtsToast("⚠️ 사고 접수센터 신규 사고가 접수되었습니다!");
          } else if (tableName === 'cod_manage') {
            showHtsToast("💰 착불 정산관리 신규 내역이 기록되었습니다!");
          }

          // 화면 새로고침 없이 상단 카드 카운트 동기화
          fetchCounts();
        }
      )
      .subscribe((status) => {
        console.log("📡 HTS 실시간 안테나 접속 상태:", status);
      });

    // 🔌 화면 소멸 시 커넥션 안전 폐기 (메모리 누수 방지)
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ⏰ 3초 타이머 무결점 토스트 구동 함수
  const showHtsToast = (message: string) => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);

    setToastMessage(message);

    const id = setTimeout(() => {
      setToastMessage(null);
    }, 3000); // 3초 뒤 자동 소멸

    setToastTimeoutId(id);
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
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans font-black relative overflow-hidden">
      
      {/* 🔵 상단 헤더 섹션 (모바일 뷰 위아래 배치 가드 / PC 좌우 수평 배치) */}
      <div className="mb-6 md:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black italic text-slate-800 tracking-tighter uppercase leading-none">
            NY LOGIS <span className="text-blue-600">대시보드</span>
          </h1>
          <p className="text-xs md:text-sm font-bold text-slate-400 mt-1.5 md:mt-1 uppercase">
            Cheonan Center Real-time Status
          </p>
        </div>
        <button 
          onClick={fetchCounts} 
          className="w-full sm:w-auto text-xs font-black text-slate-500 bg-white px-5 py-3 rounded-xl md:rounded-2xl shadow-sm hover:text-slate-800 hover:shadow-md transition-all border border-slate-100 text-center"
        >
          🔄 REFRESH
        </button>
      </div>

      {/* 📊 상단 실시간 카운트 카드 섹션 (모바일 2열 정렬로 글자 터짐 방지 📱 / PC 4열 정렬) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12 text-black">
        
        {/* 파렛트 카드 */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 mb-1.5 md:mb-2 uppercase tracking-widest font-sans">파렛트 미확인</p>
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <span className="text-3xl md:text-4xl font-black text-slate-800">{counts.pallets}</span>
            <span className="text-xs font-bold text-slate-400 font-sans">개</span>
          </div>
          <div className="absolute top-0 right-0 w-1.5 md:w-2 h-full bg-slate-100 group-hover:bg-blue-500 transition-all"></div>
        </div>

        {/* 용차 카드 */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[9px] md:text-[10px] font-black text-orange-400 mb-1.5 md:mb-2 uppercase tracking-widest font-sans">용차 신청완료</p>
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <span className="text-3xl md:text-4xl font-black text-slate-800">{counts.trucks}</span>
            <span className="text-xs font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-1.5 md:w-2 h-full bg-slate-100 group-hover:bg-orange-500 transition-all"></div>
        </div>

        {/* 사고 카드 */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[9px] md:text-[10px] font-black text-red-400 mb-1.5 md:mb-2 uppercase tracking-widest font-sans">미처리 사고접수</p>
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <span className="text-3xl md:text-4xl font-black text-slate-800">{counts.accidents}</span>
            <span className="text-xs font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-1.5 md:w-2 h-full bg-slate-100 group-hover:bg-red-500 transition-all"></div>
        </div>

        {/* 착불 카드 */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <p className="text-[9px] md:text-[10px] font-black text-blue-400 mb-1.5 md:mb-2 uppercase tracking-widest font-sans">미확인 착불관리</p>
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <span className="text-3xl md:text-4xl font-black text-slate-800">{counts.payments}</span>
            <span className="text-xs font-bold text-slate-400 font-sans">건</span>
          </div>
          <div className="absolute top-0 right-0 w-1.5 md:w-2 h-full bg-slate-100 group-hover:bg-blue-400 transition-all"></div>
        </div>
      </div>

      {/* 🚀 하단 메뉴 이동 카드 섹션 (모바일 1열 가로 전체 너비 📱 / PC 2열 가로 정렬) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-left">
        
        <Link href="/truck" className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group font-black block">
          <div className="bg-orange-50 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 text-xl md:text-2xl group-hover:scale-110 transition-all">🚚</div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-1 md:mb-2">용차 배차관리</h2>
          <p className="text-slate-400 font-bold text-xs md:text-sm font-sans leading-relaxed">현재 배차 진행 상황을 확인하고 기사 정보를 등록합니다.</p>
        </Link>

        <Link href="/accident" className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group font-black block">
          <div className="bg-red-50 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 text-xl md:text-2xl group-hover:scale-110 transition-all">⚠️</div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-1 md:mb-2">사고 접수센터</h2>
          <p className="text-slate-400 font-bold text-xs md:text-sm font-sans leading-relaxed">최근 발생한 사고 내역을 확인하고 처리 상태를 관리합니다.</p>
        </Link>

        <Link href="/pallet" className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group font-black block">
          <div className="bg-slate-100 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 text-xl md:text-2xl group-hover:scale-110 transition-all">📦</div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-1 md:mb-2">파렛트 전표관리</h2>
          <p className="text-slate-400 font-bold text-xs md:text-sm font-sans leading-relaxed">천안센터 내 전체 파렛트 입출고 데이터를 제어합니다.</p>
        </Link>

        <Link href="/cod" className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-2 transition-all group font-black block">
          <div className="bg-blue-50 w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 text-xl md:text-2xl group-hover:scale-110 transition-all">💰</div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-1 md:mb-2">착불 정산관리</h2>
          <p className="text-slate-400 font-bold text-xs md:text-sm font-sans leading-relaxed">미수금 정산 및 업체별 입금 내역을 최종 확인합니다.</p>
        </Link>
      </div>

      {/* 📈 HTS 체결 스타일 실시간 토스트 팝업 (모바일 한 손 파지법 맞춤형 하단 전면 고정 팝업 가드 조치) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-10 md:bottom-10 z-[100] bg-slate-900/95 text-white px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-[1.8rem] shadow-2xl border border-blue-500/40 backdrop-blur-md flex items-center gap-3 md:gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 animate-ping"></div>
          <p className="text-xs md:text-sm font-black tracking-tight text-white font-sans break-keep">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}
