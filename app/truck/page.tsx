"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('당일배차');
  const [excelRange, setExcelRange] = useState({ start: today, end: today });
  const [filters, setFilters] = useState({ loading_start: "", loading_end: "", status: "" });

  const initialFormState = {
    loading_date: today, unloading_date: today,
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: "",
    product_name: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [resData, setResData] = useState({ car_info: "", driver_name: "", fee: "", status: "신청완료" });

  useEffect(() => { 
    fetchData(); 
    if (!document.getElementById('xlsx-script')) {
      const script = document.createElement('script');
      script.id = 'xlsx-script';
      script.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js";
      document.head.appendChild(script);
    }
  }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from('bookmarks').select('*');
    setBookmarks(bData || []);
    const { data: lData } = await supabase.from('truck_orders').select(`*, order_responses(*)`).order('created_at', { ascending: false });
    setList(lData || []);
    setFilteredList(lData || []);
  };

  const handleSearch = () => {
    let result = [...list];
    if (filters.loading_start) result = result.filter(item => item.loading_date >= filters.loading_start);
    if (filters.loading_end) result = result.filter(item => item.loading_date <= filters.loading_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);
    setFilteredList(result);
    setCurrentPage(1);
    setExpandedId(null);
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const order = list.find(o => o.id === id);
      const res = order?.order_responses?.[0];
      setResData({ 
        car_info: res?.car_info || "", 
        driver_name: res?.driver_name || "", 
        fee: res?.fee || "", 
        status: order?.status || "신청완료" 
      });
    }
  };

  // 용차 업체 배차 정보 저장
  const handleResponseSubmit = async (orderId: number) => {
    const order = list.find(o => o.id === orderId);
    const existingRes = order?.order_responses?.[0];

    if (existingRes) {
      await supabase.from('order_responses').update(resData).eq('id', existingRes.id);
    } else {
      await supabase.from('order_responses').insert([{ ...resData, order_id: orderId }]);
    }
    await supabase.from('truck_orders').update({ status: resData.status }).eq('id', orderId);
    
    alert("🚚 배차 정보가 업데이트되었습니다!");
    fetchData();
  };

  const handleOrderSubmit = async () => {
    const { order_responses, created_at, id, ...pureData } = formData as any;
    const submissionData = { ...pureData, order_type: orderType };
    
    const { error } = editingItem 
      ? await supabase.from('truck_orders').update(submissionData).eq('id', editingItem.id)
      : await supabase.from('truck_orders').insert([{ ...submissionData, status: '신청완료' }]);

    if (!error) {
      alert(editingItem ? "✅ 수정 완료!" : "🚀 신청 완료!");
      setShowOrderModal(false);
      fetchData();
    }
  };

  // 🔢 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full shadow-lg"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">용차 <span className="text-blue-600">배차</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase text-blue-600/60">천안센터 실시간 배차 시스템</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl shadow-lg hover:bg-green-700 transition-all text-sm">📊 엑셀 다운로드</button>
          <button onClick={() => { setEditingItem(null); setFormData(initialFormState); setShowOrderModal(true); }} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl shadow-lg hover:bg-blue-700 transition-all text-sm">+ 신규 배차 신청</button>
        </div>
      </div>

      {/* 🔍 검색 필터 */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest">Loading Date</p>
            <div className="flex items-center gap-3 font-bold">
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs" value={filters.loading_start} onChange={e => setFilters({...filters, loading_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs" value={filters.loading_end} onChange={e => setFilters({...filters, loading_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest">Status</p>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-3 bg-slate-50 rounded-xl outline-none text-xs font-bold min-w-[150px]">
              <option value="">전체 상태</option>
              <option value="신청완료">신청완료</option>
              <option value="배차완료">배차완료</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50">
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl text-xs hover:bg-black transition-all">SEARCH FILTER 🔍</button>
          <button onClick={() => { setFilters({loading_start:"", loading_end:"", status:""}); setFilteredList(list); }} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl text-xs border border-slate-100">RESET</button>
        </div>
      </div>

      {/* 📋 메인 테이블 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase border-b tracking-widest">
            <tr>
              <th className="p-5 text-center w-16">No</th>
              <th className="p-5 text-center w-32">상차일자</th>
              <th className="p-5 text-left">배차 정보 (상차지 👉 하차지)</th>
              <th className="p-5 text-center w-24">상태</th>
              <th className="p-5 text-center w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => {
              const displayNo = filteredList.length - (indexOfFirstItem + index);
              return (
                <React.Fragment key={item.id}>
                  <tr onClick={() => toggleExpand(item.id)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors">
                    <td className="p-5 text-center text-blue-600">{displayNo}</td>
                    <td className="p-5 text-center text-slate-500">{item.loading_date}</td>
                    <td className="p-5">
                      <p className="text-slate-800 text-base tracking-tight">{item.loading_place} 👉 {item.unloading_place} {item.unloading_place_2 && `→ ${item.unloading_place_2}`}</p>
                      <p className="text-[11px] text-slate-400 mt-1 uppercase">📦 {item.product_name} | {item.loading_time} 상차</p>
                    </td>
                    <td className="p-5 text-center text-[10px]">
                      <span className={`px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>{item.status}</span>
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setFormData({...item}); setOrderType(item.order_type); setShowOrderModal(true); }} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs">수정</button>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="p-8">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
                            <p className="text-blue-600 uppercase text-xs tracking-widest">📍 Route Details</p>
                            <div className="space-y-2 text-xs">
                              <p><span className="text-slate-400">상차지:</span> {item.loading_place} / {item.loading_address}</p>
                              <p><span className="text-slate-400">하차지1:</span> {item.unloading_place} / {item.unloading_address}</p>
                              {item.unloading_place_2 && <p><span className="text-slate-400">하차지2:</span> {item.unloading_place_2} / {item.unloading_address_2}</p>}
                              <p><span className="text-slate-400">비고:</span> {item.remarks || "-"}</p>
                            </div>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-100 space-y-4">
                            <p className="text-blue-600 uppercase text-xs tracking-widest">🚛 Dispatch Info (용차업체 입력)</p>
                            <div className="grid grid-cols-2 gap-3">
                              <input placeholder="차량번호/톤수" className="p-3 bg-slate-50 rounded-xl text-xs outline-none" value={resData.car_info} onChange={e => setResData({...resData, car_info: e.target.value})} />
                              <input placeholder="기사님 성함/연락처" className="p-3 bg-slate-50 rounded-xl text-xs outline-none" value={resData.driver_name} onChange={e => setResData({...resData, driver_name: e.target.value})} />
                              <input placeholder="운반비" type="number" className="p-3 bg-slate-50 rounded-xl text-xs outline-none" value={resData.fee} onChange={e => setResData({...resData, fee: e.target.value})} />
                              <select className="p-3 bg-slate-50 rounded-xl text-xs outline-none font-black text-blue-600" value={resData.status} onChange={e => setResData({...resData, status: e.target.value})}>
                                <option value="신청완료">신청완료</option>
                                <option value="배차완료">배차완료</option>
                              </select>
                            </div>
                            <button onClick={() => handleResponseSubmit(item.id)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs shadow-md">배차 정보 업데이트</button>
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

        {/* 🔢 페이지네이션 복구 */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs disabled:opacity-30">PREV</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-10 h-10 rounded-xl text-xs transition-all ${currentPage === i+1 ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-white text-slate-400 border border-slate-100'}`}>{i+1}</button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs disabled:opacity-30">NEXT</button>
        </div>
      </div>

      {/* 📋 배차 신청 모달 (하차지1, 2 완벽 복구) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">{editingItem ? '배차 수정' : '신규 배차'}</h2>
               <button onClick={() => setShowOrderModal(false)} className="text-slate-300 text-2xl">✕</button>
             </div>
             
             <form onSubmit={(e) => { e.preventDefault(); handleOrderSubmit(); }} className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 shadow-inner">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 ml-4 uppercase">Loading Date</p>
                      <input required type="date" value={formData.loading_date} className="w-full p-4 bg-white rounded-xl text-sm outline-none shadow-sm" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 ml-4 uppercase">Order Type</p>
                      <select className="w-full p-4 bg-white rounded-xl text-sm outline-none shadow-sm" value={orderType} onChange={e => setOrderType(e.target.value)}>
                        <option value="당일배차">당일배차</option>
                        <option value="내일배차">내일배차</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-blue-600 text-xs ml-2 tracking-widest uppercase italic">📍 Loading & Unloading</p>
                  <input placeholder="상차지 명칭 (예: 천안센터)" value={formData.loading_place} className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none shadow-inner text-sm" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 ml-4 uppercase tracking-widest">Unloading 1 (Primary)</p>
                      <input placeholder="하차지1 명칭" value={formData.unloading_place} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-sm" onChange={e => setFormData({...formData, unloading_place: e.target.value})} />
                      <input placeholder="하차지1 주소" value={formData.unloading_address} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-xs" onChange={e => setFormData({...formData, unloading_address: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 ml-4 uppercase tracking-widest">Unloading 2 (Option)</p>
                      <input placeholder="하차지2 명칭" value={formData.unloading_place_2} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-sm" onChange={e => setFormData({...formData, unloading_place_2: e.target.value})} />
                      <input placeholder="하차지2 주소" value={formData.unloading_address_2} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-xs" onChange={e => setFormData({...formData, unloading_address_2: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-blue-600 text-xs ml-2 tracking-widest uppercase italic">📦 Product & Remarks</p>
                  <input placeholder="제품명 및 수량" value={formData.product_name} className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none shadow-inner text-sm" onChange={e => setFormData({...formData, product_name: e.target.value})} />
                  <textarea placeholder="비고 및 요청사항" value={formData.remarks} className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none shadow-inner text-sm h-24" onChange={e => setFormData({...formData, remarks: e.target.value})} />
                </div>

                <button type="submit" className="w-full mt-10 p-6 bg-blue-600 text-white rounded-[2.5rem] text-xl font-black shadow-xl hover:bg-blue-700 uppercase tracking-widest">저장하기 🚀</button>
             </form>
          </div>
        </div>
      )}

      {/* 엑셀 모달은 기존과 동일 (생략) */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10">
            <h2 className="text-lg font-black mb-4 text-slate-800 tracking-tight uppercase">Excel Download</h2>
            <div className="space-y-4">
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              <button onClick={() => downloadExcel()} className="w-full bg-green-600 text-white p-4 rounded-2xl font-black text-xs hover:bg-green-700">다운로드 실행</button>
              <button onClick={() => setShowExcelModal(false)} className="w-full bg-slate-100 text-slate-400 p-4 rounded-2xl font-black text-xs">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
