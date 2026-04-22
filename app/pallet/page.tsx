"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PalletsPage() {
  const [list, setList] = useState<any[]>([]);
  const [formData, setFormData] = useState({ company_name: "", item_details: "", remarks: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('pallets')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setList(data || []);
  };

  const handleInsert = async () => {
    if (!formData.company_name) return alert("업체명을 입력해줘 갱미야!");
    
    const { error } = await supabase
      .from('pallets')
      .insert([{ ...formData, status: '미확인' }]);

    if (!error) {
      alert("전표 등록 성공! 🚀");
      setFormData({ company_name: "", item_details: "", remarks: "" });
      fetchData();
    } else {
      alert("에러 발생: " + error.message);
    }
  };

  const handleStatusUpdate = async (id: number) => {
    const { error } = await supabase
      .from('pallets')
      .update({ status: '확인완료' })
      .eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic text-slate-800">📦 PALLET CONTROL</h1>
        <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black animate-pulse">LIVE</div>
      </div>

      {/* 등록 섹션 - 원래 디자인 */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input 
            placeholder="업체명 (예: 대한통운)" 
            className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none focus:ring-2 ring-blue-500"
            value={formData.company_name}
            onChange={e => setFormData({...formData, company_name: e.target.value})}
          />
          <input 
            placeholder="품목 및 수량" 
            className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none"
            value={formData.item_details}
            onChange={e => setFormData({...formData, item_details: e.target.value})}
          />
        </div>
        <div className="flex gap-4">
          <input 
            placeholder="비고 (특이사항)" 
            className="flex-1 p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none"
            value={formData.remarks}
            onChange={e => setFormData({...formData, remarks: e.target.value})}
          />
          <button onClick={handleInsert} className="bg-slate-900 text-white px-10 rounded-2xl font-black hover:bg-black transition-all shadow-lg">등록하기 🚀</button>
        </div>
      </div>

      {/* 리스트 섹션 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-400 font-bold border-b text-[11px] uppercase tracking-widest">
            <tr>
              <th className="p-6">등록일시</th>
              <th className="p-6">업체명</th>
              <th className="p-6">상세내용</th>
              <th className="p-6 text-center">상태</th>
              <th className="p-6 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {list.map(item => (
              <tr key={item.id} className="border-b last:border-none hover:bg-slate-50 transition-all">
                <td className="p-6 text-slate-400 font-medium">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="p-6 font-black text-slate-800">{item.company_name}</td>
                <td className="p-6">
                  <p className="font-bold text-slate-600">{item.item_details}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{item.remarks}</p>
                </td>
                <td className="p-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${item.status === '미확인' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-6 text-center">
                  {item.status === '미확인' && (
                    <button onClick={() => handleStatusUpdate(item.id)} className="text-[10px] font-black text-blue-500 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all">확인완료 처리</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
