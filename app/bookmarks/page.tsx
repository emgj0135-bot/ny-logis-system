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

  // 입력 폼 상태
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

  const handleAdd = async () => {
    if (role !== 'admin') return alert("관리자만 등록 가능합니다.");
    const { error } = await supabase.from('bookmarks').insert([{ 
      type: tab,
      ...formData
    }]);
    
    if (error) alert(error.message);
    else {
      setShowModal(false);
      setFormData({ place_name: "", address: "", manager_name: "", manager_phone: "" });
      fetchData();
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">📌 즐겨찾기 관리</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">자주 사용하는 상/하차지 정보를 관리합니다.</p>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm">
            + {tab} 등록
          </button>
        )}
      </div>

      {/* 상/하차지 탭 버튼 */}
      <div className="flex gap-2 mb-6">
        {['상차지', '하차지'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-6 py-2 rounded-full text-sm font-black transition-all ${
              tab === t ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 리스트 테이블 */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">No</th>
              <th className="px-6 py-4">{tab}명 [주소]</th>
              <th className="px-6 py-4">담당자 [이름 / 연락처]</th>
              <th className="px-6 py-4 text-center">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {bookmarks.filter(b => b.type === tab).map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-300 font-bold">{index + 1}</td>
                <td className="px-6 py-4">
                  <p className="font-black text-slate-800">{item.place_name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">[{item.address}]</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-700">{item.manager_name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">[{item.manager_phone}]</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-blue-50 text-blue-500 px-2 py-1 rounded text-[10px] font-black">정기</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 관리자용 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-6 text-slate-800 italic">New {tab}</h2>
            <div className="space-y-4">
              <input placeholder={`${tab}명`} className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" 
                onChange={e => setFormData({...formData, place_name: e.target.value})} />
              <input placeholder="주소" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" 
                onChange={e => setFormData({...formData, address: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="담당자 이름" className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" 
                  onChange={e => setFormData({...formData, manager_name: e.target.value})} />
                <input placeholder="연락처" className="p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" 
                  onChange={e => setFormData({...formData, manager_phone: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleAdd} className="flex-1 bg-orange-500 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-orange-600">등록하기</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-400 p-4 rounded-2xl font-black hover:bg-slate-200">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
