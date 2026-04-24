"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 

export default function PalletsPage() {
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false); 
  const [targetId, setTargetId] = useState<number | null>(null); 
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    created_start: "", created_end: "", issue_start: "", issue_end: "", 
    status: "", type: "" 
  });

  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  const [formData, setFormData] = useState({
    type: "출고", company_name: "", issue_date: today, 
    kpp_n11_count: "", kpp_n12_count: "", kpp_number: "", 
    aj_11a_count: "", aj_12a_count: "", aj_name: "", remarks: "" 
  });

  useEffect(() => { 
    fetchData(); 
    if (!document.getElementById('xlsx-script')) {
      const script = document.createElement('script');
      script.id = 'xlsx-script';
      script.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js";
      document.head.appendChild(script);
    }
  }, []);

  // 🔄 데이터 로드
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('pallets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setList(data || []);
      setFilteredList(data || []);
    }
  };

  // ✨ 빌드 에러 방지를 위한 변수 선언 위치 조정 (return 문 직전이 아니라 로직 중간에 배치)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  // 🗑️ 삭제 로직 (이벤트 전파 방지 추가)
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // 💡 행 클릭(수정모달) 방지
    if(!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('pallets').delete().eq('id', id);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("삭제 성공! ✨");
      fetchData();
    }
  };

  // ✨ 상태 업데이트 (이벤트 전파 방지 추가)
  const handleStatusUpdate = async (e: React.MouseEvent, id: number, currentStatus: string) => {
    e.stopPropagation(); // 💡 행 클릭 방지
    const newStatus = currentStatus === '확인완료' ? '미확인' : '확인완료';
    const { error } = await supabase.from('pallets').update({ status: newStatus }).eq('id', id);
    if (!error) fetchData();
  };

  // 🚀 등록 및 수정
  const handleSubmit = async () => {
    if (!formData.company_name) return alert("업체명을 입력해주세요.");
    const payload = {
      ...formData,
      kpp_n11_count: Number(formData.kpp_n11_count) || 0,
      kpp_n12_count: Number(formData.kpp_n12_count) || 0,
      aj_11a_count: Number(formData.aj_11a_count) || 0,
      aj_12a_count: Number(formData.aj_12a_count) || 0,
    };

    if (isEdit && targetId) {
      const { error } = await supabase.from('pallets').update(payload).eq('id', targetId);
      if (!error) { alert("수정 완료! ✨"); closeModal(); fetchData(); }
    } else {
      const { error } = await supabase.from('pallets').insert([{ ...payload, status: '미확인' }]);
      if (!error) { alert("등록 성공! 🚀"); closeModal(); fetchData(); setCurrentPage(1); }
    }
  };

  // --- 나머지 유틸리티 함수들 (변화 없음) ---
  const downloadExcel = async () => {
    try {
      // @ts-ignore
      const XLSX = window.XLSX;
      if (!XLSX) return alert("라이브러리 로딩 중입니다.");
      const { data, error } = await supabase.from('pallets').select('*').gte('issue_date', excelRange.start).lte('issue_date', excelRange.end).order('issue_date', { ascending: true });
      if (error || !data || data.length === 0) return alert("해당 기간에 데이터가 없습니다.");
      const excelData = data.map(item => ({ "상태": item.status, "구분": item.type, "발행일자": item.issue_date, "업체명": item.company_name, "KPP N11": item.kpp_n11_count || 0, "KPP N12": item.kpp_n12_count || 0, "KPP 전표번호": item.kpp_number, "AJ 11A": item.aj_11a_count || 0, "AJ 12A": item.aj_12a_count || 0, "AJ 전표번호": item.aj_name, "비고": item.remarks || "", "작성일시": formatDate(item.created_at) }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "전표내역");
      XLSX.writeFile(workbook, `파렛트전표_${excelRange.start}_${excelRange.end}.xlsx`);
      setShowExcelModal(false);
    } catch (err) { alert("엑셀 오류!"); }
  };

  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    const currentPageIds = currentItems.map(item => item.id);
    const isAllSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));
    if (isAllSelected) setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    else setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
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
  const closeModal = () => {
    setShowModal(false); setIsEdit(false); setTargetId(null);
    setFormData({ type: "출고", company_name: "", issue_date: today, kpp_n11_count: "", kpp_n12_count: "", kpp_number: "", aj_11a_count: "", aj_12a_count: "", aj_name: "", remarks: "" });
  };
  const openEditModal = (item: any) => {
    setIsEdit(true); setTargetId(item.id);
    setFormData({ type: item.type, company_name: item.company_name, issue_date: item.issue_date || today, kpp_n11_count: String(item.kpp_n11_count || ""), kpp_n12_count: String(item.kpp_n12_count || ""), kpp_number: item.kpp_number || "", aj_11a_count: String(item.aj_11a_count || ""), aj_12a_count: String(item.aj_12a_count || ""), aj_name: item.aj_name || "", remarks: item.remarks || "" });
    setShowModal(true);
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">파렛트 <span className="text-blue-600">전표</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase text-blue-600/60 font-black">NY 로지스 천안센터 전표 관리</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all text-sm">📊 엑셀 다운로드</button>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all text-sm">+ 신규 전표 등록</button>
        </div>
      </div>

      {/* 🔍 검색 필터 */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">작성일자</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl border-none text-xs font-bold outline-none" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">발행일</p>
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
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all">검색 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs border border-slate-100">리셋</button>
        </div>
      </div>

      {/* 📋 테이블 섹션 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-[11px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-6 text-center w-12"><input type="checkbox" checked={currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id))} onChange={toggleSelectAll} /></th>
                <th className="p-6 text-left">상태</th>
                <th className="p-6 text-left">작성일자</th>
                <th className="p-6 text-center">구분</th> 
                <th className="p-6 text-left">발행일 / 업체명</th>
                <th className="p-6 text-left font-black">KPP / AJ</th>
                <th className="p-6 text-left text-blue-600 font-black">비고</th>
                <th className="p-6 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-black">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all cursor-pointer" onClick={() => openEditModal(item)}>
                  <td className="p-6 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                  <td className="p-6">
                    <button 
                      onClick={(e) => handleStatusUpdate(e, item.id, item.status)} 
                      className={`px-4 py-1.5 rounded-full text-[10px] whitespace-nowrap ${item.status === '미확인' ? 'bg-orange-50 text-orange-500 animate-pulse' : 'bg-green-50 text-green-500'}`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className="p-6 text-slate-400 text-[10px] whitespace-nowrap">{formatDate(item.created_at)}</td>
                  <td className="p-6 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black whitespace-nowrap ${item.type === '출고' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-6 whitespace-nowrap font-black"><div>{item.issue_date}</div><div className="text-slate-400 text-[10px] tracking-tighter">{item.company_name}</div></td>
                  <td className="p-6 whitespace-nowrap">
                    <div className="text-blue-600">{item.kpp_n11_count}/{item.kpp_n12_count}</div>
                    <div className="text-green-600">{item.aj_11a_count}/{item.aj_12a_count}</div>
                  </td>
                  <td className="p-6 text-slate-400 font-normal max-w-[120px] truncate">{item.remarks || "-"}</td>
                  <td className="p-6 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-4 justify-center text-slate-300">
                        <button onClick={() => openEditModal(item)} className="hover:text-blue-500">수정</button>
                        <button onClick={(e) => handleDelete(e, item.id)} className="hover:text-red-500 text-red-400/60">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔢 페이지네이션 */}
        <div className="flex justify-center items-center gap-2 p-6 bg-slate-50/50">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30">PREV</button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i+1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{i+1}</button>
            ))}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30">NEXT</button>
        </div>
      </div>

      {/* 📥 엑셀 모달 */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60]">
            <div className="bg-white p-8 rounded-[2rem] w-full max-w-xs shadow-2xl font-black">
                <h2 className="text-lg mb-4 uppercase">Excel Download</h2>
                <div className="space-y-4">
                    <input type="date" className="w-full p-3 bg-slate-50 rounded-xl outline-none border-none font-black text-sm" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
                    <input type="date" className="w-full p-3 bg-slate-50 rounded-xl outline-none border-none font-black text-sm" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
                    <button onClick={downloadExcel} className="w-full bg-green-600 text-white p-4 rounded-xl text-xs font-black">엑셀 다운로드 🚀</button>
                    <button onClick={() => setShowExcelModal(false)} className="w-full text-slate-400 text-xs py-2 font-black">취소</button>
                </div>
            </div>
        </div>
      )}

      {/* 🟢 신규/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] font-black">
            <h2 className="text-xl font-black mb-6 text-slate-800 tracking-tighter uppercase">{isEdit ? '전표 수정 💾' : '신규 전표 등록 🚀'}</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
                  {['출고', '입고'].map(t => (
                    <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none text-blue-600 shadow-inner" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
              </div>
              <input placeholder="업체명 (필수)" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none shadow-inner" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-blue-600 w-12 text-center uppercase">N11</span><input type="number" placeholder="0" className="bg-transparent border-none font-bold text-sm outline-none w-full text-right" value={formData.kpp_n11_count} onChange={e => setFormData({...formData, kpp_n11_count: e.target.value})} /></div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-blue-600 w-12 text-center uppercase">N12</span><input type="number" placeholder="0" className="bg-transparent border-none font-bold text-sm outline-none w-full text-right" value={formData.kpp_n12_count} onChange={e => setFormData({...formData, kpp_n12_count: e.target.value})} /></div>
                </div>
                <textarea placeholder="KPP 전표번호 입력" className="col-span-2 p-4 bg-slate-50 rounded-2xl border-none font-bold text-xs outline-none shadow-inner resize-none h-full" value={formData.kpp_number} onChange={e => setFormData({...formData, kpp_number: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-green-600 w-12 text-center uppercase">11A</span><input type="number" placeholder="0" className="bg-transparent border-none font-bold text-sm outline-none w-full text-right" value={formData.aj_11a_count} onChange={e => setFormData({...formData, aj_11a_count: e.target.value})} /></div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-green-600 w-12 text-center uppercase">12A</span><input type="number" placeholder="0" className="bg-transparent border-none font-bold text-sm outline-none w-full text-right" value={formData.aj_12a_count} onChange={e => setFormData({...formData, aj_12a_count: e.target.value})} /></div>
                </div>
                <textarea placeholder="AJ 전표번호 입력" className="col-span-2 p-4 bg-slate-50 rounded-2xl border-none font-bold text-xs outline-none shadow-inner resize-none h-full" value={formData.aj_name} onChange={e => setFormData({...formData, aj_name: e.target.value})} />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">REMARKS (비고)</p>
                <textarea placeholder="특이사항이나 메모를 자유롭게 입력하세요." className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold text-xs outline-none shadow-inner resize-none h-24" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white p-5 rounded-[1.5rem] font-black shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest">{isEdit ? 'Save Changes' : 'Create Record'}</button>
                <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-8 rounded-[1.5rem] font-black uppercase text-xs">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
