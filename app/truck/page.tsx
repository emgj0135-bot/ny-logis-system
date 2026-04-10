"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TruckPage() {
  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    load_date: '', load_time: '', load_place: '천안센터', load_manager: '임경민 대리',
    unload_name1: '', unload_place1: '', unload_manager1: '', unload_item1: '',
    unload_name2: '', unload_place2: '', unload_manager2: '', unload_item2: '',
    truck_no: '', driver_name: '', driver_phone: '', fee: 0, status: '배차요청'
  });

  const fetchTrucks = async () => {
    const { data } = await supabase.from('trucks').select('*').order('created_at', { ascending: false });
    setList(data || []);
  };

  useEffect(() => { fetchTrucks(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStatus = formData.truck_no ? '배차완료' : '배차요청';
    const { error } = await (editingItem 
      ? supabase.from('trucks').update({...formData, status: finalStatus}).eq('id', editingItem.id)
      : supabase.from('trucks').insert([{...formData, status: finalStatus}]));
    if (error) alert("실패: " + error.message);
    else { closeModal(); fetchTrucks(); }
  };

  const openModal = (item: any = null) => {
    if (item) { setEditingItem(item); setFormData({ ...item }); }
    else { setEditingItem(null); setFormData({ load_date: '', load_time: '', load_place: '천안센터', load_manager: '임경민 대리', unload_name1: '', unload_place1: '', unload_manager1: '', unload_item1: '', unload_name2: '', unload_place2: '', unload_manager2: '', unload_item2: '', truck_no: '', driver_name: '', driver_phone: '', fee: 0, status: '배차요청' }); }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

  return (
    <div className="p-8 text-black bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">🚚 용차 <span className="text-orange-500">배차 관리</span></h1>
        <button onClick={() => openModal()} className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg">+ 배차 요청서 작성</button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {list.map((item) => (
          <div key={item.id} onClick={() => openModal(item)} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 cursor-pointer hover:border-orange-500 transition-all flex justify-between items-center group">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === '배차완료' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>{item.status}</span>
                <p className="font-black text-slate-800 text-lg">{item.load_date} [{item.load_time}]</p>
              </div>
              <p className="text-sm font-bold text-slate-600">🚩 하차1: {item.unload_name1} - {item.unload_place1}</p>
              {item.unload_name2 && <p className="text-sm font-bold text-blue-500">🚩 하차2: {item.unload_name2} - {item.unload_place2}</p>}
            </div>
            <div className="text-right">
              {item.truck_no ? (
                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 font-bold">
                  <p>{item.truck_no}</p><p className="text-orange-600 text-sm">{item.fee.toLocaleString()}원</p>
                </div>
              ) : <p className="text-slate-300 italic text-sm font-bold pr-4">배차 대기중</p>}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white p-10 rounded-[48px] w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-white/20">
            <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 font-black text-xl font-sans">✕</button>
            <h2 className="text-3xl font-black mb-8 italic text-slate-800">배차 요청서 상세</h2>
            <form onSubmit={handleSubmit} className="space-y-10 text-sm font-bold">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 w-fit px-2 py-1 rounded">Step 1. 상차 정보</p>
                <div className="grid grid-cols-2 gap-4">
                  <input required type="date" value={formData.load_date} className="bg-slate-100 p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, load_date: e.target.value})} />
                  <input required type="text" placeholder="시간" value={formData.load_time} className="bg-slate-100 p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, load_time: e.target.value})} />
                </div>
                <input required type="text" placeholder="주소" value={formData.load_place} className="w-full bg-slate-100 p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, load_place: e.target.value})} />
                <input required type="text" placeholder="담당자" value={formData.load_manager} className="w-full bg-slate-100 p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, load_manager: e.target.value})} />
              </div>
              <div className="space-y-4 p-8 bg-green-50/50 rounded-[40px] border border-green-100">
                <p className="text-[10px] font-black text-green-600 uppercase bg-green-100 w-fit px-2 py-1 rounded">Step 2. 하차지 1</p>
                <input required type="text" placeholder="업체명" value={formData.unload_name1} className="w-full p-4 rounded-2xl outline-none border border-green-100" onChange={e => setFormData({...formData, unload_name1: e.target.value})} />
                <input required type="text" placeholder="주소" value={formData.unload_place1} className="w-full p-4 rounded-2xl outline-none border border-green-100" onChange={e => setFormData({...formData, unload_place1: e.target.value})} />
                <input required type="text" placeholder="담당자/제품" value={formData.unload_item1} className="w-full p-4 rounded-2xl outline-none border border-green-100" onChange={e => setFormData({...formData, unload_item1: e.target.value})} />
              </div>
              <div className="space-y-4 p-8 bg-slate-50 rounded-[40px] border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase bg-slate-200 w-fit px-2 py-1 rounded">Step 3. 하차지 2 (선택)</p>
                <input type="text" placeholder="업체명" value={formData.unload_name2} className="w-full p-4 rounded-2xl outline-none border border-slate-200" onChange={e => setFormData({...formData, unload_name2: e.target.value})} />
                <input type="text" placeholder="주소" value={formData.unload_place2} className="w-full p-4 rounded-2xl outline-none border border-slate-200" onChange={e => setFormData({...formData, unload_place2: e.target.value})} />
                <input type="text" placeholder="담당자/제품" value={formData.unload_item2} className="w-full p-4 rounded-2xl outline-none border border-slate-200" onChange={e => setFormData({...formData, unload_item2: e.target.value})} />
              </div>
              <div className="p-8 bg-orange-50 rounded-[40px] border border-orange-100 grid grid-cols-2 gap-4">
                <input type="text" placeholder="차량번호" value={formData.truck_no} className="p-4 rounded-2xl outline-none border border-orange-200" onChange={e => setFormData({...formData, truck_no: e.target.value})} />
                <input type="text" placeholder="성함" value={formData.driver_name} className="p-4 rounded-2xl outline-none border border-orange-200" onChange={e => setFormData({...formData, driver_name: e.target.value})} />
                <input type="text" placeholder="연락처" value={formData.driver_phone} className="p-4 rounded-2xl outline-none border border-orange-200" onChange={e => setFormData({...formData, driver_phone: e.target.value})} />
                <input type="number" placeholder="운임료" value={formData.fee} className="p-4 rounded-2xl outline-none border border-orange-200 font-black text-orange-600" onChange={e => setFormData({...formData, fee: parseInt(e.target.value) || 0})} />
              </div>
              <button type="submit" className="w-full bg-orange-600 py-5 rounded-3xl font-black text-white shadow-xl italic">저장하기</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}