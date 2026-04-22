"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PalletsPage() {
  const [list, setList] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ item_name: "", etc: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    // 최신순으로 가져오기
    const { data, error } = await supabase
      .from('pallets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setList(data || []);
  };

  const handleInsert = async () => {
    if (!newItem.item_name) return alert("품목명을 입력해줘!");
    
    // 새 구조에 맞게 인서트 (status는 기본값이 '미확인')
    const { error } = await supabase
      .from('pallets')
      .insert([{ item_name: newItem.item_name, etc: newItem.etc, status: '미확인' }]);

    if (!error) {
      alert("전표 등록 완료! ✨");
      setNewItem({ item_name: "", etc: "" });
      fetchData();
    } else {
      alert("등록 에러: " + error.message);
    }
  };

  const handleUpdateStatus = async (id: number) => {
    const { error } = await supabase
      .from('pallets')
      .update({ status: '확인완료' })
      .eq('id', id);
    
    if (!error) fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <h1 className="text-2xl font-black mb-8 italic text-slate-800">📦 파렛트 전표 관리</h1>
      
      {/* 등록 섹션 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 flex gap-4">
        <input 
          placeholder="품목명 입력" 
          className="flex-1 p-4 bg-slate-50 rounded-2xl border-none font-bold shadow-inner"
          value={newItem.item_name}
          onChange={e => setNewItem({...newItem, item_name: e.target.value})}
        />
        <input 
          placeholder="비고(특이사항)" 
          className="flex-1 p-4 bg-slate-50 rounded-2xl border-none font-bold shadow-inner"
          value={newItem.etc}
          onChange={e => setNewItem({...newItem, etc: e.target.value})}
        />
        <button onClick={handleInsert} className="bg-blue-600 text-white px-8 rounded-2xl font-black shadow-lg">전표 등록</button>
      </div>

      {/* 리스트 섹션 */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold border-b">
            <tr>
              <th className="p-4 text-left">등록일시</th>
              <th className="p-4 text-left">품목명</th>
              <th className="p-4 text-center">상태</th>
              <th className="p-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {list.map(item => (
              <tr key={item.id} className="border-b hover:bg-slate-50 transition-all">
                <td className="p-4 text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                <td className="p-4 font-bold">{item.item_name}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.status === '미확인' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {item.status === '미확인' && (
                    <button onClick={() => handleUpdateStatus(item.id)} className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">확인처리</button>
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
