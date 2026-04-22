"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PalletsPage() {
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false); 
  const [targetId, setTargetId] = useState<number | null>(null); 
  
  const [formData, setFormData] = useState({
    type: "출고", company_name: "", kpp_count: "", kpp_number: "", aj_count: "", aj_name: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('pallets').select('*').order('created_at', { ascending: false });
    if (!error) setList(data || []);
  };

  const handleSubmit = async () => {
    if (!formData.company_name) return alert("업체명을 입력해줘 갱미야!");
    if (isEdit && targetId) {
      const { error } = await supabase.from('pallets').update({ ...formData }).eq('id', targetId);
      if (!error) { alert("수정 완료! ✨"); closeModal(); fetchData(); }
    } else {
      const { error } = await supabase.from('pallets').insert([{ ...formData, status: '미확인' }]);
      if (!error) { alert("전표 등록 성공! 🚀"); closeModal(); fetchData(); }
    }
  };

  const handleStatusUpdate = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === '확인완료' ? '미확인' : '확인완료';
    const { error } = await supabase.from('pallets').update({ status: newStatus }).eq('id', id);
    if (!error) fetchData();
  };

  const openEditModal = (item: any) => {
    setIsEdit(true); setTargetId(item.id);
    setFormData({ type: item.type, company_name: item.company_name, kpp_count: item.kpp_count, kpp_number: item.kpp_number, aj_count: item.aj_count, aj_name: item.aj_name });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setIsEdit(false); setTargetId(null);
    setFormData({ type: "출고", company_name: "", kpp_count: "", kpp_number: "", aj_count: "", aj_name: "" });
  };

  const handleDelete = async (id: number) => {
    if(!confirm("진짜 삭제할 거야?")) return;
    const { error } = await supabase.from('pallets').delete().eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 대시보드 스타일로 맞춘 블루 포인트 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              PALLET <span className="text-blue-600">CONTROL</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">
              천안센터 <span className="text-blue-600/60 font-black">파렛트 전표 관리 시스템</span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-105 transition-all text-sm"
        >
          + 신규 전표 등록
        </button>
      </div>

      {/* 📦 리스트 테이블 박스 (갱미가 말한 그 부분!) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-400 font-bold border-b text-[10px] uppercase tracking-widest">
            <tr>
              <th className="p-6 text-left">상태</th>
              <th className="p-6 text-left">날짜 / 업체</th>
              <th className="p-6 text-left">KPP 정보</th>
              <th className="p-6 text-left">AJ 정보</th>
              <th className="p-6 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-black">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-all">
                <td className="p-6">
                  <button 
                    onClick={() => handleStatusUpdate(item.id, item.status)}
                    className={`px-4 py-1.5 rounded-full text-[10px] transition-all font-black shadow-sm ${
                      item.status === '미확인' 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white' 
                      : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    {item.status === '확인완료' ? '✓ 확인됨' : '? 미확인'}
                  </button>
                </td>
                <td className="p-6">
                  <p className="text-slate-800 text-sm">{new Date(item.created_at).toISOString().split('T')[0]}</p>
                  <p className={`text-[11px] mt-0.5 ${item.type === '출고' ? 'text-blue-600' : 'text-slate-500'}`}>{item.company_name}</p>
                </td>
                {/* 수량 정보 등 생략 (동일) */}
                <td className="p-6">
                  <p className="text-blue-600 text-sm">{item.kpp_count || "0"}매</p>
                  <p className="text-slate-400 text-[10px]">{item.kpp_number || "-"}</p>
                </td>
                <td className="p-6">
                  <p className="text-green-500 text-sm">{item.aj_count || "0"}매</p>
                  <p className="text-slate-400 text-[10px]">{item.aj_name || "-"}</p>
                </td>
                <td className="p-6 text-center">
                   <div className="flex gap-4 justify-center text-slate-300 font-black">
                      <button onClick={() => openEditModal(item)} className="hover:text-blue-600">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="hover:text-red-400">삭제</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* (모달 코드는 기존과 동일하므로 생략 - 갱미 코드 유지해줘!) */}
      {/* ... 기존 모달 코드 ... */}
    </div>
  );
}
