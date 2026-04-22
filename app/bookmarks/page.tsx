"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BookmarkPage() {
  const [role, setRole] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [tab, setTab] = useState<'상차지' | '하차지'>('상차지');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    place_name: "",
    address: "",
    manager_name: "",
    manager_phone: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setRole(user?.user_metadata?.role || 'user');
    const { data } = await supabase.from('bookmarks').select('*').order('created_at', { ascending: false });
    setBookmarks(data || []);
  };

  // 등록 및 수정 핸들러
  const handleSubmit = async () => {
    if (role !== 'admin') return alert("관리자만 가능합니다.");
    
    if (editingId) {
      // 수정 모드
      const { error } = await supabase.from('bookmarks').update({ ...formData }).eq('id', editingId);
      if (error) alert(error.message);
      else alert("수정되었습니다!");
    } else {
      // 신규 등록 모드
      const { error } = await supabase.from('bookmarks').insert([{ type: tab, ...formData }]);
      if (error) alert(error.message);
    }
    
    closeModal();
    fetchData();
  };

  // 삭제 핸들러
  const handleDelete = async (id: number) => {
    if (role !== 'admin') return alert("관리자만 삭제 가능합니다.");
    if (!confirm("정말로 삭제하시겠습니까?")) return;

    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  // 수정 버튼 클릭 시 모달 열기
  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({
      place_name: item.place_name,
      address: item.address,
      manager_name: item.manager_name || "",
      manager_phone: item.manager_phone || ""
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ place_name: "", address: "", manager_name: "", manager_phone: "" });
  };

  return (
    <div className="p-8 bg-white min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">📌 NY LOGIS BOOKMARKS</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">{tab} 정보를 관리합니다.</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg">
            + {tab} 등록
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {['상차지', '하차지'].map((t) => (
          <button key={t} onClick={() => setTab(t as any)} className={`px-8 py-2.5 rounded-full text-sm font-black transition-all ${tab === t ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-widest">
            <tr>
              <th className="px-8 py-5">정보</th>
              <th className="px-8 py-5">담당자</th>
              {role === 'admin' && <th className="px-8 py-5 text-center">관리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {bookmarks.filter(b => b.type === tab).map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6">
                  <p className="font-black text-slate-800 text-base">{item.place_name}</p>
                  <p className="text-slate-400 text-xs font-bold mt-1 tracking-tight">{item.address}</p>
                </td>
                <td className="px-8 py-6">
                  {tab === '하차지' ? (
                    <>
                      <p className="font-black text-slate-700">{item.manager_name}</p>
                      <p className="text-slate-400 text-xs font-bold mt-1">{item.manager_phone}</p>
                    </>
                  ) : (
                    <p className="text-slate-300 italic font-bold">배차 시 선택</p>
                  )}
                </td>
                {role === 'admin' && (
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEditModal(item)} className="text-blue-500 font-bold text-xs hover:underline">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 font-bold text-xs hover:underline">삭제</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-8 text-slate-800 italic underline decoration-orange-500 underline-offset-8">
              {editingId ? 'EDIT' : 'ADD'} {tab.toUpperCase()}
            </h2>
            <div className="space-y-4">
              <input value={formData.place_name} placeholder={`${tab}명`} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                onChange={e => setFormData({...formData, place_name: e.target.value})} />
              <input value={formData.address} placeholder="주소" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                onChange={e => setFormData({...formData, address: e.target.value})} />
              {tab === '하차지' && (
                <div className="grid grid-cols-2 gap-2">
                  <input value={formData.manager_name} placeholder="담당자" className="p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    onChange={e => setFormData({...formData, manager_name: e.target.value})} />
                  <input value={formData.manager_phone} placeholder="연락처" className="p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    onChange={e => setFormData({...formData, manager_phone: e.target.value})} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={handleSubmit} className="flex-1 bg-orange-500 text-white p-5 rounded-2xl font-black shadow-lg">
                {editingId ? '수정완료' : '등록완료'}
              </button>
              <button onClick={closeModal} className="flex-1 bg-slate-100 text-slate-400 p-5 rounded-2xl font-black">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
