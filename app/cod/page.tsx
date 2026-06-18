"use client";
import React, { useEffect, useState } from 'react';
// ✅ 1. createClient 가져오기
import { createClient } from '../../lib/supabase';

export default function CodPage() {
  // ✅ 2. 컴포넌트 시작하자마자 supabase 머신 딱 한 번만 돌리기!
  const [supabase] = useState(() => createClient());

  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [filteredList, setFilteredList] = useState<any[]>([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const today = new Date().toISOString().split('T')[0];

  // 검색 필터 상태
  const [searchInputs, setSearchInputs] = useState({
    startDate: '',
    endDate: '',
    searchText: '',
    status: '',
    payType: ''
  });

  // 엑셀 다운로드용 기간 상태
  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  const [formData, setFormData] = useState({
    pay_type: '정산입금', 
    customer_name: '', 
    manager_name: '', // ✨ 담당자명 필드 추가
    delivery_company: '',
    return_invoice: '', 
    fee: 0, 
    memo: '', 
    status: '미확인'
  });

  useEffect(() => { 
    fetchCod(); 
    if (!document.getElementById('xlsx-script')) {
      const script = document.createElement('script');
      script.id = 'xlsx-script';
      script.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js";
      document.head.appendChild(script);
    }
  }, []);

  const fetchCod = async () => {
    const { data, error } = await supabase.from('cod_manage').select('*').order('created_at', { ascending: false });
    if (!error) {
      setList(data || []);
      setFilteredList(data || []);
      setSelectedIds([]);
    }
  };

  const downloadExcel = async () => {
    try {
      // @ts-ignore
      const XLSX = window.XLSX;
      if (!XLSX) return alert("라이브러리 로딩 중...");
      const { data, error } = await supabase
        .from('cod_manage')
        .select('*')
        .gte('created_at', `${excelRange.start}T00:00:00`)
        .lte('created_at', `${excelRange.end}T23:59:59`)
        .order('created_at', { ascending: true });
      if (error || !data || data.length === 0) return alert("해당 기간에 데이터가 없습니다.");
      const excelData = data.map((item, index) => ({
        "No": index + 1,
        "작성일자": item.created_at.split('T')[0],
        "상태": item.status,
        "담당자": item.manager_name || "-", // 엑셀에도 담당자 추가
        "구분": item.pay_type,
        "업체명": item.customer_name,
        "택배사": item.delivery_company,
        "반송장번호": item.return_invoice,
        "운임비": item.fee,
        "비고": item.memo || ""
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "착불정산내역");
      XLSX.writeFile(workbook, `착불정산_${excelRange.start}_${excelRange.end}.xlsx`);
      setShowExcelModal(false);
    } catch (err) { alert("엑셀 생성 오류!"); }
  };

  const handleSearch = () => {
    let temp = [...list];
    if (searchInputs.startDate) temp = temp.filter(item => item.created_at.split('T')[0] >= searchInputs.startDate);
    if (searchInputs.endDate) temp = temp.filter(item => item.created_at.split('T')[0] <= searchInputs.endDate);
    if (searchInputs.searchText) {
      const txt = searchInputs.searchText.toLowerCase();
      // 업체명, 반송장뿐만 아니라 담당자명으로도 검색되게 수정!
      temp = temp.filter(item => 
        item.customer_name.toLowerCase().includes(txt) || 
        item.return_invoice.toLowerCase().includes(txt) ||
        (item.manager_name && item.manager_name.toLowerCase().includes(txt))
      );
    }
    if (searchInputs.status) temp = temp.filter(item => item.status === searchInputs.status);
    if (searchInputs.payType) temp = temp.filter(item => item.pay_type === searchInputs.payType);
    setFilteredList(temp);
    setSelectedIds([]);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchInputs({ startDate: '', endDate: '', searchText: '', status: '', payType: '' });
    setFilteredList(list);
    setSelectedIds([]);
    setCurrentPage(1);
  };

  const handleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const handleSelectAll = () => {
    const ids = currentItems.map(i => i.id);
    setSelectedIds(ids.every(id => selectedIds.includes(id)) ? prev => prev.filter(id => !ids.includes(id)) : prev => Array.from(new Set([...prev, ...ids])));
  };
  
  const handleBulkUpdate = async (targetStatus: '확인됨' | '미확인') => {
    if (selectedIds.length === 0) return alert("항목을 선택해주세요.");
    const { error } = await supabase.from('cod_manage').update({ status: targetStatus, is_confirmed: targetStatus === '확인됨' }).in('id', selectedIds);
    if (!error) { alert("업데이트 완료! ✨"); fetchCod(); }
  };

  const toggleConfirm = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation(); 
    const isConfirmed = item.status === '확인됨';
    const nextStatus = isConfirmed ? '미확인' : '확인됨';
    
    const { error } = await supabase
      .from('cod_manage')
      .update({ is_confirmed: !isConfirmed, status: nextStatus })
      .eq('id', item.id);
      
    if (!error) await fetchCod();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingItem;
    const { error } = await (isEdit ? supabase.from('cod_manage').update(formData).eq('id', editingItem.id) : supabase.from('cod_manage').insert([formData]));
    if (!error) { alert(isEdit ? "✅ 수정 완료!" : "🚀 등록 완료!"); closeModal(); fetchCod(); }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); 
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from('cod_manage').delete().eq('id', id); 
    if (!error) { 
      alert("삭제 완료! 🗑️"); 
      await fetchCod(); 
    }
  };

  const openModal = (item: any = null) => {
    if (item) { setEditingItem(item); setFormData({ ...item }); }
    else { setEditingItem(null); setFormData({ pay_type: '정산입금', customer_name: '', manager_name: '', delivery_company: '', return_invoice: '', fee: 0, memo: '', status: '미확인' }); }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

  const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      
      {/* 🔵 헤더 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-100"></div> 
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">착불 <span className="text-blue-600">관리</span></h1>
            <p className="text-slate-400 font-bold mt-1.5 md:mt-2 tracking-tight text-[10px] md:text-xs uppercase text-blue-600/60">천안센터 착불 정산 시스템</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-4 md:px-7 py-3 rounded-xl md:rounded-2xl font-black shadow-md text-xs md:text-sm text-center">📊 엑셀 다운로드</button>
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 md:px-7 py-3 rounded-xl md:rounded-2xl font-black shadow-md text-xs md:text-sm text-center">+ 신규 데이터 등록</button>
        </div>
      </div>

      {/* 🔍 검색 필터 */}
      <div className="bg-white p-5 md:p-7 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 mb-6 md:mb-8 space-y-4 md:space-y-6 font-black">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-10 text-black">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Created Date</p>
            <div className="flex items-center gap-2 font-bold">
              <input type="date" className="w-full lg:w-auto p-3 bg-slate-50 rounded-xl outline-none text-xs" value={searchInputs.startDate} onChange={e => setSearchInputs({...searchInputs, startDate: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="w-full lg:w-auto p-3 bg-slate-50 rounded-xl outline-none text-xs" value={searchInputs.endDate} onChange={e => setSearchInputs({...searchInputs, endDate: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Search Info</p>
            <input type="text" placeholder="업체명, 반송장, 담당자" className="w-full lg:w-auto p-3 bg-slate-50 rounded-xl outline-none text-xs sm:w-64 font-bold" value={searchInputs.searchText} onChange={e => setSearchInputs({...searchInputs, searchText: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2 md:pt-4 border-t border-slate-50 items-start sm:items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="p-3 bg-slate-100 rounded-xl border-none text-xs font-black text-slate-600 outline-none" value={searchInputs.payType} onChange={e => setSearchInputs({...searchInputs, payType: e.target.value})}><option value="">구분 전체</option><option value="정산입금">정산입금</option><option value="업체입금">업체입금</option></select>
            <select className="p-3 bg-slate-100 rounded-xl border-none text-xs font-black text-slate-600 outline-none" value={searchInputs.status} onChange={e => setSearchInputs({...searchInputs, status: e.target.value})}><option value="">상태 전체</option><option value="미확인">미확인</option><option value="확인됨">확인됨</option></select>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleSearch} className="flex-1 sm:flex-none bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-black transition-all">SEARCH 🔍</button>
            <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-5 py-3 rounded-xl font-black text-xs border border-slate-100">RESET</button>
          </div>
          
          <div className="w-full sm:w-auto sm:ml-auto flex gap-1.5 bg-slate-100 p-1.5 rounded-xl justify-center shrink-0">
            <button onClick={() => handleBulkUpdate('확인됨')} className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm">일괄확인 ✅</button>
            <button onClick={() => handleBulkUpdate('미확인')} className="bg-white text-red-500 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm">일괄미확인 ❌</button>
          </div>
        </div>
      </div>

      {/* 📋 메인 정산 목록 (PC 버전) */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-black text-black">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest text-center">
            <tr>
              <th className="p-5 w-12"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer" onChange={handleSelectAll} checked={currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id))} /></th>
              <th className="p-5 w-24">상태</th>
              <th className="p-5 w-28">담당자</th> {/* ✨ PC 테이블 담당자 추가 */}
              <th className="p-5 w-32">작성일자</th>
              <th className="p-5 w-32">구분</th>
              <th className="p-5 text-left">업체 / 반송장 정보</th>
              <th className="p-5 w-32">운임비</th>
              <th className="p-5 w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50 border-b transition-colors text-center cursor-pointer ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`} onClick={() => openModal(item)}>
                  <td className="p-5" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} /></td>
                  <td className="p-5">
                    <button onClick={(e) => toggleConfirm(e, item)} className={`px-4 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-all ${item.status === '확인됨' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse'}`}>
                      {item.status}
                    </button>
                  </td>
                  <td className="p-5 text-slate-700 text-xs">{item.manager_name || "-"}</td> {/* ✨ PC 테이블 담당자 값 */}
                  <td className="p-5 text-slate-500 text-xs">{item.created_at.split('T')[0]}</td>
                  <td className="p-5 text-center text-[10px]"><span className={`inline-block px-3 py-1 rounded-lg ${item.pay_type === '정산입금' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>{item.pay_type}</span></td>
                  <td className="p-5 text-left">
                    <p className="text-slate-800 text-base tracking-tight font-black hover:text-blue-600">{item.customer_name}</p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase font-mono font-normal">{item.delivery_company} | {item.return_invoice}</p>
                  </td>
                  <td className="p-5 text-center"><p className="text-blue-600 text-lg font-black">{item.fee.toLocaleString()}원</p></td>
                  <td className="p-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-4 justify-center text-[10px] text-slate-300 uppercase font-black">
                      <button onClick={() => openModal(item)} className="hover:text-blue-600">수정</button>
                      <button onClick={(e) => handleDelete(e, item.id)} className="hover:text-red-500">삭제</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="p-20 text-center text-slate-300 font-bold italic text-lg">데이터가 없습니다. 🔍</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📱 모바일 리스트 */}
      <div className="block md:hidden space-y-4 text-black font-black">
        {currentItems.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div key={item.id} className={`p-4 rounded-xl bg-white border shadow-sm flex flex-col gap-3 transition-all ${isSelected ? 'border-blue-300 bg-blue-50/10' : 'border-slate-100'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" checked={isSelected} onChange={() => handleSelect(item.id)} />
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-black ${item.pay_type === '정산입금' ? 'bg-blue-50 text-blue-600 border' : 'bg-purple-50 text-purple-600 border'}`}>{item.pay_type}</span>
                  <button onClick={(e) => toggleConfirm(e, item)} className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${item.status === '확인됨' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border animate-pulse'}`}>{item.status}</button>
                  <span className="text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{item.manager_name || "-"}</span> {/* ✨ 모바일 담당자 추가 */}
                </div>
                <span className="text-[10px] text-slate-400">{item.created_at.split('T')[0]}</span>
              </div>
              <div className="space-y-1.5 text-left" onClick={() => openModal(item)}>
                <div>
                  <p className="text-base font-black text-slate-900 tracking-tight">{item.customer_name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.delivery_company} 👉 {item.return_invoice}</p>
                </div>
                <div className="flex justify-between items-baseline bg-slate-50 p-2.5 rounded-lg mt-1">
                  <span className="text-[11px] text-slate-400 font-bold">대행 운임 청구비</span>
                  <span className="text-base font-black text-blue-600">{item.fee.toLocaleString()}원</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-50 text-xs">
                <button onClick={() => openModal(item)} className="text-blue-600 font-black">내역수정</button>
                <button onClick={(e) => handleDelete(e, item.id)} className="text-red-400 font-black">삭제</button>
              </div>
            </div>
          );
        })}
      </div>
        
      {/* 🔢 페이지네이션 */}
      <div className="flex justify-center items-center gap-1 md:gap-2 p-4 md:p-8 bg-white border-t border-slate-50 font-black mt-4 rounded-xl md:rounded-none shadow-sm md:shadow-none">
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-black disabled:opacity-30">PREV</button>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 md:w-10 md:h-10 rounded-xl text-xs transition-all font-black ${currentPage === i+1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>{i+1}</button>
          ))}
        </div>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-black disabled:opacity-30">NEXT</button>
      </div>

      {/* 📥 엑셀 모달 */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-base md:text-lg font-black mb-2 text-slate-800 tracking-tight uppercase">Excel Download</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">다운로드할 작성일자 기간을 선택하세요.</p>
            <div className="space-y-4 font-black">
              <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-blue-600 shadow-inner text-xs font-bold" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-blue-600 shadow-inner text-xs font-bold" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              <div className="flex gap-3 pt-2">
                <button onClick={downloadExcel} className="flex-1 bg-green-600 text-white p-3.5 rounded-xl font-black text-xs hover:bg-green-700 shadow-md">엑셀 생성</button>
                <button onClick={() => setShowExcelModal(false)} className="bg-slate-100 text-slate-400 px-4 rounded-xl font-black text-xs">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end md:p-4 z-50 overflow-hidden">
          <div className="bg-white w-full max-w-2xl h-full md:h-auto md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-300 relative text-black flex flex-col font-black">
             
             <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 md:p-10 pb-4 z-20 flex justify-between items-center border-b border-slate-50 font-black">
               <h2 className="text-xl md:text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none">착불 <span className="text-blue-600">데이터 기록</span></h2>
               <button onClick={closeModal} className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all text-sm md:text-xl font-black shadow-sm">✕</button>
             </div>

             <div className="flex-1 overflow-y-auto p-5 md:p-12 pt-4 pb-28 md:pb-12">
               <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 font-black text-black">
                  <div className="bg-slate-50 p-4 rounded-xl shadow-inner space-y-4">
                    <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm">
                      {['정산입금', '업체입금'].map(t => (
                        <button key={t} type="button" onClick={() => setFormData({...formData, pay_type: t})} className={`flex-1 py-2.5 rounded-lg text-xs transition-all font-black ${formData.pay_type === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 ml-2 uppercase font-black">Customer Name</p>
                    <input required type="text" placeholder="업체명 기입" value={formData.customer_name} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-xs font-bold text-black" onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                  </div>

                  {/* ✨ [ADD] 담당자명 기입란 추가 (업체명과 택배사 사이) */}
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 ml-2 uppercase font-black">Manager Name</p>
                    <input type="text" placeholder="담당자 이름 기입" value={formData.manager_name} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-xs font-bold text-black" onChange={e => setFormData({...formData, manager_name: e.target.value})} />
                  </div>
                                                                    
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-400 ml-2 uppercase font-black">Carrier</p>
                      <input required type="text" placeholder="택배사 (예: CJ대한통운)" value={formData.delivery_company} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-xs font-bold text-black" onChange={e => setFormData({...formData, delivery_company: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-400 ml-2 uppercase font-black">Return Invoice</p>
                      <input required type="text" placeholder="반송장번호 입력" value={formData.return_invoice} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-xs font-bold font-mono text-black" onChange={e => setFormData({...formData, return_invoice: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 ml-2 uppercase font-black">Memo (Remarks)</p>
                    <input type="text" placeholder="특이사항 메모 기록" value={formData.memo || ''} className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none shadow-inner text-xs font-bold text-black" onChange={e => setFormData({...formData, memo: e.target.value})} />
                  </div>

                  <div className="space-y-1 pt-2">
                    <p className="text-[9px] text-red-500 ml-2 mb-1 text-right uppercase tracking-widest font-black">Amount (KRW)</p>
                    <input required type="number" placeholder="0" value={formData.fee} className="w-full p-4 md:p-6 bg-slate-50 rounded-xl text-right font-black text-blue-600 text-2xl md:text-3xl border-none shadow-inner" onChange={e => setFormData({...formData, fee: parseInt(e.target.value) || 0})} />
                  </div>
                  
                  <button type="submit" className="w-full mt-4 p-4 md:p-6 bg-slate-900 text-white rounded-xl md:rounded-[2.5rem] text-sm md:text-xl font-black shadow-xl hover:bg-black transition-all uppercase tracking-widest">
                    {editingItem ? '수정 완료 💾' : '등록 완료 🚀'}
                  </button>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
