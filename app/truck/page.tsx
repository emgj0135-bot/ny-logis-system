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
    
    // 배차 리스트와 답변 정보를 한 번에 가져오기
    const { data: lData } = await supabase.from('truck_orders').select(`*, order_responses(*)`).order('created_at', { ascending: false });
    setList(lData || []);
  };

  // 배차 신청 또는 수정
  const handleOrderSubmit = async () => {
    if (selectedOrder) {
      // 수정 모드
      await supabase.from('truck_orders').update({ order_type: orderType, ...formData }).eq('id', selectedOrder.id);
      alert("배차 정보가 수정되었습니다.");
    } else {
      // 신규 등록
      await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData }]);
      alert("배차 신청이 완료되었습니다! 🚀");
    }
    closeAllModals();
    fetchData();
  };

  // 배차 삭제
  const handleDeleteOrder = async (id: number) => {
    if (!confirm("정말 이 배차 요청을 삭제하시겠습니까?")) return;
    await supabase.from('truck_orders').delete().eq('id', id);
    fetchData();
  };

  // 업체 답변 등록 또는 수정
  const handleResponseSubmit = async () => {
    const existingRes = selectedOrder.order_responses?.[0];
    
    if (existingRes) {
      await supabase.from('order_responses').update(resData).eq('id', existingRes.id);
    } else {
      await supabase.from('order_responses').insert([{ order_id: selectedOrder.id, ...resData }]);
      await supabase.from('truck_orders').update({ status: '배차완료' }).eq('id', selectedOrder.id);
    }
    
    alert("배차 답변이 저장되었습니다.");
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
        product_name: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
      });
    }
    setShowOrderModal(true);
  };

  const openResponseModal = (item: any) => {
    setSelectedOrder(item);
    const res = item.order_responses?.[0];
    setResData({
      car_info: res?.car_info || "",
      driver_name: res?.driver_name || "",
      fee: res?.fee || ""
    });
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
        <h1 className="text-2xl font-black italic">🚚 용차 배차 시스템</h1>
        <button onClick={() => openOrderModal()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">+ 신규 배차 신청</button>
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
            <tr>
              <th className="p-5">일자/상태</th>
              <th className="p-5">상차지/담당자</th>
              <th className="p-5">하차지</th>
              <th className="p-5">배차 정보 (업체답변)</th>
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
                  {item.order_responses?.[0] ? (
                    <div className="bg-blue-50 p-3 rounded-xl">
                      <p className="text-xs font-black text-blue-600">{item.order_responses[0].car_info}</p>
                      <p className="text-[11px] font-bold text-blue-400">{item.order_responses[0].driver_name} | {item.order_responses[0].fee}원</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic">답변 대기 중...</p>
                  )}
                </td>
                <td className="p-5">
                  <div className="flex flex-col gap-1 items-center">
                    <button onClick={() => openResponseModal(item)} className="w-full bg-slate-900 text-white text-[10px] font-black py-1.5 rounded-lg">업체답변</button>
                    <div className="flex gap-2">
                      <button onClick={() => openOrderModal(item)} className="text-slate-400 hover:text-blue-500 font-bold text-[10px]">수정</button>
                      <button onClick={() => handleDeleteOrder(item.id)} className="text-slate-400 hover:text-red-500 font-bold text-[10px]">삭제</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 업체 답변 모달 */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10">
            <h2 className="text-2xl font-black italic mb-8 underline decoration-green-500 underline-offset-8 uppercase">Dispatch Answer</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">차량정보</label>
                <input value={resData.car_info} placeholder="예: 5톤 윙바디 98자 1234" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setResData({...resData, car_info: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">기사명</label>
                <input value={resData.driver_name} placeholder="예: 홍길동 기사님" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setResData({...resData, driver_name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">운임료</label>
                <input value={resData.fee} placeholder="예: 250,000" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setResData({...resData, fee: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={handleResponseSubmit} className="flex-1 bg-slate-900 text-white p-5 rounded-2xl font-black shadow-lg">저장하기</button>
              <button onClick={closeAllModals} className="flex-1 bg-slate-100 text-slate-400 p-5 rounded-2xl font-black">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 배차 신청/수정 모달 (기존 모달에 수정 로직 추가) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase">{selectedOrder ? 'Edit' : 'Request'} Truck</h2>
              <button onClick={closeAllModals} className="text-slate-300 hover:text-slate-600 font-bold text-2xl">×</button>
            </div>
            {/* ... (기존 폼 내용과 동일하여 생략, 단 handleSubmit만 handleOrderSubmit으로 연결) ... */}
            <button onClick={handleOrderSubmit} className="w-full mt-10 p-6 bg-slate-900 text-white rounded-[3rem] font-black text-lg shadow-xl hover:bg-black transition-all">
              {selectedOrder ? '수정 완료하기' : '배차 신청하기 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
