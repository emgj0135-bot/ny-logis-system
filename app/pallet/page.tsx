"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PalletsPage() {
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "출고", company_name: "", kpp_count: "", kpp_number: "", aj_count: "", aj_name: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    // 갱미야, 여기서 새로 만든 테이블 구조로 데이터를 긁어와!
    const { data, error } = await supabase
      .from('pallets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setList(data || []);
  };

  const handleInsert = async () => {
    if (!formData.company_name) return alert("업체명을 입력해줘 갱미야!");
    
    // 신규 등록할 때 status는 자동으로 '미확인'이 들어가게 설정!
    const { error } = await supabase
      .from('pallets')
      .insert([{ ...formData, status: '미확인' }]);

    if (!error) {
      alert("전표가 성공적으로 등록됐어! 🚀");
      setShowModal(false);
      setFormData({ type: "출고", company_name: "", kpp_count: "", kpp_number: "", aj_count: "", aj_name: "" });
      fetchData();
    } else {
      alert("등록 에러: " + error.message);
    }
  };

  const handleStatusUpdate = async (id: number) => {
    const { error } = await supabase
      .from('pallets')
      .update({ status: '확인완료' })
      .eq('id', id);
    
    if (!error) fetchData();
  };

  const handleDelete = async (id: number) => {
    if(!confirm("진짜 삭제할 거야?")) return;
    const { error } = await supabase.from('pallets').delete().eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
          📦 <span className="text-orange-500 font-black">파렛트</span> 전표 관리
        </h1>
        <div className="flex gap-2">
           <button className="bg-white text-slate-400 px-5 py-2.5 rounded-2xl font-bold border border-slate-100 text-xs shadow-sm">전체 전표</button>
           <button onClick={() => setShowModal(true)} className="bg-[#1a1c2e] text-white px-7 py-2.5 rounded-2xl font-black shadow-lg hover:bg-black transition-all text-sm flex items-center gap-2">
             + 신규 등록
           </button>
        </div>
      </div>

      {/* 전표 리스트 테이블 (갱미가 좋아하던 스타일) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-400 font-bold border-b">
            <tr>
              <th className="p-6 text-left font-black uppercase tracking-tighter">상태</th>
              <th className="p-6 text-left font-black uppercase tracking-tighter">날짜 / 구분</th>
              <th className="p-6 text-left font-black uppercase tracking-tighter text-blue-500">KPP (수량/번호)</th>
              <th className="p-6 text-left font-black uppercase tracking-tighter text-green-500">AJ (수량/번호)</th>
              <th className="p-6 text-center font-black uppercase tracking-tighter">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-black">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-all">
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] ${item.status === '미확인' ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-green-50 text-green-500 border border-green-100'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-6">
                  <p className="text-slate-800 text-sm">{new Date(item.created_at).toISOString().split('T')[0]}</p>
                  <p className={`text-[11px] mt-0.5 ${item.type === '출고' ? 'text-red-500' : 'text-blue-500'}`}>{item.type}</p>
                </td>
                <td className="p-6">
                  <p className="text-blue-600 text-sm">{item.kpp_count || "0매"}</p>
                  <p className="text-slate-400 text-[10px] font-bold tracking-tight">{item.kpp_number || "-"}</p>
                </td>
                <td className="p-6">
                  <p className="text-green-500 text-sm">{item.aj_count || "0매"}</p>
                  <p className="text-slate-400 text-[10px] font-bold tracking-tight">{item.aj_name || "-"}</p>
                </td>
                <td className="p-6 text-center">
                   <div className="flex gap-4 justify-center text-slate-300">
                      <button className="hover:text-blue-500 transition-colors">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="hover:text-red-400 transition-colors">삭제</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 신규 등록 모달 창 */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 text-xl font-black">✕</button>
            <h2 className="text-2xl font-black mb-8 italic tracking-tighter text-slate-800">NEW SLIP</h2>
            
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-slate-400 ml-4 mb-2">입고/출고 구분</p>
                <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
                  {['출고', '입고'].map(t => (
                    <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${formData.type === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 ml-4 mb-2">업체명</p>
                <input placeholder="업체명을 입력하세요" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-blue-400 ml-4">KPP 수량</p>
                  <input placeholder="예: 2매" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={formData.kpp_count} onChange={e => setFormData({...formData, kpp_count: e.target.value})} />
                  <input placeholder="KPP 번호" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-[10px]" value={formData.kpp_number} onChange={e => setFormData({...formData, kpp_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-green-500 ml-4">AJ 수량</p>
                  <input placeholder="예: 5매" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={formData.aj_count} onChange={e => setFormData({...formData, aj_count: e.target.value})} />
                  <input placeholder="AJ 업체/번호" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-[10px]" value={formData.aj_name} onChange={e => setFormData({...formData, aj_name: e.target.value})} />
                </div>
              </div>

              <button onClick={handleInsert} className="w-full mt-6 bg-[#1a1c2e] text-white p-6 rounded-[2rem] font-black text-lg shadow-xl hover:bg-black transition-all">
                전표 등록하기 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
