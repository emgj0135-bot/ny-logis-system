"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentResponse, setCurrentResponse] = useState<any>(null);

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

  // 답변용 상태 (수정 시 기존 데이터를 담기 위해 사용)
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

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setCurrentResponse(null);
    } else {
      setExpandedId(id);
      const { data } = await supabase.from('order_responses').select('*').eq('order_id', id).maybeSingle();
      setCurrentResponse(data || null);
      // 답변이 이미 있다면, 입력창에 기존 정보를 미리 채워넣음 (수정 편의성)
      if (data) {
        setResData({ car_info: data.car_info, driver_name: data.driver_name, fee: data.fee });
      } else {
        setResData({ car_info: "", driver_name: "", fee: "" });
      }
    }
  };

  // 답변 등록 및 수정 통합 로직!
  const handleResponseSubmit = async (orderId: number) => {
    if (!resData.car_info || !resData.driver_name) return alert("정보를 입력해줘!");

    // 이미 답변이 있는지 확인
    const { data: existing } = await supabase.from('order_responses').select('id').eq('order_id', orderId).maybeSingle();

    if (existing) {
      // 1. 이미 있으면 UPDATE (수정)
      const { error } = await supabase.from('order_responses').update(resData).eq('id', existing.id);
      if (!error) alert("배차 정보가 수정되었습니다! 🔄");
    } else {
      // 2. 없으면 INSERT (신규 등록)
      const { error } = await supabase.from('order_responses').insert([{ order_id: orderId, ...resData }]);
      if (!error) {
        await supabase.from('truck_orders').update({ status: '배차완료' }).eq('id', orderId);
        alert("배차 답변 등록 완료! ✅");
      }
    }
    
    // 데이터 새로고침 및 현재 답변 상태 갱신
    const { data: updatedRes } = await supabase.from('order_responses').select('*').eq('order_id', orderId).maybeSingle();
    setCurrentResponse(updatedRes);
    fetchData();
  };

  // --- 기존의 신청/수정 로직 (그대로 유지) ---
  const handleOrderSubmit = async () => {
    if (selectedOrder) await supabase.from('truck_orders').update({ order_type: orderType, ...formData }).eq('id', selectedOrder.id);
    else await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData }]);
    alert("저장 완료!");
    setShowOrderModal(false);
    fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* 헤더 부분 생략 (동일) */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic text-slate-800">🚚 NY LOGIS DISPATCH</h1>
        <button onClick={() => { setSelectedOrder(null); setShowOrderModal(true); }} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg">+ 신규 배차 신청</button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          {/* 테이블 헤더 생략 (동일) */}
          <tbody className="divide-y divide-slate-50">
            {list.map((item, index) => {
              const isExpanded = expandedId === item.id;
              return (
                <React.Fragment key={item.id}>
                  <tr onClick={() => toggleExpand(item.id)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="p-5 text-center font-black text-blue-500">{list.length - index}</td>
                    <td className="p-5 text-center text-slate-500 font-bold">{item.loading_date}</td>
                    <td className="p-5">
                      <p className="font-black text-slate-800">{item.loading_place} 👉 {item.unloading_place}</p>
                      <p className="text-[11px] text-slate-400 mt-1 font-bold">📦 {item.product_name} | {item.loading_time} 상차</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-[10px] font-black px-2 py-1 rounded ${item.status === '배차완료' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.status}</span>
                    </td>
                    <td className="p-5 text-center">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(item); setFormData({...item}); setShowOrderModal(true); }} className="text-blue-500 bg-blue-50 px-3 py-1 rounded-lg font-black text-[10px]">수정/삭제</button>
                    </td>
                  </tr>

                  {/* 답변 섹션: 여기서 수정 기능 활성화 */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="p-8">
                        <div className="bg-white border-2 border-green-500/20 rounded-[2.5rem] p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <span className="text-3xl font-black text-green-500 italic">A.</span>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">배차 상세 정보 {currentResponse ? '(수정 가능)' : '(신규 등록)'}</p>
                            </div>
                          </div>

                          <div className="flex gap-4 w-full items-end bg-slate-50 p-6 rounded-3xl">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 ml-2">차량 정보</label>
                                <input value={resData.car_info} className="w-full p-4 bg-white rounded-2xl border-none font-bold text-sm shadow-sm" onChange={e => setResData({...resData, car_info: e.target.value})} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 ml-2">기사님 성함</label>
                                <input value={resData.driver_name} className="w-full p-4 bg-white rounded-2xl border-none font-bold text-sm shadow-sm" onChange={e => setResData({...resData, driver_name: e.target.value})} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 ml-2">운임료</label>
                                <input value={resData.fee} className="w-full p-4 bg-white rounded-2xl border-none font-bold text-sm shadow-sm" onChange={e => setResData({...resData, fee: e.target.value})} />
                            </div>
                            <button onClick={() => handleResponseSubmit(item.id)} className={`px-8 py-4 rounded-2xl font-black shadow-lg transition-all ${currentResponse ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                              {currentResponse ? "정보 수정 🔄" : "답변 등록 ✅"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 신청/수정 모달은 그대로 유지 */}
      {/* ... (이전 코드와 동일하므로 중복 방지를 위해 생략) ... */}
    </div>
  );
}
