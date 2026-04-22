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
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

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
    const { error } = await supabase.from('bookmarks').insert([{ title: newTitle, url: newUrl }]);
    if (error) alert(error.message);
    else {
      setShowModal(false);
      fetchData();
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-xl font-bold text-slate-800">📌 즐겨찾기 게시판</h1>
        {role === 'admin' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
          >
            + 신규등록
          </button>
        )}
      </div>

      {/* 게시판 리스트 스타일 */}
      <table className="w-full text-sm text-left border-t border-slate-200">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black">
          <tr>
            <th className="px-6 py-3 border-b">No</th>
            <th className="px-6 py-3 border-b">업체/제목</th>
            <th className="px-6 py-3 border-b">링크 바로가기</th>
            <th className="px-6 py-3 border-b text-center">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookmarks.map((item, index) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-slate-400">{bookmarks.length - index}</td>
              <td className="px-6 py-4 font-bold text-slate-700">{item.title}</td>
              <td className="px-6 py-4">
                <a href={item.url} target="_blank" className="text-blue-500 hover:underline">바로가기 🔗</a>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-md text-[10px] font-bold">활성화</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 관리자 전용 등록 모달 (생략 가능, 단순 구현) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
            <h2 className="font-bold mb-4">새 즐겨찾기 등록</h2>
            <input placeholder="업체명" className="w-full p-2 border rounded mb-2" onChange={e => setNewTitle(e.target.value)} />
            <input placeholder="URL (https://...)" className="w-full p-2 border rounded mb-4" onChange={e => setNewUrl(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-bold">등록</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-200 p-2 rounded-lg font-bold">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
