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
    const { data: lData } = await supabase.from('truck_orders').select(`*, order_responses(*)`).order('created_at', { ascending: false });
    setList(lData || []);
  };

  // 즐겨찾기 자동 입력 함수들
  const autoFillLoading = (val: string) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '상차지');
    if(b) setFormData(prev => ({...prev, loading_place: b.place_name, loading_address: b.address}));
  };
  const autoFillStaff = (val: string) => {
    const s = staffs.find(x => x.name === val);
    if(s) setFormData(prev => ({...prev, loading_manager: s.name, loading_phone: s.phone}));
  };
  const autoFillUnloading = (val: string, num: number) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '하차지');
    if(b) {
      if(num === 1) setFormData(prev => ({...prev, unloading_place: b.place_name, unloading_address: b.address, unloading_manager: b.manager_name, unloading_phone: b.manager_phone}));
      else setFormData(prev => ({...prev, unloading_place_2: b.place_name, unloading_address_2: b.address, unloading_manager_2: b.manager_name, unloading_phone_2: b.manager_phone}));
    }
  };

  const handleOrderSubmit = async () => {
    if (selectedOrder) {
      await supabase.from('truck_orders').update({ order_type: orderType, ...formData }).eq('id', selectedOrder.id);
      alert("수정 완료! ✨");
    } else {
      await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData }]);
      alert("배차 신청 완료! 🚀");
    }
    closeAllModals();
    fetchData();
  };

  const handleResponseSubmit = async () => {
    const existingRes = selectedOrder.order_responses?.[0];
    if (existingRes) {
      await supabase.from('order_responses').update(resData).eq('id', existingRes.id);
    } else {
      await supabase.from('order_responses').insert([{ order_id: selectedOrder.id, ...resData }]);
      await supabase.from('truck_orders').update({ status: '배차완료' }).eq('id', selectedOrder.id);
    }
    alert("정보가 저장되었습니다! ✅");
    closeAllModals();
    fetchData();
  };

  const openOrderModal = (item?: any) => {
    if (item) {
      setSelectedOrder(item);
      setOrderType(item.order_type);
      setFormData({ ...item });
    } else {
      setSelectedOrder(null);
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
        <h1 className="text-2xl font-black italic">🚚 용차 통합 관리 시스템</h1>
        <button onClick={() => openOrderModal()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">+ 신규 신청</button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
            <tr>
              <th className="p-5 text-left">일자/상태</th>
              <th className="p-5 text-left">상차 정보</th>
              <th className="p-5 text-left">하차 정보(경유포함)</th>
              <th className="p-5 text-left">배차 정보 (클릭 시 확대)</th>
              <th className="p-5 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-all">
                <td className="p-5">
                  <p className="font-bold text-slate-800">{item.loading_date}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${item.status === '배차완료' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.status}</span>
                </td>
                <td className="p-5">
                  <p className="font-black text-slate-700">{item.loading_place}</p>
                  <p className="text-[11px] text-slate-400">{item.loading_manager}</p>
                </td>
                <td className="p-5">
                  <div className="space-y-1">
                    <p className="font-black text-slate-700 text-xs">1: {item.unloading_place}</p>
                    {item.unloading_place_2 && <p className="font-black text-blue-500 text-xs text-xs">2: {item.unloading_place_2}</p>}
                  </div>
                </td>
                <td className="p-5">
                  {item.order_responses?.[0] ? (
                    <div onClick={() => openResponseModal(item)} className="bg-blue-600 text-white p-3 rounded-2xl cursor-pointer hover:scale-105 transition-all shadow-md">
                      <p className="text-[11px] font-black">🚛 {item.order_responses[0].car_info}</p>
                      <p className="text-[10px] opacity-80 font-bold">{item.order_responses[0].driver_name} 기사님</p>
                    </div>
                  ) : (
                    <button onClick={() => openResponseModal(item)} className="text-[11px] text-slate-300 italic border border-dashed border-slate-200 p-2 rounded-xl w-full">입력 대기</button>
                  )}
                </td>
                <td className="p-5 text-center">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => openOrderModal(item)} className="text-slate-400 font-black text-xs hover:text-blue-500">수정</button>
                    <button onClick={() => {if(confirm("삭제할까?")) supabase.from('truck_orders').delete().eq('id', item.id).then(()=>fetchData())}} className="text-slate-300 font-black text-xs hover:text-red-500">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 배차 신청/수정 모달 (즐겨찾기 포함) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto">
            <h2 className="text-2xl font-black italic mb-6 uppercase">{selectedOrder ? 'Edit Request' : 'New Request'}</h2>
            
            <div className="space-y-6">
              {/* 날짜 및 유형 */}
              <div className="bg-slate-50 p-6 rounded-3xl grid grid-cols-2 gap-4">
                <input type="date" value={formData.loading_date} className="p-3 rounded-xl border-none font-bold text-sm" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                <input placeholder="제품명" value={formData.product_name} className="p-3 rounded-xl border-none font-bold text-sm" onChange={e => setFormData({...formData, product_name: e.target.value})} />
              </div>

              {/* 상차지 (즐겨찾기 연동) */}
              <section className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase">Loading</p>
                <div className="grid grid-cols-2 gap-3">
                  <select onChange={e => autoFillLoading(e.target.value)} className="p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none">
                    <option value="">상차지 즐겨찾기</option>
                    {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id}>{b.place_name}</option>)}
                  </select>
                  <select onChange={e => autoFillStaff(e.target.value)} className="p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none">
                    <option value="">담당자 선택</option>
                    {staffs.map(s => <option key={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <input value={formData.loading_address} placeholder="상차지 주소" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
              </section>

              {/* 하차지 1 (즐겨찾기 연동) */}
              <section className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase">Unloading 1 (Main)</p>
                <select onChange={e => autoFillUnloading(e.target.value, 1)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none">
                  <option value="">하차지 1 즐겨찾기</option>
                  {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id}>{b.place_name}</option>)}
                </select>
                <input value={formData.unloading_address} placeholder="하차지 1 주소" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, unloading_address: e.target.value})} />
              </section>

              {/* 하차지 2 (경유지 - 즐겨찾기 연동) */}
              <section className="space-y-3">
                <p className="text-[10px] font-black text-blue-400 ml-2 uppercase">Unloading 2 (Waypoint)</p>
                <select onChange={e => autoFillUnloading(e.target.value, 2)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none">
                  <option value="">하차지 2 즐겨찾기</option>
                  {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id}>{b.place_name}</option>)}
                </select>
                <input value={formData.unloading_address_2 || ""} placeholder="하차지 2 주소 (없으면 공란)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none" onChange={e => setFormData({...formData, unloading_address_2: e.target.value})} />
              </section>

              <textarea placeholder="비고" value={formData.remarks} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm h-20" onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={handleOrderSubmit} className="flex-1 bg-slate-900 text-white p-5 rounded-3xl font-black shadow-xl">저장하기</button>
              <button onClick={closeAllModals} className="flex-1 bg-slate-100 text-slate-400 p-5 rounded-3xl font-black">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 업체 답변 상세/수정 모달 */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95">
            <h2 className="text-3xl font-black italic mb-2 uppercase text-blue-600">Truck Info</h2>
            <p className="text-xs font-bold text-slate-400 mb-8 tracking-widest">배차 상세 정보를 확인하거나 수정하세요.</p>
            
            <div className="space-y-5">
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">차량 정보 (차종/번호)</label>
                <input value={resData.car_info} className="w-full p-5 bg-slate-50 rounded-3xl border-none font-black text-slate-700 text-lg shadow-inner" onChange={e => setResData({...resData, car_info: e.target.value})} />
              </div>
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">기사님 성함</label>
                <input value={resData.driver_name} className="w-full p-5 bg-slate-50 rounded-3xl border-none font-black text-slate-700 text-lg shadow-inner" onChange={e => setResData({...resData, driver_name: e.target.value})} />
              </div>
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">합계 운임료</label>
                <input value={resData.fee} className="w-full p-5 bg-blue-50 rounded-3xl border-none font-black text-blue-600 text-2xl shadow-inner" onChange={e => setResData({...resData, fee: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={handleResponseSubmit} className="flex-1 bg-blue-600 text-white p-6 rounded-[2rem] font-black text-xl shadow-xl hover:bg-blue-700 transition-all">정보 업데이트</button>
              <button onClick={closeAllModals} className="bg-slate-100 text-slate-400 px-8 rounded-[2rem] font-black">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
