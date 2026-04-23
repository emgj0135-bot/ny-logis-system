"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PalletsPage() {
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false); 
  const [targetId, setTargetId] = useState<number | null>(null); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🗓️ 오늘 날짜를 기본값으로 설정 (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    type: "출고", 
    company_name: "", 
    issue_date: today, // ✨ 발행일자 필드 추가
    kpp_count: "", 
    kpp_number: "", 
    aj_count: "", 
    aj_name: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('pallets').select('*').order('created_at', { ascending: false });
    if (!error) setList(data || []);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = list.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(list.length / itemsPerPage);

  const handleSubmit = async () => {
    if (!formData.company_name) return alert("업체명을 입력해줘 갱미야!");
    
    if (isEdit && targetId) {
      const { error } = await supabase.from('pallets').update({ ...formData }).eq('id', targetId);
      if (!error) {
        alert("수정 완료! ✨");
        closeModal();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('pallets').insert([{ ...formData, status: '미확인' }]);
      if (!error) {
        alert("전표 등록 성공! 🚀");
        closeModal();
        fetchData();
        setCurrentPage(1);
      }
    }
  };

  const handleStatusUpdate = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === '확인완료' ? '미확인' : '확인완료';
    const { error } = await supabase.from('pallets').update({ status: newStatus }).eq('id', id);
    if (!error) fetchData();
    else alert("상태 변경 에러: " + error.message);
  };

  const openEditModal = (item: any) => {
    setIsEdit(true);
    setTargetId(item.id);
    setFormData({
      type: item.type, 
      company_name: item.company_name, 
      issue_date: item.issue_date || today, // 데이터가 없으면 오늘 날짜
      kpp_count: item.kpp_count,
      kpp_number: item.kpp_number, 
      aj_count: item.aj_count, 
      aj_name: item.aj_name
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEdit(false);
    setTargetId(null);
    setFormData({ type: "출고", company_name: "", issue_date: today, kpp_count: "", kpp_number: "", aj_count: "", aj_name: "" });
  };

  const handleDelete = async (id: number) => {
    if(!confirm("진짜 삭제할 거야?")) return;
    const { error } = await supabase.from('pallets').delete().eq('id', id);
    if (!error) fetchData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              파렛트 <span className="text-blue-600">전표</span>
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

      {/* 테이블 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-400 font-bold border-b text-[10px] uppercase tracking-widest">
            <tr>
              <th className="p-6 text-left">상태</th>
              <th className="p-6 text-left">작성일자</th>
              <th className="p-6 text-left">발행일 / 구분</th>
              <th className="p-6 text-left">KPP 정보</th>
              <th className="p-6 text-left">AJ 정보</th>
              <th className="p-6 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-black">
            {currentItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-all">
                <td className="p-6">
                  <button onClick={() => handleStatusUpdate(item.id, item.status)} className={`px-4 py-1.5 rounded-full text-[10px] transition-all font-black ${item.status === '미확인' ? 'bg-orange-50 text-orange-500 border border-orange-100 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-500 border border-green-100'}`}>
                    {item.status}
                  </button>
                </td>
                <td className="p-6">
                  <p className="text-slate-400 text-[10px]">{formatDate(item.created_at)}</p>
                </td>
                <td className="p-6">
                  {/* ✨ issue_date(발행일자) 표시 */}
                  <p className="text-slate-800 text-sm">{item.issue_date || "날짜미지정"}</p>
                  <p className={`text-[11px] mt-0.5 ${item.type === '출고' ? 'text-red-500' : 'text-blue-500'}`}>{item.company_name}</p>
                </td>
                <td className="p-6">
                  <p className="text-blue-600 text-sm">{item.kpp_count || "0매"}</p>
                  <p className="text-slate-400 text-[10px]">{item.kpp_number || "-"}</p>
                </td>
                <td className="p-6">
                  <p className="text-green-500 text-sm">{item.aj_count || "0매"}</p>
                  <p className="text-slate-400 text-[10px]">{item.aj_name || "-"}</p>
                </td>
                <td className="p-6 text-center">
                   <div className="flex gap-4 justify-center text-slate-300 font-black">
                      <button onClick={() => openEditModal(item)} className="hover:text-blue-500">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="hover:text-red-400">삭제</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="flex justify-center items-center gap-2 p-6 bg-slate-50/50">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all">PREV</button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{i + 1}</button>
            ))}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all">NEXT</button>
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black mb-6 text-slate-800">{isEdit ? 'EDIT SLIP' : '신규 전표'}</h2>
            <div className="space-y-4">
              <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl">
                {['출고', '입고'].map(t => (
                  <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>{t}</button>
                ))}
              </div>
              
              {/* ✨ 발행일자 선택 필드 추가 */}
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 ml-2 uppercase font-black tracking-widest">Issue Date</p>
                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none text-blue-600" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
              </div>

              <input placeholder="업체명" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner outline-none" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="KPP 수량" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={formData.kpp_count} onChange={e => setFormData({...formData, kpp_count: e.target.value})} />
                <input placeholder="KPP 번호" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-[10px] outline-none" value={formData.kpp_number} onChange={e => setFormData({...formData, kpp_number: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="AJ 수량" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={formData.aj_count} onChange={e => setFormData({...formData, aj_count: e.target.value})} />
                <input placeholder="AJ 업체/번호" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-[10px] outline-none" value={formData.aj_name} onChange={e => setFormData({...formData, aj_name: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleSubmit} className="flex-1 bg-[#1a1c2e] text-white p-4 rounded-[1.2rem] font-black shadow-lg hover:bg-black transition-all text-sm">{isEdit ? '수정하기' : '등록하기'}</button>
                <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-6 rounded-[1.2rem] font-black text-sm">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
