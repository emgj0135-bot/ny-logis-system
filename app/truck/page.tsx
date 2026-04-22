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
      // 서버에서 해당 order_id의 답변을 가장 확실하게 긁어옴
      const { data } = await supabase.from('order_responses').select('*').eq('order_id', id).maybeSingle();
      setCurrentResponse(data || null);
    }
  };

  // 상차지 자동완성 (직접 입력 대응)
  const autoFillLoading = (val: string) => {
    if (val === "manual") {
      setFormData(prev => ({...prev, loading_place: "", loading_address: ""}));
    } else {
      const b = bookmarks.find(x => x.place_name === val && x.type === '상차지');
      if(b) setFormData(prev => ({...prev, loading_place: b.place_name, loading_address: b.address}));
    }
  };

  // 하차지 자동완성 (직접 입력 대응)
  const autoFillUnloading = (val: string, num: number) => {
    if (val === "manual") {
      const target = num === 1 ? {p:'unloading_place', a:'unloading_address', m:'unloading_manager', ph:'unloading_phone'} : {p:'unloading_place_2', a:'unloading_address_2', m:'unloading_manager_2', ph:'unloading_phone_2'};
      setFormData(prev => ({...prev, [target.p]: "", [target.a]: "", [target.m]: "", [target.ph]: ""}));
    } else {
      const b = bookmarks.find(x => x.place_name === val && x.type === '하차지');
      if(b) {
        if(num === 1) setFormData(prev => ({...prev, unloading_place: b.place_name, unloading_address: b.address, unloading_manager: b.manager_name, unloading_phone: b.manager_phone}));
        else setFormData(prev => ({...prev, unloading_place_2: b.place_name, unloading_address_2: b.address, unloading_manager_2: b.manager_name, unloading_phone_2: b.manager_phone}));
      }
    }
  };

  const handleOrderSubmit = async () => {
    if (selectedOrder) await supabase.from('truck_orders').update({ order_type: orderType, ...formData }).eq('id', selectedOrder.id);
    else await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData }]);
    alert("저장 완료! ✨");
    setShowOrderModal(false);
    fetchData();
  };

  const handleResponseSubmit = async (orderId: number) => {
    if (!resData.car_info || !resData.driver_name) return alert("배차 정보를 입력해주세요!");
    const { error } = await supabase.from('order_responses').insert([{ order_id: orderId, ...resData }]);
    if (!error) {
      await supabase.from('truck_orders').update({ status: '배차완료' }).eq('id', orderId);
      alert("배차 답변 등록 완료! ✅");
      const { data } = await supabase.from('order_responses').select('*').eq('order_id', orderId).maybeSingle();
      setCurrentResponse(data);
      fetchData();
    } else {
      alert("등록 에러: " + error.message);
    }
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

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic text-slate-800">🚚 NY LOGIS DISPATCH</h1>
        <button onClick={() => openOrderModal()} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all font-black">+ 신규 배차 신청</button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[11px] uppercase border-b">
            <tr>
              <th className="p-5 text-center w-16">Q.</th>
              <th className="p-5 text-center w-32">날짜</th>
              <th className="p-5 text-left">배차 제목 (상차지 👉 하차지)</th>
              <th className="p-5 text-center w-24">상태</th>
              <th className="p-5 text-center w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, index) => {
              const isExpanded = expandedId === item.id;
              return (
                <React.Fragment key={item.id}>
                  <tr onClick={() => toggleExpand(item.id)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors">
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
                      <div className="flex gap-2 justify-center font-black text-[10px]">
                        <button onClick={(e) => { e.stopPropagation(); openOrderModal(item); }} className="text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg">수정</button>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm("삭제?")) supabase.from('truck_orders').delete().eq('id', item.id).then(()=>fetchData()); }} className="text-red-400 bg-red-50 px-3 py-1.5 rounded-lg">삭제</button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="p-8">
                        <div className="bg-white border-2 border-green-500/20 rounded-[2.5rem] p-8 shadow-sm animate-in slide-in-from-top-4">
                          <div className="flex items-center gap-6 mb-6">
                            <span className="text-3xl font-black text-green-500 italic">A.</span>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">배차 상세 정보 답변</p>
                          </div>
                          {currentResponse ? (
                            <div className="grid grid-cols-3 gap-8">
                              <div className="bg-slate-50 p-6 rounded-3xl">
                                <p className="text-[10px] font-black text-slate-300 mb-1">TRUCK</p>
                                <p className="text-xl font-black text-slate-800">🚛 {currentResponse.car_info}</p>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-3xl">
                                <p className="text-[10px] font-black text-slate-300 mb-1">DRIVER</p>
                                <p className="text-xl font-black text-slate-800">👤 {currentResponse.driver_name}</p>
                              </div>
                              <div className="bg-blue-50 p-6 rounded-3xl">
                                <p className="text-[10px] font-black text-blue-300 mb-1">FEE</p>
                                <p className="text-2xl font-black text-blue-600">{Number(currentResponse.fee).toLocaleString()}원</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-4 w-full items-end bg-slate-50 p-6 rounded-3xl">
                              <input placeholder="차량정보" className="flex-1 p-4 rounded-2xl border-none font-bold text-sm shadow-sm" onChange={e => setResData({...resData, car_info: e.target.value})} />
                              <input placeholder="기사명" className="flex-1 p-4 rounded-2xl border-none font-bold text-sm shadow-sm" onChange={e => setResData({...resData, driver_name: e.target.value})} />
                              <input placeholder="운임료" className="flex-1 p-4 rounded-2xl border-none font-bold text-sm shadow-sm" onChange={e => setResData({...resData, fee: e.target.value})} />
                              <button onClick={() => handleResponseSubmit(item.id)} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all">답변 등록</button>
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

      {/* [모달] 신규/수정 신청 양식 (갱미의 요구사항 100% 반영) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto relative animate-in slide-in-from-right duration-300">
            <button onClick={() => setShowOrderModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 text-2xl font-bold">✕</button>
            <h2 className="text-2xl font-black italic mb-8 uppercase text-slate-800 underline decoration-orange-500 underline-offset-8">Request Form</h2>
            
            <div className="space-y-6">
              {/* 날짜 선택 */}
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm">
                  {['당일배차', '예약배차'].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${orderType === t ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                {orderType === '예약배차' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={formData.loading_date} className="p-3 rounded-xl border-none font-bold text-sm" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                    <input type="date" value={formData.unloading_date} className="p-3 rounded-xl border-none font-bold text-sm" onChange={e => setFormData({...formData, unloading_date: e.target.value})} />
                  </div>
                )}
              </div>

              {/* 상차지 섹션 */}
              <section className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase">Loading Point</p>
                <div className="grid grid-cols-2 gap-3">
                  <select onChange={e => autoFillLoading(e.target.value)} className="p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-sm">
                    <option value="">상차지 선택</option>
                    <option value="manual">✏️ 직접 입력</option>
                    {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                  </select>
                  <select value={formData.loading_manager} onChange={e => {
                    const s = staffs.find(x => x.name === e.target.value);
                    setFormData(prev => ({...prev, loading_manager: e.target.value, loading_phone: s?.phone || ""}));
                  }} className="p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-sm text-orange-600">
                    <option value="">담당자 선택</option>
                    <option value="manual">✏️ 직접 입력</option>
                    {staffs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <input value={formData.loading_place} placeholder="상차지 명칭" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm shadow-sm" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                <div className="grid grid-cols-2 gap-2 font-black text-orange-600">
                  <input value={formData.loading_manager} placeholder="상차 담당자명" className="p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none" onChange={e => setFormData({...formData, loading_manager: e.target.value})} />
                  <input value={formData.loading_phone} placeholder="상차 연락처" className="p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none" onChange={e => setFormData({...formData, loading_phone: e.target.value})} />
                </div>
                <input value={formData.loading_address} placeholder="상차지 주소" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
              </section>

              {/* 하차지 섹션 (직접 입력 담당자 추가) */}
              {[1, 2].map(num => (
                <section key={num} className="space-y-3 p-4 bg-slate-50 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-400 ml-2 uppercase">Unloading {num}</p>
                  <select onChange={e => autoFillUnloading(e.target.value, num)} className="w-full p-4 bg-white rounded-2xl font-bold text-sm border-none shadow-sm">
                    <option value="">하차지 {num} 즐겨찾기</option>
                    <option value="manual">✏️ 직접 입력</option>
                    {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                  </select>
                  <input value={num === 1 ? formData.unloading_place : formData.unloading_place_2} placeholder={`하차지 ${num} 명칭`} className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_place' : 'unloading_place_2']: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={num === 1 ? formData.unloading_manager : formData.unloading_manager_2} placeholder="하차 담당자" className="p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_manager' : 'unloading_manager_2']: e.target.value})} />
                    <input value={num === 1 ? formData.unloading_phone : formData.unloading_phone_2} placeholder="하차 연락처" className="p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_phone' : 'unloading_phone_2']: e.target.value})} />
                  </div>
                  <input value={num === 1 ? formData.unloading_address : formData.unloading_address_2} placeholder={`하차지 ${num} 주소`} className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_address' : 'unloading_address_2']: e.target.value})} />
                </section>
              ))}

              {/* 제품명, 상/하차 시간, 비고 */}
              <section className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase">Order Details</p>
                <input value={formData.product_name} placeholder="📦 제품명 (예: 파렛트 10개)" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm shadow-sm" onChange={e => setFormData({...formData, product_name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input value={formData.loading_time} placeholder="⏰ 상차시간" className="p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm shadow-sm" onChange={e => setFormData({...formData, loading_time: e.target.value})} />
                  <input value={formData.unloading_time} placeholder="⏰ 하차시간" className="p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm shadow-sm" onChange={e => setFormData({...formData, unloading_time: e.target.value})} />
                </div>
                <textarea value={formData.remarks} placeholder="📝 비고/특이사항" className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm shadow-sm h-24" onChange={e => setFormData({...formData, remarks: e.target.value})} />
              </section>

              <button onClick={handleOrderSubmit} className="w-full mt-10 p-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-xl hover:bg-black transition-all font-black">신청 내용 저장 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
