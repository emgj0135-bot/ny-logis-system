"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null); // 어떤 글의 답변을 볼지 제어

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('당일배차');

  const [formData, setFormData] = useState({
    loading_date: new Date().toISOString().split('T')[0],
    unloading_date: new Date().toISOString().split('T')[0],
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    unloading_place_2: "", unloading_address_2: "", product_name: "", loading_time: "09:00",
    unloading_time: "익일 08:00", remarks: ""
  });

  // 업체 답변용 상태
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

  const handleOrderSubmit = async () => {
    if (selectedOrder) await supabase.from('truck_orders').update({ order_type: orderType, ...formData }).eq('id', selectedOrder.id);
    else await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData }]);
    alert("완료되었습니다! ✨");
    setShowOrderModal(false);
    fetchData();
  };

  const handleResponseSubmit = async (orderId: number, resId?: number) => {
    if (resId) await supabase.from('order_responses').update(resData).eq('id', resId);
    else {
      await supabase.from('order_responses').insert([{ order_id: orderId, ...resData }]);
      await supabase.from('truck_orders').update({ status: '배차완료' }).eq('id', orderId);
    }
    alert("배차 답변이 등록되었습니다! ✅");
    fetchData();
  };

  const openOrderModal = (item?: any) => {
    if (item) { setSelectedOrder(item); setOrderType(item.order_type || '당일배차'); setFormData({ ...item }); }
    else { setSelectedOrder(null); setOrderType('당일배차'); setFormData({ loading_date: new Date().toISOString().split('T')[0], unloading_date: new Date().toISOString().split('T')[0], loading_place: "", loading_address: "", loading_manager: "", loading_phone: "", unloading_place: "", unloading_address: "", unloading_place_2: "", unloading_address_2: "", product_name: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: "" }); }
    setShowOrderModal(true);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic text-slate-800">🚚 NY LOGIS 문답형 배차관리</h1>
        <button onClick={() => openOrderModal()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">+ 신규 배차 신청</button>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[11px] uppercase border-b">
            <tr>
              <th className="p-4 text-center w-16">No</th>
              <th className="p-4 text-center w-24">구분</th>
              <th className="p-4 text-center w-32">날짜</th>
              <th className="p-4 text-left">제목 (상차지 → 하차지)</th>
              <th className="p-4 text-center w-24">상태</th>
              <th className="p-4 text-center w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const res = item.order_responses?.[0];
              return (
                <React.Fragment key={item.id}>
                  {/* 질문 행 (신청 내역) */}
                  <tr onClick={() => setExpandedId(isExpanded ? null : item.id)} className="cursor-pointer hover:bg-slate-50 border-b">
                    <td className="p-4 text-center text-slate-400 font-bold">{list.length - index}</td>
                    <td className="p-4 text-center"><span className="text-blue-500 font-black">질문</span></td>
                    <td className="p-4 text-center text-slate-500 font-bold">{item.loading_date}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.loading_place} 👉 {item.unloading_place} {item.unloading_place_2 ? `(경유: ${item.unloading_place_2})` : ''}</p>
                      <p className="text-[11px] text-slate-400 mt-1 font-bold">📦 {item.product_name} / {item.loading_time} 상차</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-black px-2 py-1 rounded ${item.status === '배차완료' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{item.status}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={(e) => { e.stopPropagation(); openOrderModal(item); }} className="text-[10px] font-bold text-blue-400 border border-blue-100 px-2 py-1 rounded">수정</button>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm("삭제?")) supabase.from('truck_orders').delete().eq('id', item.id).then(()=>fetchData()); }} className="text-[10px] font-bold text-red-300 border border-red-50 px-2 py-1 rounded">삭제</button>
                      </div>
                    </td>
                  </tr>

                  {/* 답변 행 (업체 정보 - 클릭 시 노출) */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td className="p-4"></td>
                      <td className="p-4 text-center"><span className="text-green-500 font-black">↳ 답변</span></td>
                      <td className="p-4 text-center text-slate-400 text-[11px] font-bold">{res?.created_at ? new Date(res.created_at).toLocaleDateString() : '-'}</td>
                      <td colSpan={3} className="p-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                          {res ? (
                            <div className="grid grid-cols-3 gap-6 items-center">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">차량 정보</p>
                                <p className="font-black text-slate-800">{res.car_info}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">기사님 정보</p>
                                <p className="font-black text-slate-800">{res.driver_name}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">합계 운임</p>
                                <p className="font-black text-blue-600 text-lg">{res.fee} 원</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-slate-400 font-bold italic mb-3">아직 등록된 배차 답변이 없습니다.</p>
                              <div className="flex gap-2 justify-center max-w-md mx-auto">
                                <input placeholder="차량(예: 5톤 윙)" className="p-2 border rounded-lg text-xs" onChange={e => setResData({...resData, car_info: e.target.value})} />
                                <input placeholder="기사명" className="p-2 border rounded-lg text-xs" onChange={e => setResData({...resData, driver_name: e.target.value})} />
                                <input placeholder="운임" className="p-2 border rounded-lg text-xs" onChange={e => setResData({...resData, fee: e.target.value})} />
                                <button onClick={() => handleResponseSubmit(item.id)} className="bg-slate-800 text-white px-4 rounded-lg text-xs font-black">답변등록</button>
                              </div>
                            </div>
                          )}
                          {res && (
                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                              <button onClick={() => { setResData({car_info: res.car_info, driver_name: res.driver_name, fee: res.fee}); setExpandedId(item.id); /* 수정 로직 추가 가능 */ }} className="text-[10px] font-bold text-slate-400 underline">답변 수정하기</button>
                            </div>
                          )}
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

      {/* [모달] 배차 신청/수정 (기존 로직 유지) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto relative">
             <button onClick={() => setShowOrderModal(false)} className="absolute top-8 right-8 text-slate-300">X</button>
             <h2 className="text-2xl font-black italic mb-8 uppercase text-slate-800 tracking-tighter underline decoration-orange-500 underline-offset-8">Request Form</h2>
             {/* ... (기존의 폼 내용: 상차지, 하차지, 담당자 롤백 로직 등 갱미가 가진 최신본 사용) ... */}
             <button onClick={handleOrderSubmit} className="w-full mt-10 p-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-lg shadow-xl hover:bg-black transition-all">신청/수정 저장하기 🚀</button>
          </div>
        </div>
      )}
    </div>
  );
}

// React import 잊지 마!
import React from "react";
