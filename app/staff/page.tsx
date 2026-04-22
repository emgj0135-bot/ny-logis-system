"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function StaffPage() {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => { fetchStaffs(); }, []);
  const fetchStaffs = async () => {
    const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    setStaffs(data || []);
  };

  const handleAdd = async () => {
    await supabase.from('staff').insert([{ name, phone }]);
    setName(""); setPhone(""); fetchStaffs();
  };

  const handleDelete = async (id: number) => {
    if (confirm("삭제하시겠습니까?")) {
      await supabase.from('staff').delete().eq('id', id);
      fetchStaffs();
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-2xl font-black mb-6">👥 상차 담당자 관리</h1>
      <div className="flex gap-2 mb-8 bg-slate-50 p-6 rounded-2xl">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" className="p-3 rounded-xl border-none font-bold shadow-sm" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="연락처" className="p-3 rounded-xl border-none font-bold shadow-sm" />
        <button onClick={handleAdd} className="bg-slate-900 text-white px-6 rounded-xl font-bold">등록</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {staffs.map(s => (
          <div key={s.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
            <div><p className="font-black">{s.name}</p><p className="text-xs text-slate-400 font-bold">{s.phone}</p></div>
            <button onClick={() => handleDelete(s.id)} className="text-red-400 font-bold text-xs">삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
