"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 

export default function TruckPage() {
  // --- 상태 관리 ---
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ✨ 추가된 권한 상태
  const [userRole, setUserRole] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('당일배차');
  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  const [filters, setFilters] = useState({
    created_start: "", created_end: "", 
    loading_start: "", loading_end: "",
    status: ""
  });

  const initialFormState = {
    loading_date: today,
    unloading_date: today,
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: "",
    product_name: "", product_name_2: "",
    loading_time: "09:00", unloading_time: "익일 08:00", remarks: ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [resData, setResData] = useState({ car_info: "", driver_name: "", fee: "", status: "신청완료" });

  // ✨ 유저 권한 확인 로직 추가
  useEffect(() => { 
    const checkUserAndFetch = async () => {
      // 1. 세션에서 유저 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.user_metadata?.role || "guest";
      setUserRole(role);
      
      // 💡 콘솔에 역할 출력 (성공 확인용)
      console.log("🔥 현재 로그인한 유저의 역할:", role);
      
      // 2. 데이터 호출
      fetchData(); 
    };

    checkUserAndFetch();
  }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from('bookmarks').select('*');
    setBookmarks(bData || []);
    const { data: sData } = await supabase.from('staff').select('*');
    setStaffs(sData || []);
    const { data: lData, error } = await supabase
      .from('truck_orders')
      .select(`*, order_responses(*)`)
      .order('created_at', { ascending: false });
    
    if (!error) {
      setList(lData || []);
      setFilteredList(lData || []);
    }
  };

  // 🚀 배차 신청/수정 로직
  const handleOrderSubmit = async () => {
    if (!formData.loading_place || !formData.unloading_place) return alert("필수 정보를 입력해주세요.");
    const { order_responses, created_at, id, ...pureData } = formData as any;
    const submissionData = { ...pureData, order_type: orderType };

    if (selectedOrder) {
      const { error } = await supabase.from('truck_orders').update(submissionData).eq('id', selectedOrder.id);
      if (!error) { alert("수정 완료! ✨"); setShowOrderModal(false); await fetchData(); }
    } else {
      const { error } = await supabase.from('truck_orders').insert([{ ...submissionData, status: '신청완료' }]);
      if (!error) { alert("배차 신청 완료! 🚀"); setShowOrderModal(false); await fetchData(); }
    }
  };

  // 🗑️ 삭제 로직
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제할까?")) return;
    const { error } = await supabase.from('truck_orders').delete().eq('id', id);
    if (!error) await fetchData();
  };

  // ✅ 배차 정보 저장 로직
  const handleResponseSubmit = async (orderId: number) => {
    const { data: existing } = await supabase.from('order_responses').select('id').eq('order_id', orderId).maybeSingle();
    if (existing) {
      await supabase.from('order_responses').update({ car_info: resData.car_info, driver_name: resData.driver_name, fee: resData.fee }).eq('id', existing.id);
    } else {
      await supabase.from('order_responses').insert([{ order_id: orderId, car_info: resData.car_info, driver_name: resData.driver_name, fee: resData.fee }]);
    }
    await supabase.from('truck_orders').update({ status: resData.status }).eq('id', orderId);
    alert("배차 정보 저장 완료! ✅");
    await fetchData();
  };

  const handleSearch = () => {
    let result = [...list];
    if (filters.created_start) result = result.filter(item => item.created_at.split('T')[0] >= filters.created_start);
    if (filters.created_end) result = result.filter(item => item.created_at.split('T')[0] <= filters.created_end);
    if (filters.loading_start) result = result.filter(item => item.loading_date >= filters.loading_start);
    if (filters.loading_end) result = result.filter(item => item.loading_date <= filters.loading_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);
    setFilteredList(result);
    setCurrentPage(1);
    setExpandedId(null);
  };

  const resetFilters = () => {
    setFilters({ created_start: "", created_end: "", loading_start: "", loading_end: "", status: "" });
    setFilteredList(list);
    setCurrentPage(1);
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) setExpandedId(null);
    else {
      setExpandedId(id);
      const order = list.find(o => o.id === id);
      const res = order?.order_responses?.[0];
      setResData({ car_info: res?.car_info || "", driver_name: res?.driver_name || "", fee: res?.fee || "", status: order?.status || "신청완료" });
    }
  };

  const autoFillLoading = (val: string) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '상차지');
    if(b) setFormData(prev => ({...prev, loading_place: b.place_name, loading_address: b.address}));
  };

  const autoFillUnloading = (val: string, num: number) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '하차지');
    if(b) {
      const target = num === 1 
        ? { p: 'unloading_place', a: 'unloading_address', m: 'unloading_manager', ph: 'unloading_phone' }
        : { p: 'unloading_place_2', a: 'unloading_address_2', m: 'unloading_manager_2', ph: 'unloading_phone_2' };
      setFormData(prev => ({...prev, [target.p]: b.place_name, [target.a]: b.address, [target.m]: b.manager_name, [target.ph]: b.manager_phone}));
    }
  };

  const downloadExcel = async () => {
    try {
      const XLSX = (window as any).XLSX;
      if (!XLSX) return alert("라이브러리 로딩 중입니다.");
      const { data } = await supabase.from('truck_orders').select(`*, order_responses(*)`).gte('loading_date', excelRange.start).lte('loading_date', excelRange.end).order('loading_date', { ascending: true });
      if (!data || data.length === 0) return alert("데이터가 없습니다.");
      const excelData = data.map((item, index) => ({ "No": index + 1, "작성일자": item.created_at.split('T')[0], "상차일자": item.loading_date, "배차유형": item.order_type, "상차지": item.loading_place, "하차지1": item.unloading_place, "기사명": item.order_responses?.[0]?.driver_name || "미등록", "상태": item.status }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "용차배차내역");
      XLSX.writeFile(workbook, `용차배차_${excelRange.start}.xlsx`);
      setShowExcelModal(false);
    } catch (err) { alert("엑셀 생성 오류!"); }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full shadow-lg"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">용차 <span className="text-blue-600">배차</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">천안센터 관리 시스템</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* ✨ 관리자만 엑셀 버튼 보이기 */}
          {userRole === 'admin' && (
            <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all text-sm font-black">📊 엑셀 다운로드</button>
          )}
          <button onClick={() => { setSelectedOrder(null); setFormData(initialFormState); setShowOrderModal(true); }} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg hover:scale-105 transition-all text-sm font-black">+ 신규 배차 신청</button>
        </div>
      </div>

      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">작성일자</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none shadow-inner" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none shadow-inner" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">상차일자</p>
            <div className="flex items-center gap-3">
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none shadow-inner" value={filters.loading_start} onChange={e => setFilters({...filters, loading_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none shadow-inner" value={filters.loading_end} onChange={e => setFilters({...filters, loading_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Status</p>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[150px] outline-none">
              <option value="">상태 전체</option>
              <option value="신청완료">신청완료</option>
              <option value="배차완료">배차완료</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50">
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all">검색 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs border border-slate-100 font-black">리셋</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-black text-black">
        <table className="w-full text-sm font-black">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest text-center">
            <tr>
              <th className="p-5 w-16">No</th>
              <th className="p-5 w-32">작성일자</th>
              <th className="p-5 text-left">배차 정보 (상차지 👉 하차지)</th>
              <th className="p-5 w-32">상차일자</th>
              <th className="p-5 w-24">상태</th>
              <th className="p-5 w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const displayNo = filteredList.length - (indexOfFirstItem + index);
              return (
                <React.Fragment key={item.id}>
                  <tr onClick={() => toggleExpand(item.id)} className="cursor-pointer hover:bg-slate-50 border-b transition-colors text-center">
                    <td className="p-5 text-blue-600">{displayNo}</td>
                    <td className="p-5 text-slate-400 text-xs font-bold">{item.created_at.split('T')[0]}</td>
                    <td className="p-5 text-left">
                      <p className="text-slate-800 text-base tracking-tight font-black">{item.loading_place} 👉 {item.unloading_place} {item.unloading_place_2 && <span className="text-blue-500">→ {item.unloading_place_2}</span>}</p>
                      <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-bold">📦 {item.product_name} {item.product_name_2 && `| ${item.product_name_2}`}</p>
                    </td>
                    <td className="p-5 text-slate-800 text-xs font-black">{item.loading_date}</td>
                    <td className="p-5">
                      <span className={`text-[10px] px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>{item.status}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex gap-2 justify-center text-[10px]">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(item); setFormData({...item}); setOrderType(item.order_type); setShowOrderModal(true); }} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-black">수정</button>
                        {/* ✨ 관리자만 삭제 버튼 보이기 */}
                        {userRole === 'admin' && (
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg font-black">삭제</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="p-8">
                        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                            <div className="grid grid-cols-2 gap-8 text-black text-left font-black">
                              <div className="space-y-4">
                                 <p className="text-xs text-blue-600 uppercase tracking-widest italic font-black">📍 Loading & Unloading Info</p>
                                 <div className="bg-slate-50 p-6 rounded-3xl text-xs space-y-2 font-black">
                                    <p><span className="text-slate-400">상차:</span> {item.loading_place} / {item.loading_address}</p>
                                    <p><span className="text-slate-400">하차1:</span> {item.unloading_place} ({item.product_name})</p>
                                    {item.unloading_place_2 && <p><span className="text-slate-400">하차2:</span> {item.unloading_place_2} ({item.product_name_2})</p>}
                                    <p className="pt-2 text-red-500 font-bold font-black underline underline-offset-4 decoration-2">비고: {item.remarks || "없음"}</p>
                                 </div>
                              </div>
                              <div className="space-y-4 font-black">
                                 <p className="text-xs text-blue-600 uppercase tracking-widest italic font-black">🚛 Driver & Fee Dispatch</p>
                                 <div className="grid grid-cols-2 gap-3 items-end">
                                    <input placeholder="차량정보" className="p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner font-black" value={resData.car_info} onChange={e => setResData({...resData, car_info: e.target.value})} />
                                    <input placeholder="기사명 연락처" className="p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner font-black" value={resData.driver_name} onChange={e => setResData({...resData, driver_name: e.target.value})} />
                                    <input placeholder="운반비" className="p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner text-blue-600 font-black" value={resData.fee} onChange={e => setResData({...resData, fee: e.target.value})} />
                                    <select className="p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner font-black text-blue-600" value={resData.status} onChange={e => setResData({...resData, status: e.target.value})}>
                                       <option value="신청완료">신청완료</option>
                                       <option value="배차완료">배차완료</option>
                                    </select>
                                    <button onClick={() => handleResponseSubmit(item.id)} className="col-span-2 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all font-black">배차 정보 업데이트</button>
                                 </div>
                              </div>
                            </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50 overflow-hidden font-black">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 relative text-black flex flex-col">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-10 pb-5 z-20 flex justify-between items-center border-b border-slate-50">
              <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none">
                {selectedOrder ? '배차 수정 💾' : '신규 배차 신청 🚀'}
              </h2>
              <button onClick={() => setShowOrderModal(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all text-xl font-black shadow-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 pt-5 space-y-8 font-black">
              <div className="bg-slate-50 p-6 rounded-[2.5rem] shadow-inner space-y-4 font-black">
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm">
                  {['당일배차', '야상배차'].map(t => (
                    <button key={t} onClick={() => setOrderType(t)} className={`flex-1 py-3 rounded-xl text-xs transition-all font-black ${orderType === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>{t}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input type="date" value={formData.loading_date} className="w-full p-4 rounded-2xl border-none text-sm shadow-sm outline-none font-black text-black" onChange={e => setFormData({...formData, loading_date: e.target.value})} />
                   <input type="date" value={formData.unloading_date} className="w-full p-4 rounded-2xl border-none text-sm shadow-sm outline-none font-black text-black" onChange={e => setFormData({...formData, unloading_date: e.target.value})} />
                </div>
              </div>
              <section className="space-y-4 font-black">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black ml-4">Loading Point</p>
                <div className="grid grid-cols-2 gap-3 font-black">
                  <select onChange={e => autoFillLoading(e.target.value)} className="p-5 bg-slate-50 rounded-2xl text-sm border-none shadow-inner outline-none font-black">
                    <option value="">상차지 즐겨찾기</option>
                    {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                  </select>
                  <select onChange={e => {
                    const s = staffs.find(x => x.name === e.target.value);
                    setFormData(prev => ({...prev, loading_manager: e.target.value, loading_phone: s?.phone || ""}));
                  }} className="p-5 bg-slate-50 rounded-2xl text-sm border-none shadow-inner text-blue-600 outline-none font-black">
                    <option value="">담당자 선택</option>
                    {staffs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <input value={formData.loading_place} placeholder="상차지 명칭" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner font-black text-black" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                <input value={formData.loading_address} placeholder="상차지 주소" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner font-black text-black" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
              </section>
              <section className="space-y-4 p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 shadow-inner font-black">
                <p className="text-[10px] text-blue-600 uppercase tracking-widest font-black ml-2 italic font-black">Unloading Point 1</p>
                <select onChange={e => autoFillUnloading(e.target.value, 1)} className="w-full p-5 bg-white rounded-2xl text-sm border-none shadow-sm outline-none font-black text-black">
                  <option value="">하차지 즐겨찾기</option>
                  {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                </select>
                <input value={formData.unloading_place} placeholder="하차지1 명칭" className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm font-black text-black font-black" onChange={e => setFormData({...formData, unloading_place: e.target.value})} />
                <input value={formData.unloading_address} placeholder="하차지1 주소" className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm font-black text-black font-black" onChange={e => setFormData({...formData, unloading_address: e.target.value})} />
                <input value={formData.product_name} placeholder="📦 제품명 및 수량 (하차1)" className="w-full p-5 bg-blue-600 text-white placeholder:text-blue-200 rounded-2xl border-none text-sm shadow-md font-black" onChange={e => setFormData({...formData, product_name: e.target.value})} />
              </section>
              <section className="space-y-4 p-8 bg-slate-100/50 rounded-[2.5rem] border border-slate-200 shadow-inner font-black">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black ml-2 italic font-black">Unloading Point 2 (Optional)</p>
                <select onChange={e => autoFillUnloading(e.target.value, 2)} className="w-full p-5 bg-white rounded-2xl text-sm border-none shadow-sm outline-none font-black text-black">
                  <option value="">하차지 즐겨찾기</option>
                  {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                </select>
                <input value={formData.unloading_place_2} placeholder="하차지2 명칭" className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm font-black text-black font-black" onChange={e => setFormData({...formData, unloading_place_2: e.target.value})} />
                <input value={formData.unloading_address_2} placeholder="하차지2 주소" className="w-full p-5 bg-white rounded-2xl border-none text-sm shadow-sm font-black text-black font-black" onChange={e => setFormData({...formData, unloading_address_2: e.target.value})} />
                <input value={formData.product_name_2} placeholder="📦 제품명 및 수량 (하차2)" className="w-full p-5 bg-slate-800 text-white placeholder:text-slate-400 rounded-2xl border-none text-sm shadow-md font-black" onChange={e => setFormData({...formData, product_name_2: e.target.value})} />
              </section>
              <textarea value={formData.remarks} placeholder="📝 기타 비고 (특이사항)" className="w-full p-5 bg-slate-50 rounded-2xl border-none text-sm shadow-inner h-32 font-black text-black font-black" onChange={e => setFormData({...formData, remarks: e.target.value})} />
              <button onClick={handleOrderSubmit} className="w-full p-6 bg-blue-600 text-white rounded-[2.5rem] text-xl font-black shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest font-black">
                {selectedOrder ? 'Save Changes 💾' : 'Submit Dispatch 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
