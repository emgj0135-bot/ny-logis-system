"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TruckPage() {
  const [role, setRole] = useState<string | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    tonnage: "5톤", truck_type: "윙바디", start_place: "", end_place: "",
    price: 0, status: "신청완료", vendor_info: ""
  });

  const [dispatchData, setDispatchData] = useState({
    driver_name: "", driver_phone: "", car_number: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setRole(user?.user_metadata?.role || 'user');
    const { data } = await supabase.from('truck_orders').select('*').order('created_at', { ascending: false });
    setList(data || []);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('truck_orders').insert([formData]);
    if (error) alert(error.message);
    else { setIsModalOpen(false); fetchData(); }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const info = `🚚 ${dispatchData.car_number} / ${dispatchData.driver_name} (${dispatchData.driver_phone})`;
    const { error } = await supabase
      .from('truck_orders')
      .update({ status: '배차완료', vendor_info: info })
      .eq('id', editingItem.id);
    
    if (error) alert(error.message);
    else { setIsDispatchModalOpen(false); setDispatchData({ driver_name: "", driver_phone: "", car_number: "" }); fetchData(); }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 블루 포인트 헤더 섹션 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              TRUCK <span className="text-blue-600">DISPATCH</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">
              천안센터 <span className="text-blue-600 font-black">용차 배차 및 기사 정보 관리 시스템</span>
            </p>
          </div>
        </div>
        {role === 'admin' && (
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-105 transition-all text-sm">
            + 신규 배차 요청
          </button>
        )}
      </div>

      {/* 리스트 카드 섹션 */}
      <div className="grid grid-cols-1 gap-4 max-w-5xl mx-auto">
        {list.map((item) => (
          <div key={item.id} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-8">
              <div className={`w-20 py-10 rounded-[2rem] flex flex-col items-center justify-center font-black text-xs ${item.status === '배차완료' ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white animate-pulse shadow-lg shadow-blue-100'}`}>
                <p>{item.status === '배차완료' ? '완료' : '대기'}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase">{item.tonnage} {item.truck_type}</span>
                  <p className="font-black text-slate-800 text-xl tracking-tight">{item.start_place} → {item.end_place}</p>
                </div>
                <p className="text-sm font-bold text-blue-600 tracking-tight">
                  {item.status === '배차완료' ? item.vendor_info : '상세 배차 정보를 기다리고 있습니다.'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-slate-900 text-2xl tracking-tighter mb-2">{item.price?.toLocaleString()}원</p>
              {(role === 'admin' || role === 'truck_vendor') && item.status === '신청완료' && (
                <button 
                  onClick={() => { setEditingItem(item); setIsDispatchModalOpen(true); }}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-blue-600 transition-all"
                >
                  배차 정보 등록
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 🚚 업체용 배차 등록 모달 (갱미가 말한 요청 요약 정보 포함!) */}
      {isDispatchModalOpen && editingItem && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-6 text-slate-800 uppercase italic">Dispatch <span className="text-blue-600">Info</span></h2>
            
            {/* 💡 요청 정보 요약 박스 (이게 핵심!) */}
            <div className="bg-blue-50 p-6 rounded-[2rem] mb-8 border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-2 tracking-widest italic">Request Summary</p>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    {editingItem.tonnage} <span className="text-blue-600">{editingItem.truck_type}</span>
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    {editingItem.start_place} → {editingItem.end_place}
                  </p>
                </div>
                <p className="text-base font-black text-slate-800">
                  {editingItem.price?.toLocaleString()}원
                </p>
              </div>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 ml-4 uppercase">차량 번호</p>
                <input required placeholder="예: 12가 3456" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" onChange={e => setDispatchData({...dispatchData, car_number: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 ml-4 uppercase">기사 성함</p>
                  <input required placeholder="성함" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" onChange={e => setDispatchData({...dispatchData, driver_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 ml-4 uppercase">연락처</p>
                  <input required placeholder="010-0000-0000" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-xs shadow-inner" onChange={e => setDispatchData({...dispatchData, driver_phone: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-5 rounded-[1.5rem] font-black shadow-xl hover:bg-blue-700 transition-all uppercase text-sm">등록 완료</button>
                <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="bg-slate-100 text-slate-400 px-8 rounded-[1.5rem] font-black text-sm">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ➕ 관리자용 배차 요청 모달 (디자인 통일) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-8 text-slate-800 uppercase italic">New <span className="text-blue-600">Request</span></h2>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select className="p-5 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-inner text-blue-600" onChange={e => setFormData({...formData, tonnage: e.target.value})}>
                  <option>1톤</option><option>2.5톤</option><option>5톤</option><option>11톤</option><option>25톤</option>
                </select>
                <select className="p-5 bg-slate-50 rounded-2xl font-bold text-sm border-none shadow-inner text-blue-600" onChange={e => setFormData({...formData, truck_type: e.target.value})}>
                  <option>윙바디</option><option>카고</option><option>냉장</option><option>냉동</option>
                </select>
              </div>
              <input required placeholder="상차지 (예: 천안센터)" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" onChange={e => setFormData({...formData, start_place: e.target.value})} />
              <input required placeholder="하차지" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" onChange={e => setFormData({...formData, end_place: e.target.value})} />
              <input required type="number" placeholder="운임료" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-sm shadow-inner" onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} />
              <div className="flex gap-3 mt-8">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-5 rounded-[1.5rem] font-black shadow-xl hover:bg-blue-700 transition-all uppercase text-sm">요청 하기</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-100 text-slate-400 px-8 rounded-[1.5rem] font-black text-sm">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
