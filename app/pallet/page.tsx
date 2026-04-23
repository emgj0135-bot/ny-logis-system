"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ 전역 변수로 선언해서 라이브러리 충돌을 방지해
let XLSX_MODULE: any = null;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PalletsPage() {
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false); 
  const [targetId, setTargetId] = useState<number | null>(null); 
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  // ✨ 엑셀 관련 추가 상태
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  const [filters, setFilters] = useState({
    created_start: "", created_end: "", issue_start: "", issue_end: "", 
    status: "",
    type: "" 
  });

  const [formData, setFormData] = useState({
    type: "출고", 
    company_name: "", 
    issue_date: today, 
    kpp_n11_count: "", 
    kpp_n12_count: "", 
    kpp_number: "", 
    aj_11a_count: "", 
    aj_12a_count: "", 
    aj_name: "" 
  });

  useEffect(() => { 
    fetchData(); 
    // 페이지 로드 시 라이브러리를 미리 준비하지만, 실패해도 전체가 멈추지 않게 함
    import("xlsx").then(mod => { XLSX_MODULE = mod; }).catch(e => console.log("엑셀 대기 중.."));
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('pallets').select('*').order('created_at', { ascending: false });
    if (!error) {
      setList(data || []);
      setFilteredList(data || []);
    }
  };

  // 📥 엑셀 다운로드 실행 함수 (기존 기능에 영향 주지 않음)
  const downloadExcel = async () => {
    try {
      if (!XLSX_MODULE) {
        XLSX_MODULE = await import("xlsx");
      }

      const { data, error } = await supabase
        .from('pallets')
        .select('*')
        .gte('issue_date', excelRange.start)
        .lte('issue_date', excelRange.end)
        .order('issue_date', { ascending: true });

      if (error || !data || data.length === 0) {
        return alert("해당 기간에 데이터가 없어, 갱미야!");
      }

      const excelData = data.map(item => ({
        "상태": item.status,
        "구분": item.type,
        "발행일자": item.issue_date,
        "업체명": item.company_name,
        "KPP N11": item.kpp_n11_count || 0,
        "KPP N12": item.kpp_n12_count || 0,
        "KPP 전표번호": item.kpp_number,
        "AJ 11A": item.aj_11a_count || 0,
        "AJ 12A": item.aj_12a_count || 0,
        "AJ 전표번호": item.aj_name,
        "작성일시": formatDate(item.created_at)
      }));

      const worksheet = XLSX_MODULE.utils.json_to_sheet(excelData);
      const workbook = XLSX_MODULE.utils.book_new();
      XLSX_MODULE.utils.book_append_sheet(workbook, worksheet, "전표내역");
      XLSX_MODULE.writeFile(workbook, `파렛트전표_${excelRange.start}_${excelRange.end}.xlsx`);
      
      setShowExcelModal(false);
    } catch (err) {
      alert("엑셀 기능을 불러오지 못했어. npm install xlsx 했는지 확인해줘!");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const currentPageIds = currentItems.map(item => item.id);
    const isAllSelected = currentPageIds.every(id => selectedIds.includes(id));
    if (isAllSelected) setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    else setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
  };

  const handleBulkStatusUpdate = async (newStatus: '확인완료' | '미확인') => {
    if (selectedIds.length === 0) return alert("선택된 항목이 없어, 갱미야!");
    if (!confirm(`${selectedIds.length}개의 항목을 [${newStatus}] 상태로 변경할까?`)) return;
    const { error } = await supabase.from('pallets').update({ status: newStatus }).in('id', selectedIds);
    if (!error) { alert("일괄 변경 성공! ✨"); setSelectedIds([]); fetchData(); }
  };

  const handleSearch = () => {
    let result = [...list];
    if (filters.created_start) result = result.filter(item => item.created_at.split('T')[0] >= filters.created_start);
    if (filters.created_end) result = result.filter(item => item.created_at.split('T')[0] <= filters.created_end);
    if (filters.issue_start) result = result.filter(item => item.issue_date && item.issue_date >= filters.issue_start);
    if (filters.issue_end) result = result.filter(item => item.issue_date && item.issue_date <= filters.issue_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);
    if (filters.type) result = result.filter(item => item.type === filters.type);

    setFilteredList(result);
    setCurrentPage(1);
    setSelectedIds([]); 
  };

  const resetFilters = () => setFilters({ created_start: "", created_end: "", issue_start: "", issue_end: "", status: "", type: "" });

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

  const closeModal = () => {
    setShowModal(false); setIsEdit(false); setTargetId(null);
    setFormData({ type: "출고", company_name: "", issue_date: today, kpp_n11_count: "", kpp_n12_count: "", kpp_number: "", aj_11a_count: "", aj_12a_count: "", aj_name: "" });
  };

  const openEditModal = (item: any) => {
    setIsEdit(true); setTargetId(item.id);
    setFormData({ 
      type: item.type, company_name: item.company_name, issue_date: item.issue_date || today, 
      kpp_n11_count: item.kpp_n11_count || "", kpp_n12_count: item.kpp_n12_count || "", kpp_number: item.kpp_number || "", 
      aj_11a_count: item.aj_11a_count || "", aj_12a_count: item.aj_12a_count || "", aj_name: item.aj_name || "" 
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if(!confirm("진짜 삭제할 거야?")) return;
    const { error } = await supabase.from('pallets').delete().eq('id', id);
    if (!error) fetchData();
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
        <div className="flex gap-2">
          {/* ✨ 엑셀 버튼 추가 */}
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all text-sm">📊 엑셀 다운로드</button>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm">+ 신규 전표 등록</button>
        </div>
      </div>

      {/* 🔍 검색 필터 (생략 - 기존 코드 그대로) */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Created Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Issue Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.issue_start} onChange={e => setFilters({...filters, issue_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.issue_end} onChange={e => setFilters({...filters, issue_end: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50">
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[120px]">
            <option value="">상태 전체</option><option value="미확인">미확인</option><option value="확인완료">확인완료</option>
          </select>
          <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[120px]">
            <option value="">구분 전체</option><option value="출고">출고만 보기</option><option value="입고">입고만 보기</option>
          </select>
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all">SEARCH FILTER 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all border border-slate-100">RESET</button>
        </div>
      </div>

      {/* 테이블 섹션 (기존 코드 그대로) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-xs">
        {selectedIds.length > 0 && (
          <div className="bg-blue-600 px-8 py-4 flex justify-between items-center">
            <p className="text-white font-black text-sm">{selectedIds.length}개 선택됨</p>
            <div className="flex gap-2">
              <button onClick={() => handleBulkStatusUpdate('확인완료')} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[10px]">확인완료 처리</button>
              <button onClick={() => handleBulkStatusUpdate('미확인')} className="bg-blue-400 text-white px-4 py-2 rounded-xl font-black text-[10px]">미확인 처리</button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b text-[10px] uppercase tracking-widest">
              <tr>
                <th className="p-6 text-center w-12"><input type="checkbox" checked={currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id))} onChange={toggleSelectAll} /></th>
                <th className="p-6 text-left whitespace-nowrap">상태</th>
                <th className="p-6 text-left whitespace-nowrap">작성일자</th>
                <th className="p-6 text-center whitespace-nowrap">구분</th> 
                <th className="p-6 text-left whitespace-nowrap">발행일 / 업체명</th>
                <th className="p-6 text-left whitespace-nowrap">KPP (N11 / N12)</th>
                <th className="p-6 text-left whitespace-nowrap">AJ (11A / 12A)</th>
                <th className="p-6 text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-black">
              {currentItems.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50 transition-all ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-6 text-center"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                  <td className="p-6"><button onClick={() => handleStatusUpdate(item.id, item.status)} className={`px-4 py-1.5 rounded-full text-[10px] whitespace-nowrap ${item.status === '미확인' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>{item.status}</button></td>
                  <td className="p-6 text-slate-400 text-[10px] whitespace-nowrap">{formatDate(item.created_at)}</td>
                  <td className="p-6 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black whitespace-nowrap ${item.type === '출고' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-6 whitespace-nowrap"><p>{item.issue_date}</p><p className="text-slate-500 text-[11px]">{item.company_name}</p></td>
                  <td className="p-6 text-blue-600 font-bold whitespace-nowrap">{item.kpp_n11_count || 0} / {item.kpp_n12_count || 0}<p className="text-slate-400 text-[10px] font-normal">{item.kpp_number || "-"}</p></td>
                  <td className="p-6 text-green-500 font-bold whitespace-nowrap">{item.aj_11a_count || 0} / {item.aj_12a_count || 0}<p className="text-slate-400 text-[10px] font-normal">{item.aj_name || "-"}</p></td>
                  <td className="p-6 text-center">
                    <div className="flex gap-4 justify-center text-slate-300">
                        <button onClick={() => openEditModal(item)} className="hover:text-blue-500">수정</button>
                        <button onClick={() => handleDelete(item.id)} className="hover:text-red-400">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {/* 📥 엑셀 기간 선택 모달 (새로 추가됨) */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black mb-2 text-slate-800">Excel Download</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">다운로드할 발행일자 기간을 선택해줘.</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black ml-1">START DATE</p>
                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none text-green-600" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black ml-1">END DATE</p>
                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none text-green-600" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={downloadExcel} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all text-xs">엑셀 생성 및 저장</button>
                <button onClick={() => setShowExcelModal(false)} className="bg-slate-100 text-slate-400 px-6 rounded-2xl font-black text-xs">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모달 (신규/수정) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black mb-6 text-slate-800">{isEdit ? 'EDIT SLIP' : '신규 전표'}</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
                  {['출고', '입고'].map(t => (
                    <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none text-blue-600" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
              </div>
              <input placeholder="업체명" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-blue-600 w-12">N11</span><input placeholder="수량" className="bg-transparent border-none font-bold text-sm outline-none w-full" value={formData.kpp_n11_count} onChange={e => setFormData({...formData, kpp_n11_count: e.target.value})} /></div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-blue-600 w-12">N12</span><input placeholder="수량" className="bg-transparent border-none font-bold text-sm outline-none w-full" value={formData.kpp_n12_count} onChange={e => setFormData({...formData, kpp_n12_count: e.target.value})} /></div>
                </div>
                <textarea placeholder="KPP 전표번호" className="col-span-2 p-4 bg-slate-50 rounded-2xl border-none font-bold text-xs outline-none shadow-inner resize-none h-full" value={formData.kpp_number} onChange={e => setFormData({...formData, kpp_number: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-green-600 w-12">11A</span><input placeholder="수량" className="bg-transparent border-none font-bold text-sm outline-none w-full" value={formData.aj_11a_count} onChange={e => setFormData({...formData, aj_11a_count: e.target.value})} /></div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-green-600 w-12">12A</span><input placeholder="수량" className="bg-transparent border-none font-bold text-sm outline-none w-full" value={formData.aj_12a_count} onChange={e => setFormData({...formData, aj_12a_count: e.target.value})} /></div>
                </div>
                <textarea placeholder="AJ 전표번호" className="col-span-2 p-4 bg-slate-50 rounded-2xl border-none font-bold text-xs outline-none shadow-inner resize-none h-full" value={formData.aj_name} onChange={e => setFormData({...formData, aj_name: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSubmit} className="flex-1 bg-[#1a1c2e] text-white p-5 rounded-[1.5rem] font-black shadow-lg hover:bg-black transition-all">{isEdit ? '전표 수정하기' : '전표 등록하기'}</button>
                <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-8 rounded-[1.5rem] font-black">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
