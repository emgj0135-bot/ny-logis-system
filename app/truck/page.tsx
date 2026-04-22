"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TruckPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  
  // 실제 배차 신청 시 보낼 데이터 상태
  const [orderData, setOrderData] = useState({
    loading_place: "",
    loading_address: "",
    loading_manager: "",
    loading_phone: "",
    unloading_place: "",
    unloading_address: "",
    unloading_manager: "",
    unloading_phone: "",
    // ... 기타 필요한 정보들
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. 즐겨찾기(상/하차지) 가져오기
    const { data: bData } = await supabase.from('bookmarks').select('*');
    setBookmarks(bData || []);

    // 2. 상차 담당자(직원) 가져오기
    const { data: sData } = await supabase.from('staff').select('*');
    setStaffs(sData || []);
  };

  // 상차지 선택 시 주소 자동 입력
  const handleLoadingSelect = (placeName: string) => {
    const selected = bookmarks.find(b => b.place_name === placeName && b.type === '상차지');
    if (selected) {
      setOrderData({ ...orderData, loading_place: selected.place_name, loading_address: selected.address });
    }
  };

  // 상차 담당자 선택 시 연락처 자동 입력
  const handleStaffSelect = (staffName: string) => {
    const selected = staffs.find(s => s.name === staffName);
    if (selected) {
      setOrderData({ ...orderData, loading_manager: selected.name, loading_phone: selected.phone });
    }
  };

  // 하차지 선택 시 모든 정보(주소/담당자/번호) 자동 입력
  const handleUnloadingSelect = (placeName: string) => {
    const selected = bookmarks.find(b => b.place_name === placeName && b.type === '하차지');
    if (selected) {
      setOrderData({ 
        ...orderData, 
        unloading_place: selected.place_name, 
        unloading_address: selected.address,
        unloading_manager: selected.manager_name,
        unloading_phone: selected.manager_phone
      });
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <h1 className="text-2xl font-black text-slate-800 mb-8 italic">🚚 용차 배차 신청</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* --- 상차지 섹션 --- */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h2 className="text-lg font-black text-orange-500 mb-6 underline decoration-2 underline-offset-4">STEP 1. 상차 정보</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 ml-2 mb-1 block uppercase">상차지 선택</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700"
                onChange={(e) => handleLoadingSelect(e.target.value)}
              >
                <option value="">상차지를 선택하세요</option>
                {bookmarks.filter(b => b.type === '상차지').map(b => (
                  <option key={b.id} value={b.place_name}>{b.place_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 ml-2 mb-1 block uppercase">상차 담당자</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700"
                onChange={(e) => handleStaffSelect(e.target.value)}
              >
                <option value="">담당자를 선택하세요</option>
                {staffs.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 자동 입력된 결과 확인창 (수정 가능하게 input으로) */}
            <div className="pt-4 border-t border-slate-50 mt-4 space-y-2">
              <input value={orderData.loading_address} readOnly className="w-full p-3 bg-white text-xs text-slate-400 border border-slate-100 rounded-xl" placeholder="상차지 주소 (자동입력)" />
              <input value={orderData.loading_phone} readOnly className="w-full p-3 bg-white text-xs text-slate-400 border border-slate-100 rounded-xl" placeholder="담당자 연락처 (자동입력)" />
            </div>
          </div>
        </div>

        {/* --- 하차지 섹션 --- */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h2 className="text-lg font-black text-blue-500 mb-6 underline decoration-2 underline-offset-4">STEP 2. 하차 정보</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 ml-2 mb-1 block uppercase">하차지(거래처) 선택</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700"
                onChange={(e) => handleUnloadingSelect(e.target.value)}
              >
                <option value="">하차지를 선택하세요</option>
                {bookmarks.filter(b => b.type === '하차지').map(b => (
                  <option key={b.id} value={b.place_name}>{b.place_name}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-50 mt-4 space-y-2">
              <input value={orderData.unloading_address} readOnly className="w-full p-3 bg-white text-xs text-slate-400 border border-slate-100 rounded-xl" placeholder="하차지 주소 (자동입력)" />
              <div className="grid grid-cols-2 gap-2">
                <input value={orderData.unloading_manager} readOnly className="p-3 bg-white text-xs text-slate-400 border border-slate-100 rounded-xl" placeholder="담당자 (자동)" />
                <input value={orderData.unloading_phone} readOnly className="p-3 bg-white text-xs text-slate-400 border border-slate-100 rounded-xl" placeholder="연락처 (자동)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="w-full mt-10 p-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-slate-800 transition-all">
        배차 신청하기 🚀
      </button>
    </div>
  );
}
