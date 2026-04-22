"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; 

export default function PalletPage() {
  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOnlyUnconfirmed, setShowOnlyUnconfirmed] = useState(false);

  const [formData, setFormData] = useState({
    manager: '', io_date: '', io_type: '입고', quantity: 0,
    kpp_count: 0, kpp_no: '', aj_count: 0, aj_no: '', memo: ''
  });

  const fetchPallets = async () => {
    let query = supabase.from('pallets').select('*').order('io_date', { ascending: false });
    if (showOnlyUnconfirmed) query = query.eq('is_confirmed', false);
    const { data } = await query;
    setList(data || []);
  };

  useEffect(() => { fetchPallets(); }, [showOnlyUnconfirmed]);

  const toggleConfirm = async (id: string, currentStatus: boolean) => {
    await supabase.from('pallets').update({ is_confirmed: !currentStatus }).eq('id', id);
    fetchPallets();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('pallets').update(formData).eq('id', editingId);
    } else {
      await supabase.from('pallets').insert([formData]);
    }
    closeModal();
    fetchPallets();
  };

  const handleDelete = async (id: string) => {
    if (confirm('삭제할까?')) {
      await supabase.from('pallets').delete().eq('id', id);
      fetchPallets();
    }
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ manager: '', io_date: '', io_type: '입고', quantity: 0, kpp_count: 0, kpp_no: '', aj_count: 0, aj_no: '', memo: '' });
  };

  return (
    <div className="p-8 text-black bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">📦 파렛트 <span className="text-orange-500">전표 관리</span></h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowOnlyUnconfirmed(!showOnlyUnconfirmed)} className={`px-5 py-3 rounded-2xl text-xs font-bold border transition-all ${showOnlyUnconfirmed ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 border-slate-200'}`}>
            {showOnlyUnconfirmed ? '미확인 전표만' : '전체 전표'}
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-lg">+ 신규 등록</button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">상태</th>
              <th className="px-8 py-5">날짜 / 구분</th>
              <th className="px-8 py-5 text-blue-600">KPP (수량/번호)</th>
              <th className="px-8 py-5 text-green-600">AJ (수량/번호)</th>
              <th className="px-8 py-5 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold">
            {list.map((item) => (
              <tr key={item.id} className={item.is_confirmed ? 'bg-slate-50 opacity-60' : ''}>
                <td className="px-8 py-5">
                  <button onClick={() => toggleConfirm(item.id, item.is_confirmed)} className={`px-3 py-1 rounded-xl text-[10px] font-black border ${item.is_confirmed ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                    {item.is_confirmed ? '확인완료' : '미확인'}
                  </button>
                </td>
                <td className="px-8 py-5">
                  <p>{item.io_date}</p>
                  <p className={`text-[10px] ${item.io_type === '입고' ? 'text-blue-500' : 'text-red-500'}`}>{item.io_type}</p>
                </td>
                <td className="px-8 py-5">
                  <p className="text-blue-600">{item.kpp_count}매</p>
                  <p className="text-[10px] text-slate-400">{item.kpp_no}</p>
                </td>
                <td className="px-8 py-5">
                  <p className="text-green-600">{item.aj_count}매</p>
                  <p className="text-[10px] text-slate-400">{item.aj_no}</p>
                </td>
                <td className="px-8 py-5 text-center">
                  <button onClick={() => openEditModal(item)} className="text-slate-400 mr-4">수정</button>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-200">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white p-10 rounded-[48px] w-full max-w-lg shadow-2xl relative">
            <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 font-black text-xl font-sans">✕</button>
            <h2 className="text-2xl font-black mb-6">파렛트 전표 {editingId ? '수정' : '등록'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <input required type="text" placeholder="담당자" value={formData.manager} className="bg-slate-100 p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, manager: e.target.value})} />
                <input required type="date" value={formData.io_date} className="bg-slate-100 p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, io_date: e.target.value})} />
                <select value={formData.io_type} className="bg-slate-100 p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, io_type: e.target.value})}>
                  <option value="입고">입고 (+)</option><option value="출고">출고 (-)</option>
                </select>
                <input type="number" placeholder="총 수량" value={formData.quantity} className="bg-slate-100 p-4 rounded-2xl outline-none text-right" onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
              </div>
              <div className="p-6 bg-blue-50 rounded-3xl space-y-3">
                <p className="text-[10px] font-black text-blue-500 text-center">KPP 파렛트</p>
                <div className="grid grid-cols-2 gap-2">
                   <input type="number" placeholder="수량" value={formData.kpp_count} className="p-3 rounded-xl outline-none text-center font-bold" onChange={e => setFormData({...formData, kpp_count: parseInt(e.target.value) || 0})} />
                   <input type="text" placeholder="전표번호" value={formData.kpp_no} className="p-3 rounded-xl outline-none text-center text-xs" onChange={e => setFormData({...formData, kpp_no: e.target.value})} />
                </div>
              </div>
              <div className="p-6 bg-green-50 rounded-3xl space-y-3">
                <p className="text-[10px] font-black text-green-500 text-center">AJ 파렛트</p>
                <div className="grid grid-cols-2 gap-2">
                   <input type="number" placeholder="수량" value={formData.aj_count} className="p-3 rounded-xl outline-none text-center font-bold" onChange={e => setFormData({...formData, aj_count: parseInt(e.target.value) || 0})} />
                   <input type="text" placeholder="전표번호" value={formData.aj_no} className="p-3 rounded-xl outline-none text-center text-xs" onChange={e => setFormData({...formData, aj_no: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 py-5 rounded-3xl font-black text-white italic shadow-xl">전표 저장</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
