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

  const handleSubmit = async () => {
    if (role !== 'admin') return alert("관리자만 가능합니다.");
    
    if (editingId) {
      const { error } = await supabase.from('bookmarks').update({ ...formData }).eq('id', editingId);
      if (error) alert(error.message);
      else alert("수정되었습니다! ✨");
    } else {
      const { error } = await supabase.from('bookmarks').insert([{ type: tab, ...formData }]);
      if (error) alert(error.message);
      else alert("등록 성공! 🚀");
    }
    
    closeModal();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (role !== 'admin') return alert("관리자만 삭제 가능합니다.");
    if (!confirm("정말로 삭제하시겠습니까?")) return;

    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

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
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 블루 포인트 헤더 섹션 - 완벽 통일! */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              NY LOGIS <span className="text-blue-600">BOOKMARKS</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">
              천안센터 <span className="text-blue-600/60 font-black">{tab} 관리 및 즐겨찾기</span>
            </p>
          </div>
        </div>
        {role === 'admin' && (
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-105 transition-all text-sm"
          >
            + {tab} 등록
          </button>
        )}
      </div>

      {/* 탭 버튼 섹션 - 블루 테마 적용 */}
      <div className="flex gap-2 mb-8">
        {['상차지', '하차지'].map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t as any)} 
            className={`px-8 py-3 rounded-full text-sm font-black transition-all ${
              tab === t ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white text-slate-400 border border-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 테이블 섹션 - 갱미 스타일로 다듬기 */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-sm bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-10 py-6">정보</th>
              <th className="px-10 py-6">담당자</th>
              {role === 'admin' && <th className="px-10 py-6 text-center">관리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-black">
            {bookmarks.filter(b => b.type === tab).map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-8">
                  <p className="font-black text-slate-800 text-lg tracking-tight">{item.place_name}</p>
                  <p className="text-slate-400 text-xs font-bold mt-1 tracking-tight">{item.address}</p>
                </td>
                <td className="px-10 py-8">
                  {tab === '하차지' ? (
                    <>
                      <p className="text-slate-700 text-sm">{item.manager_name}</p>
                      <p className="text-blue-600 text-xs mt-1">{item.manager_phone}</p>
                    </>
                  ) : (
                    <p className="text-slate-300 italic text-xs">배차 시 선택</p>
                  )}
                </td>
                {role === 'admin' && (
                  <td className="px-10 py-8 text-center">
                    <div className="flex justify-center gap-4 text-slate-300">
                      <button onClick={() => openEditModal(item)} className="hover:text-blue-600 transition-colors">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="hover:text-red-400 transition-colors">삭제</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모달 섹션 - 블루 포인트 적용 */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-8 text-slate-800 tracking-tight uppercase">
              {editingId ? 'Edit' : 'Add'} <span className="text-blue-600">{tab}</span>
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">{tab}명</p>
                <input value={formData.place_name} placeholder="Place Name" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" 
                  onChange={e => setFormData({...formData, place_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">주소</p>
                <input value={formData.address} placeholder="Address" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" 
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              {tab === '하차지' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">담당자</p>
                    <input value={formData.manager_name} placeholder="Manager" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" 
                      onChange={e => setFormData({...formData, manager_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">연락처</p>
                    <input value={formData.manager_phone} placeholder="Phone" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" 
                      onChange={e => setFormData({...formData, manager_phone: e.target.value})} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white p-5 rounded-[1.5rem] font-black shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest">
                Save
              </button>
              <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-8 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all uppercase tracking-widest">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
