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

  const [resData, setResData] = useState({ car_info: "", driver_name: "", fee: "", status: "신청완료" });

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
      const order = list.find(o => o.id === id);
      const { data } = await supabase.from('order_responses').select('*').eq('order_id', id).maybeSingle();
      setCurrentResponse(data || null);
      
      setResData({ 
        car_info: data?.car_info || "", 
        driver_name: data?.driver_name || "", 
        fee: data?.fee || "",
        status: order?.status || "신청완료" 
      });
    }
  };

  const handleOrderSubmit = async () => {
    if (selectedOrder) {
      const { error } = await supabase.from('truck_orders').update({ order_type: orderType, ...formData }).eq('id', selectedOrder.id);
      if (!error) alert("배차 신청서가 수정되었습니다! ✨");
    } else {
      const { error } = await supabase.from('truck_orders').insert([{ order_type: orderType, ...formData, status: '신청완료' }]);
      if (!error) alert("신규 배차 신청 완료! 🚀");
    }
    setShowOrderModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from('truck_orders').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleResponseSubmit = async (orderId: number) => {
    if (!resData.car_info || !resData.driver_name) return alert("기사 정보를 입력해줘!");
    const { data: existing } = await supabase.from('order_responses').select('id').eq('order_id', orderId).maybeSingle();
    
    if (existing) {
      await supabase.from('order_responses').update({ car_info: resData.car_info, driver_name: resData.driver_name, fee: resData.fee }).eq('id', existing.id);
    } else {
      await supabase.from('order_responses').insert([{ order_id: orderId, car_info: resData.car_info, driver_name: resData.driver_name, fee: resData.fee }]);
    }

    const { error } = await supabase.from('truck_orders').update({ status: resData.status }).eq('id', orderId);
    if (!error) {
      alert(`정보가 저장되었습니다! 현재 상태: [${resData.status}] ✅`);
      fetchData();
    }
  };

  const handleStaffChange = (staffName: string) => {
    const selected = staffs.find(s => s.name === staffName);
    setFormData(prev => ({ ...prev, loading_manager: staffName, loading_phone: selected?.phone || "" }));
  };

  const autoFillLoading = (val: string) => {
    if (val === "manual") setFormData(prev => ({...prev, loading_place: "", loading_address: ""}));
    else {
      const b = bookmarks.find(x => x.place_name === val && x.type === '상차지');
      if(b) setFormData(prev => ({...prev, loading_place: b.place_name, loading_address: b.address}));
    }
  };

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

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 블루 포인트 헤더 섹션 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              용차 <span className="text-blue-600">배차</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">
              천안센터 <span className="text-blue-600 font-black">용차 배차 및 실시간 현황 관리</span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedOrder(null); setShowOrderModal(true); }} 
          className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-105 transition-all text-sm"
        >
          + 신규 배차 신청
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest">
            <tr>
              <th className="p-5 text-center w-16">No</th>
              <th className="p-5 text-center w-32">날짜</th>
              <th className="p-5 text-left">제목 (상차지 👉 하차지)</th>
              <th className="p-5 text-center w-24">상태</th>
              <th className="p-5 text-center w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, index) => {
              const isExpanded = expandedId === item.id;
              return (
                <React.Fragment key={item.id}>
                  <tr onClick={() => toggleExpand(item.id)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors font-black">
                    <td className="p-5 text-center text-blue-600">{list.length - index}</td>
                    <td className="p-5 text-center text-slate-500">{item.loading_date}</td>
                    <td className="p-5">
                      <p className="text-slate-800 text-base tracking-tight">{item.loading_place} 👉 {item.unloading_place}</p>
                      <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">📦 {item.product_name} | {item.loading_time} 상차</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-[10px] px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'}`}>{item.status}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center text-[10px]">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(item); setFormData({...item}); setOrderType(item.order_type); setShowOrderModal(true); }} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg">수정</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg">삭제</button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="p-8 animate-in slide-in-from-top-2">
                        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                          
                          {/* 💡 요청 정보 정밀 요약 박스 (하차지 1, 2 완벽 대응 버전) */}
<div className="bg-blue-50 p-8 rounded-[2.5rem] mb-8 border border-blue-100">
  <div className="flex justify-between items-start mb-6">
    <div>
      <p className="text-[10px] font-black text-blue-400 uppercase mb-2 tracking-widest">Order Summary</p>
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${item.order_type === '당일배차' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
          {item.order_type}
        </span>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          {item.loading_place} <span className="text-blue-600 mx-1">→</span> {item.unloading_place}
          {item.unloading_place_2 && <span className="text-blue-400 mx-1">→ {item.unloading_place_2}</span>}
        </h3>
      </div>
    </div>
    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
      <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
      <select 
        className="bg-slate-100 border-none rounded-xl px-4 py-2 font-black text-xs shadow-inner outline-none text-blue-600"
        value={resData.status}
        onChange={(e) => setResData({...resData, status: e.target.value})}
      >
        <option value="신청완료">🟠 신청완료</option>
        <option value="배차완료">🟢 배차완료</option>
      </select>
    </div>
  </div>

  {/* 상하차 상세 정보 그리드 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-blue-100 pt-6">
    {/* 상차지 정보 (고정) */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
        <p className="text-[11px] font-black text-slate-400 uppercase">Loading Point</p>
      </div>
      <p className="text-sm font-black text-slate-700">{item.loading_place} <span className="text-blue-600 ml-2">{item.loading_time} 상차</span></p>
      <p className="text-xs font-bold text-slate-500 leading-relaxed">{item.loading_address}</p>
      <p className="text-xs font-black text-blue-600 bg-blue-100/50 w-fit px-2 py-1 rounded-md">담당: {item.loading_manager} ({item.loading_phone})</p>
    </div>

    {/* 하차지 정보 (1과 2가 있을 경우 모두 표시) */}
    <div className="space-y-6 border-l border-blue-100 pl-8">
      {[1, 2].map(num => {
        const place = num === 1 ? item.unloading_place : item.unloading_place_2;
        const address = num === 1 ? item.unloading_address : item.unloading_address_2;
        const manager = num === 1 ? item.unloading_manager : item.unloading_manager_2;
        const phone = num === 1 ? item.unloading_phone : item.unloading_phone_2;
        const product = num === 1 ? item.product_name : item.product_name_2;

        if (!place) return null; // 하차지 2가 없으면 렌더링 안 함

        return (
          <div key={num} className={`space-y-2 ${num === 2 ? 'pt-4 border-t border-dashed border-blue-100' : ''}`}>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${num === 1 ? 'bg-slate-400' : 'bg-purple-400'}`}></span>
              <p className="text-[11px] font-black text-slate-400 uppercase">Unloading Point {num}</p>
            </div>
            <p className="text-sm font-black text-slate-700">{place} <span className="text-slate-400 ml-2">{item.unloading_time} 하차</span></p>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">{address}</p>
            <div className="flex flex-wrap gap-2">
              <p className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-md">담당: {manager} ({phone})</p>
              <p className="text-xs font-black text-white bg-blue-500 px-2 py-1 rounded-md">📦 {product}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* 하단 메모 섹션 */}
  <div className="mt-6 pt-4 border-t border-blue-100 flex items-center justify-between">
    <div className="flex items-center gap-6">
      {item.remarks && (
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black text-slate-400 uppercase">Memo:</p>
          <p className="text-sm font-bold text-red-500">{item.remarks}</p>
        </div>
      )}
    </div>
    <p className="text-[10px] font-black text-blue-300 italic">NY LOGIS DISPATCH FORM</p>
  </div>
</div>

                          {/* 기사 정보 입력란 */}
                          <div className="flex gap-4 w-full items-end bg-slate-50 p-6 rounded-3xl">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Vehicle Info</label>
                                <input placeholder="예: 11가1234 / 5톤" value={resData.car_info} className="w-full p-5 bg-white rounded-2xl border-none font-bold text-sm shadow-inner outline-none" onChange={e => setResData({...resData, car_info: e.target.value})} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Driver Info</label>
                                <input placeholder="예: 홍길동 010-1234-5678" value={resData.driver_name} className="w-full p-5 bg-white rounded-2xl border-none font-bold text-sm shadow-inner outline-none" onChange={e => setResData({...resData, driver_name: e.target.value})} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Settlement</label>
                                <input placeholder="예: 250,000" value={resData.fee} className="w-full p-5 bg-white rounded-2xl border-none font-bold text-sm shadow-inner text-blue-600 outline-none" onChange={e => setResData({...resData, fee: e.target.value})} />
                            </div>
                            <button onClick={() => handleResponseSubmit(item.id)} className="px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-blue-700 transition-all uppercase text-sm">
                              Save 🚀
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

      {/* 신규 배차 신청 모달 (기존 코드 유지) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto relative animate-in slide-in-from-right duration-300">
            <button onClick={() => setShowOrderModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 text-2xl font-black">✕</button>
            <h2 className="text-3xl font-black mb-8 uppercase text-slate-900 tracking-tighter italic">
              {selectedOrder ? 'Edit' : 'New'} <span className="text-blue-600">Dispatch</span>
            </h2>
            <div className="space-y-6 font-black">
              <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 shadow-inner">
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm">
                  {['당일배차', '예약배차'].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-3 rounded-xl text-xs transition-all ${orderType === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                  ))}
                </div>
                {orderType === '예약배차' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={formData.loading_date} className="p-4 rounded-2xl border-none text-sm shadow-sm outline-none" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                    <input type="date" value={formData.unloading_date} className="p-4 rounded-2xl border-none text-sm shadow-sm outline-none" onChange={e => setFormData({...formData, unloading_date: e.target.value})} />
                  </div>
                )}
              </div>
              
              <section className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Loading Point</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select onChange={e => autoFillLoading(e.target.value)} className="p-5 bg-slate-50 rounded-2xl text-sm border-none shadow-inner outline-none">
                    <option value="">상차지 선택</option>
                    <option value="manual">✏️ 직접 입력</option>
                    {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                  </select>
                  <select value={formData.loading_manager} onChange={e => handleStaffChange(e.target.value)} className="p-5 bg-slate-50 rounded-2xl text-sm border-none shadow-inner text-blue-600 outline-none">
                    <option value="">담당자 선택</option>
                    <option value="manual">✏️ 직접 입력</option>
                    {staffs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <input value={formData.loading_place} placeholder="상차지 명칭" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <input value={formData.loading_manager} placeholder="상차 담당자" className="p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner text-blue-600" onChange={e => setFormData({...formData, loading_manager: e.target.value})} />
                  <input value={formData.loading_phone} placeholder="연락처" className="p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner text-blue-600" onChange={e => setFormData({...formData, loading_phone: e.target.value})} />
                </div>
                <input value={formData.loading_address} placeholder="상차지 주소" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
              </section>

              {[1, 2].map(num => (
  <section key={num} className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] shadow-inner">
    <div className="flex items-center gap-2 ml-2">
      <div className="w-1.5 h-4 bg-blue-600/40 rounded-full"></div>
      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Unloading Point {num}</p>
    </div>
    
    {/* 즐겨찾기 선택 */}
    <select onChange={e => autoFillUnloading(e.target.value, num)} className="w-full p-5 bg-white rounded-2xl text-sm border-none shadow-sm outline-none">
      <option value="">하차지 {num} 즐겨찾기</option>
      <option value="manual">✏️ 직접 입력</option>
      {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
    </select>

    {/* 명칭 입력 */}
    <input value={num === 1 ? formData.unloading_place : formData.unloading_place_2} placeholder={`하차지 ${num} 명칭`} className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_place' : 'unloading_place_2']: e.target.value})} />
    
    {/* 담당자 및 연락처 */}
    <div className="grid grid-cols-2 gap-3">
      <input value={num === 1 ? formData.unloading_manager : formData.unloading_manager_2} placeholder="하차 담당자" className="p-5 bg-white rounded-2xl border-none text-sm shadow-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_manager' : 'unloading_manager_2']: e.target.value})} />
      <input value={num === 1 ? formData.unloading_phone : formData.unloading_phone_2} placeholder="연락처" className="p-5 bg-white rounded-2xl border-none text-sm shadow-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_phone' : 'unloading_phone_2']: e.target.value})} />
    </div>

    {/* 주소 입력 */}
    <input value={num === 1 ? formData.unloading_address : formData.unloading_address_2} placeholder={`하차지 ${num} 주소`} className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm" onChange={e => setFormData({...formData, [num === 1 ? 'unloading_address' : 'unloading_address_2']: e.target.value})} />

    {/* ✨ 추가된 제품 입력 칸 (주소 아래) */}
    <input 
      value={num === 1 ? formData.product_name : formData.product_name_2} 
      placeholder={`📦 하차지 ${num} 제품명 (예: 반도체 장비)`} 
      className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm" 
      onChange={e => setFormData({...formData, [num === 1 ? 'product_name' : 'product_name_2']: e.target.value})} 
    />
  </section>
))}

{/* Cargo Detail 섹션 삭제 후 상하차 시간부터 시작 */}
<section className="space-y-4 pt-4">
  <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
          <p className="text-[10px] text-slate-400 ml-4 uppercase">Loading Time</p>
          <input value={formData.loading_time} placeholder="⏰ 상차시간" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner text-blue-600" onChange={e => setFormData({...formData, loading_time: e.target.value})} />
      </div>
      <div className="space-y-1">
          <p className="text-[10px] text-slate-400 ml-4 uppercase">Unloading Time</p>
          <input value={formData.unloading_time} placeholder="⏰ 하차시간" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner text-blue-600" onChange={e => setFormData({...formData, unloading_time: e.target.value})} />
      </div>
  </div>
  <div className="space-y-1">
      <p className="text-[10px] text-slate-400 ml-4 uppercase">Remarks</p>
      <textarea value={formData.remarks} placeholder="📝 비고" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner h-32" onChange={e => setFormData({...formData, remarks: e.target.value})} />
  </div>
</section>

<button onClick={handleOrderSubmit} className="w-full mt-10 p-6 bg-blue-600 text-white rounded-[2.5rem] text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all uppercase tracking-widest italic">Save Request 🚀</button>            </div>
          </div>
        </div>
      )}
    </div>
  );
}
