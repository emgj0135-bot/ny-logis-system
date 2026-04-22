"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'manual' | 'bookmark'>('bookmark'); // 수동/즐겨찾기 모드
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from('bookmarks').select('*');
    setBookmarks(bData || []);
    const { data: sData } = await supabase.from('staff').select('*');
    setStaffs(sData || []);
    // 신청 목록 가져오는 로직 (기존 테이블에 맞춰 연동 필요)
  };

  // 즐겨찾기 선택 로직 (이전과 동일)
  const autoFillLoading = (val: string) => {
    const b = bookmarks.find(x => x.place_name === val);
    if(b) setFormData({...formData, loading_place: b.place_name, loading_address: b.address});
  };
  const autoFillStaff = (val: string) => {
    const s = staffs.find(x => x.name === val);
    if(s) setFormData({...formData, loading_manager: s.name, loading_phone: s.phone});
  };
  const autoFillUnloading = (val: string) => {
    const b = bookmarks.find(x => x.place_name === val);
    if(b) setFormData({...formData, unloading_place: b.place_name, unloading_address: b.address, unloading_manager: b.manager_name, unloading_phone: b.manager_phone});
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic">🚚 용차 배차 리스트</h1>
        <button onClick={() => setShowModal(true)} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">
          + 배차 신청하기
        </button>
      </div>

      {/* 배차 리스트 테이블 (기존 화면 느낌) */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
            <tr>
              <th className="p-5">날짜</th>
              <th className="p-5">상차지</th>
              <th className="p-5">하차지</th>
              <th className="p-5">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="text-slate-300 italic"><td colSpan={4} className="p-20 text-center font-bold">신청 내역을 불러오고 있습니다...</td></tr>
          </tbody>
        </table>
      </div>

      {/* 배차 신청 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto animate-in fade-in slide-in-from-right">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic underline decoration-orange-500 underline-offset-8 uppercase">Request Truck</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setMode('bookmark')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${mode === 'bookmark' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400'}`}>즐겨찾기</button>
                <button onClick={() => setMode('manual')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400'}`}>직접입력</button>
              </div>
            </div>

            <div className="space-y-8">
              {/* 상차 정보 섹션 */}
              <section className="space-y-4">
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest ml-1">Loading Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  {mode === 'bookmark' ? (
                    <>
                      <select onChange={e => autoFillLoading(e.target.value)} className="p-4 bg-slate-50 rounded-2xl border-none font-bold">
                        <option>상차지 선택</option>
                        {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id}>{b.place_name}</option>)}
                      </select>
                      <select onChange={e => autoFillStaff(e.target.value)} className="p-4 bg-slate-50 rounded-2xl border-none font-bold">
                        <option>담당자 선택</option>
                        {staffs.map(s => <option key={s.id}>{s.name}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <input placeholder="상차지명" className="p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                      <input placeholder="담당자명" className="p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, loading_manager: e.target.value})} />
                    </>
                  )}
                </div>
                <input placeholder="상차지 주소" value={formData.loading_address} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
              </section>

              {/* 하차 정보 섹션 */}
              <section className="space-y-4">
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest ml-1">Unloading Info</h3>
                {mode === 'bookmark' ? (
                  <select onChange={e => autoFillUnloading(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">
                    <option>하차지(거래처) 선택</option>
                    {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id}>{b.place_name}</option>)}
                  </select>
                ) : (
                  <input placeholder="하차지명" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, unloading_place: e.target.value})} />
                )}
                <input placeholder="하차지 주소" value={formData.unloading_address} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, unloading_address: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="하차지 담당자" value={formData.unloading_manager} className="p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, unloading_manager: e.target.value})} />
                  <input placeholder="하차지 연락처" value={formData.unloading_phone} className="p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setFormData({...formData, unloading_phone: e.target.value})} />
                </div>
              </section>
            </div>

            <div className="flex gap-4 mt-12">
              <button className="flex-1 bg-slate-900 text-white p-6 rounded-3xl font-black text-lg">신청하기 🚀</button>
              <button onClick={() => setShowModal(false)} className="px-8 bg-slate-100 text-slate-400 rounded-3xl font-black">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
