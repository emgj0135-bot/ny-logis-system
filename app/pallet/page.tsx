"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 

export default function PalletsPage() {
  // ... (상단 상태값들은 동일하니까 생략할게) ...

  // 🗑️ 삭제 로직 수정 (확실하게 에러 체크)
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    // ✨ 1. 부모 행(tr)의 수정 모달 이벤트가 실행되지 않게 막음
    e.stopPropagation(); 

    if(!confirm("정말 삭제하시겠습니까? 삭제 후에는 복구가 불가능합니다.")) return;

    try {
      const { error } = await supabase.from('pallets').delete().eq('id', id);
      
      if (error) {
        console.error("삭제 에러 상세:", error);
        alert("삭제에 실패했습니다: " + error.message);
      } else {
        alert("삭제되었습니다. ✨");
        fetchData(); // 삭제 후 목록 새로고침
      }
    } catch (err) {
      console.error("시스템 에러:", err);
      alert("삭제 중 시스템 오류가 발생했습니다.");
    }
  };

  // ✨ 상태 업데이트 버튼도 이벤트 전파 막기 추가
  const handleStatusUpdate = async (e: React.MouseEvent, id: number, currentStatus: string) => {
    e.stopPropagation(); // 수정 모달 방지
    const newStatus = currentStatus === '확인완료' ? '미확인' : '확인완료';
    const { error } = await supabase.from('pallets').update({ status: newStatus }).eq('id', id);
    if (!error) fetchData();
  };

  // 📋 테이블 렌더링 부분 (여기 버튼 부분을 잘 봐!)
  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      {/* ... (상단 헤더/필터 생략) ... */}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-[11px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b uppercase tracking-widest text-[10px]">
              {/* ... (thead 내용 동일) ... */}
            </thead>
            <tbody className="divide-y divide-slate-50 font-black">
              {currentItems.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50 transition-all cursor-pointer" 
                  onClick={() => openEditModal(item)} // 행 클릭 시 수정 모달
                >
                  <td className="p-6 text-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  
                  {/* ✨ 상태 업데이트 버튼 */}
                  <td className="p-6">
                    <button 
                      onClick={(e) => handleStatusUpdate(e, item.id, item.status)} 
                      className={`px-4 py-1.5 rounded-full text-[10px] whitespace-nowrap ${item.status === '미확인' ? 'bg-orange-50 text-orange-500 animate-pulse' : 'bg-green-50 text-green-500'}`}
                    >
                      {item.status}
                    </button>
                  </td>

                  <td className="p-6 text-slate-400 text-[10px] whitespace-nowrap">{formatDate(item.created_at)}</td>
                  <td className="p-6 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black whitespace-nowrap ${item.type === '출고' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-6 whitespace-nowrap font-black"><div>{item.issue_date}</div><div className="text-slate-400 text-[10px]">{item.company_name}</div></td>
                  <td className="p-6 text-blue-600 font-bold whitespace-nowrap">{item.kpp_n11_count} / {item.kpp_n12_count}</td>
                  <td className="p-6 text-green-600 font-bold whitespace-nowrap">{item.aj_11a_count} / {item.aj_12a_count}</td>
                  <td className="p-6 text-slate-400 font-normal max-w-[120px] truncate">{item.remarks || "-"}</td>
                  
                  {/* ✨ 관리 버튼 (삭제 버튼 수정됨) */}
                  <td className="p-6 text-center">
                    <div className="flex gap-3 justify-center text-slate-300">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(item); }} 
                          className="hover:text-blue-500 font-black"
                        >
                          수정
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, item.id)} // ✨ 여기서 handleDelete 호출!
                          className="hover:text-red-500 font-black text-red-400/50"
                        >
                          삭제
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ... (페이지네이션/모달 생략) ... */}
      </div>
    </div>
  );
}
