"use client";

import React, { useState, useEffect, useMemo } from 'react';

import { Search, Calendar, Filter, ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown, Eye, X, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function RatingsTable({ ratings }: { ratings: any[] }) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedRating, setSelectedRating] = useState<any | null>(null);
  const router = useRouter();
  const { addToast, ToastContainer } = useToast();

  useEffect(() => {
    fetch('/api/departments?all=true')
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(err => console.error("Failed to load departments:", err));
  }, []);

  // Filters
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState("all"); // 'all', 'text', 'audio', 'any', 'none'
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'department' | 'score' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // default: newest first

  const handleSort = (field: 'date' | 'department' | 'score' | 'status') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder(field === 'department' || field === 'status' ? 'asc' : 'desc');
    }
  };

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const getDeptName = (id: string) => departments.find(d => d.code === id)?.name || id;
  const getDeptTypeLabel = (id: string) => {
    const dept = departments.find(d => d.code === id);
    if (!dept) return "";
    return (dept.type === 'floor' || dept.type === 'special') ? " (Statsionar)" : " (Ambulator)";
  };

  const isRoom = (d: any) => 
    Boolean(d?.code?.startsWith('xona-') || /^\d+-xona/i.test(d?.name || '') || d?.name?.toLowerCase().includes('xona') || (d?.type === 'floor' && d?.parentId));

  const ambulatorDepts = useMemo(() => {
    return departments
      .filter(d => d.type === 'general' && !d.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [departments]);

  const specialDepts = useMemo(() => {
    return departments
      .filter(d => (d.type === 'special' || (d.type === 'floor' && !isRoom(d) && ['tugruq', 'neonatologiya', 'operatsiya'].includes(d.code))) && !d.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [departments]);

  const floorGroups = useMemo(() => {
    const floorNums = new Set<number>();
    departments.forEach(d => {
      if (d.floor !== null && d.floor !== undefined && d.floor >= 3) {
        floorNums.add(d.floor);
      }
    });

    return Array.from(floorNums).sort((a, b) => a - b).map(floorNum => {
      const summaryDept = departments.find(d => !isRoom(d) && d.type === 'floor' && d.floor === floorNum);
      const rooms = departments
        .filter(d => isRoom(d) && d.floor === floorNum)
        .sort((a, b) => {
          const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
          const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
          return numA - numB;
        });
      return {
        floorNum,
        summaryDept,
        rooms
      };
    });
  }, [departments]);

  // Compute filtered ratings
  const filteredRatings = useMemo(() => {
    return ratings.filter((r) => {
      // 1. Department Filter (Ota bo'lim tanlansa, uning barcha ichki xonalari va o'zining baholari birgalikda chiqadi)
      if (deptFilter !== "all") {
        const selectedDept = departments.find(d => d.code === deptFilter);
        const matchedFloorGroup = floorGroups.find(
          fg => (fg.summaryDept && fg.summaryDept.code === deptFilter) || `floor-${fg.floorNum}` === deptFilter
        );

        if (selectedDept && ((selectedDept.children && selectedDept.children.length > 0) || departments.some(d => d.parentId === selectedDept.id))) {
          const matchCodes = new Set<string>();
          matchCodes.add(selectedDept.code);
          if (selectedDept.children) {
            selectedDept.children.forEach((c: any) => matchCodes.add(c.code));
          }
          departments.filter(d => d.parentId === selectedDept.id).forEach(c => matchCodes.add(c.code));
          if (selectedDept.type === 'floor' && selectedDept.floor !== null) {
            departments.filter(d => d.floor === selectedDept.floor).forEach(c => matchCodes.add(c.code));
          }

          if (!matchCodes.has(r.department)) return false;
        } else if (matchedFloorGroup) {
          const codesOnFloor = new Set<string>();
          if (matchedFloorGroup.summaryDept) codesOnFloor.add(matchedFloorGroup.summaryDept.code);
          matchedFloorGroup.rooms.forEach(room => codesOnFloor.add(room.code));

          const matchesFloor = codesOnFloor.has(r.department) || departments.some(
            d => d.code === r.department && d.floor === matchedFloorGroup.floorNum
          );
          if (!matchesFloor) return false;
        } else {
          if (r.department !== deptFilter) return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== "all" && (r.status || 'NEW') !== statusFilter) return false;

      // 3. Feedback Type Filter
      if (feedbackTypeFilter === 'text') {
        if (!r.comment || r.comment.trim() === '') return false;
      } else if (feedbackTypeFilter === 'audio') {
        if (!r.audioUrl) return false;
      } else if (feedbackTypeFilter === 'any') {
        const hasText = r.comment && r.comment.trim() !== '';
        const hasVoice = Boolean(r.audioUrl);
        if (!hasText && !hasVoice) return false;
      } else if (feedbackTypeFilter === 'none') {
        const hasText = r.comment && r.comment.trim() !== '';
        const hasVoice = Boolean(r.audioUrl);
        if (hasText || hasVoice) return false;
      }

      // 4. Date Filter
      if (dateStart) {
        if (new Date(r.createdAt) < new Date(dateStart)) return false;
      }
      if (dateEnd) {
        const end = new Date(dateEnd);
        end.setDate(end.getDate() + 1);
        if (new Date(r.createdAt) >= end) return false;
      }

      // 5. Score Filter (1: 😡, 2: 🙁, 3: 🙂, 4: 😍)
      if (scoreFilter !== "all") {
        const targetScore = parseInt(scoreFilter);
        if (r.overallScore) {
          if (r.overallScore !== targetScore) return false;
        } else if (r.values && r.values.length > 0) {
          const avg = Math.round(r.values.reduce((a: number, v: any) => a + v.score, 0) / r.values.length);
          const mapped = avg >= 5 ? 4 : avg >= 4 ? 3 : avg >= 3 ? 2 : 1;
          if (mapped !== targetScore) return false;
        } else {
          return false;
        }
      }

      // 6. Search Query (comment text, employee name, or phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hasComment = r.comment && r.comment.toLowerCase().includes(q);
        const hasEmployee = r.employee && (`${r.employee.firstName} ${r.employee.lastName}`).toLowerCase().includes(q);
        const hasPhone = r.phone && r.phone.toLowerCase().includes(q);
        if (!hasComment && !hasEmployee && !hasPhone) return false;
      }

      return true;
    });
  }, [ratings, deptFilter, statusFilter, feedbackTypeFilter, dateStart, dateEnd, scoreFilter, searchQuery]);

  // Sorting Logic
  const sortedRatings = useMemo(() => {
    return [...filteredRatings].sort((a, b) => {
      if (sortField === 'date') {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      if (sortField === 'department') {
        const nameA = getDeptName(a.department).toLowerCase();
        const nameB = getDeptName(b.department).toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortField === 'score') {
        const scoreA = a.overallScore || 0;
        const scoreB = b.overallScore || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      if (sortField === 'status') {
        const statusWeights: Record<string, number> = {
          NEW: 1,
          REVIEWED: 2,
          RESOLVED: 3,
        };
        const weightA = statusWeights[a.status || 'NEW'] || 1;
        const weightB = statusWeights[b.status || 'NEW'] || 1;
        return sortOrder === 'asc' ? weightA - weightB : weightB - weightA;
      }
      return 0;
    });
  }, [filteredRatings, sortField, sortOrder, departments]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedRatings.length / pageSize);
  const currentData = sortedRatings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when filters or sort change
  useEffect(() => { setCurrentPage(1) }, [deptFilter, statusFilter, feedbackTypeFilter, dateStart, dateEnd, scoreFilter, searchQuery, pageSize, sortField, sortOrder]);

  const handleExportExcel = () => {
    if (sortedRatings.length === 0) {
      addToast("Eksport qilish uchun hech qanday baho mavjud emas", "error");
      return;
    }

    const data = sortedRatings.map((r, index) => {
      let detailedScores = "";
      if (r.values && r.values.length > 0) {
        detailedScores = r.values
          .map((v: any) => `${v.criterion?.name || 'Mezon'}: ${v.textAnswer || v.score}`)
          .join(' | ');
      }
      
      let overallEmoji = "-";
      if (r.overallScore === 1) overallEmoji = "😡 Juda yomon (1)";
      else if (r.overallScore === 2) overallEmoji = "🙁 Qoniqarsiz (2)";
      else if (r.overallScore === 3) overallEmoji = "🙂 Yaxshi (3)";
      else if (r.overallScore === 4) overallEmoji = "😍 A'lo (4)";

      const isUrgent = (r.overallScore === 1 || r.overallScore === 2) && Boolean(r.phone);
      const phoneDisplay = r.phone 
        ? isUrgent 
          ? `${r.phone} (⚠️ Qayta aloqa!)` 
          : r.phone 
        : "-";

      const hasVoice = Boolean(r.audioUrl);
      const hasText = Boolean(r.comment && r.comment.trim() !== '');
      let feedbackType = "Izohsiz";
      if (hasVoice && hasText) feedbackType = "🎙️ Ovozli + 📝 Matn";
      else if (hasVoice) feedbackType = "🎙️ Faqat ovozli";
      else if (hasText) feedbackType = "📝 Faqat matnli";

      const deptObj = departments.find(d => d.code === r.department);
      const isDeptRoom = isRoom(deptObj) || r.department.startsWith('xona-');
      const deptName = deptObj 
        ? (isDeptRoom 
            ? `${deptObj.name} (${deptObj.floor ? `${deptObj.floor}-qavat Statsionar` : 'Statsionar palatasi'})` 
            : `${deptObj.name}${getDeptTypeLabel(r.department)}`)
        : r.department;

      let statusText = "Yangi";
      if (r.status === 'RESOLVED') statusText = "Hal qilindi";
      else if (r.status === 'REVIEWED') statusText = "Ko'rildi";

      return {
        "№": index + 1,
        "Sana va Vaqt": new Date(r.createdAt).toLocaleString('uz-UZ', { 
          year: 'numeric', month: '2-digit', day: '2-digit', 
          hour: '2-digit', minute: '2-digit' 
        }),
        "Bo'lim": deptName,
        "Umumiy taassurot": overallEmoji,
        "Telefon / Qayta aloqa": phoneDisplay,
        "Izoh turi": feedbackType,
        "Matnli izoh": r.comment || "-",
        "Batafsil savol-javoblar": detailedScores || "-",
        "Biriktirilgan xodim": r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "-",
        "Holati": statusText
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-calculate column widths with sensible padding and boundaries
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      worksheet['!cols'] = keys.map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = String((row as any)[key] || '');
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
      });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Baholar");

    // Dynamic filename with current date and active filters
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const fileSuffix = deptFilter !== 'all' ? `_${deptFilter}` : '';
    const fileName = `SmileBaby_Baholar_${dateStr}${fileSuffix}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    addToast("Excel fayl muvaffaqiyatli yuklab olindi", "success");
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/ratings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        addToast("Holat yangilandi", "success");
        router.refresh();
      } else {
        addToast("Xatolik yuz berdi", "error");
      }
    } catch (err) {
      addToast("Tarmoq xatosi", "error");
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <ToastContainer />
      
      {/* Top Filter Bar */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Izoh yoki xodim ismidan qidiring..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={pageSize} 
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-3 px-4 focus:outline-none cursor-pointer font-bold w-full md:w-auto"
            >
              <option value={10}>10 ta dan</option>
              <option value={20}>20 ta dan</option>
              <option value={30}>30 ta dan</option>
              <option value={50}>50 ta dan</option>
            </select>
            <button 
              onClick={handleExportExcel}
              className="bg-[#0A9C54] hover:bg-[#088246] text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 flex-shrink-0"
            >
              <Download size={18} />
              Excel yuklash
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Bo'lim bo'yicha</label>
            <select 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">📋 Barcha bo'limlar</option>

              {ambulatorDepts.length > 0 && (
                <optgroup label="─── Ambulator bo'limlar ───">
                  {ambulatorDepts.map(d => {
                    const children = departments.filter(c => c.parentId === d.id);
                    if (children.length > 0) {
                      return (
                        <React.Fragment key={d.code}>
                          <option value={d.code}>
                            🏥 {d.name} (Barcha xonalar va umumiy)
                          </option>
                          {children.map(child => (
                            <option key={child.code} value={child.code}>
                              &nbsp;&nbsp;&nbsp;&nbsp;↳ {child.name}
                            </option>
                          ))}
                        </React.Fragment>
                      );
                    }
                    return (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    );
                  })}
                </optgroup>
              )}

              {specialDepts.length > 0 && (
                <optgroup label="─── Maxsus bo'limlar (Statsionar) ───">
                  {specialDepts.map(d => {
                    const children = departments.filter(c => c.parentId === d.id);
                    if (children.length > 0) {
                      return (
                        <React.Fragment key={d.code}>
                          <option value={d.code}>
                            ⭐ {d.name} (Barcha xonalar va umumiy)
                          </option>
                          {children.map(child => (
                            <option key={child.code} value={child.code}>
                              &nbsp;&nbsp;&nbsp;&nbsp;↳ {child.name}
                            </option>
                          ))}
                        </React.Fragment>
                      );
                    }
                    return (
                      <option key={d.code} value={d.code}>
                        ⭐ {d.name}
                      </option>
                    );
                  })}
                </optgroup>
              )}

              {floorGroups.map(fg => (
                <optgroup key={fg.floorNum} label={`─── ${fg.floorNum}-qavat (Statsionar) ───`}>
                  <option value={fg.summaryDept ? fg.summaryDept.code : `floor-${fg.floorNum}`}>
                    🏢 {fg.summaryDept ? fg.summaryDept.name : `${fg.floorNum}-qavat`} (Barcha xonalar va umumiy)
                  </option>
                  {fg.rooms.map(room => (
                    <option key={room.code} value={room.code}>
                      &nbsp;&nbsp;&nbsp;&nbsp;↳ {room.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Baho darajasi</label>
            <select 
              value={scoreFilter} 
              onChange={(e) => setScoreFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">Barchasi</option>
              <option value="4">😍 A'lo (4)</option>
              <option value="3">🙂 Yaxshi (3)</option>
              <option value="2">🙁 Qoniqarsiz (2)</option>
              <option value="1">😡 Juda yomon (1)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Holati</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">Barchasi</option>
              <option value="NEW">🟡 Yangi</option>
              <option value="REVIEWED">🔵 Ko'rildi</option>
              <option value="RESOLVED">🟢 Hal qilindi</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Izoh turi</label>
            <select 
              value={feedbackTypeFilter} 
              onChange={(e) => setFeedbackTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">Barchasi</option>
              <option value="text">📝 Faqat matnli izohlar</option>
              <option value="audio">🎙 Faqat ovozli xabarlar</option>
              <option value="any">💬 Izohi borlar (matn/ovoz)</option>
              <option value="none">Izohsizlar</option>
            </select>
          </div>

          <div>
             <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Boshlanish sanasi</label>
             <div className="relative">
                <input 
                  type="date" 
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none font-medium"
                />
             </div>
          </div>

          <div>
             <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Tugash sanasi</label>
             <div className="relative">
                <input 
                  type="date" 
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none font-medium"
                />
             </div>
          </div>
        </div>

      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100 font-extrabold tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-4 w-12 text-center select-none">№</th>
              <th 
                scope="col" 
                onClick={() => handleSort('date')}
                className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="Sana bo'yicha saralash (eng yangi / eng eski)"
              >
                <div className="flex items-center gap-1.5">
                  <span>Sana</span>
                  {sortField === 'date' ? (
                    sortOrder === 'desc' ? (
                      <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    )
                  ) : (
                    <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                onClick={() => handleSort('department')}
                className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="Bo'lim bo'yicha alifbo tartibida saralash"
              >
                <div className="flex items-center gap-1.5">
                  <span>Bo'lim & Xodim</span>
                  {sortField === 'department' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    )
                  ) : (
                    <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-4 select-none">Telefon & Aloqa</th>
              <th 
                scope="col" 
                onClick={() => handleSort('score')}
                className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="Baho bo'yicha saralash (eng yuqori / eng past)"
              >
                <div className="flex items-center gap-1.5">
                  <span>Baho tafsilotlari</span>
                  {sortField === 'score' ? (
                    sortOrder === 'desc' ? (
                      <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    )
                  ) : (
                    <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                onClick={() => handleSort('status')}
                className="px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                title="Holati bo'yicha saralash (Yangi / Ko'rildi / Hal qilindi)"
              >
                <div className="flex items-center gap-1.5">
                  <span>Holati</span>
                  {sortField === 'status' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    )
                  ) : (
                    <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-4 select-none">Mijoz izohi</th>
              <th scope="col" className="px-4 py-4 text-center select-none">Amal</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((r: any, idx: number) => {
              const isUrgent = Boolean(r.phone) && Boolean(r.overallScore && r.overallScore <= 2) && r.status !== 'RESOLVED';

              return (
                <tr key={r.id} className="bg-white border-b border-slate-50 hover:bg-[#0A9C54]/5 transition-colors group">
                  <td className="px-4 py-5 text-center font-bold text-slate-400 text-xs">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                     <div className="font-bold text-slate-800">{new Date(r.createdAt).toLocaleDateString('uz-UZ')}</div>
                     <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}</div>
                  </td>
                  <td className="px-6 py-5">
                    {(() => {
                      const deptObj = departments.find(d => d.code === r.department);
                      const isDeptRoom = isRoom(deptObj) || r.department.startsWith('xona-');
                      const isSpecial = deptObj?.type === 'special';
                      const isFloor = deptObj?.type === 'floor';

                      return (
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              isDeptRoom 
                                ? 'bg-emerald-50 text-[#0A9C54] border-emerald-200 font-black'
                                : isSpecial 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : isFloor 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {isDeptRoom ? `🛏️ ${deptObj?.name || r.department}` : isSpecial ? `⭐ ${deptObj?.name || r.department}` : isFloor ? `🏢 ${deptObj?.name || r.department}` : (deptObj?.name || r.department)}
                            </span>
                            {isDeptRoom && deptObj?.floor && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                {deptObj.floor}-qavat
                              </span>
                            )}
                          </div>
                          {r.employee && (
                            <div className="text-xs font-bold text-[#0A9C54] bg-[#0A9C54]/10 inline-block px-2 py-0.5 rounded-lg">
                              👤 {r.employee.firstName} {r.employee.lastName}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {r.phone ? (
                      <div className="flex flex-col gap-1 items-start">
                        <a href={`tel:${r.phone}`} className="text-blue-600 font-bold hover:underline text-sm flex items-center gap-1">
                          {r.phone}
                        </a>
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200 animate-pulse">
                            📞 Qayta aloqa!
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {r.overallScore && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-2xl" title="Umumiy taassurot">
                          {r.overallScore === 1 ? '😡' : r.overallScore === 2 ? '🙁' : r.overallScore === 3 ? '🙂' : '😍'}
                        </span>
                        <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md ${
                          r.overallScore >= 3 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                        }`}>
                          {r.overallScore === 4 ? "A'lo" : r.overallScore === 3 ? "Yaxshi" : r.overallScore === 2 ? "Qoniqarsiz" : "Juda yomon"}
                        </span>
                      </div>
                    )}
                    {r.values && r.values.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {r.values.map((v: any) => (
                          <span key={v.id} className="bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            <span className="text-slate-500 font-normal">{v.criterion?.name}:</span> <span className="text-[#0A9C54] font-bold">{v.textAnswer ? v.textAnswer : `${v.score} ⭐`}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      !r.overallScore && <span className="text-slate-400 text-xs italic">Baho mavjud emas</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <select
                      value={r.status || 'NEW'}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${
                        r.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        r.status === 'REVIEWED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="NEW">Yangi</option>
                      <option value="REVIEWED">Ko'rildi</option>
                      <option value="RESOLVED">Hal qilindi</option>
                    </select>
                  </td>
                  <td className="px-6 py-5 min-w-[240px] max-w-[360px]">
                    {r.comment && (
                      <div 
                        onClick={() => setSelectedRating(r)}
                        className="cursor-pointer group/comment mb-2"
                        title="To'liq o'qish uchun bosing"
                      >
                        <p className="text-slate-700 font-medium italic text-sm leading-relaxed line-clamp-2 group-hover/comment:text-[#0A9C54] transition-colors">
                          "{r.comment}"
                        </p>
                        {r.comment.length > 80 && (
                          <span className="text-[11px] font-bold text-[#0A9C54] hover:underline inline-block mt-0.5">
                            to'liq o'qish &rarr;
                          </span>
                        )}
                      </div>
                    )}
                    {r.audioUrl && (
                      <div className="bg-purple-50 p-2 rounded-xl border border-purple-100 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 flex items-center gap-1">
                          🎙 Ovozli xabar
                        </span>
                        <audio src={r.audioUrl} controls className="w-full h-8" />
                      </div>
                    )}
                    {!r.comment && !r.audioUrl && (
                      <span className="text-slate-300 text-xs uppercase font-bold tracking-widest">Izoh qoldirilmagan</span>
                    )}
                  </td>
                  <td className="px-4 py-5 text-center whitespace-nowrap">
                    <button
                      onClick={() => setSelectedRating(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-[#0A9C54] hover:text-white text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all shadow-xs group/btn cursor-pointer"
                      title="Barcha tafsilotlarni to'liq ko'rish"
                    >
                      <Eye size={15} className="text-[#0A9C54] group-hover/btn:text-white transition-colors" />
                      <span>Ko'rish</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Search size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold text-lg mb-1">Ma'lumot topilmadi</p>
                  <p className="text-slate-400 text-sm">Filtrni o'zgartirib qaytadan urinib ko'ring</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {(totalPages > 1 || filteredRatings.length > 10) && (
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-sm text-slate-500 font-medium">
              Jami: <span className="font-bold text-slate-900">{filteredRatings.length}</span> ta yozuvdan <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredRatings.length)}</span> ko'rsatilmoqda
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span>Ko'rsatish:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-1 px-2.5 focus:outline-none cursor-pointer font-bold"
              >
                <option value="10">10 tadan</option>
                <option value="20">20 tadan</option>
                <option value="40">40 tadan</option>
                <option value="50">50 tadan</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? 'bg-[#0A9C54] text-white shadow-md shadow-[#0A9C54]/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Rating Detail Modal */}
      {selectedRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="bg-[#0A9C54]/10 text-[#0A9C54] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {getDeptName(selectedRating.department)}
                  </span>
                  {selectedRating.employee && (
                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                      👤 {selectedRating.employee.firstName} {selectedRating.employee.lastName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Murojaat vaqti: {new Date(selectedRating.createdAt).toLocaleString('uz-UZ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedRating(null)}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-6 space-y-6">

              {/* Overall Impression & Status Banner */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">
                    {selectedRating.overallScore === 1 ? '😡' : selectedRating.overallScore === 2 ? '🙁' : selectedRating.overallScore === 3 ? '🙂' : '😍'}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Umumiy taassurot</p>
                    <h4 className="text-lg font-black text-slate-800">
                      {selectedRating.overallScore === 4 ? "A'lo darajada" : selectedRating.overallScore === 3 ? "Yaxshi" : selectedRating.overallScore === 2 ? "Qoniqarsiz" : "Juda yomon"}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-400">Holati:</span>
                  <select
                    value={selectedRating.status || 'NEW'}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      updateStatus(selectedRating.id, newStatus);
                      setSelectedRating((prev: any) => ({ ...prev, status: newStatus }));
                    }}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl border outline-none cursor-pointer transition-colors ${
                      selectedRating.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      selectedRating.status === 'REVIEWED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <option value="NEW">🟡 Yangi</option>
                    <option value="REVIEWED">🔵 Ko'rildi</option>
                    <option value="RESOLVED">🟢 Hal qilindi</option>
                  </select>
                </div>
              </div>

              {/* Phone & Urgent Alert */}
              {selectedRating.phone && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  selectedRating.overallScore <= 2 ? 'bg-red-50/70 border-red-200' : 'bg-blue-50/70 border-blue-200'
                }`}>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone size={14} className={selectedRating.overallScore <= 2 ? "text-red-500" : "text-blue-500"} />
                      Mijoz telefon raqami
                    </p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">{selectedRating.phone}</p>
                    {selectedRating.overallScore <= 2 && (
                      <p className="text-xs font-semibold text-red-600 mt-1">
                        ⚠️ Bemor salbiy baho qoldirgan. Zudlik bilan bog'lanish tavsiya etiladi!
                      </p>
                    )}
                  </div>
                  <a
                    href={`tel:${selectedRating.phone}`}
                    className="px-4 py-2.5 bg-[#0A9C54] hover:bg-[#088246] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <Phone size={14} />
                    Qo'ng'iroq qilish
                  </a>
                </div>
              )}

              {/* Audio Message */}
              {selectedRating.audioUrl && (
                <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                    🎙 Bemor qoldirgan ovozli xabar
                  </span>
                  <audio src={selectedRating.audioUrl} controls className="w-full mt-2" autoPlay={false} />
                </div>
              )}

              {/* Full Text Comment */}
              {selectedRating.comment && (
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mijozning to'liq yozma izohi</h5>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800 font-medium text-sm sm:text-base leading-relaxed italic">
                    "{selectedRating.comment}"
                  </div>
                </div>
              )}

              {/* Detailed Criteria Answers */}
              {selectedRating.values && selectedRating.values.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bo'lim mezonlari bo'yicha javoblar</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedRating.values.map((v: any) => (
                      <div key={v.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-xs text-slate-500 font-medium mb-1">{v.criterion?.name}</span>
                        <span className="text-sm font-bold text-[#0A9C54] flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-[#0A9C54] shrink-0" />
                          {v.textAnswer ? v.textAnswer : `${v.score} ⭐`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRating(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
