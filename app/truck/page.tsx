{/* 검색 필터 섹션 하단 버튼 그룹 */}
<div className="flex gap-3 pt-4 border-t border-slate-50">
  <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-3.5 bg-slate-100 rounded-2xl border-none text-xs font-black text-slate-600 min-w-[150px]">
    <option value="">상태 전체</option>
    <option value="신청완료">신청완료</option>
    <option value="배차완료">배차완료</option>
  </select>
  
  <button onClick={handleSearch} className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg">SEARCH 🔍</button>
  
  <button onClick={resetFilters} className="bg-slate-50 text-slate-400 px-8 py-3.5 rounded-2xl font-black text-xs border border-slate-100">RESET</button>

  {/* ✨ 엑셀 다운로드 버튼 추가! */}
  <button 
    onClick={downloadExcel} 
    className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
  >
    EXCEL DOWNLOAD 📊
  </button>
</div>
