"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'manual' | 'bookmark'>('bookmark');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  
  // 배차 타입 (당일 / 예약)
  const [orderType, setOrderType] = useState('당일배차');

  const [formData, setFormData] = useState({
    loading_date: new Date().toISOString().split('T')[0],
    unloading_date: new Date().toISOString().split('T')[0],
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    product_name: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from('bookmarks').select('*');
    setBookmarks(bData || []);
    const { data: sData } = await supabase.from('staff').select('*');
    setStaffs(sData || []);
    const { data: lData } = await supabase.from('truck_orders').select('*').order('created_at', { ascending: false });
    setList(lData || []);
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData }]);
    if (error) alert("신청 실패: " + error.message);
    else {
      alert("배차 신청이 완료되었습니다! 🚀");
      setShowModal(false);
      fetchData(); // 목록 새로고침
    }
  };

  // 자동입력 핸들러들
  const autoFillLoading = (val: string) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '상차지');
    if(b) setFormData({...formData, loading_place: b.place_name, loading_address: b.address});
  };
  const autoFillStaff = (val: string) => {
    const s = staffs.find(x => x.name === val);
    if(s) setFormData({...formData, loading_manager: s.name, loading_phone: s.phone});
  };
  const autoFillUnloading = (val: string) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '하차지');
    if(b) setFormData({...formData, unloading_place: b.place_name, unloading_address: b.address, unloading_manager: b.manager_name, unloading_phone: b.manager_phone});
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic">🚚 용차 배차 리스트</h1>
        <button onClick={() => setShowModal(true)} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">+ 배차 신청하기</button>
      </div>

      {/* 목록 리스트 */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
            <tr>
              <th className="p-5">일자/유형</th>
              <th className="p-5">상차지/담당자</th>
              <th className="p-5">하차지</th>
              <th className="p-5">제품/비고</th>
              <th className="p-5">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="p-5">
                  <p className="font-bold text-slate-800">{item.loading_date}</p>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{item.order_type}</span>
                </td>
                <td className="p-5">
                  <p className="font-black text-slate-700">{item.loading_place}</p>
                  <p className="text-xs text-slate-400">{item.loading_manager} / {item.loading_phone}</p>
                </td>
                <td className="p-5">
                  <p className="font-black text-slate-700">{item.unloading_place}</p>
                  <p className="text-xs text-slate-400">{item.unloading_address}</p>
                </td>
                <td className="p-5">
                  <p className="font-bold text-blue-500">{item.product_name}</p>
                  <p className="text-xs text-slate-300">{item.remarks}</p>
                </td>
                <td className="p-5"><span className="bg-orange-50 text-orange-500 px-3 py-1 rounded-full text-[10px] font-black">{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 배차 신청 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase">Request Truck</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-600 font-bold text-2xl">×</button>
            </div>

            {/* 배차 유형 및 날짜 선택 */}
            <div className="bg-slate-50 p-6 rounded-3xl mb-8 space-y-4">
              <div className="flex gap-2">
                {['당일배차', '예약배차'].map(t => (
                  <button key={t} onClick={() => setOrderType(t)} className={`flex-1 p-3 rounded-xl font-black text-xs transition-all ${orderType === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-400'}`}>{t}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">상차 날짜</label>
                  <input type="date" value={formData.loading_date} className="w-full p-3 rounded-xl border-none font-bold text-sm" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">하차 날짜</label>
                  <input type="date" value={formData.unloading_date} className="w-full p-3 rounded-xl border-none font-bold text-sm" onChange={e => setFormData({...formData, unloading_date: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* 상차 정보 */}
              <section className="space-y-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest ml-1">Loading Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select onChange={e => autoFillLoading(e.target.value)} className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm">
                    <option>상차지 선택</option>
                    {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id}>{b.place_name}</option>)}
                  </select>
                  <select onChange={e => autoFillStaff(e.target.value)} className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm">
                    <option>담당자 선택</option>
                    {staffs.map(s => <option key={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">상차지 주소 및 담당자 정보</p>
                  <p className="text-sm font-black text-slate-700">{formData.loading_address || "주소를 선택하세요"}</p>
                  {formData.loading_manager && (
                    <p className="text-sm font-black text-blue-500 mt-1">{formData.loading_manager} / {formData.loading_phone}</p>
                  )}
                </div>
              </section>

              {/* 하차 정보 */}
              <section className="space-y-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest ml-1">Unloading Info</h3>
                <select onChange={e => autoFillUnloading(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm">
                  <option>하차지 선택</option>
                  {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id}>{b.place_name}</option>)}
                </select>
                <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <p className="text-sm font-black text-slate-700">{formData.unloading_address || "하차지 주소"}</p>
                  <p className="text-xs font-bold text-slate-400">{formData.unloading_manager} {formData.unloading_phone}</p>
                </div>
              </section>

              {/* 제품 및 시간 정보 (추가된 칸들) */}
              <section className="space-y-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest ml-1">Product & Time</h3>
                <input placeholder="제품명 (예: 파렛트 10개, 정밀기계 등)" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" onChange={e => setFormData({...formData, product_name: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="상차시간 (예: 17:00)" className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" onChange={e => setFormData({...formData, loading_time: e.target.value})} />
                  <input placeholder="하차시간 (예: 익일 08:00)" className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" onChange={e => setFormData({...formData, unloading_time: e.target.value})} />
                </div>
                <textarea placeholder="비고 (특이사항)" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm h-24" onChange={e => setFormData({...formData, remarks: e.target.value})} />
              </section>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={handleSubmit} className="flex-1 bg-slate-900 text-white p-6 rounded-3xl font-black text-lg shadow-xl hover:bg-black transition-all">배차 신청하기 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
