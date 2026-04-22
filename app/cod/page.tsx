"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function CodPage() {
  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    pay_type: '정산입금', customer_name: '', delivery_company: '',
    return_invoice: '', fee: 0, memo: '', status: '미확인' // status 기본값 추가
  });

  // 데이터 가져오기 함수 (이름 통일: fetchCod)
  const fetchCod = async () => {
    const { data, error } = await supabase
      .from('cod_manage')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setList(data || []);
  };

  useEffect(() => { fetchCod(); }, []);

  // 확인/미확인 토글 함수 (대시보드 연동 핵심!)
  const toggleConfirm = async (id: number, currentConfirmed: boolean) => {
    // 갱미야, 여기서 status를 직접 바꿔줘야 대시보드가 숫자를 줄여!
    const newStatus = currentConfirmed ? '미확인' : '확인됨';
    
    const { error } = await supabase
      .from('cod_manage')
      .update({ 
        is_confirmed: !currentConfirmed, 
        status: newStatus 
      })
      .eq('id', id);

    if (!error) {
      fetchCod(); // 갱미야, 아까 fetchData라고 되어있어서 에러났을거야! 이걸로 수정 완료.
    } else {
      alert("상태 변경 실패: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 등록할 때도 기본 status를 '미확인'으로 명시해주자!
    const submitData = { ...formData, status: formData.status || '미확인' };

    const { error } = await (editingItem 
      ? supabase.from('cod_manage').update(submitData).eq('id', editingItem.id)
      : supabase.from('cod_manage').insert([submitData]));

    if (error) {
      alert("실패: " + error.message);
    } else { 
      closeModal(); 
      fetchCod(); 
    }
  };

  const openModal = (item: any = null) => {
    if (item) { 
      setEditingItem(item); 
      setFormData({ ...item }); 
    } else { 
      setEditingItem(null); 
      setFormData({ 
        pay_type: '정산입금', customer_name: '', delivery_company: '', 
        return_invoice: '', fee: 0, memo: '', status: '미확인' 
      }); 
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto flex justify-between items-end mb-8">
        <div><h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">💰 착불 <span className="text-blue-600 not-italic">정산 관리</span></h1></div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all">+ 착불 등록</button>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
        {list.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex justify-between items-center group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-6">
              {/* 클릭하면 status가 '확인됨'으로 바뀌면서 대시보드 숫자가 줄어들어! */}
              <button 
                onClick={() => toggleConfirm(item.id, item.status === '확인됨')} 
                className={`w-16 py-8 rounded-2xl font-black text-xs transition-all ${
                  item.status === '확인됨' ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white animate-pulse'
                }`}
              >
                {item.status === '확인됨' ? '확인됨' : '미확인'}
              </button>
              
              <div onClick={() => openModal(item)} className="cursor-pointer">
                <p className={`text-[10px] font-black w-fit px-2 py-1 rounded mb-1 ${item.pay_type === '정산입금' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{item.pay_type}</p>
                <p className="font-black text-slate-800 text-lg">{item.customer_name}</p>
                <p className="text-sm font-bold text-slate-400">{item.delivery_company} | {item.return_invoice}</p>
              </div>
            </div>
            <p className="font-black text-blue-600 text-xl">{item.fee.toLocaleString()}원</p>
          </div>
        ))}
      </div>

      {/* 모달 섹션 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white p-10 rounded-[48px] w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 font-black text-xl font-sans">✕</button>
            <h2 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Enter Data</h2>
            <form onSubmit={handleSubmit} className="space-y-6 text-sm font-bold">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 ml-4 mb-1">입금 구분</p>
                <select value={formData.pay_type} className="w-full bg-slate-50 p-5 rounded-[24px] border-none outline-none font-black text-blue-600 shadow-inner" onChange={e => setFormData({...formData, pay_type: e.target.value})}>
                  <option value="정산입금">💳 정산입금 (선지불)</option>
                  <option value="업체입금">💸 업체입금 (직접지불)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="업체명" value={formData.customer_name} className="bg-slate-50 p-5 rounded-2xl border-none shadow-inner" onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                <input required type="text" placeholder="택배사" value={formData.delivery_company} className="bg-slate-50 p-5 rounded-2xl border-none shadow-inner" onChange={e => setFormData({...formData, delivery_company: e.target.value})} />
              </div>
              
              <input required type="text" placeholder="반송장번호" value={formData.return_invoice} className="w-full bg-slate-50 p-5 rounded-2xl border-none shadow-inner font-mono" onChange={e => setFormData({...formData, return_invoice: e.target.value})} />
              
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 ml-4 mb-1 text-right">정산 금액 (원)</p>
                <input required type="number" placeholder="운임비" value={formData.fee} className="w-full bg-slate-50 p-6 rounded-2xl text-right font-black text-blue-600 text-3xl border-none shadow-inner" onChange={e => setFormData({...formData, fee: parseInt(e.target.value) || 0})} />
              </div>

              {formData.pay_type === '업체입금' && (
                <div className="p-8 bg-purple-50 rounded-[40px] border-2 border-purple-100 space-y-3 text-xs animate-in slide-in-from-top-2">
                  <p className="font-black text-purple-600 mb-2 italic uppercase">Account Info</p>
                  <div className="bg-white p-4 rounded-2xl flex justify-between shadow-sm"><span>CJ대한통운(농협)</span><span className="font-black text-slate-800">174428-52-054702 [이재우]</span></div>
                  <div className="bg-white p-4 rounded-2xl flex justify-between shadow-sm"><span>한진택배(기업)</span><span className="font-black text-slate-800">118-063027-01-017 [양현모]</span></div>
                </div>
              )}
              
              <button type="submit" className="w-full bg-slate-900 py-6 rounded-[2.5rem] font-black text-white shadow-xl hover:bg-black transition-all text-xl italic uppercase tracking-widest mt-4">
                Save Data 🚀
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
