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
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  const [filters, setFilters] = useState({
    created_start: "", created_end: "", issue_start: "", issue_end: "", status: "", type: "" 
  });

  const [formData, setFormData] = useState({
    type: "출고", company_name: "", issue_date: today, 
    kpp_n11_count: "", kpp_n12_count: "", kpp_number: "", 
    aj_11a_count: "", aj_12a_count: "", aj_name: "" 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('pallets').select('*').order('created_at', { ascending: false });
    if (!error) {
      setList(data || []);
      setFilteredList(data || []);
    }
  };

  // 📥 엑셀 다운로드 (동적 임포트 방식으로 에러 원천 차단)
  const downloadExcel = async () => {
    try {
      // ✅ 버튼 누를 때만 라이브러리를 불러와서 빌드 에러를 방지함
      const XLSX = await import("xlsx");
      const { saveAs } = await import("file-saver");

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

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "전표내역");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const finalBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      saveAs(finalBlob, `파렛트전표_${excelRange.start}_${excelRange.end}.xlsx`);
      setShowExcelModal(false);
    } catch (err) {
      console.error("에러 상세:", err);
      alert("엑셀 라이브러리를 불러오지 못했어. npm install xlsx file-saver 했는지 확인해줘!");
    }
  };

  const handleSubmit = async () => {
    if (!formData.company_name) return alert("업체명을 입력해줘 갱미야!");
    
    const submitData = {
      ...formData,
      kpp_n11_count: Number(formData.kpp_n11_count) || 0,
      kpp_n12_count: Number(formData.kpp_n12_count) || 0,
      aj_11a_count: Number(formData.aj_11a_count) || 0,
      aj_12a_count: Number(formData.aj_12a_count) || 0,
    };

    if (isEdit && targetId) {
      const { error } = await supabase.from('pallets').update(submitData).eq('id', targetId);
      if (!error) { alert("수정 완료! ✨"); closeModal(); fetchData(); }
    } else {
      const { error } = await supabase.from('pallets').insert([{ ...submitData, status: '미확인' }]);
      if (!error) { alert("전표 등록 성공! 🚀"); closeModal(); fetchData(); setCurrentPage(1); }
    }
  };

  const closeModal = () => {
    setShowModal(false); setIsEdit(false); setTargetId(null);
    setFormData({ type: "출고", company_name: "", issue_date: today, kpp_n11_count: "", kpp_n12_count: "", kpp_number: "", aj_11a_count: "", aj_12a_count: "", aj_name: "" });
  };

  const openEditModal = (item: any) => {
    setIsEdit(true); setTargetId(item.id);
    setFormData({ 
      type: item.type, company_name: item.company_name, issue_date: item.issue_date || today, 
      kpp_n11_count: String(item.kpp_n11_count || ""), kpp_n12_count: String(item.kpp_n12_count || ""), kpp_number: item.kpp_number || "", 
      aj_11a_count: String(item.aj_11a_count || ""), aj_12a_count: String(item.aj_12a_count || ""), aj_name: item.aj_name || "" 
    });
    setShowModal(true);
  };

  const handleStatusUpdate = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === '확인완료' ? '미확인' : '확인완료';
    await supabase.from('pallets').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if(!confirm("진짜 삭제할 거야?")) return;
    const { error } = await supabase.from('pallets').delete().eq('id', id);
    if (!error) fetchData();
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">파렛트 <span className="text-blue-600">전표</span></h1>
            <p className="text-slate-400 font-bold mt-2 text-xs uppercase text-blue-600/60 font-black">파렛트 전표 관리 시스템</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-green-700 text-sm">📊 엑셀 다운로드</button>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-blue-700 text-sm">+ 신규 전표 등록</button>
        </div>
      </div>

      {/* 🔍 검색 필터 */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Created Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Issue Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={filters.issue_start} onChange={e => setFilters({...filters, issue_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none" value={filters.issue_end} onChange={e => setFilters({...filters, issue_end: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50">
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-3.5 bg-slate-100 rounded-2xl text-xs font-black text-slate-600 min-w-[120px]">
            <option value="">상태 전체</option><option value="미확인">미확인</option><option value="확인완료">확인완료</option>
          </select>
          <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} className="p-3.5 bg-slate-100 rounded-2xl text-xs font-black text-slate-600 min-w-[120px]">
            <option value="">구분 전체</option><option value="출고">출고만</option><option value="입고">입고만</option>
          </select>
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg shadow-slate-200">SEARCH FILTER 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs border border-slate-100">RESET</button>
        </div>
      </div>

      {/* 테이블 섹션 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b text-[10px] uppercase tracking-widest">
              <tr>
                <th className="p-6 text-center w-12"><input type="checkbox" onChange={() => {}} /></th>
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
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-6 text-center"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                  <td className="p-6"><button onClick={() => handleStatusUpdate(item.id, item.status)} className={`px-4 py-1.5 rounded-full text-[10px] ${item.status === '미확인' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>{item.status}</button></td>
                  <td className="p-6 text-slate-400 text-[10px] whitespace-nowrap">{formatDate(item.created_at)}</td>
                  <td className="p-6 text-center"><span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black ${item.type === '출고' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>{item.type}</span></td>
                  <td className="p-6 whitespace-nowrap"><p>{item.issue_date}</p><p className="text-slate-500 text-[11px] font-normal">{item.company_name}</p></td>
                  <td className="p-6 text-blue-600 font-bold">{item.kpp_n11_count || 0} / {item.kpp_n12_count || 0}</td>
                  <td className="p-6 text-green-500 font-bold">{item.aj_11a_count || 0} / {item.aj_12a_count || 0}</td>
                  <td className="p-6 text-center text-slate-300">
                    <button onClick={() => openEditModal(item)} className="mr-4 hover:text-blue-500">수정</button>
                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-400">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center items-center gap-2 p-6 bg-slate-50/50">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30">PREV</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-xl text-[10px] font-black ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{i + 1}</button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30">NEXT</button>
        </div>
      </div>

      {/* 📥 엑셀 기간 선택 모달 */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 animate-in zoom-in-95 duration-200 shadow-2xl">
            <h2 className="text-lg font-black mb-2 text-slate-800">Excel Download</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">다운로드할 발행일자 기간을 선택해줘.</p>
            <div className="space-y-4">
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none text-green-600" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none text-green-600" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button onClick={downloadExcel} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black text-xs hover:bg-green-700 transition-all">다운로드</button>
                <button onClick={() => setShowExcelModal(false)} className="bg-slate-100 text-slate-400 px-6 rounded-2xl font-black text-xs">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 신규/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 animate-in zoom-in-95 duration-200 shadow-2xl">
            <h2 className="text-xl font-black mb-6 text-slate-800">{isEdit ? 'EDIT SLIP' : '신규 전표 등록'}</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
                  {['출고', '입고'].map(t => (
                    <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm text-blue-600 outline-none" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
              </div>
              <input placeholder="업체명" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none shadow-inner" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-blue-600 w-12">N11</span><input placeholder="수량" className="bg-transparent font-bold text-sm outline-none w-full" value={formData.kpp_n11_count} onChange={e => setFormData({...formData, kpp_n11_count: e.target.value})} /></div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-blue-600 w-12">N12</span><input placeholder="수량" className="bg-transparent font-bold text-sm outline-none w-full" value={formData.kpp_n12_count} onChange={e => setFormData({...formData, kpp_n12_count: e.target.value})} /></div>
                </div>
                <textarea placeholder="KPP 전표번호" className="col-span-2 p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none shadow-inner resize-none h-full" value={formData.kpp_number} onChange={e => setFormData({...formData, kpp_number: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-green-600 w-12">11A</span><input placeholder="수량" className="bg-transparent font-bold text-sm outline-none w-full" value={formData.aj_11a_count} onChange={e => setFormData({...formData, aj_11a_count: e.target.value})} /></div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 px-4 shadow-inner"><span className="text-[10px] font-black text-green-600 w-12">12A</span><input placeholder="수량" className="bg-transparent font-bold text-sm outline-none w-full" value={formData.aj_12a_count} onChange={e => setFormData({...formData, aj_12a_count: e.target.value})} /></div>
                </div>
                <textarea placeholder="AJ 전표번호" className="col-span-2 p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none shadow-inner resize-none h-full" value={formData.aj_name} onChange={e => setFormData({...formData, aj_name: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSubmit} className="flex-1 bg-[#1a1c2e] text-white p-5 rounded-[1.5rem] font-black hover:bg-black transition-all">{isEdit ? '수정 완료하기' : '새 전표 등록하기'}</button>
                <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-8 rounded-[1.5rem] font-black">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
