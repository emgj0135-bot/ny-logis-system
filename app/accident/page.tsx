"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AccidentPage() {
  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    out_date: '', invoice_no: '', receiver_name: '', reason: '분실',
    cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: ''
  });

  const fetchAccidents = async () => {
    const { data } = await supabase.from('accidents').select('*').order('created_at', { ascending: false });
    setList(data || []);
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

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* 🔵 블루 포인트 헤더 섹션 - 여기서부터 수정된 부분이야! */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          {/* 대시보드와 통일감을 주는 블루 바 */}
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              사고 <span className="text-blue-600">접수</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">
              천안센터 <span className="text-red-500 font-black">실시간 사고 접수 및 변상 관리</span>
            </p>
          </div>
        </div>

        <button 
          onClick={() => openModal()} 
          className="bg-red-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-red-100 hover:bg-red-700 hover:scale-105 transition-all text-sm flex items-center gap-2 uppercase tracking-tight"
        >
          <span className="text-xl">+</span> 신규 사고 접수
        </button>
      </div>
      {/* 🔵 헤더 끝 */}

      <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
        {list.map((item) => (
          <div key={item.id} onClick={() => openModal(item)} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 cursor-pointer hover:border-red-500 transition-all flex justify-between items-center text-black">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === '보상승인' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600 animate-pulse'}`}>{item.status}</span>
                <p className="font-black text-slate-800">송장: {item.invoice_no}</p>
              </div>
              <p className="text-xs font-bold text-slate-500">출고일: {item.out_date} | 사유: {item.reason}</p>
            </div>
            <p className="font-black text-slate-900 text-xl">{item.confirmed_amount.toLocaleString()}원</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white p-10 rounded-[48px] w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-white/20 animate-in zoom-in-95 duration-200">
            <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 font-black text-xl font-sans hover:text-slate-600">✕</button>
            <h2 className="text-3xl font-black mb-8 italic text-black">사고 접수 및 변상 요청</h2>
            <form onSubmit={handleSubmit} className="space-y-8 text-sm font-bold text-black">
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" value={formData.out_date} className="bg-slate-100 p-4 rounded-2xl outline-none border-none shadow-inner" onChange={e => setFormData({...formData, out_date: e.target.value})} />
                <input required type="text" placeholder="송장번호" value={formData.invoice_no} className="bg-slate-100 p-4 rounded-2xl outline-none border-none shadow-inner" onChange={e => setFormData({...formData, invoice_no: e.target.value})} />
                <input required type="text" placeholder="수령인" value={formData.receiver_name} className="bg-slate-100 p-4 rounded-2xl outline-none border-none shadow-inner" onChange={e => setFormData({...formData, receiver_name: e.target.value})} />
                <select value={formData.reason} className="bg-slate-100 p-4 rounded-2xl outline-none text-red-600 font-black border-none shadow-inner" onChange={e => setFormData({...formData, reason: e.target.value})}>
                  <option value="분실">🚨 분실</option><option value="파손">📦 파손</option><option value="지연">⏰ 지연</option>
                </select>
              </div>
              <textarea placeholder="CJ 단톡방 답변 내용 기록" value={formData.cj_answer} className="w-full bg-slate-50 p-5 rounded-2xl outline-none h-28 border-none shadow-inner" onChange={e => setFormData({...formData, cj_answer: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.status} className="bg-white p-4 rounded-2xl outline-none border font-black shadow-sm" onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="접수완료">접수완료</option><option value="정상출고(취소)">정상출고(취소)</option><option value="보상승인">보상승인</option>
                </select>
                <input type="number" placeholder="확정 변상금" value={formData.confirmed_amount} className="bg-white p-4 rounded-2xl outline-none border text-right font-black text-red-600 shadow-sm" onChange={e => setFormData({...formData, confirmed_amount: parseInt(e.target.value) || 0})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 py-6 rounded-[2.5rem] font-black text-white shadow-xl hover:bg-black transition-all text-xl italic uppercase tracking-widest">사고 데이터 저장</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
