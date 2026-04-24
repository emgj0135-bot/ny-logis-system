"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TruckPage() {
  // --- 상태 관리 ---
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('당일배차');

  // 검색 필터
  const [filters, setFilters] = useState({
    created_start: "", created_end: "",
    loading_start: "", loading_end: "",
    status: ""
  });

  const initialFormState = {
    loading_date: new Date().toISOString().split('T')[0],
    unloading_date: new Date().toISOString().split('T')[0],
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: "",
    product_name: "", product_name_2: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [resData, setResData] = useState({ car_info: "", driver_name: "", fee: "", status: "신청완료" });

  // --- 데이터 패칭 ---
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from('bookmarks').select('*');
    setBookmarks(bData || []);
    const { data: sData } = await supabase.from('staff').select('*');
    setStaffs(sData || []);
    const { data: lData } = await supabase.from('truck_orders').select(`*, order_responses(*)`).order('created_at', { ascending: false });
    
    setList(lData || []);
    setFilteredList(lData || []);
  };

  // --- 주요 핸들러 ---
  const handleSearch = () => {
    let result = [...list];
    if (filters.created_start) result = result.filter(item => item.created_at.split('T')[0] >= filters.created_start);
    if (filters.created_end) result = result.filter(item => item.created_at.split('T')[0] <= filters.created_end);
    if (filters.loading_start) result = result.filter(item => item.loading_date >= filters.loading_start);
    if (filters.loading_end) result = result.filter(item => item.loading_date <= filters.loading_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);

    setFilteredList(result);
    setCurrentPage(1);
    setExpandedId(null);
  };

  const resetFilters = () => {
    setFilters({ created_start: "", created_end: "", loading_start: "", loading_end: "", status: "" });
    setFilteredList(list);
    setCurrentPage(1);
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const order = list.find(o => o.id === id);
      const { data } = await supabase.from('order_responses').select('*').eq('order_id', id).maybeSingle();
      setResData({ 
        car_info: data?.car_info || "", 
        driver_name: data?.driver_name || "", 
        fee: data?.fee || "",
        status: order?.status || "신청완료" 
      });
    }
  };

  const handleOrderSubmit = async () => {
    const { order_responses, created_at, id, ...pureData } = formData as any;
    const submissionData = { ...pureData, order_type: orderType };

    if (selectedOrder) {
      const { error } = await supabase.from('truck_orders').update(submissionData).eq('id', selectedOrder.id);
      if (!error) alert("수정 완료! ✨");
    } else {
      const { error } = await supabase.from('truck_orders').insert([{ ...submissionData, status: '신청완료' }]);
      if (!error) alert("배차 신청 완료! 🚀");
    }
    setShowOrderModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제할까?")) return;
    await supabase.from('truck_orders').delete().eq('id', id);
    fetchData();
  };

  const handleResponseSubmit = async (orderId: number) => {
    const { data: existing } = await supabase.from('order_responses').select('id').eq('order_id', orderId).maybeSingle();
    if (existing) {
      await supabase.from('order_responses').update({ car_info: resData.car_info, driver_name: resData.driver_name, fee: resData.fee }).eq('id', existing.id);
    } else {
      await supabase.from('order_responses').insert([{ order_id: orderId, car_info: resData.car_info, driver_name: resData.driver_name, fee: resData.fee }]);
    }
    await supabase.from('truck_orders').update({ status: resData.status }).eq('id', orderId);
    alert("배차 정보 저장 완료! ✅");
    fetchData();
  };

  // --- 자동완성 함수 ---
  const autoFillLoading = (val: string) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '상차지');
    if(b) setFormData(prev => ({...prev, loading_place: b.place_name, loading_address: b.address}));
  };

  const autoFillUnloading = (val: string, num: number) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '하차지');
    if(b) {
      const target = num === 1 
        ? { p: 'unloading_place', a: 'unloading_address', m: 'unloading_manager', ph: 'unloading_phone' }
        : { p: 'unloading_place_2', a: 'unloading_address_2', m: 'unloading_manager_2', ph: 'unloading_phone_2' };
      setFormData(prev => ({...prev, [target.p]: b.place_name, [target.a]: b.address, [target.m]: b.manager_name, [target.ph]: b.manager_phone}));
    }
  };

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">용차 <span className="text-blue-600">배차</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">천안센터 관리 시스템</p>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedOrder(null); setFormData(initialFormState); setShowOrderModal(true); }}
          className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:scale-105 transition-all text-sm"
        >
          + 신규 배차 신청
        </button>
      </div>

      {/* 🔍 검색 필터 (이건 유지할게!) */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2">Created Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2">Loading Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold" value={filters.loading_start} onChange={e => setFilters({...filters, loading_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold" value={filters.loading_end} onChange={e => setFilters({...filters, loading_end: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50">
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[150px]">
            <option value="">상태 전체</option>
            <option value="신청완료">신청완료</option>
            <option value="배차완료">배차완료</option>
          </select>
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all">SEARCH 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs border border-slate-100">RESET</button>
        </div>
      </div>

      {/* 📋 메인 테이블 */}
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
            {currentItems.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const displayNo = filteredList.length - (indexOfFirstItem + index);
              
              return (
                <React.Fragment key={item.id}>
                  <tr onClick={() => toggleExpand(item.id)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors font-black">
                    <td className="p-5 text-center text-blue-600">{displayNo}</td>
                    <td className="p-5 text-center text-slate-500">{item.loading_date}</td>
                    <td className="p-5">
                      <p className="text-slate-800 text-base tracking-tight">{item.loading_place} 👉 {item.unloading_place}</p>
                      <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">📦 {item.product_name} | {item.loading_time} 상차</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-[10px] px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>{item.status}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center text-[10px]">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(item); setFormData({...item}); setOrderType(item.order_type); setShowOrderModal(true); }} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg">수정</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg">삭제</button>
                      </div>
                    </td>
                  </tr>

                  {/* ✨ 상세보기 & 배차 정보 입력 (고른 디자인 합체) */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="p-8 animate-in slide-in-from-top-2">
                        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                          {/* 배차 요약 박스 */}
                          <div className="bg-blue-50 p-8 rounded-[2.5rem] mb-8 border border-blue-100">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Order Summary</p>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                  {item.loading_place} <span className="text-blue-600 mx-1">→</span> {item.unloading_place}
                                  {item.unloading_place_2 && <span className="text-blue-400 mx-1">→ {item.unloading_place_2}</span>}
                                </h3>
                              </div>
                              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400">Status</span>
                                <select className="bg-slate-100 border-none rounded-xl px-4 py-2 font-black text-xs text-blue-600 outline-none" value={resData.status} onChange={(e) => setResData({...resData, status: e.target.value})}>
                                  <option value="신청완료">🟠 신청완료</option>
                                  <option value="배차완료">🟢 배차완료</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 border-t border-blue-100 pt-6">
                              <div className="space-y-2 text-xs">
                                <p className="font-black text-slate-400 uppercase">Loading</p>
                                <p className="font-bold">{item.loading_place} ({item.loading_time})</p>
                                <p className="text-slate-500">{item.loading_address}</p>
                                <p className="text-blue-600 font-black">{item.loading_manager} / {item.loading_phone}</p>
                              </div>
                              <div className="space-y-2 text-xs border-l pl-8">
                                <p className="font-black text-slate-400 uppercase">Unloading 1</p>
                                <p className="font-bold">{item.unloading_place} ({item.product_name})</p>
                                <p className="text-slate-500">{item.unloading_address}</p>
                              </div>
                            </div>
                            {item.remarks && <p className="mt-4 pt-4 border-t border-blue-100 text-sm font-bold text-red-500">💡 비고: {item.remarks}</p>}
                          </div>

                          {/* 기사 정보 입력란 */}
                          <div className="flex gap-4 w-full items-end bg-slate-50 p-6 rounded-3xl">
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Vehicle</label>
                              <input placeholder="차량번호 / 톤수" value={resData.car_info} className="w-full p-5 bg-white rounded-2xl border-none font-bold text-sm shadow-inner outline-none" onChange={e => setResData({...resData, car_info: e.target.value})} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Driver</label>
                              <input placeholder="기사명 연락처" value={resData.driver_name} className="w-full p-5 bg-white rounded-2xl border-none font-bold text-sm shadow-inner outline-none" onChange={e => setResData({...resData, driver_name: e.target.value})} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Fee</label>
                              <input placeholder="운반비" value={resData.fee} className="w-full p-5 bg-white rounded-2xl border-none font-bold text-sm shadow-inner text-blue-600 outline-none" onChange={e => setResData({...resData, fee: e.target.value})} />
                            </div>
                            <button onClick={() => handleResponseSubmit(item.id)} className="px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-blue-700 transition-all text-sm uppercase">저장 🚀</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* 🔢 페이지네이션 컨트롤 */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50 font-black">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs disabled:opacity-30">PREV</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-10 h-10 rounded-xl text-xs transition-all ${currentPage === i+1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110' : 'bg-white text-slate-400 border border-slate-100'}`}>{i+1}</button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs disabled:opacity-30">NEXT</button>
        </div>
      </div>

      {/* 📋 배차 신청/수정 슬라이드 모달 (고른 디자인 합체) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50 overflow-hidden">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-300 relative">
            <button onClick={() => setShowOrderModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 text-2xl font-black">✕</button>
            <h2 className="text-3xl font-black mb-8 uppercase text-slate-900 tracking-tighter">
              {selectedOrder ? '배차 수정' : '신규 배차'}
            </h2>
            
            <div className="space-y-6 font-black">
              {/* 배차 유형 선택 */}
              <div className="bg-slate-50 p-6 rounded-[2.5rem] shadow-inner space-y-4">
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm">
                  {['당일배차', '야상배차'].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-3 rounded-xl text-xs transition-all ${orderType === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={formData.loading_date} className="p-4 rounded-2xl border-none text-sm shadow-sm outline-none" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                  <input type="date" value={formData.unloading_date} className="p-4 rounded-2xl border-none text-sm shadow-sm outline-none" onChange={e => setFormData({...formData, unloading_date: e.target.value})} />
                </div>
              </div>

              {/* 상차지 섹션 */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Loading Point</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select onChange={e => autoFillLoading(e.target.value)} className="p-5 bg-slate-50 rounded-2xl text-sm border-none shadow-inner outline-none">
                    <option value="">상차지 즐겨찾기</option>
                    {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                  </select>
                  <select onChange={e => {
                    const s = staffs.find(x => x.name === e.target.value);
                    setFormData(prev => ({...prev, loading_manager: e.target.value, loading_phone: s?.phone || ""}));
                  }} className="p-5 bg-slate-50 rounded-2xl text-sm border-none shadow-inner text-blue-600 outline-none">
                    <option value="">담당자 선택</option>
                    {staffs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <input value={formData.loading_place} placeholder="상차지 명칭" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                <input value={formData.loading_address} placeholder="상차지 주소" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
              </section>

              {/* 하차지 섹션 (1개만 예시, 2개도 동일 방식) */}
              <section className="space-y-4 p-6 bg-slate-50 rounded-[2.5rem] shadow-inner">
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-1.5 h-4 bg-blue-600/40 rounded-full"></div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Unloading Point 1</p>
                </div>
                <select onChange={e => autoFillUnloading(e.target.value, 1)} className="w-full p-5 bg-white rounded-2xl text-sm border-none shadow-sm outline-none">
                  <option value="">하차지 즐겨찾기</option>
                  {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                </select>
                <input value={formData.unloading_place} placeholder="하차지 명칭" className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm" onChange={e => setFormData({...formData, unloading_place: e.target.value})} />
                <input value={formData.unloading_address} placeholder="하차지 주소" className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm" onChange={e => setFormData({...formData, unloading_address: e.target.value})} />
                <input value={formData.product_name} placeholder="📦 제품명" className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm" onChange={e => setFormData({...formData, product_name: e.target.value})} />
              </section>

              {/* 기타 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <input value={formData.loading_time} placeholder="⏰ 상차시간" className="p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner" onChange={e => setFormData({...formData, loading_time: e.target.value})} />
                <input value={formData.unloading_time} placeholder="⏰ 하차시간" className="p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner" onChange={e => setFormData({...formData, unloading_time: e.target.value})} />
              </div>
              <textarea value={formData.remarks} placeholder="📝 비고" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner h-32" onChange={e => setFormData({...formData, remarks: e.target.value})} />

              <button onClick={handleOrderSubmit} className="w-full mt-10 p-6 bg-blue-600 text-white rounded-[2.5rem] text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all uppercase tracking-widest">
                {selectedOrder ? '수정 완료 💾' : '신규 배차 저장 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
