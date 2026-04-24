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

  const [orderType, setOrderType] = useState('당일배차');
  const [excelRange, setExcelRange] = useState({ start: today, end: today });
  
  // ✨ 검색 필터 상태 (입력용)
  const [filters, setFilters] = useState({ loading_start: "", loading_end: "", status: "" });

  const initialFormState = {
    loading_date: today, unloading_date: today,
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: "",
    product_name: "", product_name_2: "", // ✨ 하차지별 제품 분리
    loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [resData, setResData] = useState({ car_info: "", driver_name: "", fee: "", status: "신청완료" });

  useEffect(() => { 
    fetchData(); 
    // 엑셀 라이브러리 로드 로직 생략 (기존과 동일)
  }, []);

  const fetchData = async () => {
    const { data: lData } = await supabase.from('truck_orders').select(`*, order_responses(*)`).order('created_at', { ascending: false });
    setList(lData || []);
    setFilteredList(lData || []);
  };

  // ✨ 검색 버튼을 눌러야만 필터링 적용
  const handleSearch = () => {
    let result = [...list];
    if (filters.loading_start) result = result.filter(item => item.loading_date >= filters.loading_start);
    if (filters.loading_end) result = result.filter(item => item.loading_date <= filters.loading_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);
    setFilteredList(result);
    setCurrentPage(1);
    setExpandedId(null);
  };

  // ✨ 리셋 버튼: 입력값만 비우고, 검색은 따로 눌러야 함
  const resetFilters = () => {
    setFilters({ loading_start: "", loading_end: "", status: "" });
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) setExpandedId(null);
    else {
      setExpandedId(id);
      const order = list.find(o => o.id === id);
      const res = order?.order_responses?.[0];
      setResData({ car_info: res?.car_info || "", driver_name: res?.driver_name || "", fee: res?.fee || "", status: order?.status || "신청완료" });
    }
  };

  // 🗑️ 삭제 기능 추가
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 관련 배차 정보도 모두 사라집니다.")) return;
    const { error } = await supabase.from('truck_orders').delete().eq('id', id);
    if (!error) {
      alert("삭제되었습니다.");
      fetchData();
    }
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
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl shadow-lg text-sm">📊 엑셀 다운로드</button>
          <button onClick={() => { setEditingItem(null); setFormData(initialFormState); setShowOrderModal(true); }} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl shadow-lg text-sm">+ 신규 배차 신청</button>
        </div>
      </div>

      {/* 🔍 검색 필터 (수정됨) */}
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
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl text-xs border border-slate-100">RESET</button>
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
              <th className="p-5 text-center w-40">관리</th>
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
                      <p className="text-[11px] text-slate-400 mt-1 uppercase font-normal">📦 {item.product_name} {item.product_name_2 && ` / ${item.product_name_2}`}</p>
                    </td>
                    <td className="p-5 text-center text-[10px]">
                      <span className={`px-4 py-1.5 rounded-full ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>{item.status}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-4 justify-center text-[10px] text-slate-300">
                        <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setFormData({...item}); setShowOrderModal(true); }} className="hover:text-blue-600">수정</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="hover:text-red-500">삭제</button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded 영역 생략 (기존 유지) */}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* 🔢 페이지네이션 */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs">PREV</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-10 h-10 rounded-xl text-xs ${currentPage === i+1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>{i+1}</button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs">NEXT</button>
        </div>
      </div>

      {/* 📋 배차 신청 모달 (제품 분리 적용) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">{editingItem ? '배차 수정' : '신규 배차'}</h2>
               <button onClick={() => setShowOrderModal(false)} className="text-slate-300 text-2xl">✕</button>
             </div>
             
             <form onSubmit={(e) => { e.preventDefault(); handleOrderSubmit(); }} className="space-y-6">
                {/* 상차지 섹션 */}
                <div className="bg-slate-50 p-6 rounded-[2rem] shadow-inner space-y-4">
                  <p className="text-blue-600 text-[10px] tracking-widest uppercase">📍 Loading Point</p>
                  <input placeholder="상차지 명칭" value={formData.loading_place} className="w-full p-4 bg-white rounded-xl text-sm outline-none shadow-sm" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                </div>

                {/* 하차지 섹션 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-blue-600 text-[10px] tracking-widest uppercase">📍 Unloading 1</p>
                    <input placeholder="하차지1 명칭" value={formData.unloading_place} className="w-full p-4 bg-slate-50 rounded-xl text-sm outline-none shadow-inner" onChange={e => setFormData({...formData, unloading_place: e.target.value})} />
                    <input placeholder="하차지1 주소" value={formData.unloading_address} className="w-full p-4 bg-slate-50 rounded-xl text-xs outline-none shadow-inner" onChange={e => setFormData({...formData, unloading_address: e.target.value})} />
                    <input placeholder="📦 하차지1 제품" value={formData.product_name} className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs outline-none font-bold" onChange={e => setFormData({...formData, product_name: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <p className="text-slate-400 text-[10px] tracking-widest uppercase">📍 Unloading 2 (Optional)</p>
                    <input placeholder="하차지2 명칭" value={formData.unloading_place_2} className="w-full p-4 bg-slate-50 rounded-xl text-sm outline-none shadow-inner" onChange={e => setFormData({...formData, unloading_place_2: e.target.value})} />
                    <input placeholder="하차지2 주소" value={formData.unloading_address_2} className="w-full p-4 bg-slate-50 rounded-xl text-xs outline-none shadow-inner" onChange={e => setFormData({...formData, unloading_address_2: e.target.value})} />
                    <input placeholder="📦 하차지2 제품" value={formData.product_name_2} className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs outline-none font-bold" onChange={e => setFormData({...formData, product_name_2: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400 text-[10px] tracking-widest uppercase">Memo</p>
                  <textarea placeholder="기타 요청사항" value={formData.remarks} className="w-full p-5 bg-slate-50 rounded-2xl text-sm h-24 outline-none shadow-inner" onChange={e => setFormData({...formData, remarks: e.target.value})} />
                </div>

                <button type="submit" className="w-full mt-6 p-6 bg-blue-600 text-white rounded-[2.5rem] text-xl font-black shadow-xl hover:bg-blue-700 uppercase tracking-widest">저장하기 🚀</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
