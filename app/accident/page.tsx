"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AccidentPage() {
  const [list, setList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false); // ✨ 엑셀 모달 상태 추가
  const [editingItem, setEditingItem] = useState<any>(null);

  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const today = new Date().toISOString().split('T')[0];

  // 엑셀 다운로드 기간 상태
  const [excelRange, setExcelRange] = useState({ start: today, end: today });

  const [searchFilters, setSearchFilters] = useState({
    startDate: '',
    endDate: '',
    searchText: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    out_date: '', invoice_no: '', receiver_name: '', reason: '분실',
    cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: ''
  });

  // --- ✨ 엑셀 라이브러리 로드 ---
  useEffect(() => { 
    fetchAccidents(); 
    if (!document.getElementById('xlsx-script')) {
      const script = document.createElement('script');
      script.id = 'xlsx-script';
      script.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js";
      document.head.appendChild(script);
    }
  }, []);

  const fetchAccidents = async () => {
    const { data } = await supabase.from('accidents').select('*').order('created_at', { ascending: false });
    const result = data || [];
    setList(result);
    setFilteredList(result);
  };

  // --- ✨ 기간 선택형 엑셀 다운로드 함수 ---
  const downloadExcel = async () => {
    try {
      // @ts-ignore
      const XLSX = window.XLSX;
      if (!XLSX) return alert("라이브러리 로딩 중입니다.");

      // 설정한 기간(출고일 out_date 기준)으로 데이터 가져오기
      const { data, error } = await supabase
        .from('accidents')
        .select('*')
        .gte('out_date', excelRange.start)
        .lte('out_date', excelRange.end)
        .order('out_date', { ascending: true });

      if (error || !data || data.length === 0) {
        return alert("해당 기간에 사고 데이터가 없습니다.");
      }

      const excelData = data.map((item, index) => ({
        "No": index + 1,
        "출고일자": item.out_date,
        "송장번호": item.invoice_no,
        "수령인": item.receiver_name,
        "사고유형": item.reason,
        "CJ 답변내용": item.cj_answer || "-",
        "상태": item.status,
        "확정변상금": item.confirmed_amount,
        "비고/메모": item.memo || "",
        "등록일시": new Date(item.created_at).toLocaleString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "사고접수현황");
      
      XLSX.writeFile(workbook, `사고접수_${excelRange.start}_${excelRange.end}.xlsx`);
      setShowExcelModal(false);
    } catch (err) {
      alert("엑셀 생성 중 오류가 발생했습니다.");
    }
  };

  const handleSearch = () => {
    let temp = [...list];
    if (searchFilters.startDate) temp = temp.filter(item => item.out_date >= searchFilters.startDate);
    if (searchFilters.endDate) temp = temp.filter(item => item.out_date <= searchFilters.endDate);
    if (searchFilters.searchText) {
      const txt = searchFilters.searchText.toLowerCase();
      temp = temp.filter(item => 
        item.invoice_no.toLowerCase().includes(txt) || 
        item.receiver_name.toLowerCase().includes(txt)
      );
    }
    if (searchFilters.status) temp = temp.filter(item => item.status === searchFilters.status);
    setFilteredList(temp);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchFilters({ startDate: '', endDate: '', searchText: '', status: '' });
    setFilteredList(list);
    setCurrentPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingItem;
    const { error } = await (isEdit
      ? supabase.from('accidents').update(formData).eq('id', editingItem.id)
      : supabase.from('accidents').insert([formData]));

    if (error) alert("⚠️ 저장 실패: " + error.message);
    else {
      alert(isEdit ? "✅ 수정 완료!" : "🚀 신규 사고 접수 완료!");
      closeModal();
      fetchAccidents();
    }
  };

  const openModal = (item: any = null) => {
    if (item) { setEditingItem(item); setFormData({ ...item }); }
    else { setEditingItem(null); setFormData({ out_date: today, invoice_no: '', receiver_name: '', reason: '분실', cj_answer: '', status: '접수완료', confirmed_amount: 0, memo: '' }); }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 🔵 헤더 섹션 */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-red-600 rounded-full shadow-lg shadow-red-100"></div> 
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              사고 <span className="text-red-600">접수</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight text-xs uppercase">
              천안센터 <span className="text-red-500">실시간 사고 및 클레임 관리</span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-red-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg shadow-red-100 hover:bg-red-700 hover:scale-105 transition-all text-sm"
        >
          + 신규 사고 접수
        </button>
      </div>

      {/* 🔍 검색 필터 및 📊 엑셀 다운로드 버튼 */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Outbound Date</p>
            <div className="flex items-center gap-3 font-bold">
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs" 
                value={searchFilters.startDate} onChange={e => setSearchFilters({...searchFilters, startDate: e.target.value})} />
              <span className="text-slate-300">~</span>
              <input type="date" className="p-3 bg-slate-50 rounded-xl outline-none text-xs" 
                value={searchFilters.endDate} onChange={e => setSearchFilters({...searchFilters, endDate: e.target.value})} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Search Info</p>
            <input type="text" placeholder="송장번호 또는 수령인" className="p-3 bg-slate-50 rounded-xl outline-none text-xs w-64 font-bold" 
              value={searchFilters.searchText} onChange={e => setSearchFilters({...searchFilters, searchText: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
          <select className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[150px] outline-none font-black"
            value={searchFilters.status} onChange={e => setSearchFilters({...searchFilters, status: e.target.value})}>
            <option value="">상태 전체</option>
            <option value="접수완료">접수완료</option>
            <option value="보상승인">보상승인</option>
            <option value="정상출고(취소)">정상출고(취소)</option>
          </select>
          <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all">SEARCH FILTER 🔍</button>
          <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs border border-slate-100">RESET</button>
          
          <button onClick={() => setShowExcelModal(true)} className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-100">
            📊 EXCEL DOWNLOAD
          </button>
        </div>
      </div>

      {/* 📋 리스트 테이블 (기존 동일) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b tracking-widest">
            <tr>
              <th className="p-5 text-center w-16">No</th>
              <th className="p-5 text-center w-32">출고일자</th>
              <th className="p-5 text-left">사고 내용 (송장 / 수령인)</th>
              <th className="p-5 text-center w-32">변상 금액</th>
              <th className="p-5 text-center w-24">상태</th>
              <th className="p-5 text-center w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => {
                const displayNo = filteredList.length - (indexOfFirstItem + index);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 border-b transition-colors font-black">
                    <td className="p-5 text-center text-red-600">{displayNo}</td>
                    <td className="p-5 text-center text-slate-500 font-bold">{item.out_date}</td>
                    <td className="p-5" onClick={() => openModal(item)}>
                      <p className="text-slate-800 text-base tracking-tight cursor-pointer hover:text-red-600">{item.invoice_no} <span className="text-slate-400 mx-2">|</span> {item.receiver_name}</p>
                      <p className="text-[11px] text-red-400 mt-1 uppercase tracking-wider">🚨 {item.reason}</p>
                    </td>
                    <td className="p-5 text-center text-slate-900 text-lg">
                      {item.confirmed_amount.toLocaleString()}원
                    </td>
                    <td className="p-5 text-center text-[10px]">
                      <span className={`px-4 py-1.5 rounded-full whitespace-nowrap ${item.status === '보상승인' ? 'bg-blue-50 text-blue-600 border border-blue-100' : item.status === '정상출고(취소)' ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={() => openModal(item)} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg">수정</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-bold italic">검색 결과가 없습니다. 🔍</td></tr>
            )}
          </tbody>
        </table>
        {/* 페이지네이션 생략 */}
      </div>

      {/* 📥 엑셀 기간 선택 모달 (✨ 추가된 부분) */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-[60]">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black mb-2 text-slate-800 tracking-tight">Excel Download</h2>
            <p className="text-slate-400 text-xs font-bold mb-6">다운로드할 출고일자(Outbound Date) 기간을 선택하세요.</p>
            <div className="space-y-4">
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none text-red-600 shadow-inner" value={excelRange.start} onChange={e => setExcelRange({...excelRange, start: e.target.value})} />
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none text-red-600 shadow-inner" value={excelRange.end} onChange={e => setExcelRange({...excelRange, end: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button onClick={downloadExcel} className="flex-1 bg-red-600 text-white p-4 rounded-2xl font-black text-xs hover:bg-red-700 shadow-lg shadow-red-50">엑셀 생성 및 저장</button>
                <button onClick={() => setShowExcelModal(false)} className="bg-slate-100 text-slate-400 px-6 rounded-2xl font-black text-xs font-bold">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 사고 접수 모달 (기존 동일) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-end p-4 z-50 overflow-hidden font-black">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-300 relative text-black">
             {/* 모달 폼 생략 (기존 코드 유지) */}
             <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 font-black text-2xl">✕</button>
             <h2 className="text-3xl font-black mb-8 uppercase text-slate-900 tracking-tighter">사고 <span className="text-red-600">데이터 기록</span></h2>
             <form onSubmit={handleSubmit} className="space-y-6">
                <input required type="date" value={formData.out_date} className="w-full p-5 bg-slate-50 rounded-2xl border-none shadow-inner" onChange={e => setFormData({...formData, out_date: e.target.value})} />
                <input required type="text" placeholder="송장번호 입력" value={formData.invoice_no} className="w-full p-5 bg-slate-50 rounded-2xl border-none shadow-inner" onChange={e => setFormData({...formData, invoice_no: e.target.value})} />
                <input required type="text" placeholder="수령인 성함" value={formData.receiver_name} className="w-full p-5 bg-slate-50 rounded-2xl border-none shadow-inner" onChange={e => setFormData({...formData, receiver_name: e.target.value})} />
                <button type="submit" className="w-full mt-10 p-6 bg-red-600 text-white rounded-[2.5rem] text-xl font-black shadow-xl shadow-red-100 uppercase tracking-widest">데이터 저장 🚀</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
