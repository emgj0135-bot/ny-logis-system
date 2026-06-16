"use client";
import { useEffect, useState } from "react";
// ✅ 1. 만들어둔 머신(createClient)을 가져오기
import { createClient } from '@/lib/supabase';

export default function StaffPage() {
  // ✅ 2. Supabase 머신 딱 한 번만 돌리기 (경고 제거)
  const [supabase] = useState(() => createClient());

  const [role, setRole] = useState<string | null>(null);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 🔢 페이지네이션용 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: "",
    phone: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 🔒 profiles 테이블에서 직접 role 가져오기!
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setRole(profile?.role || 'user');
    } else {
      setRole(null);
    }

    // staff 테이블에서 전체 명단 가져오기
    const { data, error } = await supabase.from('staff').select('*').order('name', { ascending: true });
    if (error) console.error("데이터 로드 에러:", error);
    setStaffs(data || []);
  };

  const handleSubmit = async () => {
    if (role !== 'admin') return alert("관리자만 가능합니다.");
    if (!formData.name || !formData.phone) return alert("이름과 연락처를 모두 입력해주세요!");
    
    if (editingId) {
      // 수정 완료 로직 (await 추가)
      const { error } = await supabase.from('staff').update({ ...formData }).eq('id', editingId);
      if (error) alert("수정 실패: " + error.message);
      else alert("수정 완료! ✨");
    } else {
      // 신규 등록 로직 (Insert 정상 연결)
      const { error } = await supabase.from('staff').insert([formData]);
      if (error) alert("등록 실패: " + error.message);
      else alert("정상적으로 등록되었습니다! 🚀");
    }
    
    closeModal();
    await fetchData();
  };

  const handleDelete = async (id: number) => {
    if (role !== 'admin') return alert("관리자만 삭제 가능합니다.");
    if (!confirm("이 담당자를 삭제하시겠습니까?")) return;
    
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) alert("삭제 실패: " + error.message);
    else {
      alert("삭제 완료! 🗑️");
      await fetchData();
    }
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({ name: item.name, phone: item.phone });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "", phone: "" });
  };

  // 🔢 페이지네이션 데이터 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = staffs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(staffs.length / itemsPerPage);

  const isAdmin = role === 'admin';

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      
      {/* 🔵 블루 포인트 헤더 섹션 (모바일 크기 유연 대응) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              STAFF <span className="text-blue-600">MANAGEMENT</span>
            </h1>
            <p className="text-slate-400 font-bold mt-1.5 md:mt-2 tracking-tight text-[10px] md:text-xs uppercase">
              천안센터 <span className="text-blue-600/60 font-black">상차 담당자 관리 명단</span>
            </p>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)} 
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl md:rounded-2xl font-black shadow-md hover:bg-blue-700 transition-all text-xs md:text-sm"
          >
            + 신규 담당자 등록
          </button>
        )}
      </div>

      {/* 📋 메인 담당자 리스트 분기 레이아웃 */}

      {/* 1. PC 및 데스크톱 와이드 테이블 (md 이상 활성화) */}
      <div className="hidden md:block overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-sm bg-white text-black font-black">
        <table className="w-full text-sm text-left font-black">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest text-center">
            <tr>
              <th className="px-10 py-4 text-left w-[40%]">이름</th>
              <th className="px-10 py-4 text-left w-[45%]">연락처</th>
              {isAdmin && <th className="px-10 py-4 text-center w-[15%]">관리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-black">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-4.5 font-black text-slate-800 text-base">{item.name}</td>
                  <td className="px-10 py-4.5 font-bold text-slate-500">{item.phone}</td>
                  {isAdmin && (
                    <td className="px-10 py-4.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-3 text-slate-300 font-black text-xs">
                        <button onClick={() => openEditModal(item)} className="hover:text-blue-600 transition-colors font-black">수정</button>
                        <button onClick={() => handleDelete(item.id)} className="hover:text-red-400 transition-colors font-black">삭제</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 3 : 2} className="p-20 text-center text-slate-300 font-bold italic text-lg">
                  등록된 담당자가 없습니다. 🔍
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. 모바일 주소록 매칭 인적 카드 뷰 (md 미만 스마트폰 최적화 📱) */}
      <div className="block md:hidden space-y-3 text-black font-black">
        {currentItems.map((item) => (
          <div key={item.id} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
            <div className="space-y-1 w-full">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3 bg-blue-500 rounded-full"></div>
                <p className="text-base font-black text-slate-900 tracking-tight">{item.name}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg flex justify-between items-center w-full">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Phone :</span>
                <a href={`tel:${item.phone}`} className="text-sm font-black text-blue-600 tracking-tight bg-blue-50/50 px-2.5 py-1 rounded border border-blue-100">
                  📞 {item.phone}
                </a>
              </div>
            </div>

            {/* 권한 관리 전용 제어 스위치 컴포넌트 */}
            {isAdmin && (
              <div className="flex justify-end gap-4 pt-1.5 w-full text-xs border-t border-slate-100/70">
                <button onClick={() => openEditModal(item)} className="text-blue-600 font-black">정보수정</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 font-black">명단삭제</button>
              </div>
            )}
          </div>
        ))}

        {currentItems.length === 0 && (
          <div className="p-16 bg-white rounded-xl text-center text-slate-300 italic font-bold">등록된 담당자가 없습니다. 🔍</div>
        )}
      </div>
        
      {/* 🔢 페이지네이션 (가변 터치 영역 반영) */}
      <div className="flex justify-center items-center gap-1 md:gap-2 p-4 md:p-5 bg-white md:bg-slate-50/50 border-t border-slate-100 font-black mt-4 rounded-xl md:rounded-none shadow-sm md:shadow-none">
        <button 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
          className="px-3 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30"
        >
          PREV
        </button>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button 
              key={i+1} 
              onClick={() => setCurrentPage(i+1)} 
              className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                currentPage === i+1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
              }`}
            >
              {i+1}
            </button>
          ))}
        </div>
        <button 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
          className="px-3 py-2 text-xs font-black text-slate-400 hover:text-blue-600 disabled:opacity-30"
        >
          NEXT
        </button>
      </div>

      {/* 📋 등록/수정 모달 (모바일 터치 키보드 인클루딩 마진 장착 📱) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 sm:p-12 rounded-2xl sm:rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 text-black font-black max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 text-slate-800 tracking-tight uppercase">
              {editingId ? 'Edit' : 'Add'} <span className="text-blue-600">Staff</span>
            </h2>
            <div className="space-y-4 font-black">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">이름</p>
                <input value={formData.name} placeholder="예: 홍길동 대리 (필수)" className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-xs shadow-inner text-black outline-none" 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">연락처</p>
                <input value={formData.phone} placeholder="예: 010-1234-5678 (필수)" className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-xs shadow-inner text-black outline-none" 
                  onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-8 sm:mt-10">
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white p-4 rounded-xl sm:rounded-[1.5rem] font-black shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest text-xs sm:text-sm">
                Save Staff
              </button>
              <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-6 rounded-xl sm:rounded-[1.5rem] font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
