"use client";
import React, { useEffect, useState } from "react";
// ✅ 1. 여기서 만들어둔 머신(createClient)을 가져오고!
import { createClient } from "@/lib/supabase"; 

export default function TruckPage() {
  // ✅ 2. 컴포넌트 안에서 직접 supabase를 뽑아 쓴다! (경고 없애기 위해 useState 사용!)
  const [supabase] = useState(() => createClient());

  // --- 상태 관리 ---
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [orderType, setOrderType] = useState('당일배차');
  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  // 📝 [수정포인트]: 검색 필터 조건에 work_status(기본값 전체 "") 추가
  const [filters, setFilters] = useState({
    created_start: "", created_end: "", 
    loading_start: "", loading_end: "",
    status: "",
    work_status: ""
  });

  const initialFormState = {
    loading_date: today,
    unloading_date: today,
    loading_place: "", loading_address: "", loading_manager: "", loading_phone: "",
    unloading_place: "", unloading_address: "", unloading_manager: "", unloading_phone: "",
    unloading_place_2: "", unloading_address_2: "", unloading_manager_2: "", unloading_phone_2: "",
    product_name: "", product_name_2: "",
    loading_time: "09:00", unloading_time: "08:00", remarks: "" 
  };

  const [formData, setFormData] = useState(initialFormState);
  const [resData, setResData] = useState({ car_info: "", driver_name: "", fee: "", status: "신청완료", work_status: "상차 진행예정" });

  // ⏰ ✨ [추가포인트]: 상하차 커스텀 시/분 상태 분리 관리
  const [loadingHour, setLoadingHour] = useState("09");
  const [loadingMin, setLoadingMin] = useState("00");
  const [unloadingHour, setUnloadingHour] = useState("08");
  const [unloadingMin, setUnloadingMin] = useState("00");

  // 드롭다운 옵션 목록 정의 (바로배차 추가)
  const hourOptions = ["바로배차", ...Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))];
  const minOptions = ["00", "10", "20", "30", "40", "50"];

  // 데이터 로드 및 수정 시 시간 쪼개서 각 select 박스 상태에 반영하기
  useEffect(() => {
    if (showOrderModal) {
      if (formData.loading_time === "바로배차") {
        setLoadingHour("바로배차");
        setLoadingMin("00");
      } else {
        const [h, m] = (formData.loading_time || "09:00").split(":");
        setLoadingHour(h || "09");
        setLoadingMin(m || "00");
      }

      if (formData.unloading_time === "바로배차") {
        setUnloadingHour("바로배차");
        setUnloadingMin("00");
      } else {
        const [h, m] = (formData.unloading_time || "08:00").split(":");
        setUnloadingHour(h || "08");
        setUnloadingMin(m || "00");
      }
    }
  }, [showOrderModal, formData.loading_time, formData.unloading_time]);

  // 사용자가 드롭다운을 조작할 때 실시간으로 하나의 텍스트("09:00" 또는 "바로배차")로 조립
  useEffect(() => {
    const finalLoading = loadingHour === "바로배차" ? "바로배차" : `${loadingHour}:${loadingMin}`;
    const finalUnloading = unloadingHour === "바로배차" ? "바로배차" : `${unloadingHour}:${unloadingMin}`;
    
    setFormData(prev => ({
      ...prev,
      loading_time: finalLoading,
      unloading_time: finalUnloading
    }));
  }, [loadingHour, loadingMin, unloadingHour, unloadingMin]);

  useEffect(() => { 
    fetchData(); 
    if (!document.getElementById('xlsx-script')) {
      const script = document.createElement('script');
      script.id = 'xlsx-script';
      script.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
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

  const handleOrderTypeChange = (type: string, currentLoadingDate: string) => {
    setOrderType(type);
    if (type === '야상배차' && currentLoadingDate) {
      const nextDay = new Date(currentLoadingDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, unloading_date: nextDayStr }));
    } else {
      setFormData(prev => ({ ...prev, unloading_date: currentLoadingDate }));
    }
  };

  const handleOrderSubmit = async () => {
    if (!formData.loading_place || !formData.unloading_place) return alert("필수 정보를 입력해주세요.");
    const { order_responses, created_at, id, ...pureData } = formData as any;
    const submissionData = { ...pureData, order_type: orderType };

    if (selectedOrder) {
      const { error } = await supabase.from('truck_orders').update(submissionData).eq('id', selectedOrder.id);
      if (!error) { alert("수정 완료! ✨"); setShowOrderModal(false); await fetchData(); }
    } else {
      const { error } = await supabase.from('truck_orders').insert([{ ...submissionData, status: '신청완료', work_status: '상차 진행예정' }]);
      if (!error) { alert("배차 신청 완료! 🚀"); setShowOrderModal(false); await fetchData(); }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('truck_orders').delete().eq('id', id);
    if (!error) await fetchData();
  };

  const handleResponseSubmit = async (orderId: number) => {
    try {
      const { data: existing } = await supabase.from('order_responses').select('id').eq('order_id', orderId).maybeSingle();
      if (existing) {
        await supabase.from('order_responses').update({ car_info: resData.car_info, driver_name: resData.driver_name, fee: resData.fee }).eq('id', existing.id);
      } else {
        await supabase.from('order_responses').insert([{ order_id: orderId, car_info: resData.car_info, driver_name: resData.driver_name, fee: resData.fee }]);
      }
      
      await supabase.from('truck_orders').update({ status: resData.status, work_status: resData.work_status }).eq('id', orderId);
      alert("배차 및 작업 정보가 정상적으로 저장되었습니다! ✅");
      await fetchData();
    } catch (err) {
      alert("저장 중 오류가 발생했습니다. 다시 시도해 주세요!");
    }
  };

  const handleCopyToClipboard = async (orderItem: any) => {
    const copyText = `[NY 로지스 배차 확정 안내]\n\n• 상차지: ${orderItem.loading_place}\n• 하차지: ${orderItem.unloading_place}${orderItem.unloading_place_2 ? ` -> ${orderItem.unloading_place_2}` : ''}\n• 배차유형: ${orderItem.order_type}\n• 차량정보: ${resData.car_info || "미등록"}\n• 기사명/연락처: ${resData.driver_name || "미등록"}\n• 운반비: ${resData.fee || "0"}원\n• 진행상태: ${resData.status}\n• 작업상태: ${resData.work_status}`;
    try {
      await navigator.clipboard.writeText(copyText);
      alert("📋 카톡 전송용 배차 안내 텍스트가 복사되었습니다!\n원하는 카톡방에 Ctrl+V로 붙여넣으세요.");
    } catch (err) {
      alert("클립보드 복사에 실패했습니다. 기기 권한을 확인해 주세요.");
    }
  };

  // 📝 [수정포인트]: handleSearch 필터 기능에 work_status 연동
  const handleSearch = () => {
    let result = [...list];
    if (filters.created_start) result = result.filter(item => item.created_at.split('T')[0] >= filters.created_start);
    if (filters.created_end) result = result.filter(item => item.created_at.split('T')[0] <= filters.created_end);
    if (filters.loading_start) result = result.filter(item => item.loading_date >= filters.loading_start);
    if (filters.loading_end) result = result.filter(item => item.loading_date <= filters.loading_end);
    if (filters.status) result = result.filter(item => item.status === filters.status);
    
    // 작업상태 필터링 (값이 지정되어 있을 때만 필터 동작, 없으면 전체)
    if (filters.work_status) {
      result = result.filter(item => (item.work_status || "상차 진행예정") === filters.work_status);
    }

    setFilteredList(result);
    setCurrentPage(1);
    setExpandedId(null);
  };

  // 📝 [수정포인트]: resetFilters 시 work_status도 리셋되도록 초기화
  const resetFilters = () => {
    setFilters({ created_start: "", created_end: "", loading_start: "", loading_end: "", status: "", work_status: "" });
    setFilteredList(list);
    setCurrentPage(1);
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) setExpandedId(null);
    else {
      setExpandedId(id);
      const order = list.find(o => o.id === id);
      const res = order?.order_responses?.[0];
      setResData({ 
        car_info: res?.car_info || "", 
        driver_name: res?.driver_name || "", 
        fee: res?.fee || "", 
        status: order?.status || "신청완료",
        work_status: order?.work_status || "상차 진행예정" 
      });
    }
  };

  const autoFillLoading = (val: string) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '상차지');
    if(b) setFormData(prev => ({...prev, loading_place: b.place_name, loading_address: b.address}));
  };

  const autoFillUnloading = (val: string, num: number) => {
    const b = bookmarks.find(x => x.place_name === val && x.type === '하차지');
    if(b) {
      const target = num === 1 ? { p: 'unloading_place', a: 'unloading_address', m: 'unloading_manager', ph: 'unloading_phone' } : { p: 'unloading_place_2', a: 'unloading_address_2', m: 'unloading_manager_2', ph: 'unloading_phone_2' };
      setFormData(prev => ({...prev, [target.p]: b.place_name, [target.a]: b.address, [target.m]: b.manager_name || "", [target.ph]: b.manager_phone || ""}));
    }
  };

  const downloadExcel = async () => {
    try {
      const XLSX = (window as any).XLSX;
      if (!XLSX) return alert("라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      const { data, error } = await supabase.from('truck_orders').select(`*, order_responses(*)`).gte('loading_date', excelRange.start).lte('loading_date', excelRange.end).order('loading_date', { ascending: true });
      if (error || !data || data.length === 0) return alert("해당 기간에 데이터가 없습니다.");
      const excelData = data.map((item, index) => ({ "No": index + 1, "작성일자": item.created_at.split('T')[0], "상차일자": item.loading_date, "상차시간": item.loading_time || "", "하차일자": item.unloading_date, "하차시간": item.unloading_time || "", "배차유형": item.order_type, "상차지": item.loading_place, "하차지1": item.unloading_place, "하차지2": item.unloading_place_2 || "-", "제품명": item.product_name, "기사명": item.order_responses?.[0]?.driver_name || "미등록", "차량정보": item.order_responses?.[0]?.car_info || "미등록", "운반비": item.order_responses?.[0]?.fee || "0", "status": item.status, "작업상태": item.work_status || "상차 진행예정" }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "용차배차내역");
      XLSX.writeFile(workbook, `용차배차_${excelRange.start}_${excelRange.end}.xlsx`);
      setShowExcelModal(false);
    } catch (err) { alert("엑셀 생성 오류!"); }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      {/* 🔵 헤더 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full shadow-lg"></div> 
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">용차 <span className="text-blue-600">배차</span></h1>
            <p className="text-slate-400 font-bold mt-1.5 md:mt-2 tracking-tight text-[10px] md:text-xs uppercase">천안센터 관리 시스템</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 md:px-7 py-3 rounded-xl md:rounded-2xl font-black shadow-md hover:bg-green-700 transition-all text-xs md:text-sm text-center">📊 엑셀 다운로드</button>
          <button onClick={() => { setSelectedOrder(null); setFormData(initialFormState); setOrderType('당일배차'); setShowOrderModal(true); }} className="bg-blue-600 text-white px-4 md:px-7 py-3 rounded-xl md:rounded-2xl font-black shadow-md hover:scale-105 transition-all text-xs md:text-sm text-center">+ 신규 배차 신청</button>
        </div>
      </div>

      {/* 🔍 검색 필터 */}
      <div className="bg-white p-5 md:p-7 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 mb-6 md:mb-8 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-10 text-black">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">작성일자</p>
            <div className="flex items-center gap-2">
              <input type="date" className="w-full lg:w-auto p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none shadow-inner" value={filters.created_start} onChange={e => setFilters({...filters, created_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="w-full lg:w-auto p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none shadow-inner" value={filters.created_end} onChange={e => setFilters({...filters, created_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">상차일자</p>
            <div className="flex items-center gap-2">
              <input type="date" className="w-full lg:w-auto p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none shadow-inner" value={filters.loading_start} onChange={e => setFilters({...filters, loading_start: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="w-full lg:w-auto p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none shadow-inner" value={filters.loading_end} onChange={e => setFilters({...filters, loading_end: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Status</p>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full lg:w-auto p-3 bg-slate-100 rounded-xl border-none text-xs font-black text-slate-600 min-w-[150px] outline-none">
              <option value="">상태 전체</option>
              <option value="신청완료">신청완료</option>
              <option value="배차완료">배차완료</option>
            </select>
          </div>
          {/* 📝 [수정포인트]: Status 옆에 작업상태 필터 콤보박스 추가 */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">작업상태</p>
            <select value={filters.work_status} onChange={e => setFilters({...filters, work_status: e.target.value})} className="w-full lg:w-auto p-3 bg-slate-100 rounded-xl border-none text-xs font-black text-slate-600 min-w-[150px] outline-none">
              <option value="">작업 전체</option>
              <option value="상차 진행예정">상차 진행예정</option>
              <option value="상차완료">상차완료</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-2 md:pt-4 border-t border-slate-50">
          <button onClick={handleSearch} className="flex-1 lg:flex-none bg-slate-800 text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-black transition-all">검색 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-6 py-3 rounded-xl font-black text-xs border border-slate-100">리셋</button>
        </div>
      </div>

      {/* 📋 메인 테이블 리스트 (PC 뷰) */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-black text-black">
        <table className="w-full text-sm font-black">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest text-center">
            <tr>
              <th className="p-5 w-14">No</th>
              <th className="p-5 w-28">작성일자</th>
              <th className="p-5 w-20">유형</th>
              <th className="p-5 text-left">배차 정보 (상차지 👉 하차지)</th>
              <th className="p-5 w-24">상차일자</th>
              <th className="p-5 w-20">상차시간</th>
              <th className="p-5 w-24">하차일자</th>
              <th className="p-5 w-20">하차시간</th>
              <th className="p-5 w-24">상태</th>
              <th className="p-5 w-28">작업</th>
              <th className="p-5 w-24">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const displayNo = filteredList.length - (indexOfFirstItem + index);
              const isYasang = item.order_type === "야상배차";
              const isOlive = item.order_type === "올리브영";
              return (
                <React.Fragment key={item.id}>
                  <tr onClick={() => toggleExpand(item.id)} className={`cursor-pointer hover:bg-slate-100/80 border-b transition-colors text-center ${isYasang ? 'bg-indigo-50/40' : isOlive ? 'bg-orange-50/30' : ''}`}>
                    <td className="p-5 text-blue-600">{displayNo}</td>
                    <td className="p-5 text-slate-400 text-xs font-bold">{item.created_at.split('T')[0]}</td>
                    <td className="p-5">
                      <span className={`text-[10px] px-3 py-1.5 rounded-xl font-black block text-center shadow-sm whitespace-nowrap ${isYasang ? 'bg-purple-600 text-white' : isOlive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{isYasang ? '🌙 야상' : isOlive ? '🌿 올영' : '☀️ 당일'}</span>
                    </td>
                    <td className="p-5 text-left">
                      <p className="text-slate-800 text-base tracking-tight font-black">{isYasang && <span className="text-purple-600 mr-1">🌙</span>}{isOlive && <span className="text-amber-500 mr-1">🌿</span>}{item.loading_place} 👉 {item.unloading_place} {item.unloading_place_2 && <span className="text-blue-500">→ {item.unloading_place_2}</span>}</p>
                      <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-bold">📦 {item.product_name} {item.product_name_2 && `| ${item.product_name_2}`}</p>
                    </td>
                    <td className="p-5 text-slate-800 text-xs font-black">{item.loading_date}</td>
                    <td className="p-5 text-slate-600 text-xs font-bold">{item.loading_time || "09:00"}</td>
                    <td className="p-5 text-blue-600 text-xs font-black">{item.unloading_date}</td>
                    <td className="p-5 text-slate-600 text-xs font-bold">{item.unloading_time || "08:00"}</td>
                    <td className="p-5">
                      <span className={`text-[10px] px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>{item.status}</span>
                    </td>
                    <td className="p-5">
                      <span className={`text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap ${item.work_status === '상차완료' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500'}`}>
                        {item.work_status || "상차 진행예정"}
                      </span>
                    </td>
                    <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-center text-[10px]">
                        <button onClick={() => { setSelectedOrder(item); setFormData({...item}); setOrderType(item.order_type); setShowOrderModal(true); }} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-black">수정</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg font-black">삭제</button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={11}>
                        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm m-4">
                            <div className="grid grid-cols-2 gap-8 text-black text-left font-black">
                              <div className="space-y-4">
                                 <p className="text-xs text-blue-600 uppercase tracking-widest italic font-black">📍 Loading & Unloading Info</p>
                                 <div className="bg-slate-50 p-6 rounded-3xl text-xs space-y-3 font-black">
                                    <p><span className="text-slate-400">배차유형:</span> <span className={isYasang ? "text-purple-600 font-black" : isOlive ? "text-amber-600 font-black" : "text-slate-800 font-black"}>{item.order_type} {isYasang ? '🌙' : isOlive ? '🌿' : '☀️'}</span></p>
                                    <p><span className="text-slate-400">상차:</span> {item.loading_date} ({item.loading_time || "09:00"}) / {item.loading_place} ({item.loading_manager || "담당자 미지정"} / {item.loading_phone || "-"})</p>
                                    <p><span className="text-slate-400">주소:</span> {item.loading_address}</p>
                                    
                                    <div className="border-t border-slate-200 my-2 pt-2 space-y-1">
                                      <p><span className="text-slate-400">하차:</span> {item.unloading_date} ({item.unloading_time || "08:00"}) / {item.unloading_place} ({item.unloading_manager || "미등록"} / {item.unloading_phone || "-"})</p>
                                      <p><span className="text-slate-400">하차지 주소:</span> {item.unloading_address}</p>
                                      <p><span className="text-slate-400">제품명:</span> {item.product_name}</p>
                                    </div>

                                    {item.unloading_place_2 && (
                                      <div className="border-t border-slate-200 my-2 pt-2 space-y-1">
                                        <p><span className="text-slate-400">하차2:</span> {item.unloading_place_2} ({item.unloading_manager_2 || "미등록"} / {item.unloading_phone_2 || "-"})</p>
                                        <p><span className="text-slate-400">하차지2 주소:</span> {item.unloading_address_2}</p>
                                        <p><span className="text-slate-400">제품명2:</span> {item.product_name_2}</p>
                                      </div>
                                    )}
                                    <div className="pt-2 border-t border-slate-200">
                                      <span className="text-red-500 font-bold block mb-1">📝 비고 (특이사항):</span>
                                      <p className="text-slate-800 font-black bg-white p-3 rounded-xl border border-red-100 whitespace-pre-wrap leading-relaxed">{item.remarks || "없음"}</p>
                                    </div>
                                 </div>
                              </div>
                              <div className="space-y-4 font-black">
                                 <p className="text-xs text-blue-600 uppercase tracking-widest italic font-black">RM 🚛 Driver & Fee Dispatch</p>
                                 <div className="grid grid-cols-2 gap-3 items-end">
                                    <input placeholder="차량정보" className="p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner font-black text-black" value={resData.car_info} onChange={e => setResData({...resData, car_info: e.target.value})} />
                                    <input placeholder="기사명 연락처" className="p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner font-black text-black" value={resData.driver_name} onChange={e => setResData({...resData, driver_name: e.target.value})} />
                                    <input placeholder="운반비" className="p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner text-blue-600 font-black" value={resData.fee} onChange={e => setResData({...resData, fee: e.target.value})} />
                                    <select className="p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner font-black text-blue-600" value={resData.status} onChange={e => setResData({...resData, status: e.target.value})}>
                                       <option value="신청완료">신청완료</option>
                                       <option value="배차완료">배차완료</option>
                                    </select>
                                    
                                    <div className="col-span-2 space-y-1">
                                      <p className="text-[10px] text-slate-400 ml-1 font-bold">🛠️ 작업 상태 변경</p>
                                      <select className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none shadow-inner font-black text-green-700" value={resData.work_status} onChange={e => setResData({...resData, work_status: e.target.value})}>
                                         <option value="상차 진행예정">상차 진행예정</option>
                                         <option value="상차완료">상차완료</option>
                                      </select>
                                    </div>

                                    <button onClick={() => handleResponseSubmit(item.id)} className="py-4 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all">배차 정보 저장 💾</button>
                                    <button onClick={() => handleCopyToClipboard(item)} className="py-4 bg-green-600 text-white rounded-2xl text-xs font-black shadow-lg hover:bg-green-700 transition-all">카톡 양식 복사 📋</button>
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

      {/* 2. 카드형 리스트 (모바일 뷰) */}
      <div className="block md:hidden space-y-4 text-black">
        {currentItems.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const displayNo = filteredList.length - (indexOfFirstItem + index);
          const isYasang = item.order_type === "야상배차";
          const isOlive = item.order_type === "올리브영";
          return (
            <div key={item.id} className={`p-4 rounded-xl border bg-white shadow-sm transition-all ${isYasang ? 'border-purple-200 bg-purple-50/20' : isOlive ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-blue-600 font-black">#{displayNo}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-black ${isYasang ? 'bg-purple-600 text-white' : isOlive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 border'}`}>{isYasang ? '🌙 야상' : isOlive ? '🌿 올영' : '☀️ 당일'}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${item.status === '배차완료' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>{item.status}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${item.work_status === '상차완료' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-500'}`}>{item.work_status || "상차 진행예정"}</span>
                </div>
                <div className="text-right text-[9px] font-bold space-y-0.5">
                  <p className="text-slate-400">상차: {item.loading_date} ({item.loading_time || "09:00"})</p>
                  <p className="text-blue-600">하차: {item.unloading_date} ({item.unloading_time || "08:00"})</p>
                </div>
              </div>
              <div className="space-y-1" onClick={() => toggleExpand(item.id)}>
                <p className="text-base font-black tracking-tight text-slate-900">{isYasang && <span className="text-purple-600 mr-1">🌙</span>}{isOlive && <span className="text-amber-500 mr-1">🌿</span>}{item.loading_place} 👉 {item.unloading_place}{item.unloading_place_2 && <span className="text-blue-500 text-xs block mt-0.5">→ {item.unloading_place_2}</span>}</p>
                <p className="text-xs text-slate-400 font-bold">📦 {item.product_name}</p>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100">
                <button onClick={() => toggleExpand(item.id)} className="text-xs text-slate-500 font-black flex items-center gap-0.5">{isExpanded ? '상세 닫기 🔼' : '상세 보기 🔽'}</button>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => { setSelectedOrder(item); setFormData({...item}); setOrderType(item.order_type); setShowOrderModal(true); }} className="text-blue-600 font-black px-2 py-1 bg-blue-50 rounded-md">수정</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 font-black px-2 py-1 bg-red-50 rounded-md">삭제</button>
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-4 text-left">
                  <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 font-black">
                    <p><span className="text-slate-400">상차지 주소:</span> {item.loading_address}</p>
                    <p><span className="text-slate-400">상차 담당:</span> {item.loading_manager || "-"} / {item.loading_phone || "-"}</p>
                    
                    <p className="border-t border-slate-200 pt-1.5 mt-1.5"><span className="text-slate-400">하차지 주소:</span> {item.unloading_address}</p>
                    <p><span className="text-slate-400">하차1 담당:</span> {item.unloading_manager || "-"} / {item.unloading_phone || "-"}</p>
                    {item.unloading_place_2 && (
                      <>
                        <p className="border-t border-slate-100 pt-1.5"><span className="text-slate-400">하차지2 주소:</span> {item.unloading_address_2}</p>
                        <p><span className="text-slate-400">하차2 담당:</span> {item.unloading_manager_2 || "-"} / {item.unloading_phone_2 || "-"}</p>
                      </>
                    )}
                    <div className="text-red-500 font-black mt-2 pt-1.5 border-t border-slate-200">
                      <span>비고:</span>
                      <p className="text-slate-800 mt-1 whitespace-pre-wrap bg-white p-2 rounded-lg border">{item.remarks || "없음"}</p>
                    </div>
                  </div>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl font-black block">
                    <p className="text-xs text-blue-600 font-black mb-2">🚛 기사 정보 매칭</p>
                    <input placeholder="차량정보" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-black mb-2" value={resData.car_info} onChange={e => setResData({...resData, car_info: e.target.value})} />
                    <input placeholder="기사명 연락처" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-black mb-2" value={resData.driver_name} onChange={e => setResData({...resData, driver_name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <input placeholder="운반비" className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-blue-600 font-black" value={resData.fee} onChange={e => setResData({...resData, fee: e.target.value})} />
                      <select className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-blue-600" value={resData.status} onChange={e => setResData({...resData, status: e.target.value})}>
                        <option value="신청완료">신청완료</option>
                        <option value="배차완료">배차완료</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      <p className="text-[10px] text-slate-400 ml-1 font-bold">🛠️ 작업 상태 변경</p>
                      <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-green-700" value={resData.work_status} onChange={e => setResData({...resData, work_status: e.target.value})}>
                        <option value="상차 진행예정">상차 진행예정</option>
                        <option value="상차완료">상차완료</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleResponseSubmit(item.id)} className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md text-center">배차 정보 저장 💾</button>
                      <button onClick={() => handleCopyToClipboard(item)} className="w-full py-3.5 bg-green-600 text-white rounded-xl text-xs font-black shadow-md text-center">카톡 양식 복사 📋</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
        
      {/* 🔢 페이지네이션 */}
      <div className="flex justify-center items-center gap-1 md:gap-2 p-4 md:p-8 bg-white border-t border-slate-50 font-black mt-4 rounded-xl md:rounded-none shadow-sm md:shadow-none">
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-black disabled:opacity-30">PREV</button>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 md:w-10 md:h-10 rounded-xl text-xs transition-all font-black ${currentPage === i+1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>{i+1}</button>
          ))}
        </div>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-black disabled:opacity-30">NEXT</button>
      </div>

      {/* 📥 엑셀 기간 선택 모달 */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black mb-2 text-slate-800 tracking-tight uppercase">Excel Download</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">다운로드할 상차일자 기간을 선택하세요.</p>
            <div className="space-y-4 font-black">
              <input type="date" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none text-blue-600 shadow-inner text-xs font-bold" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              <input type="date" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none text-blue-600 shadow-inner text-xs font-bold" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              <div className="flex gap-3 pt-2">
                <button onClick={downloadExcel} className="flex-1 bg-green-600 text-white p-4 rounded-xl font-black text-xs hover:bg-green-700 shadow-md">엑셀 생성</button>
                <button onClick={() => setShowExcelModal(false)} className="bg-slate-100 text-slate-400 px-4 rounded-xl font-black text-xs">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 신규/수정 신청 모달 */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end md:p-4 z-50 overflow-hidden font-black">
          <div className="bg-white w-full max-w-2xl h-full md:h-auto md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-300 relative text-black flex flex-col">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 md:p-10 pb-4 z-20 flex justify-between items-center border-b border-slate-50">
              <h2 className="text-xl md:text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none">{selectedOrder ? '배차 수정 💾' : '신규 배차 신청 🚀'}</h2>
              <button onClick={() => setShowOrderModal(false)} className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all text-sm md:text-xl font-black shadow-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-12 pt-4 space-y-6 md:space-y-8 font-black pb-28 md:pb-12">
              <div className="bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-inner space-y-4 font-black">
                <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm">
                  {['당일배차', '야상배차', '올리브영'].map(t => (
                    <button key={t} type="button" onClick={() => handleOrderTypeChange(t, formData.loading_date)} className={`flex-1 py-3 rounded-lg text-xs transition-all font-black ${orderType === t ? (t === '야상배차' ? 'bg-purple-600 text-white shadow-md' : t === '올리브영' ? 'bg-amber-500 text-white shadow-md' : 'bg-blue-600 text-white shadow-md') : 'text-slate-400'}`}>{t === '야상배차' ? '🌙 야상배차' : t === '올리브영' ? '🌿 올리브영' : '☀️ 당일배차'}</button>
                  ))}
                </div>
                
                {/* 📅 날짜 선택 영역 */}
                <div className="grid grid-cols-2 gap-3">
                   <input type="date" value={formData.loading_date} className="w-full p-3.5 rounded-xl border-none text-xs shadow-sm outline-none font-black text-black" onChange={e => {
                     const newLDate = e.target.value;
                     setFormData(prev => ({ ...prev, loading_date: newLDate }));
                     if (orderType === '야상배차') {
                       const nextDay = new Date(newLDate);
                       nextDay.setDate(nextDay.getDate() + 1);
                       setFormData(prev => ({ ...prev, unloading_date: nextDay.toISOString().split('T')[0] }));
                     } else {
                       setFormData(prev => ({ ...prev, unloading_date: newLDate }));
                     }
                   }} />
                   <input type="date" value={formData.unloading_date} className="w-full p-3.5 rounded-xl border-none text-xs shadow-sm outline-none font-black text-black" onChange={e => setFormData({...formData, unloading_date: e.target.value})} />
                </div>

                {/* ⏰ 커스텀 상차시간 & 하차시간 일치화 레이아웃 영역 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 상차지 시간 */}
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 ml-1 font-bold">상차시간 (24H / 바로배차)</p>
                    <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                      <select value={loadingHour} className="flex-1 bg-transparent text-xs font-black text-black outline-none border-none cursor-pointer" onChange={e => setLoadingHour(e.target.value)}>
                        {hourOptions.map(h => (
                          <option key={h} value={h}>{h === "바로배차" ? "바로배차" : `${h}시`}</option>
                        ))}
                      </select>
                      {loadingHour !== "바로배차" && (
                        <select value={loadingMin} className="bg-transparent text-xs font-black text-blue-600 outline-none border-none cursor-pointer" onChange={e => setLoadingMin(e.target.value)}>
                          {minOptions.map(m => (
                            <option key={m} value={m}>{m}분</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* 하차지 시간 */}
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 ml-1 font-bold">하차시간 (24H / 바로배차)</p>
                    <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                      <select value={unloadingHour} className="flex-1 bg-transparent text-xs font-black text-black outline-none border-none cursor-pointer" onChange={e => setUnloadingHour(e.target.value)}>
                        {hourOptions.map(h => (
                          <option key={h} value={h}>{h === "바로배차" ? "바로배차" : `${h}시`}</option>
                        ))}
                      </select>
                      {unloadingHour !== "바로배차" && (
                        <select value={unloadingMin} className="bg-transparent text-xs font-black text-blue-600 outline-none border-none cursor-pointer" onChange={e => setUnloadingMin(e.target.value)}>
                          {minOptions.map(m => (
                            <option key={m} value={m}>{m}분</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

              </div>
              <section className="space-y-3 font-black">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black ml-2">Loading Point (상차지)</p>
                <div className="grid grid-cols-2 gap-2">
                  <select onChange={e => autoFillLoading(e.target.value)} className="p-4 bg-slate-50 rounded-xl text-xs border-none shadow-inner outline-none font-black text-black">
                    <option value="">상차지 즐겨찾기</option>
                    {bookmarks.filter(b => b.type === '상차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                  </select>
                  <select value={formData.loading_manager} onChange={e => {
                    const s = staffs.find(x => x.name === e.target.value);
                    setFormData(prev => ({...prev, loading_manager: e.target.value, loading_phone: s?.phone || ""}));
                  }} className="p-4 bg-slate-50 rounded-xl text-xs border-none shadow-inner text-blue-600 outline-none font-black">
                    <option value="">담당자 선택</option>
                    {staffs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <input value={formData.loading_place} placeholder="상차지 명칭" className="w-full p-4 bg-slate-50 rounded-xl border-none text-xs shadow-inner font-black text-black" onChange={e => setFormData({...formData, loading_place: e.target.value})} />
                <input value={formData.loading_address} placeholder="상차지 주소" className="w-full p-4 bg-slate-50 rounded-xl border-none text-xs shadow-inner font-black text-black" onChange={e => setFormData({...formData, loading_address: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={formData.loading_manager} placeholder="상차 담당자명" className="w-full p-3.5 bg-slate-50 rounded-xl border-none text-xs shadow-inner font-bold text-black" onChange={e => setFormData({...formData, loading_manager: e.target.value})} />
                  <input value={formData.loading_phone} placeholder="상차 담당자 연락처" className="w-full p-3.5 bg-slate-50 rounded-xl border-none text-xs shadow-inner font-bold text-blue-600" onChange={e => setFormData({...formData, loading_phone: e.target.value})} />
                </div>
              </section>
              <section className="space-y-3 p-5 md:p-8 bg-blue-50/50 rounded-2xl md:rounded-[2.5rem] border border-blue-100 shadow-inner font-black">
                <p className="text-[10px] text-blue-600 uppercase tracking-widest font-black ml-1 italic">Unloading Point 1 (하차지1)</p>
                <select onChange={e => autoFillUnloading(e.target.value, 1)} className="w-full p-4 bg-white rounded-xl text-xs border-none shadow-sm outline-none font-black text-black">
                  <option value="">하차지 즐겨찾기</option>
                  {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                </select>
                <input value={formData.unloading_place} placeholder="하차지1 명칭" className="w-full p-4 bg-white rounded-xl text-xs shadow-sm font-black text-black" onChange={e => setFormData({...formData, unloading_place: e.target.value})} />
                <input value={formData.unloading_address} placeholder="하차지1 주소" className="w-full p-4 bg-white rounded-xl text-xs shadow-sm font-black text-black" onChange={e => setFormData({...formData, unloading_address: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={formData.unloading_manager} placeholder="하차지1 담당자" className="w-full p-3.5 bg-white rounded-xl border-none text-xs shadow-sm font-bold text-black" onChange={e => setFormData({...formData, unloading_manager: e.target.value})} />
                  <input value={formData.unloading_phone} placeholder="하차지1 연락처" className="w-full p-3.5 bg-white rounded-xl border-none text-xs shadow-sm font-bold text-blue-600" onChange={e => setFormData({...formData, unloading_phone: e.target.value})} />
                </div>
                <input value={formData.product_name} placeholder="📦 제품명 및 수량 (하차1)" className="w-full p-4 bg-blue-600 text-white placeholder:text-blue-200 rounded-xl border-none text-xs shadow-md font-black" onChange={e => setFormData({...formData, product_name: e.target.value})} />
              </section>
              <section className="space-y-3 p-5 md:p-8 bg-slate-100/50 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-inner font-black">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black ml-1 italic">Unloading Point 2 (Optional - 하차지2)</p>
                <select onChange={e => autoFillUnloading(e.target.value, 2)} className="w-full p-4 bg-white rounded-xl text-xs border-none shadow-sm outline-none font-black text-black">
                  <option value="">하차지 즐겨찾기</option>
                  {bookmarks.filter(b => b.type === '하차지').map(b => <option key={b.id} value={b.place_name}>{b.place_name}</option>)}
                </select>
                <input value={formData.unloading_place_2} placeholder="하차지2 명칭" className="w-full p-4 bg-white rounded-xl text-xs shadow-sm font-black text-black" onChange={e => setFormData({...formData, unloading_place_2: e.target.value})} />
                <input value={formData.unloading_address_2} placeholder="하차지2 주소" className="w-full p-4 bg-white rounded-xl text-xs shadow-sm font-black text-black" onChange={e => setFormData({...formData, unloading_address_2: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={formData.unloading_manager_2} placeholder="하차지2 담당자" className="w-full p-3.5 bg-white rounded-xl border-none text-xs shadow-sm font-bold text-black" onChange={e => setFormData({...formData, unloading_manager_2: e.target.value})} />
                  <input value={formData.unloading_phone_2} placeholder="하차지2 연락처" className="w-full p-3.5 bg-white rounded-xl border-none text-xs shadow-sm font-bold text-blue-600" onChange={e => setFormData({...formData, unloading_phone_2: e.target.value})} />
                </div>
                <input value={formData.product_name_2} placeholder="📦 제품명 및 수량 (하차2)" className="w-full p-4 bg-slate-800 text-white placeholder:text-slate-400 rounded-xl border-none text-xs shadow-md font-black" onChange={e => setFormData({...formData, product_name_2: e.target.value})} />
              </section>
              <textarea value={formData.remarks} placeholder="📝 기타 비고 (특이사항)" className="w-full p-4 bg-slate-50 rounded-xl border-none text-xs shadow-inner h-28 font-black text-black" onChange={e => setFormData({...formData, remarks: e.target.value})} />
              <button onClick={handleOrderSubmit} className="w-full p-4 md:p-6 bg-blue-600 text-white rounded-xl md:rounded-[2.5rem] text-sm md:text-xl font-black shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest">{selectedOrder ? 'Save Changes 💾' : 'Submit Dispatch 🚀'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
