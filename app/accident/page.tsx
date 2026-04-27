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
  }, []);

  const fetchAccidents = async () => {
    const { data } = await supabase.from('accidents').select('*').order('created_at', { ascending: false });
    setList(data || []);
    setFilteredList(data || []);
  };

  // 🗑️ 삭제 로직 (e.stopPropagation 추가)
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // 💡 여기서 수정 모달 뜨는 걸 막아줌!
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('accidents').delete().eq('id', id);
    if (!error) {
      alert("삭제되었습니다. ✨");
      await fetchAccidents();
    }
  };

  // 🚀 저장 및 수정 로직 (await 보강)
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      {/* 헤더 부분 동일 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-red-600 rounded-full shadow-lg"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">사고 <span className="text-red-600">접수</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase italic">천안센터 실시간 클레임 관리</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all text-sm">📊 엑셀 다운로드</button>
          <button onClick={() => openModal()} className="bg-red-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:scale-105 transition-all text-sm font-black">+ 신규 사고 접수</button>
        </div>
      </div>

      {/* 검색 필터 생략 (기존 유지) */}

      {/* 📋 메인 테이블 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-black font-black">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest text-center">
            <tr>
              <th className="p-5 w-16">No</th>
              <th className="p-5 w-32 italic font-black">Created</th>
              <th className="p-5 text-left font-black">사고 내용 (송장 / 수령인)</th>
              <th className="p-5 w-32 italic font-black">Outbound</th>
              <th className="p-5 w-40 font-black">변상 금액</th> {/* ✨ 너비를 넓힘 */}
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
                  <td className="p-5 text-slate-400 text-xs">{item.created_at.split('T')[0]}</td>
                  <td className="p-5 text-left">
                    <p className="text-slate-800 text-base tracking-tight font-black">{item.invoice_no} <span className="text-slate-200 mx-2 font-normal">|</span> {item.receiver_name}</p>
                    <p className="text-[11px] text-red-400 mt-1 uppercase font-black">🚨 {item.reason}</p>
                  </td>
                  <td className="p-5 text-slate-800 font-black">{item.out_date}</td>
                  <td className="p-5 text-red-600 text-lg font-black whitespace-nowrap"> {/* ✨ 한 줄 고정! */}
                    {item.confirmed_amount.toLocaleString()}원
                  </td>
                  <td className="p-5">
                    <span className={`text-[10px] px-4 py-1.5 rounded-full font-black inline-block whitespace-nowrap ${item.status === '보상승인' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex gap-2 justify-center text-[10px] text-slate-300">
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="hover:text-blue-600 font-black">수정</button>
                      <button onClick={(e) => handleDelete(e, item.id)} className="hover:text-red-500 font-black">삭제</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* 페이지네이션 동일 */}
      </div>

      {/* 모달 디자인 (닫기 버튼 고정 적용) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50 overflow-hidden">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 relative text-black flex flex-col font-black">
            
            {/* ✨ 닫기 버튼 고정 헤더 */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-10 pb-5 z-20 flex justify-between items-center border-b border-slate-50 font-black">
              <h2 className="text-3xl font-black mb-0 uppercase text-slate-900 tracking-tighter">사고 <span className="text-red-600">데이터 기록</span></h2>
              <button onClick={closeModal} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all text-xl font-black">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 pt-5">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ... 나머지 폼 내용은 기존과 동일 ... */}
                <div className="bg-slate-50 p-6 rounded-[2.5rem] shadow-inner space-y-4">
                  <div className="grid grid-cols-2 gap-4 font-black">
                    <input required type="date" value={formData.out_date} className="w-full p-5 bg-white rounded-2xl text-sm shadow-sm outline-none font-black" onChange={e => setFormData({...formData, out_date: e.target.value})} />
                    <input required type="text" placeholder="송장번호" value={formData.invoice_no} className="w-full p-5 bg-white rounded-2xl text-sm shadow-sm outline-none font-black" onChange={e => setFormData({...formData, invoice_no: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 font-black">
                  <input required type="text" placeholder="수령인" value={formData.receiver_name} className="w-full p-5 bg-slate-50 rounded-2xl text-sm shadow-inner outline-none font-black" onChange={e => setFormData({...formData, receiver_name: e.target.value})} />
                  <select value={formData.reason} className="w-full p-5 bg-slate-50 rounded-2xl text-sm shadow-inner outline-none text-red-600 font-black" onChange={e => setFormData({...formData, reason: e.target.value})}>
                    <option value="분실">🚨 분실</option>
                    <option value="파손">📦 파손</option>
                    <option value="지연">⏰ 지연</option>
                  </select>
                </div>
                <textarea placeholder="CJ 답변 기록" value={formData.cj_answer} className="w-full p-5 bg-slate-50 rounded-2xl text-sm shadow-inner h-32 outline-none font-black" onChange={e => setFormData({...formData, cj_answer: e.target.value})} />
                <div className="grid grid-cols-2 gap-4 items-end font-black">
                  <select value={formData.status} className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl text-sm outline-none font-black" onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="접수완료">접수완료</option>
                    <option value="보상승인">보상승인</option>
                  </select>
                  <input type="number" value={formData.confirmed_amount} className="w-full p-5 bg-white border-2 border-red-100 rounded-2xl text-sm outline-none text-right text-red-600 font-black" onChange={e => setFormData({...formData, confirmed_amount: parseInt(e.target.value) || 0})} />
                </div>
                <button type="submit" className="w-full mt-10 p-6 bg-red-600 text-white rounded-[2.5rem] text-xl font-black shadow-xl hover:bg-red-700 transition-all uppercase tracking-widest font-black">
                  {editingItem ? '수정완료 💾' : '저장완료 🚀'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
