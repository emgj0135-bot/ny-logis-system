"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AccidentPage() {
  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // 리스트 필터 및 페이지네이션 상태 (통일감 유지)
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    out_date: '', invoice_no: '', receiver_name: '', reason: '분실',
    cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: ''
  });

  const fetchAccidents = async () => {
    const { data } = await supabase.from('accidents').select('*').order('created_at', { ascending: false });
    setList(data || []);
    setFilteredList(data || []); // 초기엔 전체 리스트
  };

  useEffect(() => { fetchAccidents(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await (editingItem 
      ? supabase.from('accidents').update(formData).eq('id', editingItem.id)
      : supabase.from('accidents').insert([formData]));
    if (error) alert("저장 실패: " + error.message);
    else { closeModal(); fetchAccidents(); }
  };

  const openModal = (item: any = null) => {
    if (item) { setEditingItem(item); setFormData({ ...item }); }
    else { setEditingItem(null); setFormData({ out_date: '', invoice_no: '', receiver_name: '', reason: '분실', cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: '' }); }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 헤더 섹션 (용차 배차와 통일) */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-red-600 rounded-full shadow-lg shadow-red-100"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              사고 <span className="text-red-600">접수</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">
              천안센터 <span className="text-red-500">실시간 사고 및 클레임 관리</span>
            </p>
          </div>
        </div>

        <button 
          onClick={() => openModal()} 
          className="bg-red-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-red-100 hover:bg-red-700 hover:scale-105 transition-all text-sm"
        >
          + 신규 사고 접수
        </button>
      </div>

      {/* 🔍 검색 필터 (디자인 통일) */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Outbound Date</p>
            <div className="flex items-center gap-3 font-bold">
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs" />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Search Info</p>
            <input type="text" placeholder="송장번호 또는 수령인" className="p-3 bg-slate-50 rounded-xl outline-none text-xs w-64" />
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50">
          <select className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[150px] outline-none">
            <option value="">상태 전체</option>
            <option value="접수완료">접수완료</option>
            <option value="보상승인">보상승인</option>
          </select>
          <button className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all">SEARCH FILTER 🔍</button>
          <button className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs border border-slate-100">RESET</button>
        </div>
      </div>

      {/* 📋 메인 리스트 테이블 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest">
            <tr>
              <th className="p-5 text-center w-16">No</th>
              <th className="p-5 text-center w-32">출고일자</th>
              <th className="p-5 text-left">사고 내용 (송장 / 수령인)</th>
              <th className="p-5 text-center w-32">변상 금액</th>
              <th className="p-5 text-center w-24">상태</th>
              <th className="p-5 text-center w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => {
              const displayNo = filteredList.length - (indexOfFirstItem + index);
              return (
                <tr key={item.id} onClick={() => openModal(item)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors font-black">
                  <td className="p-5 text-center text-red-600">{displayNo}</td>
                  <td className="p-5 text-center text-slate-500 font-bold">{item.out_date}</td>
                  <td className="p-5">
                    <p className="text-slate-800 text-base tracking-tight">{item.invoice_no} <span className="text-slate-400 mx-2">|</span> {item.receiver_name}</p>
                    <p className="text-[11px] text-red-400 mt-1 uppercase tracking-wider">🚨 {item.reason}</p>
                  </td>
                  <td className="p-5 text-center text-slate-900 text-lg">
                    {item.confirmed_amount.toLocaleString()}원
                  </td>
                  <td className="p-5 text-center">
                    <span className={`text-[10px] px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '보상승인' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex gap-2 justify-center text-[10px]">
                      <button className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg">수정</button>
                      <button className="text-slate-300 hover:text-red-400 px-3 py-1.5 rounded-lg">삭제</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 🔢 페이지네이션 (디자인 통일) */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50 font-black">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs disabled:opacity-30">PREV</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i+1} 
                onClick={() => setCurrentPage(i+1)} 
                className={`w-10 h-10 rounded-xl text-xs transition-all ${currentPage === i+1 ? 'bg-red-600 text-white shadow-lg shadow-red-100 scale-110' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {i+1}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs disabled:opacity-30">NEXT</button>
        </div>
      </div>

      {/* 🟢 사고 접수 모달 (슬라이드 인 디자인 적용 가능성 열어둠) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50 overflow-hidden">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-300 relative text-black">
            <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 text-2xl font-black">✕</button>
            <h2 className="text-3xl font-black mb-8 uppercase text-slate-900 tracking-tighter">
              사고 <span className="text-red-600">데이터 기록</span>
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6 font-black">
              <div className="bg-slate-50 p-6 rounded-[2.5rem] shadow-inner space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 ml-4 uppercase">Outbound Date</p>
                    <input required type="date" value={formData.out_date} className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm outline-none" onChange={e => setFormData({...formData, out_date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 ml-4 uppercase">Invoice No</p>
                    <input required type="text" placeholder="송장번호 입력" value={formData.invoice_no} className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm outline-none" onChange={e => setFormData({...formData, invoice_no: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Receiver</p>
                  <input required type="text" placeholder="수령인 성함" value={formData.receiver_name} className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner outline-none" onChange={e => setFormData({...formData, receiver_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Reason</p>
                  <select value={formData.reason} className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner outline-none text-red-600" onChange={e => setFormData({...formData, reason: e.target.value})}>
                    <option value="분실">🚨 분실</option>
                    <option value="파손">📦 파손</option>
                    <option value="지연">⏰ 지연</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 ml-4 uppercase">CJ KakaoTalk Answer</p>
                <textarea placeholder="단톡방 답변 기록" value={formData.cj_answer} className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner h-32 outline-none" onChange={e => setFormData({...formData, cj_answer: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Process Status</p>
                  <select value={formData.status} className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl text-sm outline-none" onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="접수완료">접수완료</option>
                    <option value="정상출고(취소)">정상출고(취소)</option>
                    <option value="보상승인">보상승인</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Compensation Amount</p>
                  <input type="number" placeholder="0" value={formData.confirmed_amount} className="w-full p-5 bg-white border-2 border-red-100 rounded-2xl text-sm outline-none text-right text-red-600" onChange={e => setFormData({...formData, confirmed_amount: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <button type="submit" className="w-full mt-10 p-6 bg-red-600 text-white rounded-[2.5rem] text-xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-widest">
                {editingItem ? '사고 정보 수정 완료 💾' : '사고 데이터 저장 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
