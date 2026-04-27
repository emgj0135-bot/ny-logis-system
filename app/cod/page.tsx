"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function CodPage() {
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
    pay_type: '정산입금', customer_name: '', delivery_company: '',
    return_invoice: '', fee: 0, memo: '', status: '미확인'
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
        "구분": item.pay_type,
        "업체명": item.customer_name,
        "택배사": item.delivery_company,
        "반송장번호": item.return_invoice,
        "운임비": item.fee,
        "상태": item.status,
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
      temp = temp.filter(item => item.customer_name.toLowerCase().includes(txt) || item.return_invoice.toLowerCase().includes(txt));
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
    if (selectedIds.length === 0) return alert("항목을 선택해줘!");
    const { error } = await supabase.from('cod_manage').update({ status: targetStatus, is_confirmed: targetStatus === '확인됨' }).in('id', selectedIds);
    if (!error) { alert("업데이트 완료!"); fetchCod(); }
  };

  const toggleConfirm = async (id: number, currentConfirmed: boolean) => {
    const { error } = await supabase.from('cod_manage').update({ is_confirmed: !currentConfirmed, status: currentConfirmed ? '미확인' : '확인됨' }).eq('id', id);
    if (!error) fetchCod();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingItem;
    const { error } = await (isEdit ? supabase.from('cod_manage').update(formData).eq('id', editingItem.id) : supabase.from('cod_manage').insert([formData]));
    if (!error) { alert(isEdit ? "✅ 수정 완료!" : "🚀 등록 완료!"); closeModal(); fetchCod(); }
  };

  const handleDelete = async (id: number) => {
    if (confirm("삭제할까?")) { await supabase.from('cod_manage').delete().eq('id', id); fetchCod(); }
  };

  const openModal = (item: any = null) => {
    if (item) { setEditingItem(item); setFormData({ ...item }); }
    else { setEditingItem(null); setFormData({ pay_type: '정산입금', customer_name: '', delivery_company: '', return_invoice: '', fee: 0, memo: '', status: '미확인' }); }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

  // 페이지네이션용 데이터 계산
  const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* 🔵 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-100"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">착불 <span className="text-blue-600">관리</span></h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase text-blue-600/60">천안센터 착불 정산 시스템</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all text-sm">📊 엑셀 다운로드</button>
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-sm">+ 신규 데이터 등록</button>
        </div>
      </div>

      {/* 🔍 검색 필터 */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6 font-black">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Created Date</p>
            <div className="flex items-center gap-3 font-bold">
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs" value={searchInputs.startDate} onChange={e => setSearchInputs({...searchInputs, startDate: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs" value={searchInputs.endDate} onChange={e => setSearchInputs({...searchInputs, endDate: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Search Info</p>
            <input type="text" placeholder="업체명 또는 반송장번호" className="p-3 bg-slate-50 rounded-xl outline-none text-xs w-64 font-bold" value={searchInputs.searchText} onChange={e => setSearchInputs({...searchInputs, searchText: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-50 items-center">
          <select className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[120px] outline-none" value={searchInputs.payType} onChange={e => setSearchInputs({...searchInputs, payType: e.target.value})}><option value="">구분 전체</option><option value="정산입금">정산입금</option><option value="업체입금">업체입금</option></select>
          <select className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[120px] outline-none" value={searchInputs.status} onChange={e => setSearchInputs({...searchInputs, status: e.target.value})}><option value="">상태 전체</option><option value="미확인">미확인</option><option value="확인됨">확인됨</option></select>
          <button onClick={handleSearch} className="bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all">SEARCH 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-6 py-3.5 rounded-2xl font-black text-xs border border-slate-100 mr-auto">RESET</button>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => handleBulkUpdate('확인됨')} className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm">일괄확인 ✅</button>
            <button onClick={() => handleBulkUpdate('미확인')} className="bg-white text-red-500 px-4 py-2 rounded-xl text-xs font-black shadow-sm">일괄미확인 ❌</button>
          </div>
        </div>
      </div>

      {/* 📋 메인 테이블 */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-black text-black">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest text-center">
            <tr>
              <th className="p-5 w-12"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-blue-600" onChange={handleSelectAll} checked={currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id))} /></th>
              <th className="p-5 w-24">상태</th>
              <th className="p-5 w-32">작성일자</th> {/* ✨ 추가됨 */}
              <th className="p-5 w-32">구분</th>
              <th className="p-5 text-left">업체 / 반송장 정보</th>
              <th className="p-5 w-32">운임비</th>
              <th className="p-5 w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50 border-b transition-colors text-center ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-5"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-blue-600" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} /></td>
                  <td className="p-5"><button onClick={() => toggleConfirm(item.id, item.status === '확인됨')} className={`px-4 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-all ${item.status === '확인됨' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse'}`}>{item.status}</button></td>
                  <td className="p-5 text-slate-500 text-xs">{item.created_at.split('T')[0]}</td> {/* ✨ 작성일자 데이터 */}
                  <td className="p-5 text-[10px]"><span className={`inline-block px-3 py-1 rounded-lg ${item.pay_type === '정산입금' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>{item.pay_type}</span></td>
                  <td className="p-5 text-left" onClick={() => openModal(item)}><p className="text-slate-800 text-base tracking-tight cursor-pointer hover:text-blue-600">{item.customer_name}</p><p className="text-[11px] text-slate-400 mt-1 uppercase font-mono font-normal">{item.delivery_company} | {item.return_invoice}</p></td>
                  <td className="p-5"><p className="text-blue-600 text-lg font-black">{item.fee.toLocaleString()}원</p></td>
                  <td className="p-5"><div className="flex gap-4 justify-center text-[10px] text-slate-300 uppercase"><button onClick={() => openModal(item)} className="hover:text-blue-600">수정</button><button onClick={() => handleDelete(item.id)} className="hover:text-red-500">삭제</button></div></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="p-20 text-center text-slate-300 font-bold italic text-lg">데이터가 없습니다. 🔍</td></tr>
            )}
          </tbody>
        </table>

        {/* 🔢 페이지네이션 복구 */}
        <div className="flex justify-center items-center gap-2 p-8 bg-white border-t border-slate-50 font-black">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1} 
            className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs disabled:opacity-30"
          >
            PREV
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i+1} 
                onClick={() => setCurrentPage(i+1)} 
                className={`w-10 h-10 rounded-xl text-xs transition-all ${currentPage === i+1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {i+1}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages || totalPages === 0} 
            className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-xs disabled:opacity-30"
          >
            NEXT
          </button>
        </div>
      </div>

      {/* 📥 엑셀 기간 선택 모달 */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black mb-2 text-slate-800 tracking-tight uppercase">Excel Download</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">다운로드할 작성일자 기간을 선택하세요.</p>
            <div className="space-y-4 font-black">
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-blue-600 shadow-inner" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-blue-600 shadow-inner" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button onClick={downloadExcel} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black text-xs hover:bg-green-700 shadow-lg shadow-green-50">엑셀 생성 및 저장</button>
                <button onClick={() => setShowExcelModal(false)} className="bg-slate-100 text-slate-400 px-6 rounded-2xl font-black text-xs">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right relative text-black">
             <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 font-black text-2xl">✕</button>
             <h2 className="text-3xl font-black mb-8 uppercase text-slate-900 tracking-tighter">착불 <span className="text-blue-600">데이터 기록</span></h2>
             <form onSubmit={handleSubmit} className="space-y-6 font-black text-black">
                <div className="bg-slate-50 p-6 rounded-[2.5rem] shadow-inner space-y-4">
                  <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm">
                    {['정산입금', '업체입금'].map(t => (
                      <button key={t} type="button" onClick={() => setFormData({...formData, pay_type: t})} className={`flex-1 py-3 rounded-xl text-xs transition-all ${formData.pay_type === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Customer Name</p>
                  <input required type="text" placeholder="업체명" value={formData.customer_name} className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none shadow-inner" onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Carrier</p>
                  <input required type="text" placeholder="택배사" value={formData.delivery_company} className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none shadow-inner" onChange={e => setFormData({...formData, delivery_company: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 uppercase">Return Invoice</p>
                  <input required type="text" placeholder="반송장번호" value={formData.return_invoice} className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none shadow-inner font-mono" onChange={e => setFormData({...formData, return_invoice: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 ml-4 mb-1 text-right uppercase tracking-widest">Amount (KRW)</p>
                  <input required type="number" placeholder="운임비" value={formData.fee} className="w-full p-6 bg-slate-50 rounded-2xl text-right font-black text-blue-600 text-3xl border-none shadow-inner" onChange={e => setFormData({...formData, fee: parseInt(e.target.value) || 0})} />
                </div>
                <button type="submit" className="w-full mt-6 p-6 bg-slate-900 text-white rounded-[2.5rem] text-xl font-black shadow-xl hover:bg-black transition-all uppercase tracking-widest">등록 완료 🚀</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
