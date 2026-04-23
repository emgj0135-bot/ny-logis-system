"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PalletsPage() {
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false); 
  const [targetId, setTargetId] = useState<number | null>(null); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    created_start: "", created_end: "",
    issue_start: "", issue_end: ""
  });

  const [formData, setFormData] = useState({
    type: "출고", company_name: "", issue_date: today, kpp_count: "", kpp_number: "", aj_count: "", aj_name: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('pallets').select('*').order('created_at', { ascending: false });
    if (!error) {
      setList(data || []);
      setFilteredList(data || []);
    }
  };

  // 🔍 날짜 자동 계산 함수
  const setQuickDate = (type: string, filterType: 'created' | 'issue') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case "today": break;
      case "yesterday": 
        start.setDate(now.getDate() - 1); 
        end.setDate(now.getDate() - 1); 
        break;
      case "tomorrow":
        start.setDate(now.getDate() + 1);
        end.setDate(now.getDate() + 1);
        break;
      case "week": start.setDate(now.getDate() - 7); break;
      case "1month": start.setMonth(now.getMonth() - 1); break;
      case "2month": start.setMonth(now.getMonth() - 2); break;
      case "3month": start.setMonth(now.getMonth() - 3); break;
      default: return;
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    if (filterType === 'created') {
      setFilters(prev => ({ ...prev, created_start: startStr, created_end: endStr }));
    } else {
      setFilters(prev => ({ ...prev, issue_start: startStr, issue_end: endStr }));
    }
  };

  const handleSearch = () => {
    let result = [...list];
    if (filters.created_start) result = result.filter(item => item.created_at.split('T')[0] >= filters.created_start);
    if (filters.created_end) result = result.filter(item => item.created_at.split('T')[0] <= filters.created_end);
    if (filters.issue_start) result = result.filter(item => item.issue_date && item.issue_date >= filters.issue_start);
    if (filters.issue_end) result = result.filter(item => item.issue_date && item.issue_date <= filters.issue_end);
    setFilteredList(result);
    setCurrentPage(1);
  };

  // 🔄 리셋 버튼: 날짜 값만 비움 (검색은 유지됨)
  const resetFilters = () => {
    setFilters({ created_start: "", created_end: "", issue_start: "", issue_end: "" });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const handleSubmit = async () => {
    if (!formData.company_name) return alert("업체명을 입력해줘 갱미야!");
    if (isEdit && targetId) {
      const { error } = await supabase.from('pallets').update({ ...formData }).eq('id', targetId);
      if (!error) { alert("수정 완료! ✨"); closeModal(); fetchData(); }
    } else {
      const { error } = await supabase.from('pallets').insert([{ ...formData, status: '미확인' }]);
      if (!error) { alert("전표 등록 성공! 🚀"); closeModal(); fetchData(); setCurrentPage(1); }
    }
  };

  const handleStatusUpdate = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === '확인완료' ? '미확인' : '확인완료';
    await supabase.from('pallets').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const openEditModal = (item: any) => {
    setIsEdit(true); setTargetId(item.id);
    setFormData({ type: item.type, company_name: item.company_name, issue_date: item.issue_date || today, kpp_count: item.kpp_count, kpp_number: item.kpp_number, aj_count: item.aj_count, aj_name: item.aj_name });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setIsEdit(false); setTargetId(null);
    setFormData({ type: "출고", company_name: "", issue_date: today, kpp_count: "", kpp_number: "", aj_count: "", aj_name: "" });
  };

  const handleDelete = async (id: number) => {
    if(!confirm("진짜 삭제할 거야?")) return;
    await supabase.from('pallets').delete().eq('id', id);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">파렛트 <span className="text-blue-600">전표</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">천안센터 <span className="text-blue-600/60 font-black">파렛트 전표 관리 시스템</span></p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm">+ 신규 전표 등록</button>
      </div>

      {/* 🔍 검색 필터 영역 */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          {/* 작성일자 필터 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Created Date (작성일)</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
              <select onChange={(e) => setQuickDate(e.target.value, 'created')} className="p-3 bg-slate-50 rounded-xl border-none text-[10px] font-black outline-none text-blue-600">
                <option value="">간편 선택</option>
                <option value="today">오늘</option>
                <option value="yesterday">어제</option>
                <option value="tomorrow">내일</option>
                <option value="week">최근 한주</option>
                <option value="1month">최근 한달</option>
                <option value="2month">최근 두달</option>
                <option value="3month">최근 세달</option>
              </select>
            </div>
          </div>

          {/* 발행일자 필터 */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Issue Date (발행일)</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.issue_start} onChange={e => setFilters({...filters, issue_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.issue_end} onChange={e => setFilters({...filters, issue_end: e.target.value})} />
              <select onChange={(e) => setQuickDate(e.target.value, 'issue')} className="p-3 bg-slate-50 rounded-xl border-none text-[10px] font-black outline-none text-green-600">
                <option value="">간편 선택</option>
                <option value="today">오늘</option>
                <option value="yesterday">어제</option>
                <option value="tomorrow">내일</option>
                <option value="week">최근 한주</option>
                <option value="1month">최근 한달</option>
                <option value="2month">최근 두달</option>
                <option value="3month">최근 세달</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-50">
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg shadow-slate-200">SEARCH FILTER 🔍</button>
          <button onClick={resetFilters} className="bg-slate-100 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all">RESET DATES</button>
        </div>
      </div>

      {/* 테이블 섹션 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-400 font-bold border-b text-[10px] uppercase tracking-widest">
            <tr>
              <th className="p-6 text-left">상태</th>
              <th className="p-6 text-left">작성일자</th>
              <th className="p-6 text-left">발행일 / 구분</th>
              <th className="p-6 text-left">KPP 정보</th>
              <th className="p-6 text-left">AJ 정보</th>
              <th className="p-6 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-black">
            {currentItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-all">
                <td className="p-6">
                  <button onClick={() => handleStatusUpdate(item.id, item.status)} className={`px-4 py-1.5 rounded-full text-[10px] transition-all font-black ${item.status === '미확인' ? 'bg-orange-50 text-orange-500 border border-orange-100 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-500 border border-green-100'}`}>{item.status}</button>
                </td>
                <td className="p-6"><p className="text-slate-400 text-[10px]">{formatDate(item.created_at)}</p></td>
                <td className="p-6">
                  <p className="text-slate-800 text-sm">{item.issue_date || "날짜미지정"}</p>
                  <p className={`text-[11px] mt-0.5 ${item.type === '출고' ? 'text-red-500' : 'text-blue-500'}`}>{item.company_name}</p>
                </td>
                <td className="p-6">
                  <p className="text-blue-600 text-sm">{item.kpp_count || "0매"}</p>
                  <p className="text-slate-400 text-[10px]">{item.kpp_number || "-"}</p>
                </td>
                <td className="p-6">
                  <p className="text-green-500 text-sm">{item.aj_count || "0매"}</p>
                  <p className="text-slate-400 text-[10px]">{item.aj_name || "-"}</p>
                </td>
                <td className="p-6 text-center">
                   <div className="flex gap-4 justify-center text-slate-300 font-black">
                      <button onClick={() => openEditModal(item)} className="hover:text-blue-500">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="hover:text-red-400">삭제</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 페이지네이션 (생략 - 위와 동일) */}
        <div className="flex justify-center items-center gap-2 p-6 bg-slate-50/50">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all">PREV</button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{i + 1}</button>
            ))}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all">NEXT</button>
        </div>
      </div>

      {/* 모달 섹션 (기존 코드 유지) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black mb-6 text-slate-800">{isEdit ? 'EDIT SLIP' : '신규 전표'}</h2>
            <div className="space-y-4">
              <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
                {['출고', '입고'].map(t => (
                  <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>{t}</button>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 ml-2 uppercase font-black tracking-widest">Issue Date</p>
                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none text-blue-600" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
              </div>
              <input placeholder="업체명" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="KPP 수량" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={formData.kpp_count} onChange={e => setFormData({...formData, kpp_count: e.target.value})} />
                <input placeholder="KPP 번호" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-[10px] outline-none" value={formData.kpp_number} onChange={e => setFormData({...formData, kpp_number: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="AJ 수량" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={formData.aj_count} onChange={e => setFormData({...formData, aj_count: e.target.value})} />
                <input placeholder="AJ 업체/번호" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-[10px] outline-none" value={formData.aj_name} onChange={e => setFormData({...formData, aj_name: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleSubmit} className="flex-1 bg-[#1a1c2e] text-white p-4 rounded-[1.2rem] font-black shadow-lg hover:bg-black transition-all text-sm">{isEdit ? '수정하기' : '등록하기'}</button>
                <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-6 rounded-[1.2rem] font-black text-sm">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
