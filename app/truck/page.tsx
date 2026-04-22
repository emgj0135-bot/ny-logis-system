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

  // 배차 신청/수정 폼 데이터
  const [formData, setFormData] = useState({
    loading_date: new Date().toISOString().split('T')[0],
    unloading_date: new Date().toISOString().split('T')[0],
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    product_name: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
  });

  // 업체 답변 폼 데이터
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

  // 배차 신청 또는 수정
  const handleOrderSubmit = async () => {
    if (selectedOrder) {
      await supabase.from('truck_orders').update({ order_type: orderType, ...formData }).eq('id', selectedOrder.id);
      alert("수정되었습니다! ✨");
    } else {
      await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData }]);
      alert("배차 신청 완료! 🚀");
    }
    closeAllModals();
    fetchData();
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm("이 배차를 삭제할까?")) return;
    await supabase.from('truck_orders').delete().eq('id', id);
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
    alert("배차 정보가 저장되었어! ✅");
    closeAllModals();
    fetchData();
  };

  const openOrderModal = (item?: any) => {
    if (item) {
      setSelectedOrder(item);
      setOrderType(item.order_type);
      setFormData({
        loading_date: item.loading_date, unloading_date: item.unloading_date,
        loading_place: item.loading_place, loading_address: item.loading_address,
        loading_manager: item.loading_manager, loading_phone: item.loading_phone,
        unloading_place: item.unloading_place, unloading_address: item.unloading_address,
        unloading_manager: item.unloading_manager, unloading_phone: item.unloading_phone,
        product_name: item.product_name, loading_time: item.loading_time,
        unloading_time: item.unloading_time, remarks: item.remarks
      });
    } else {
      setSelectedOrder(null);
      setFormData({
        loading_date: new Date().toISOString().split('T')[0],
        unloading_date: new Date().toISOString().split('T')[0],
        loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
        unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
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
        <h1 className="text-2xl font-black italic">🚚 용차 배차 관리 시스템</h1>
        <button onClick={() => openOrderModal()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">+ 신규 배차 신청</button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
            <tr>
              <th className="p-5">일자/상태</th>
              <th className="p-5">상차 정보</th>
              <th className="p-5">하차 정보</th>
              <th className="p-5">📦 제품 / 🚛 배차정보</th>
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
                  <p className="text-xs text-slate-400">{item.loading_manager} / {item.loading_phone}</p>
                </td>
                <td className="p-5">
                  <p className="font-black text-slate-700">{item.unloading_place}</p>
                  <p className="text-xs text-slate-400">{item.unloading_address}</p>
                </td>
                <td className="p-5">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500">제품: <span className="text-blue-500">{item.product_name}</span></p>
                    {item.order_responses?.[0] ? (
                      <div onClick={() => openResponseModal(item)} className="bg-blue-600 text-white p-2.5 rounded-xl cursor-pointer hover:bg-blue-700 transition-all shadow-md">
                        <p className="text-[11px] font-black">🚛 {item.order_responses[0].car_info}</p>
                        <p className="text-[10px] font-bold opacity-90">{item.order_responses[0].driver_name} | {item.order_responses[0].fee}원</p>
                      </div>
                    ) : (
                      <button onClick={() => openResponseModal(item)} className="text-[11px] font-black text-slate-300 italic border border-dashed border-slate-200 px-3 py-2 rounded-xl w-full text-left">배차 정보 입력대기...</button>
                    )}
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => openOrderModal(item)} className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-black text-[10px] hover:bg-blue-50 hover:text-blue-600">수정</button>
                    <button onClick={() => handleDeleteOrder(item.id)} className="bg-slate-100 text-slate-400 px-3 py-2 rounded-xl font-black text-[10px] hover:bg-red-50 hover:text-red-500">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 배차 신청/수정 모달 */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase">{selectedOrder ? 'Edit' : 'New Request'}</h2>
              <button onClick={closeAllModals} className="text-slate-300 text-2xl font-bold">×</button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex gap-2">
                  {['당일배차', '예약배차'].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 p-3 rounded-xl font-black text-xs ${orderType === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={formData.loading_date} className="p-3 rounded-xl border-none font-bold text-sm" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                  <input type="date" value={formData.unloading_date} className="p-3 rounded-xl border-none font-bold text-sm" onChange={e => setFormData({...formData, unloading_date: e.target.value})} />
                </div>
              </div>

              <input placeholder="제품명" value={formData.product_name} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" onChange={e => setFormData({...formData, product_name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="상차시간" value={formData.loading_time} className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" onChange={e => setFormData({...formData, loading_time: e.target.value})} />
                <input placeholder="하차시간" value={formData.unloading_time} className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" onChange={e => setFormData({...formData, unloading_time: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 ml-2">상차지 정보</p>
                  <input placeholder="장소명" value={formData.loading_place} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                  <input placeholder="주소" value={formData.loading_address} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm text-slate-400" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 ml-2">하차지 정보</p>
                  <input placeholder="장소명" value={formData.unloading_place} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" onChange={e => setFormData({...formData, unloading_place: e.target.value})} />
                  <input placeholder="주소" value={formData.unloading_address} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm text-slate-400" onChange={e => setFormData({...formData, unloading_address: e.target.value})} />
                </div>
              </div>

              <textarea placeholder="비고" value={formData.remarks} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm h-24" onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>

            <button onClick={handleOrderSubmit} className="w-full mt-10 p-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-black transition-all">
              {selectedOrder ? '수정 내용 저장하기' : '배차 신청하기 🚀'}
            </button>
          </div>
        </div>
      )}

      {/* 업체 답변 모달 (위와 동일) */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10">
            <h2 className="text-2xl font-black italic mb-8 uppercase">Dispatch Info</h2>
            <div className="space-y-4">
              <input value={resData.car_info} placeholder="차량정보 (예: 5톤 윙바디)" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setResData({...resData, car_info: e.target.value})} />
              <input value={resData.driver_name} placeholder="기사명" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setResData({...resData, driver_name: e.target.value})} />
              <input value={resData.fee} placeholder="운임료" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setResData({...resData, fee: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={handleResponseSubmit} className="flex-1 bg-slate-900 text-white p-5 rounded-2xl font-black shadow-lg">저장하기</button>
              <button onClick={closeAllModals} className="flex-1 bg-slate-100 text-slate-400 p-5 rounded-2xl font-black">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
