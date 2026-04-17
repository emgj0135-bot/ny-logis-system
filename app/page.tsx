"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ pallet: 0, truck: 0, accident: 0, cod: 0 });

  const fetchStats = async () => {
    const { count: pCount } = await supabase.from('pallets').select('*', { count: 'exact', head: true }).eq('is_confirmed', false);
    const { count: tCount } = await supabase.from('trucks').select('*', { count: 'exact', head: true }).eq('status', '배차요청');
    const { count: aCount } = await supabase.from('accidents').select('*', { count: 'exact', head: true }).neq('status', '보상승인');
    const { count: cCount } = await supabase.from('cod_manage').select('*', { count: 'exact', head: true }).eq('is_confirmed', false);
    setStats({ pallet: pCount || 0, truck: tCount || 0, accident: aCount || 0, cod: cCount || 0 });
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 flex justify-between items-center border-b border-slate-200 pb-10">
          <div>
            {/* 로고 이미지를 제거하고 텍스트 디자인으로 변경 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-10 h-1 bg-[#1055a4]"></span>
              <p className="text-[10px] font-black text-[#1055a4] uppercase tracking-[0.5em]">NY International Logistics</p>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              안녕하세요 <span className="text-[#1055a4]"></span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 text-base">천안 물류센터의 오늘 자 실시간 현황판입니다.</p>
          </div>
          
          <div className="p-6 bg-[#1055a4] rounded-[32px] text-center shadow-xl w-72">
            <p className="text-sky-300 font-black text-xs uppercase tracking-[0.3em] mb-2">통합 관리 시스템</p>
            <p className="text-white font-bold text-sm italic">"데이터 중심의 스마트 물류 운영"</p>
          </div>
        </header>

        {/* 상황판 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">미확인 파렛트</p>
            <p className="text-4xl font-black text-slate-900">{stats.pallet}<span className="text-sm ml-1 text-slate-300">건</span></p>
          </div>
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">배차 대기</p>
            <p className="text-4xl font-black text-orange-500">{stats.truck}<span className="text-sm ml-1 text-slate-300">건</span></p>
          </div>
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">사고 처리중</p>
            <p className="text-4xl font-black text-red-500">{stats.accident}<span className="text-sm ml-1 text-slate-300">건</span></p>
          </div>
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">미확인 착불</p>
            <p className="text-4xl font-black text-blue-600">{stats.cod}<span className="text-sm ml-1 text-slate-300">건</span></p>
          </div>
        </div>

        {/* 메뉴 바로가기 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/pallet" className="bg-white p-10 rounded-[40px] border border-slate-200 hover:border-orange-500 transition-all flex items-center justify-between shadow-sm group">
            <div><h2 className="text-2xl font-black text-slate-800 mb-1">파렛트 재고 관리</h2><p className="text-sm text-slate-400">실시간 입출고 데이터 및 전표 번호 확인</p></div>
            <span className="text-5xl group-hover:scale-110 transition-all">📦</span>
          </Link>
          <Link href="/truck" className="bg-white p-10 rounded-[40px] border border-slate-200 hover:border-orange-500 transition-all flex items-center justify-between shadow-sm group">
            <div><h2 className="text-2xl font-black text-slate-800 mb-1">용차 배차 관리</h2><p className="text-sm text-slate-400">하차지별 배차 정보 및 기사님 정보 등록</p></div>
            <span className="text-5xl group-hover:scale-110 transition-all">🚚</span>
          </Link>
          <Link href="/accident" className="bg-white p-10 rounded-[40px] border border-slate-200 hover:border-red-500 transition-all flex items-center justify-between shadow-sm group">
            <div><h2 className="text-2xl font-black text-slate-800 mb-1">사고 접수 센터</h2><p className="text-sm text-slate-400">CJ 단톡방 사고 기록 및 변상 금액 관리</p></div>
            <span className="text-5xl group-hover:scale-110 transition-all">⚠️</span>
          </Link>
          <Link href="/cod" className="bg-white p-10 rounded-[40px] border border-slate-200 hover:border-blue-500 transition-all flex items-center justify-between shadow-sm group">
            <div><h2 className="text-2xl font-black text-slate-800 mb-1">착불 정산 관리</h2><p className="text-sm text-slate-400">운임비 수금 확인 및 입금 계좌 안내</p></div>
            <span className="text-5xl group-hover:scale-110 transition-all">💰</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
