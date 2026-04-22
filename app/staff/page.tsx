"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StaffPage() {
  const [role, setRole] = useState<string | null>(null);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setRole(user?.user_metadata?.role || 'user');
    
    // staff 테이블에서 전체 명단 가져오기
    const { data, error } = await supabase.from('staff').select('*').order('name', { ascending: true });
    if (error) console.error("데이터 로드 에러:", error);
    setStaffs(data || []);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) return alert("이름과 연락처를 모두 입력해주세요!");
    
    if (editingId) {
      // 수정
      await supabase.from('staff').update({ ...formData }).eq('id', editingId);
      alert("수정 완료!");
    } else {
      // 신규 등록
      const { error } = await supabase.from('staff').insert([formData]);
      if (error) alert("등록 실패: " + error.message);
      else alert("정상적으로 등록되었습니다!");
    }
    
    closeModal();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 담당자를 삭제하시겠습니까?")) return;
    await supabase.from('staff').delete().eq('id', id);
    fetchData();
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({ name: item.name, phone: item.phone });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "", phone: "" });
  };

  return (
    <div className="p-8 bg-white min-h-screen font-sans">
      {/* 헤더 부분: 즐겨찾기와 통일감 있게! */}
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">👥 상차 담당자 관리</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">우리 센터에서 용차를 호출하는 담당자 명단입니다.</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">
            + 신규 담당자 등록
          </button>
        )}
      </div>

      {/* 리스트 테이블: 깔끔하게 한눈에 확인! */}
      <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-widest">
            <tr>
              <th className="px-8 py-5">이름</th>
              <th className="px-8 py-5">연락처</th>
              <th className="px-8 py-5 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {staffs.length > 0 ? (
              staffs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-800 text-base">{item.name}</td>
                  <td className="px-8 py-6 font-bold text-slate-400">{item.phone}</td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => openEditModal(item)} className="text-blue-500 font-bold text-xs hover:underline">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 font-bold text-xs hover:underline">삭제</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-bold italic">등록된 담당자가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-8 text-slate-800 italic underline decoration-green-500 underline-offset-8">
              {editingId ? 'EDIT' : 'ADD'} STAFF
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">이름</label>
                <input value={formData.name} placeholder="예: 임경민 대리" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 mb-1 block">연락처</label>
                <input value={formData.phone} placeholder="예: 010-0000-0000" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                  onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={handleSubmit} className="flex-1 bg-green-600 text-white p-5 rounded-2xl font-black shadow-lg hover:bg-green-700">
                {editingId ? '수정완료' : '등록완료'}
              </button>
              <button onClick={closeModal} className="flex-1 bg-slate-100 text-slate-400 p-5 rounded-2xl font-black">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
