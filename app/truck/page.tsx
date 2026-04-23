"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // ✨ 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('당일배차');

  const [filters, setFilters] = useState({
    created_start: "", created_end: "",
    loading_start: "", loading_end: "",
    status: ""
  });

  const [formData, setFormData] = useState({
    loading_date: new Date().toISOString().split('T')[0],
    unloading_date: new Date().toISOString().split('T')[0],
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: "",
    product_name: "", product_name_2: "", loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
  });

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

  // ✨ 검색 로직 (페이지 번호 초기화 추가)
  const handleSearch = () => {
    let result = [...list];
    if (filters.created_start) result = result.filter(item => item.created_at.split('T')[0] >= filters.created_start);
    if (filters.created_end) result = result.filter(item => item.created_at.split('T')[0] <= filters.created_end);
    if (filters.loading_start) result = result.filter(item => item.loading_date >= filters.loading_start);
    if (filters.loading_end) result = result.filter(item => item.loading_date <= filters.loading_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);

    setFilteredList(result);
    setCurrentPage(1); // 검색 시 1페이지로 이동
    setExpandedId(null);
  };

  const resetFilters = () => {
    setFilters({ created_start: "", created_end: "", loading_start: "", loading_end: "", status: "" });
    setFilteredList(list);
    setCurrentPage(1);
  };

  // ✨ 페이지네이션 계산 로직
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const toggleExpand = (id: number) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 헤더 섹션 (기존 유지) */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              용차 <span className="text-blue-600">배차</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">천안센터 관리 시스템</p>
          </div>
        </div>
        <button onClick={() => { setSelectedOrder(null); setShowOrderModal(true); }} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all text-sm">+ 신규 배차 신청</button>
      </div>

      {/* 🔍 검색 필터 (기존 유지) */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2">Created Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2">Loading Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={filters.loading_start} onChange={e => setFilters({...filters, loading_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={filters.loading_end} onChange={e => setFilters({...filters, loading_end: e.target.value})} />
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

      {/* 📋 리스트 테이블 */}
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
            {/* ✨ filteredList 대신 currentItems 사용 */}
            {currentItems.map((item, index) => {
              const isExpanded = expandedId === item.id;
              // 페이지가 넘어가도 전체 리스트 기준 순번 유지
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
                      <span className={`text-[10px] px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>{item.status}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center text-[10px]">
                        <button onClick={(e) => { e.stopPropagation(); /* 수정로직 */ }} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg">수정</button>
                        <button onClick={(e) => { e.stopPropagation(); /* 삭제로직 */ }} className="text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg">삭제</button>
                      </div>
                    </td>
                  </tr>
                  {/* 상세 내용 (기존 유지) */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50 p-8 border-b">
                        <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-1">
                            <p className="text-[10px] text-blue-600 font-black uppercase">Loading Info</p>
                            <p className="text-sm font-bold text-slate-700">{item.loading_address}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-orange-600 font-black uppercase">Remarks</p>
                            <p className="text-sm font-bold text-slate-700">{item.remarks || "특이사항 없음"}</p>
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

        {/* ✨ 페이지네이션 버튼 UI */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs disabled:opacity-30 hover:bg-slate-100 transition-all"
          >
            PREV
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                  currentPage === i + 1 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110' 
                  : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs disabled:opacity-30 hover:bg-slate-100 transition-all"
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
}
