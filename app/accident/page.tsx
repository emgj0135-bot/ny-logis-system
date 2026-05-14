"use client";
import React, { useEffect, useState } from 'react';
// ✅ 1. createClient 가져오기
import { createClient } from '../../lib/supabase';

export default function AccidentPage() {
  // ✅ 2. 컴포넌트 시작하자마자 supabase 머신 딱 한 번만 돌리기! (경고 제거)
  const [supabase] = useState(() => createClient());

  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  const [filters, setFilters] = useState({
    created_start: "", created_end: "",
    out_start: "", out_end: "",
    status: "",
    search: ""
  });

  const [formData, setFormData] = useState({
    out_date: today, invoice_no: '', receiver_name: '', reason: '분실',
    cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: ''
  });

  useEffect(() => { 
    fetchAccidents(); 
    // 👇 엑셀 라이브러리 엔진 켜기!
    if (!document.getElementById('xlsx-script')) {
      const script = document.createElement('script');
      script.id = 'xlsx-script';
      script.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js";
      document.head.appendChild(script);
    }
  }, []);

  const fetchAccidents = async () => {
    const { data } = await supabase.from('accidents').select('*').order('created_at', { ascending: false });
    setList(data || []);
    setFilteredList(data || []);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); 
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('accidents').delete().eq('id', id);
    if (!error) {
      alert("삭제되었습니다. ✨");
      await fetchAccidents();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase.from('accidents').update(formData).eq('id', editingItem.id);
        if (error) throw error;
        alert("수정 완료! 💾");
      } else {
        const { error } = await supabase.from('accidents').insert([formData]);
        if (error) throw error;
        alert("접수 완료! 🚀");
      }
      closeModal();
      await fetchAccidents();
    } catch (err: any) {
      alert("저장 실패: " + err.message);
    }
  };

  const handleSearch = () => {
    let result = [...list];
    if (filters.created_start) result = result.filter(item => item.created_at.split('T')[0] >= filters.created_start);
    if (filters.created_end) result = result.filter(item => item.created_at.split('T')[0] <= filters.created_end);
    if (filters.out_start) result = result.filter(item => item.out_date >= filters.out_start);
    if (filters.out_end) result = result.filter(item => item.out_date <= filters.out_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);
    if (filters.search) {
      result = result.filter(item => 
        item.invoice_no.includes(filters.search) || item.receiver_name.includes(filters.search)
      );
    }
    setFilteredList(result);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ created_start: "", created_end: "", out_start: "", out_end: "", status: "", search: "" });
    setFilteredList(list);
    setCurrentPage(1);
  };

  const openModal = (item: any = null) => {
    if (item) { setEditingItem(item); setFormData({ ...item }); }
    else { setEditingItem(null); setFormData({ out_date: today, invoice_no: '', receiver_name: '', reason: '분실', cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: '' }); }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

  // 🚀 사고접수 전용 엑셀 다운로드 함수 추가!
  const downloadExcel = async () => {
    try {
      const XLSX = (window as any).XLSX;
      if (!XLSX) return alert("라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      
      const { data, error } = await supabase
        .from('accidents')
        .select('*')
        .gte('created_at', `${excelRange.start}T00:00:00`)
        .lte('created_at', `${excelRange.end}T23:59:59`)
        .order('created_at', { ascending: true });
        
      if (error || !data || data.length === 0) return alert("해당 기간에 데이터가 없습니다.");
      
      const excelData = data.map((item, index) => ({
        "No": index + 1,
        "작성일자": item.created_at.split('T')[0],
        "출고일자": item.out_date,
        "송장번호": item.invoice_no,
        "수령인": item.receiver_name,
        "사고유형": item.reason,
        "상태": item.status,
        "변상금액": item.confirmed_amount,
        "CJ답변": item.cj_answer || ""
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "사고접수내역");
      XLSX.writeFile(workbook, `사고접수_${excelRange.start}_${excelRange.end}.xlsx`);
      setShowExcelModal(false);
    } catch (err) { alert("엑셀 생성 오류!"); }
  };

  // --- 페이지네이션 로직 ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-red-600 rounded-full shadow-lg"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">사고 <span className="text-red-600">접수</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase italic">천안센터 실시간 클레임 관리</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all text-sm font-black">📊 엑셀 다운로드</button>
          <button onClick={() => openModal()} className="bg-red-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-red-100 hover:scale-105 transition-all text-sm font-black">+ 신규 사고 접수</button>
        </div>
      </div>

      {/* 🔍 검색 필터 */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10 font-black">
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest italic font-black">Created Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs shadow-inner font-black" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs shadow-inner font-black" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest italic font-black">Outbound Date</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs shadow-inner font-black" value={filters.out_start} onChange={e => setFilters({...filters, out_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs shadow-inner font-black" value={filters.out_end} onChange={e => setFilters({...filters, out_end: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50 font-black">
          <select className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs text-slate-600 min-w-[150px] outline-none font-black" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">상태 전체</option>
            <option value="접수완료">접수완료</option>
            <option value="보상승인">보상승인</option>
          </select>
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl text-xs hover:bg-black transition-all font-black uppercase">검색 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl text-xs border border-slate-100 font-black">리셋</button>
        </div>
      </div>

      {/* 📋 메인 테이블 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-black font-black">
        <table className="w-full text-sm font-black">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest text-center">
            <tr>
              <th className="p-5 w-16">No</th>
              <th className="p-5 w-32 italic font-black">Created</th>
              <th className="p-5 text-left font-black">사고 내용 (송장 / 수령인)</th>
              <th className="p-5 w-32 italic font-black">Outbound</th>
              <th className="p-5 w-40 font-black">변상 금액</th>
              <th className="p-5 w-24 font-black">상태</th>
              <th className="p-5 w-32 font-black">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => {
              const displayNo = filteredList.length - (indexOfFirstItem + index);
              return (
                <tr key={item.id} onClick={() => openModal(item)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors text-center font-black">
                  <td className="p-5 text-red-600">{displayNo}</td>
                  <td className="p-5 text-slate-400 text-xs font-black">{item.created_at.split('T')[0]}</td>
                  <td className="p-5 text-left font-black">
                    <p className="text-slate-800 text-base tracking-tight font-black">{item.invoice_no} <span className="text-slate-200 mx-2 font-normal">|</span> {item.receiver_name}</p>
                    <p className="text-[11px] text-red-400 mt-1 uppercase font-black">🚨 {item.reason}</p>
                  </td>
                  <td className="p-5 text-slate-800 font-black">{item.out_date}</td>
                  <td className="p-5 text-red-600 text-lg font-black whitespace-nowrap">
                    {item.confirmed_amount.toLocaleString()}원
                  </td>
                  <td className="p-5">
                    <span className={`text-[10px] px-4 py-1.5 rounded-full font-black inline-block whitespace-nowrap ${item.status === '보상승인' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-center text-[10px] text-slate-300 font-black">
                      <button onClick={() => openModal(item)} className="hover:text-blue-600 font-black">수정</button>
                      <button onClick={(e) => handleDelete(e, item.id)} className="hover:text-red-500 font-black">삭제</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 🔢 페이지네이션 */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50 font-black">
          <button onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(prev - 1, 1)); }} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-black hover:bg-slate-100 disabled:opacity-30">PREV</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} onClick={(e) => { e.stopPropagation(); setCurrentPage(i+1); }} className={`w-10 h-10 rounded-xl text-xs transition-all font-black ${currentPage === i+1 ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>{i+1}</button>
            ))}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(prev + 1, totalPages)); }} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-black hover:bg-slate-100 disabled:opacity-30">NEXT</button>
        </div>
      </div>

      {/* 📥 엑셀 모달 */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-[60] overflow-hidden">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 text-black font-black">
            <h2 className="text-lg font-black mb-2 text-slate-800 tracking-tight uppercase">Excel Download</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">다운로드할 작성일자 기간을 선택하세요.</p>
            <div className="space-y-4 font-black">
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-blue-600 shadow-inner" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-blue-600 shadow-inner" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              <div className="flex gap-3 pt-4">
                {/* 👇 여길 진짜 다운로드 함수로 바꿨어! */}
                <button onClick={downloadExcel} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black text-xs hover:bg-green-700 shadow-lg shadow-green-50">엑셀 생성 및 저장</button>
                <button onClick={() => setShowExcelModal(false)} className="bg-slate-100 text-slate-400 px-6 rounded-2xl font-black text-xs">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50 overflow-hidden">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 relative text-black flex flex-col font-black">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-10 pb-5 z-20 flex justify-between items-center border-b border-slate-50 font-black">
              <h2 className="text-3xl font-black mb-0 uppercase text-slate-900 tracking-tighter leading-none">사고 <span className="text-red-600">데이터 기록</span></h2>
              <button onClick={closeModal} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all text-xl font-black">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 pt-5">
              <form onSubmit={handleSubmit} className="space-y-6 font-black">
                <div className="bg-slate-50 p-6 rounded-[2.5rem] shadow-inner space-y-4 font-black">
                  <div className="grid grid-cols-2 gap-4 font-black">
                    <input required type="date" value={formData.out_date} className="w-full p-5 bg-white rounded-2xl text-sm shadow-sm outline-none font-black text-black" onChange={e => setFormData({...formData, out_date: e.target.value})} />
                    <input required type="text" placeholder="송장번호" value={formData.invoice_no} className="w-full p-5 bg-white rounded-2xl text-sm shadow-sm outline-none font-black text-black" onChange={e => setFormData({...formData, invoice_no: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 font-black">
                  <input required type="text" placeholder="수령인" value={formData.receiver_name} className="w-full p-5 bg-slate-50 rounded-2xl text-sm shadow-inner outline-none font-black text-black" onChange={e => setFormData({...formData, receiver_name: e.target.value})} />
                  <select value={formData.reason} className="w-full p-5 bg-slate-50 rounded-2xl text-sm shadow-inner outline-none text-red-600 font-black" onChange={e => setFormData({...formData, reason: e.target.value})}>
                    <option value="분실">🚨 분실</option>
                    <option value="파손">📦 파손</option>
                    <option value="지연">⏰ 지연</option>
                  </select>
                </div>
                <textarea placeholder="CJ 답변 기록" value={formData.cj_answer} className="w-full p-5 bg-slate-50 rounded-2xl text-sm shadow-inner h-32 outline-none font-black text-black" onChange={e => setFormData({...formData, cj_answer: e.target.value})} />
                <div className="grid grid-cols-2 gap-4 items-end font-black">
                  <select value={formData.status} className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl text-sm outline-none font-black text-black" onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="접수완료">접수완료</option>
                    <option value="보상승인">보상승인</option>
                  </select>
                  <input type="number" value={formData.confirmed_amount} className="w-full p-5 bg-white border-2 border-red-100 rounded-2xl text-sm outline-none text-right text-red-600 font-black" onChange={e => setFormData({...formData, confirmed_amount: parseInt(e.target.value) || 0})} />
                </div>
                <button type="submit" className="w-full mt-10 p-6 bg-red-600 text-white rounded-[2.5rem] text-xl font-black shadow-xl hover:bg-red-700 transition-all uppercase tracking-widest font-black">
                  {editingItem ? '수정완료 💾' : '등록완료 🚀'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
