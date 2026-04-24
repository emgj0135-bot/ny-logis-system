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
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('pallets').select('*').order('created_at', { ascending: false });
    if (!error) {
      setList(data || []);
      setFilteredList(data || []);
    }
  };

  // ✨ 빌드 에러 해결 포인트: currentItems 정의를 테이블 그리기 전에 확실히 선언!
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  
  const toggleSelectAll = () => {
    const currentPageIds = currentItems.map(item => item.id);
    const isAllSelected = currentPageIds.every(id => selectedIds.includes(id));
    if (isAllSelected) setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    else setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if(!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('pallets').delete().eq('id', id);
    if (!error) { alert("삭제 완료!"); fetchData(); }
  };

  const handleStatusUpdate = async (e: React.MouseEvent, id: number, currentStatus: string) => {
    e.stopPropagation();
    const newStatus = currentStatus === '확인완료' ? '미확인' : '확인완료';
    await supabase.from('pallets').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

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
      if (!error) { alert("등록 성공! 🚀"); closeModal(); fetchData(); }
    }
  };

  const handleSearch = () => {
    let result = [...list];
    if (filters.created_start) result = result.filter(item => item.created_at.split('T')[0] >= filters.created_start);
    if (filters.created_end) result = result.filter(item => item.created_at.split('T')[0] <= filters.created_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);
    if (filters.type) result = result.filter(item => item.type === filters.type);
    setFilteredList(result);
    setCurrentPage(1);
  };

  const closeModal = () => {
    setShowModal(false); setIsEdit(false); setTargetId(null);
    setFormData({ type: "출고", company_name: "", issue_date: today, kpp_n11_count: "", kpp_n12_count: "", kpp_number: "", aj_11a_count: "", aj_12a_count: "", aj_name: "", remarks: "" });
  };

  const openEditModal = (item: any) => {
    setIsEdit(true); setTargetId(item.id);
    setFormData({ 
      type: item.type, company_name: item.company_name, issue_date: item.issue_date || today, 
      kpp_n11_count: String(item.kpp_n11_count || ""), kpp_n12_count: String(item.kpp_n12_count || ""), kpp_number: item.kpp_number || "", 
      aj_11a_count: String(item.aj_11a_count || ""), aj_12a_count: String(item.aj_12a_count || ""), aj_name: item.aj_name || "",
      remarks: item.remarks || ""
    });
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans font-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-slate-900 uppercase">파렛트 <span className="text-blue-600">전표</span></h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black">+ 신규 전표 등록</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-[11px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-6 text-center w-12">
                  <input type="checkbox" checked={currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id))} onChange={toggleSelectAll} />
                </th>
                <th className="p-6 text-left">상태</th>
                <th className="p-6 text-left">작성일자</th>
                <th className="p-6 text-center">구분</th> 
                <th className="p-6 text-left">발행일 / 업체명</th>
                <th className="p-6 text-left text-blue-600">비고</th>
                <th className="p-6 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-black">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all cursor-pointer" onClick={() => openEditModal(item)}>
                  <td className="p-6 text-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  <td className="p-6">
                    <button onClick={(e) => handleStatusUpdate(e, item.id, item.status)} className={`px-4 py-1.5 rounded-full text-[10px] ${item.status === '미확인' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>{item.status}</button>
                  </td>
                  <td className="p-6 text-slate-400 text-[10px]">{formatDate(item.created_at)}</td>
                  <td className="p-6 text-center"><span className={`px-3 py-1 rounded-lg text-[10px] ${item.type === '출고' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{item.type}</span></td>
                  <td className="p-6 font-black"><div>{item.issue_date}</div><div className="text-slate-400 text-[10px]">{item.company_name}</div></td>
                  <td className="p-6 text-slate-400 font-normal max-w-[120px] truncate">{item.remarks || "-"}</td>
                  <td className="p-6 text-center">
                    <div className="flex gap-3 justify-center text-slate-300">
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="hover:text-blue-500">수정</button>
                      <button onClick={(e) => handleDelete(e, item.id)} className="hover:text-red-500">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center gap-2 p-6 bg-slate-50/50">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded-xl text-[10px] font-black ${currentPage === i+1 ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border'}`}>{i+1}</button>
          ))}
        </div>
      </div>

      {/* 모달 (기존 디자인 유지) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 font-black shadow-2xl">
            <h2 className="text-xl mb-6">{isEdit ? '전표 수정 💾' : '신규 전표 등록 🚀'}</h2>
            <div className="space-y-6">
              <input placeholder="업체명 (필수)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              <textarea placeholder="비고 입력" className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-24" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white p-5 rounded-[1.5rem]">{isEdit ? 'Save Changes' : 'Create Record'}</button>
                <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-8 rounded-[1.5rem]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
