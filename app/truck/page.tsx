"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // 상세 확인용 모달
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('당일배차');

  // 신청/수정용 폼
  const [formData, setFormData] = useState({
    loading_date: "", unloading_date: "", loading_place: "", loading_address: "",
    loading_manager: "", loading_phone: "", unloading_place: "", unloading_address: "",
    unloading_place_2: "", unloading_address_2: "", product_name: "", loading_time: "",
    unloading_time: "", remarks: ""
  });

  // 업체 답변 입력용 폼
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

  // 모달 열기 제어
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
        unloading_place_2: "", unloading_address_2: "", product_name: "", loading_time: "09:00",
        unloading_time: "익일 08:00", remarks: ""
      });
    }
    setShowOrderModal(true);
  };

  // 상세 보기 모달 (위: 신청내용, 아래: 업체답변)
  const openDetailModal = (item: any) => {
    setSelectedOrder(item);
    const res = item.order_responses?.[0];
    setResData({ car_info: res?.car_info || "", driver_name: res?.driver_name || "", fee: res?.fee || "" });
    setShowDetailModal(true);
  };

  const handleResponseSubmit = async () => {
    const res = selectedOrder.order_responses?.[0];
    if (res) await supabase.from('order_responses').update(resData).eq('id', res.id);
    else {
      await supabase.from('order_responses').insert([{ order_id: selectedOrder.id, ...resData }]);
      await supabase.from('truck_orders').update({ status: '배차완료' }).eq('id', selectedOrder.id);
    }
    alert("배차 정보가 업데이트 되었습니다! ✅");
    setShowDetailModal(false);
    fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic text-slate-800 tracking-tighter">🚚 NY LOGIS DISPATCH</h1>
        <button onClick={() => openOrderModal()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">+ 신규 배차 신청</button>
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
            <tr>
              <th className="p-5 text-left">일자/유형</th>
              <th className="p-5 text-left">상차 정보</th>
              <th className="p-5 text-left">하차 정보</th>
              <th className="p-5 text-left">배차 현황 (클릭)</th>
              <th className="p-5 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-all">
                <td className="p-5">
                  <p className="font-bold text-slate-800">{item.loading_date}</p>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${item.status === '배차완료' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.status}</span>
                </td>
                <td className="p-5">
                  <p className="font-black text-slate-700">{item.loading_place}</p>
                  <p className="text-[11px] text-slate-400 font-bold">{item.loading_manager}</p>
                </td>
                <td className="p-5 text-xs">
                  <p className="font-black text-slate-700">1: {item.unloading_place}</p>
                  {item.unloading_place_2 && <p className="font-black text-blue-500">2: {item.unloading_place_2}</p>}
                </td>
                <td className="p-5">
                  <button onClick={() => openDetailModal(item)} className={`w-full p-3 rounded-2xl text-[11px] font-black transition-all ${item.order_responses?.[0] ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 italic'}`}>
                    {item.order_responses?.[0] ? `🚛 ${item.order_responses[0].car_info} (확인)` : "배차 정보 확인/입력"}
                  </button>
                </td>
                <td className="p-5 text-center">
                  <div className="flex gap-2 justify-center font-black text-[10px]">
                    <button onClick={() => openOrderModal(item)} className="text-blue-500 bg-blue-50 px-3 py-2 rounded-xl">수정</button>
                    <button onClick={() => {if(confirm("삭제?")) supabase.from('truck_orders').delete().eq('id', item.id).then(()=>fetchData())}} className="text-red-400 bg-red-50 px-3 py-2 rounded-xl">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- 상세 정보 확인 및 답변 모달 (위아래 이단 구성) --- */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95">
            
            {/* [위쪽 창] 갱미의 신청 내용 (Read Only) */}
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 relative">
              <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 text-slate-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest mb-4 italic">Original Request Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-slate-400 mb-1">상차지</p>
                  <p className="text-slate-800">{selectedOrder.loading_place}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{selectedOrder.loading_address}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-slate-400 mb-1">하차지 1</p>
                  <p className="text-slate-800">{selectedOrder.unloading_place}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{selectedOrder.unloading_address}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-orange-50 rounded-2xl">
                <p className="text-[10px] text-orange-400 font-black mb-1">제품 및 비고</p>
                <p className="text-orange-900 font-black">📦 {selectedOrder.product_name}</p>
                <p className="text-xs text-orange-700 mt-1 italic">{selectedOrder.remarks || "특이사항 없음"}</p>
              </div>
            </div>

            {/* [아래쪽 창] 업체 배차 정보 입력/확인 */}
            <div className="bg-blue-600 rounded-[2.5rem] shadow-2xl p-8 text-white">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 italic opacity-80">Dispatch Answer</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black ml-2 mb-1 block opacity-60 uppercase">Truck Info</label>
                  <input value={resData.car_info} className="w-full p-4 bg-blue-700/50 rounded-2xl border-none font-black text-white placeholder-blue-300" placeholder="예: 5톤 윙바디 (98자 1234)" onChange={e => setResData({...resData, car_info: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black ml-2 mb-1 block opacity-60 uppercase">Driver Name</label>
                    <input value={resData.driver_name} className="w-full p-4 bg-blue-700/50 rounded-2xl border-none font-black text-white" placeholder="기사님 성함" onChange={e => setResData({...resData, driver_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black ml-2 mb-1 block opacity-60 uppercase">Fee</label>
                    <input value={resData.fee} className="w-full p-4 bg-blue-700/50 rounded-2xl border-none font-black text-white" placeholder="운임료" onChange={e => setResData({...resData, fee: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={handleResponseSubmit} className="flex-1 bg-white text-blue-600 p-5 rounded-[1.5rem] font-black shadow-lg">정보 업데이트 저장 💾</button>
                <button onClick={() => setShowDetailModal(false)} className="px-8 bg-blue-800 text-blue-200 rounded-[1.5rem] font-black text-sm">닫기</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 신규/수정 모달은 그대로 유지... */}
    </div>
  );
}
