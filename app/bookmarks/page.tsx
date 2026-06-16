"use client";
import { useEffect, useState } from "react";
// ✅ 1. 만들어둔 머신(createClient)을 가져오기
import { createClient } from '@/lib/supabase';

export default function BookmarkPage() {
  // ✅ 2. Supabase 머신 딱 한 번만 돌리기 (경고 제거)
  const [supabase] = useState(() => createClient());

  const [role, setRole] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [tab, setTab] = useState<'상차지' | '하차지'>('상차지');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 🔢 페이지네이션용 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    place_name: "",
    address: "",
    manager_name: "",
    manager_phone: ""
  });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
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

    const { data } = await supabase.from('bookmarks').select('*').order('created_at', { ascending: false });
    setBookmarks(data || []);
    setCurrentPage(1);
  };

  const handleSubmit = async () => {
    if (role !== 'admin') return alert("관리자만 가능합니다.");
    if (!formData.place_name || !formData.address) return alert("필수 정보를 입력해주세요.");
    
    if (editingId) {
      const { error } = await supabase.from('bookmarks').update({ ...formData }).eq('id', editingId);
      if (error) alert(error.message);
      else alert("수정되었습니다! ✨");
    } else {
      const { error } = await supabase.from('bookmarks').insert([{ type: tab, ...formData }]);
      if (error) alert(error.message);
      else alert("등록 성공! 🚀");
    }
    
    closeModal();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (role !== 'admin') return alert("관리자만 삭제 가능합니다.");
    if (!confirm("정말로 삭제하시겠습니까?")) return;

    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      alert("삭제 완료! 🗑️");
      fetchData();
    }
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({
      place_name: item.place_name,
      address: item.address,
      manager_name: item.manager_name || "",
      manager_phone: item.manager_phone || ""
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ place_name: "", address: "", manager_name: "", manager_phone: "" });
  };

  const filteredBookmarks = bookmarks.filter(b => b.type === tab);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookmarks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookmarks.length / itemsPerPage);

  const isAdmin = role === 'admin';

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-800 font-black">
      
      {/* 🔵 블루 포인트 헤더 섹션 (모바일 최적화) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full"></div> 
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
              NY LOGIS <span className="text-blue-600">BOOKMARKS</span>
            </h1>
            <p className="text-slate-400 font-bold mt-1.5 md:mt-2 tracking-tight text-[10px] md:text-xs uppercase">
              천안센터 <span className="text-blue-600/60 font-black">{tab} 관리 및 즐겨찾기</span>
            </p>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)} 
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl md:rounded-2xl font-black shadow-md hover:bg-blue-700 transition-all text-xs md:text-sm"
          >
            + {tab} 등록
          </button>
        )}
      </div>

      {/* 탭 버튼 섹션 (손가락 터치 영역 확장) */}
      <div className="flex gap-2 mb-6 md:mb-8">
        {['상차지', '하차지'].map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t as any)} 
            className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-full text-xs sm:text-sm font-black transition-all ${
              tab === t ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 📋 메인 주소록 데이터 디스플레이 분기 */}

      {/* 1. PC 및 태블릿 대형 스크린 뷰 (md 이상 노출) */}
      <div className="hidden md:block overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-sm bg-white text-black font-black">
        <table className="w-full text-sm text-left font-black">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest text-center">
            <tr>
              <th className="px-8 py-4 text-left w-[55%]">정보 (명칭 / 주소)</th>
              <th className="px-6 py-4 text-left w-[30%]">담당자 정보</th>
              {isAdmin && <th className="px-6 py-4 text-center w-[15%]">관리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-black">
            {currentItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-4.5">
                  <p className="font-black text-slate-800 text-base tracking-tight">{item.place_name}</p>
                  <p className="text-slate-400 text-[11px] font-bold mt-0.5 tracking-tight">{item.address}</p>
                </td>
                <td className="px-6 py-4.5">
                  {item.type === '하차지' ? (
                    <div>
                      <p className="text-slate-700 text-xs font-black">{item.manager_name || "-"}</p>
                      <p className="text-blue-600 text-[11px] mt-0.5 font-black">{item.manager_phone || "-"}</p>
                    </div>
                  ) : (
                    <p className="text-slate-300 italic text-xs">배차 시 선택</p>
                  )}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center gap-3 text-slate-300 font-black text-xs">
                      <button onClick={() => openEditModal(item)} className="hover:text-blue-600 transition-colors font-black">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="hover:text-red-400 transition-colors font-black">삭제</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. 모바일 특화 전용 주소록 카드 뷰 (md 미만 스마트폰 최적화 📱) */}
      <div className="block md:hidden space-y-3 text-black font-black">
        {currentItems.map((item) => (
          <div key={item.id} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col gap-2.5 text-left">
            <div>
              <span className="text-[9px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 mr-2">{item.type}</span>
              <span className="text-base font-black text-slate-900 tracking-tight">{item.place_name}</span>
            </div>
            
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg space-y-1">
              <p className="tracking-tight"><span className="text-slate-400 font-bold mr-1">주소:</span> {item.address}</p>
              {item.type === '하차지' ? (
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5 mt-1.5">
                  <p><span className="text-slate-400 font-bold mr-1">담당:</span> {item.manager_name || "-"}</p>
                  {item.manager_phone && (
                    <a href={`tel:${item.manager_phone}`} className="text-blue-600 font-black text-[11px] bg-blue-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                      📞 {item.manager_phone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px] pt-0.5">⚠️ 상차지 담당자는 용차 배차 등록 시 동적 배정됩니다.</p>
              )}
            </div>

            {/* 관리자 등급 전용 제어 링크바 */}
            {isAdmin && (
              <div className="flex justify-end gap-4 pt-1.5 text-xs border-t border-slate-50">
                <button onClick={() => openEditModal(item)} className="text-blue-600 font-black">내역수정</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 font-black">정보삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 데이터 없음 디스플레이 가드 */}
      {currentItems.length === 0 && (
        <div className="p-16 bg-white rounded-2xl text-center text-slate-300 italic font-bold">등록된 {tab} 데이터가 없습니다. 🔍</div>
      )}
        
      {/* 🔢 페이지네이션 (가변 스케일 터치 매칭) */}
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
                currentPage === i+1 ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white text-slate-400 border border-slate-100'
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

      {/* 📋 등록/수정 모달 (모바일 전체 스크롤 팝오버 핏 기법 📱) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a1c2e]/60 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 z-50">
          <div className="bg-white p-6 sm:p-12 rounded-2xl sm:rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 text-black font-black max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 text-slate-800 tracking-tight uppercase">
              {editingId ? 'Edit' : 'Add'} <span className="text-blue-600">{tab}</span>
            </h2>
            
            <div className="space-y-4 font-black">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">{tab}명</p>
                <input value={formData.place_name} placeholder="명칭을 입력하세요 (필수)" className="w-full p-4 bg-slate-50 rounded-xl border-none text-xs font-bold shadow-inner text-black outline-none" 
                  onChange={e => setFormData({...formData, place_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">주소</p>
                <input value={formData.address} placeholder="정확한 도로명 주소 (필수)" className="w-full p-4 bg-slate-50 rounded-xl border-none text-xs font-bold shadow-inner text-black outline-none" 
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              
              {tab === '하차지' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">담당자</p>
                    <input value={formData.manager_name} placeholder="현장 담당자명" className="w-full p-4 bg-slate-50 rounded-xl border-none text-xs font-bold shadow-inner text-black outline-none" 
                      onChange={e => setFormData({...formData, manager_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">연락처</p>
                    <input value={formData.manager_phone} placeholder="전화번호" className="w-full p-4 bg-slate-50 rounded-xl border-none text-xs font-bold shadow-inner text-black outline-none" 
                      onChange={e => setFormData({...formData, manager_phone: e.target.value})} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-8 sm:mt-10">
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white p-4 sm:p-5 rounded-xl sm:rounded-[1.5rem] font-black shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest text-xs sm:text-sm">
                Save Changes
              </button>
              <button onClick={closeModal} className="bg-slate-100 text-slate-400 px-5 sm:px-8 rounded-xl sm:rounded-[1.5rem] font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
