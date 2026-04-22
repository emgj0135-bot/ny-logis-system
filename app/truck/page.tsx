"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('당일배차');

  const [formData, setFormData] = useState({
    loading_date: new Date().toISOString().split('T')[0],
    unloading_date: new Date().toISOString().split('T')[0],
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: "",
    product_name: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
  });

  const [resData, setResData] = useState({ car_info: "", driver_name: "", fee: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from('bookmarks').select('*');
    setBookmarks(bData || []);
    const { data: sData } = await supabase.from('staff').select('*');
    setStaffs(sData || []);
    
    // 핵심: 관계 쿼리를 통해 답변 데이터를 확실히 긁어옴
    const { data: lData } = await supabase
      .from('truck_orders')
      .select('*, order_responses(*)')
      .order('created_at', { ascending: false });
    setList(lData || []);
  };

  const handleStaffChange = (staffName: string) => {
    const selected = staffs.find(s => s.name === staffName);
    if (selected) setFormData(prev => ({ ...prev, loading_manager: selected.name, loading_phone: selected.phone }));
    else setFormData(prev => ({ ...prev, loading_manager: staffName, loading_phone: "" }));
  };

  const autoFillLoading = (val: string) => {
    if (val === "manual") setFormData(prev => ({...prev, loading_place: "", loading_address: ""}));
    else {
      const b = bookmarks.find(x => x.place_name === val && x.type === '상차지');
      if(b) setFormData(prev => ({...prev, loading_place: b.place_name, loading_address: b.address}));
    }
  };

  const autoFillUnloading = (val: string, num: number) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '하차지');
    if(b) {
      if(num === 1) setFormData(prev => ({...prev, unloading_place: b.place_name, unloading_address: b.address, unloading_manager: b.manager_name, unloading_phone: b.manager_phone}));
      else setFormData(prev => ({...prev, unloading_place_2: b.place_name, unloading_address_2: b.address, unloading_manager_2: b.manager_name, unloading_phone_2: b.manager_phone}));
    } else if (val === "manual") {
      if(num === 1) setFormData(prev => ({...prev, unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: ""}));
      else setFormData(prev => ({...prev, unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: ""}));
    }
  };

  const handleOrderSubmit = async () => {
    if (selectedOrder) await supabase.from('truck_orders').update({ order_type: orderType, ...formData }).eq('id', selectedOrder.id);
    else await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData }]);
    alert("완료되었습니다! ✨");
    closeAllModals();
    fetchData();
  };

  const handleResponseSubmit = async () => {
    const res = selectedOrder.order_responses?.[0];
    if (res) await supabase.from('order_responses').update(resData).eq('id', res.id);
    else {
      await supabase.from('order_responses').insert([{ order_id: selectedOrder.id, ...resData }]);
      await supabase.from('truck_orders').update({ status: '배차완료' }).eq('id', selectedOrder.id);
    }
    alert("배차 정보가 저장되었습니다! ✅");
    closeAllModals();
    fetchData();
  };

  const openOrderModal = (item?: any) => {
    if (item) {
      setSelectedOrder(item);
      setOrderType(item.order_type || '당일배차');
      setFormData({ ...item });
    } else {
      setSelectedOrder(null);
      setOrderType('당일배차');
      setFormData({
        loading_date: new Date().toISOString().split('T')[0],
        unloading_date: new Date().toISOString().split('T')[0],
        loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
        unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
        unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: "",
        product_name: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
      });
    }
    setShowOrderModal(true);
  };

  const openResponseModal = (item: any) => {
    setSelectedOrder(item);
    const res = item.order_responses?.[0];
    setResData({ car_info: res?.car_info || "", driver_name: res?.driver_name || "", fee: res?.fee || "" });
    setShowResponseModal(true);
  };

  const closeAllModals = () => {
    setShowOrderModal(false);
    setShowResponseModal(false);
    setSelectedOrder(null);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic text-slate-800">🚚 NY LOGIS 통합 관리</h1>
        <button onClick={() => openOrderModal()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">+ 신규 배차 신청</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
            <tr>
              <th className="p-5 text-left">일자/상태</th>
              <th className="p-5 text-left">상차 정보</th>
              <th className="p-5 text-left">하차 정보(경유)</th>
              <th className="p-5 text-left">🚛 배차 상세 정보</th>
              <th className="p-5 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((item) => {
              const res = item.order_responses?.[0];
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-5">
                    <p className="font-bold text-slate-800">{item.loading_date}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${item.status === '배차완료' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.status}</span>
                  </td>
                  <td className="p-5">
                    <p className="font-black text-slate-700">{item.loading_place}</p>
                    <p className="text-[11px] text-slate-400 font-bold">{item.loading_manager} / {item.loading_phone}</p>
                  </td>
                  <td className="p-5">
                    <div className="space-y-1 text-xs">
                      <p className="font-black text-slate-700 italic">1: {item.unloading_place || "미입력"}</p>
                      {item.unloading_place_2 && <p className="font-black text-blue-500 italic">2: {item.unloading_place_2}</p>}
                    </div>
                  </td>
                  <td className="p-5">
                    {/* 답변 정보가 리스트에 나오도록 보강한 부분 */}
                    <button 
                      onClick={() => openResponseModal(item)} 
                      className={`w-full p-3 rounded-2xl text-[11px] font-black text-left transition-all ${res ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-300 italic'}`}
                    >
                      {res ? (
                        <>
                          <p>🚛 {res.car_info}</p>
                          <p className="opacity-80 font-bold">{res.driver_name} | {res.fee}원</p>
                        </>
                      ) : "배차 정보 대기 중..."}
                    </button>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex gap-2 justify-center font-black text-[10px]">
                      <button onClick={() => openOrderModal(item)} className="bg-slate-100 text-blue-500 px-3 py-2 rounded-xl">수정</button>
                      <button onClick={() => {if(confirm("삭제?")) supabase.from('truck_orders').delete().eq('id', item.id).then(()=>fetchData())}} className="bg-slate-100 text-red-400 px-3 py-2 rounded-xl">삭제</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* [1] 배차 신청/수정 모달 */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto relative animate-in slide-in-from-right duration-300">
            {/* 우측 상단 X 닫기 버튼 */}
            <button onClick={closeAllModals} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-all p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h2 className="text-2xl font-black mb-8 uppercase italic text-slate-800 tracking-tighter">{selectedOrder ? 'Edit' : 'New'} Request</h2>
            
            <div className="space-y-6">
              {/* 날짜 선택/정보 입력 부분 (기존 로직 유지) */}
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm">
                  {['당일배차', '예약배차'].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${orderType === t ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                {orderType === '예약배차' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={formData.loading_date} className="p-3 rounded-xl border-none font-bold text-sm shadow-sm" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                    <input type="date" value={formData.unloading_date} className="p-3 rounded-xl border-none font-bold text-sm shadow-sm" onChange={e => setFormData({...formData, unloading_date: e.target.value})} />
                  </div>
                )}
              </div>

              {/* 상차지/하차지 섹션들 생략... (기존 담당자 롤백 로직 포함) */}
              <section className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase">Loading Point</p>
                <div className="grid grid-cols-2 gap-3">
                  <select onChange={e => autoFillLoading(e.target.value)} className="p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-sm">
                    <option value="">상차지 선택</option>
                    <option value="manual">✏️ 직접 입력</option>
                    {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                  </select>
                  <select value={formData.loading_manager} onChange={e => handleStaffChange(e.target.value)} className="p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-sm text-orange-600">
                    <option value="">담당자 선택</option>
                    {staffs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <input value={formData.loading_place} placeholder="상차지 명칭" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                <div className="flex gap-2">
                  <input value={formData.loading_manager} placeholder="담당자 이름" className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-sm text-orange-600 border-none" readOnly />
                  <input value={formData.loading_phone} placeholder="담당자 연락처" className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-sm text-orange-600 border-none" readOnly />
                </div>
                <input value={formData.loading_address} placeholder="상차지 주소" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
              </section>

              {/* 하차지 섹션 */}
              {[1, 2].map(num => (
                <section key={num} className="space-y-3 p-4 bg-slate-50 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Unloading {num}</p>
                  <select onChange={e => autoFillUnloading(e.target.value, num)} className="w-full p-4 bg-white rounded-2xl font-bold text-sm border-none shadow-sm">
                    <option value="">하차지 {num} 즐겨찾기</option>
                    <option value="manual">✏️ 직접 입력</option>
                    {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                  </select>
                  <input value={num === 1 ? formData.unloading_place : formData.unloading_place_2} placeholder={`하차지 ${num} 명칭`} className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_place' : 'unloading_place_2']: e.target.value})} />
                  <input value={num === 1 ? formData.unloading_address : formData.unloading_address_2} placeholder={`하차지 ${num} 주소`} className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_address' : 'unloading_address_2']: e.target.value})} />
                </section>
              ))}

              <div className="flex gap-4 mt-12 pt-8 border-t border-slate-50">
                <button onClick={handleOrderSubmit} className="flex-1 bg-slate-900 text-white p-6 rounded-[2.5rem] font-black text-xl shadow-xl hover:bg-black transition-all">
                  {selectedOrder ? '수정 내용 저장 💾' : '배차 신청하기 🚀'}
                </button>
                <button onClick={closeAllModals} className="px-10 bg-slate-100 text-slate-400 rounded-[2.5rem] font-black">닫기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [2] 업체 답변 모달 (활성화 해결) */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 relative animate-in zoom-in-95 duration-200">
            {/* X 닫기 버튼 */}
            <button onClick={closeAllModals} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-all p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h2 className="text-3xl font-black italic mb-2 uppercase text-blue-600 tracking-tighter underline decoration-blue-100 underline-offset-8">Truck Info</h2>
            <p className="text-[11px] font-black text-slate-400 mb-10 tracking-widest uppercase ml-1">상세 정보를 입력하거나 확인하세요.</p>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 block">🚚 차량 정보</label>
                <input value={resData.car_info} className="w-full p-6 bg-slate-50 rounded-[2rem] border-none font-black text-slate-800 text-xl shadow-inner focus:ring-2 focus:ring-blue-500 transition-all" onChange={e => setResData({...resData, car_info: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 block">👤 기사님 성함</label>
                <input value={resData.driver_name} className="w-full p-6 bg-slate-50 rounded-[2rem] border-none font-black text-slate-800 text-xl shadow-inner focus:ring-2 focus:ring-blue-500 transition-all" onChange={e => setResData({...resData, driver_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 block">💰 합계 운임료 (원)</label>
                <input value={resData.fee} className="w-full p-6 bg-blue-50 rounded-[2rem] border-none font-black text-blue-600 text-3xl shadow-inner focus:ring-2 focus:ring-blue-600 transition-all" onChange={e => setResData({...resData, fee: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={handleResponseSubmit} className="flex-1 bg-blue-600 text-white p-7 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-blue-700 transition-all">정보 업데이트</button>
              <button onClick={closeAllModals} className="bg-slate-100 text-slate-400 px-8 rounded-[2.5rem] font-black">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
