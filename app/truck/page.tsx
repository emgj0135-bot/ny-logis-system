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

  // 초기 폼 데이터 상태
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

  // 🔍 검색 로직
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

  // 📝 배차 신청/수정 제출
  const handleOrderSubmit = async () => {
    if (selectedOrder) {
      await supabase.from('truck_orders').update({ ...formData, order_type: orderType }).eq('id', selectedOrder.id);
    } else {
      await supabase.from('truck_orders').insert([{ ...formData, order_type: orderType, status: '신청완료' }]);
    }
    setShowOrderModal(false);
    fetchData();
  };

  // 🗑️ 삭제 로직
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from('truck_orders').delete().eq('id', id);
    fetchData();
  };

  // 🚚 배차 정보(응답) 등록 로직
  const handleResponseSubmit = async (orderId: number) => {
    const { error } = await supabase.from('order_responses').upsert([{ order_id: orderId, ...resData }]);
    if (!error) {
      await supabase.from('truck_orders').update({ status: resData.status }).eq('id', orderId);
      alert("배차 정보가 저장되었습니다.");
      fetchData();
    }
  };

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const toggleExpand = (id: number, item: any) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // 배차 정보 등록란을 위해 기존 응답 데이터가 있다면 세팅
      if (item.order_responses && item.order_responses.length > 0) {
        setResData({ ...item.order_responses[0] });
      } else {
        setResData({ car_info: "", driver_name: "", fee: "", status: item.status || "신청완료" });
      }
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 헤더 */}
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
        <button 
          onClick={() => { setSelectedOrder(null); setFormData(initialFormState); setShowOrderModal(true); }} 
          className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all text-sm"
        >
          + 신규 배차 신청
        </button>
      </div>

      {/* 🔍 검색 필터 */}
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
            {currentItems.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const displayNo = filteredList.length - (indexOfFirstItem + index);
              
              return (
                <React.Fragment key={item.id}>
                  <tr onClick={() => toggleExpand(item.id, item)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors font-black">
                    <td className="p-5 text-center text-blue-600">{displayNo}</td>
                    <td className="p-5 text-center text-slate-500">{item.loading_date}</td>
                    <td className="p-5">
                      <p className="text-slate-800 text-base tracking-tight">{item.loading_place} 👉 {item.unloading_place}</p>
                      <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">📦 {item.product_name} | {item.loading_time} 상차</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-[10px] px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100 animate-pulse'}`}>{item.status}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center text-[10px]">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(item); setFormData({...item}); setOrderType(item.order_type); setShowOrderModal(true); }} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg">수정</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg">삭제</button>
                      </div>
                    </td>
                  </tr>

                  {/* ✨ 펼쳐졌을 때: 배차 정보 등록란 (이게 갱미가 말한 그 디자인!) */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50 p-8 border-b">
                        <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span> 배차 정보 등록
                          </h3>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">차량 정보</label>
                              <input className="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold" placeholder="ex) 11가 1234 (5톤)" value={resData.car_info} onChange={e => setResData({...resData, car_info: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">기사명/연락처</label>
                              <input className="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold" placeholder="ex) 홍길동 010-..." value={resData.driver_name} onChange={e => setResData({...resData, driver_name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">운반비</label>
                              <input className="w-full p-3 bg-slate-50 rounded-xl border-none text-xs font-bold" placeholder="ex) 150,000" value={resData.fee} onChange={e => setResData({...resData, fee: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">진행 상태</label>
                              <select className="w-full p-3 bg-slate-100 rounded-xl border-none text-xs font-black" value={resData.status} onChange={e => setResData({...resData, status: e.target.value})}>
                                <option value="신청완료">신청완료</option>
                                <option value="배차완료">배차완료</option>
                              </select>
                            </div>
                          </div>
                          <button onClick={() => handleResponseSubmit(item.id)} className="w-full mt-6 bg-slate-800 text-white py-4 rounded-2xl font-black hover:bg-black transition-all">배차 정보 저장하기</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* 🔢 페이지네이션 버튼 */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs disabled:opacity-30">PREV</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>{i + 1}</button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs disabled:opacity-30">NEXT</button>
        </div>
      </div>

      {/* 📋 신규/수정 모달 (갱미가 원하던 그 모달 디자인!) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">배차 <span className="text-blue-600">{selectedOrder ? '수정' : '신청'}</span></h2>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors font-black text-xl">✕</button>
            </div>
            
            <div className="space-y-8">
              {/* 상차지 정보 등 갱미의 기존 폼 필드들을 여기에 배치하면 됨! (길어서 일부만 표기) */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">상차지명</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.loading_place} onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">하차지명</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.unloading_place} onChange={e => setFormData({...formData, unloading_place: e.target.value})} />
                </div>
              </div>
              {/* ... (생략된 폼 필드들) ... */}
              <button onClick={handleOrderSubmit} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all mt-4">
                {selectedOrder ? '정보 수정하기' : '배차 신청하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
