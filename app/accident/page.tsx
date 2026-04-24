"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AccidentPage() {
  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  // ✨ 검색 필터 (작성일자 created_start/end 추가)
  const [filters, setFilters] = useState({
    created_start: "", created_end: "", // ✨ 작성일자 필터
    out_start: "", out_end: "",         // ✨ 출고일자 필터
    status: "",
    search: ""
  });

  const [formData, setFormData] = useState({
    out_date: today, invoice_no: '', receiver_name: '', reason: '분실',
    cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: ''
  });

  useEffect(() => { 
    fetchAccidents(); 
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

  // ✨ 검색 필터 로직
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

  const downloadExcel = async () => {
    try {
      // @ts-ignore
      const XLSX = window.XLSX;
      if (!XLSX) return alert("라이브러리 로딩 중...");
      const { data } = await supabase.from('accidents').select('*').gte('out_date', excelRange.start).lte('out_date', excelRange.end).order('out_date', { ascending: true });
      if (!data || data.length === 0) return alert("데이터가 없습니다.");
      const excelData = data.map((item, index) => ({
        "No": index + 1,
        "작성일자": item.created_at.split('T')[0],
        "출고일자": item.out_date,
        "송장번호": item.invoice_no,
        "수령인": item.receiver_name,
        "사고구분": item.reason,
        "상태": item.status,
        "금액": item.confirmed_amount
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "사고내역");
      XLSX.writeFile(workbook, `사고접수_${excelRange.start}_${excelRange.end}.xlsx`);
      setShowExcelModal(false);
    } catch (err) { alert("엑셀 오류!"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await (editingItem 
      ? supabase.from('accidents').update(formData).eq('id', editingItem.id)
      : supabase.from('accidents').insert([formData]));
    if (error) alert("저장 실패");
    else { closeModal(); fetchAccidents(); }
  };

  const openModal = (item: any = null) => {
    if (item) { setEditingItem(item); setFormData({ ...item }); }
    else { setEditingItem(null); setFormData({ out_date: today, invoice_no: '', receiver_name: '', reason: '분실', cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: '' }); }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-red-600 rounded-full shadow-lg shadow-red-100"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">사고 <span className="text-red-600">접수</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase italic">천안센터 실시간 클레임 관리</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all text-sm">📊 엑셀 다운로드</button>
          <button onClick={() => openModal()} className="bg-red-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-red-100 hover:scale-105 transition-all text-sm">+ 신규 사고 접수</button>
        </div>
      </div>

      {/* 🔍 검색 필터 (작성일자 & 출고일자 분리) */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10 font-black">
          {/* ✨ 작성일자 필터 */}
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest italic">Created Date (작성일)</p>
            <div className="flex items-center gap-3 font-bold">
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs shadow-inner" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs shadow-inner" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          {/* ✨ 출고일자 필터 */}
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest italic">Outbound Date (출고일)</p>
            <div className="flex items-center gap-3 font-bold">
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs shadow-inner" value={filters.out_start} onChange={e => setFilters({...filters, out_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs shadow-inner" value={filters.out_end} onChange={e => setFilters({...filters, out_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 uppercase ml-2 tracking-widest italic">Search Text</p>
            <input type="text" placeholder="송장번호 또는 수령인" className="p-3 bg-slate-50 rounded-xl outline-none text-xs w-64 font-black shadow-inner" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50 font-black">
          <select className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs text-slate-600 min-w-[150px] outline-none font-black" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">상태 전체</option>
            <option value="접수완료">접수완료</option>
            <option value="보상승인">보상승인</option>
          </select>
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl text-xs hover:bg-black transition-all uppercase">Apply Filter 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl text-xs border border-slate-100">Reset</button>
        </div>
      </div>

      {/* 📋 메인 테이블 (컬럼 재배치) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-black font-black">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest text-center">
            <tr>
              <th className="p-5 w-16">No</th>
              <th className="p-5 w-32 italic">Created (작성)</th> {/* ✨ 작성일자 위치 */}
              <th className="p-5 text-left">사고 내용 (송장 / 수령인)</th>
              <th className="p-5 w-32 italic">Outbound (출고)</th> {/* ✨ 출고일자 위치 */}
              <th className="p-5 w-32">변상 금액</th>
              <th className="p-5 w-24">상태</th>
              <th className="p-5 w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => {
              const displayNo = filteredList.length - (indexOfFirstItem + index);
              return (
                <tr key={item.id} onClick={() => openModal(item)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors text-center font-black">
                  <td className="p-5 text-red-600">{displayNo}</td>
                  <td className="p-5 text-slate-400 text-xs">{item.created_at.split('T')[0]}</td> {/* ✨ 작성일자 */}
                  <td className="p-5 text-left">
                    <p className="text-slate-800 text-base tracking-tight font-black">{item.invoice_no} <span className="text-slate-200 mx-2 font-normal">|</span> {item.receiver_name}</p>
                    <p className="text-[11px] text-red-400 mt-1 uppercase font-black">🚨 {item.reason}</p>
                  </td>
                  <td className="p-5 text-slate-800 font-black">{item.out_date}</td> {/* ✨ 출고일자 */}
                  <td className="p-5 text-red-600 text-lg font-black">{item.confirmed_amount.toLocaleString()}원</td>
                  <td className="p-5">
                    <span className={`text-[10px] px-4 py-1.5 rounded-full font-black ${item.status === '보상승인' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex gap-2 justify-center text-[10px] text-slate-300">
                      <button className="hover:text-blue-600">EDIT</button>
                      <button className="hover:text-red-500">DEL</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* 페이지네이션 생략 (기존과 동일) */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50">
          <button onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(prev - 1, 1)); }} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs">PREV</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} onClick={(e) => { e.stopPropagation(); setCurrentPage(i+1); }} className={`w-10 h-10 rounded-xl text-xs transition-all ${currentPage === i+1 ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>{i+1}</button>
            ))}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(prev + 1, totalPages)); }} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs">NEXT</button>
        </div>
      </div>

      {/* 📥 엑셀 모달 (기존 동일) */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black mb-2 text-slate-800 tracking-tight uppercase">Excel Download</h2>
            <p className="text-slate-400 text-[10px] font-bold mb-6 italic text-red-500">출고일자(Outbound) 기준으로 추출됩니다.</p>
            <div className="space-y-4">
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-red-600 shadow-inner font-black" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-red-600 shadow-inner font-black" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button onClick={downloadExcel} className="flex-1 bg-green-600 text-white p-4 rounded-2xl text-xs hover:bg-green-700 shadow-lg font-black">저장 🚀</button>
                <button onClick={() => setShowExcelModal(false)} className="bg-slate-100 text-slate-400 px-6 rounded-2xl text-xs font-black">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 사고 접수 모달 (레전드 디자인 유지) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50 overflow-hidden font-black">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-300 relative text-black font-black">
            <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 text-2xl font-black font-black">✕</button>
            <h2 className="text-3xl font-black mb-8 uppercase text-slate-900 tracking-tighter">사고 <span className="text-red-600">데이터 기록</span></h2>
            <form onSubmit={handleSubmit} className="space-y-6 font-black text-black">
              <div className="bg-slate-50 p-6 rounded-[2.5rem] shadow-inner space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 ml-4 uppercase">Outbound Date</p>
                    <input required type="date" value={formData.out_date} className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm outline-none font-black text-black" onChange={e => setFormData({...formData, out_date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 ml-4 uppercase">Invoice No</p>
                    <input required type="text" placeholder="송장번호" value={formData.invoice_no} className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm outline-none font-black text-black" onChange={e => setFormData({...formData, invoice_no: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Receiver</p>
                  <input required type="text" placeholder="수령인" value={formData.receiver_name} className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner outline-none font-black text-black" onChange={e => setFormData({...formData, receiver_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Reason</p>
                  <select value={formData.reason} className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner outline-none text-red-600 font-black" onChange={e => setFormData({...formData, reason: e.target.value})}>
                    <option value="분실">🚨 분실</option>
                    <option value="파손">📦 파손</option>
                    <option value="지연">⏰ 지연</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 ml-4 uppercase font-black">CJ KakaoTalk Answer</p>
                <textarea placeholder="단톡방 답변 기록" value={formData.cj_answer} className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner h-32 outline-none font-black text-black" onChange={e => setFormData({...formData, cj_answer: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Status</p>
                  <select value={formData.status} className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl text-sm outline-none font-black text-black" onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="접수완료">접수완료</option>
                    <option value="보상승인">보상승인</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Amount</p>
                  <input type="number" placeholder="0" value={formData.confirmed_amount} className="w-full p-5 bg-white border-2 border-red-100 rounded-2xl text-sm outline-none text-right text-red-600 font-black" onChange={e => setFormData({...formData, confirmed_amount: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <button type="submit" className="w-full mt-10 p-6 bg-red-600 text-white rounded-[2.5rem] text-xl font-black shadow-xl hover:bg-red-700 transition-all uppercase tracking-widest font-black">
                {editingItem ? 'SAVE CHANGES 💾' : 'SAVE RECORD 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
