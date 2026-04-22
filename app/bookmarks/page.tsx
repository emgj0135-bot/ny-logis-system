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
  const [staffs, setStaffs] = useState<any[]>([]); // 직원 리st
  const [tab, setTab] = useState<'상차지' | '하차지'>('상차지');
  const [showModal, setShowModal] = useState(false);

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
    
    // 즐겨찾기 목록 가져오기
    const { data: bData } = await supabase.from('bookmarks').select('*').order('created_at', { ascending: false });
    setBookmarks(bData || []);

    // 직원 목록 가져오기
    const { data: sData } = await supabase.from('staff').select('*');
    setStaffs(sData || []);
  };

  const handleAdd = async () => {
    if (role !== 'admin') return alert("관리자만 등록 가능합니다.");
    const { error } = await supabase.from('bookmarks').insert([{ type: tab, ...formData }]);
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">📌 NY LOGIS BOOKMARKS</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">{tab === '상차지' ? '우리 센터 정보를 관리합니다.' : '거래처(하차지) 정보를 관리합니다.'}</p>
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
              <th className="px-8 py-5">구분</th>
              <th className="px-8 py-5">{tab} 정보</th>
              <th className="px-8 py-5">담당자 정보</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {bookmarks.filter(b => b.type === tab).map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${tab === '상차지' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>{tab}</span>
                </td>
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
                    <p className="text-slate-300 italic font-bold">상차지는 배차 시 담당자 선택</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-8 text-slate-800 italic underline decoration-orange-500 underline-offset-8">ADD {tab.toUpperCase()}</h2>
            <div className="space-y-4">
              <input placeholder={`${tab}명`} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                onChange={e => setFormData({...formData, place_name: e.target.value})} />
              <input placeholder="주소" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                onChange={e => setFormData({...formData, address: e.target.value})} />
              
              {/* 하차지일 때만 담당자 입력 칸 노출 */}
              {tab === '하차지' && (
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="담당자 이름" className="p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    onChange={e => setFormData({...formData, manager_name: e.target.value})} />
                  <input placeholder="연락처" className="p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    onChange={e => setFormData({...formData, manager_phone: e.target.value})} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={handleAdd} className="flex-1 bg-orange-500 text-white p-5 rounded-2xl font-black shadow-lg">등록완료</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-400 p-5 rounded-2xl font-black">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
