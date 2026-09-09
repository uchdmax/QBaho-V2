"use client";

import React, { useState, useMemo } from 'react';
import { Users, Star, Activity, Building2, Stethoscope, HeartPulse, Calendar, Mic, MessageSquare, HelpCircle, X, CheckCircle2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';

const getIconForCriterion = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('shifokor') || n.includes('vrach')) return <Stethoscope size={16} className="text-cyan-500" />;
  if (n.includes('hamshira')) return <HeartPulse size={16} className="text-rose-500" />;
  if (n.includes('toza') || n.includes('gigiyena')) return <Users size={16} className="text-orange-500" />;
  if (n.includes('oshxona') || n.includes('ovqat')) return <Activity size={16} className="text-amber-500" />;
  if (n.includes('laboratoriya') || n.includes('uzi')) return <Activity size={16} className="text-pink-500" />;
  if (n.includes('qabulxona') || n.includes('kassa') || n.includes('reception')) return <Users size={16} className="text-emerald-500" />;
  return <Star size={16} className="text-indigo-500" />;
};

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enUS } from 'date-fns/locale';

export default function DashboardClient({ initialRatings, employeesCount, allDepts }: any) {
  const [dateFilter, setDateFilter] = useState('all'); // 'today', 'week', 'month', 'all', 'custom'
  const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
  const [deptTypeFilter, setDeptTypeFilter] = useState<'all' | 'general' | 'floor'>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all'); // 'all' or department code
  const [showMethodology, setShowMethodology] = useState(false);

  const deptTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    allDepts.forEach((d: any) => {
      map[d.code] = d.type;
    });
    return map;
  }, [allDepts]);

  const isRoom = (d: any) => 
    Boolean(d?.code?.startsWith('xona-') || /^\d+-xona/i.test(d?.name || '') || d?.name?.toLowerCase().includes('xona') || (d?.type === 'floor' && d?.parentId));

  const ambulatorDepts = useMemo(() => {
    return allDepts
      .filter((d: any) => d.type === 'general' && !d.parentId)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [allDepts]);

  const specialDepts = useMemo(() => {
    return allDepts
      .filter((d: any) => (d.type === 'special' || (d.type === 'floor' && !isRoom(d) && ['tugruq', 'neonatologiya', 'operatsiya'].includes(d.code))) && !d.parentId)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [allDepts]);

  const floorGroups = useMemo(() => {
    const floorNums = new Set<number>();
    allDepts.forEach((d: any) => {
      if (d.floor !== null && d.floor !== undefined && d.floor >= 3) {
        floorNums.add(d.floor);
      }
    });

    return Array.from(floorNums).sort((a, b) => a - b).map(floorNum => {
      const summaryDept = allDepts.find((d: any) => !isRoom(d) && d.type === 'floor' && d.floor === floorNum);
      const rooms = allDepts
        .filter((d: any) => isRoom(d) && d.floor === floorNum)
        .sort((a: any, b: any) => {
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
  }, [allDepts]);

  const availableDepts = useMemo(() => {
    if (deptTypeFilter === 'all') return allDepts;
    if (deptTypeFilter === 'floor') return allDepts.filter((d: any) => d.type === 'floor' || d.type === 'special');
    return allDepts.filter((d: any) => d.type === deptTypeFilter);
  }, [allDepts, deptTypeFilter]);

  const handleTypeFilterChange = (type: 'all' | 'general' | 'floor') => {
    setDeptTypeFilter(type);
    if (type !== 'all' && selectedDeptFilter !== 'all') {
      const d = allDepts.find((dept: any) => dept.code === selectedDeptFilter);
      if (d) {
        const matches = type === 'floor' ? (d.type === 'floor' || d.type === 'special') : d.type === type;
        if (!matches) {
          setSelectedDeptFilter('all');
        }
      }
    }
  };

  const filteredRatings = useMemo(() => {
    const now = new Date();
    return initialRatings.filter((r: any) => {
      // 1. Turi bo'yicha filtr (Ambulator / Statsionar)
      if (deptTypeFilter !== 'all') {
        const dType = deptTypeMap[r.department];
        if (deptTypeFilter === 'floor') {
          if (dType !== 'floor' && dType !== 'special') return false;
        } else if (dType !== deptTypeFilter) {
          return false;
        }
      }

      // 2. Bo'lim bo'yicha filtr (Ota bo'lim tanlansa, uning barcha ichki xonalari va o'zining baholari birgalikda chiqadi)
      if (selectedDeptFilter !== 'all') {
        const selectedDept = allDepts.find((d: any) => d.code === selectedDeptFilter);
        const matchedFloorGroup = floorGroups.find(
          fg => (fg.summaryDept && fg.summaryDept.code === selectedDeptFilter) || `floor-${fg.floorNum}` === selectedDeptFilter
        );

        if (selectedDept && ((selectedDept.children && selectedDept.children.length > 0) || allDepts.some((d: any) => d.parentId === selectedDept.id))) {
          const matchCodes = new Set<string>();
          matchCodes.add(selectedDept.code);
          if (selectedDept.children) {
            selectedDept.children.forEach((c: any) => matchCodes.add(c.code));
          }
          allDepts.filter((d: any) => d.parentId === selectedDept.id).forEach((c: any) => matchCodes.add(c.code));
          if (selectedDept.type === 'floor' && selectedDept.floor !== null) {
            allDepts.filter((d: any) => d.floor === selectedDept.floor).forEach((c: any) => matchCodes.add(c.code));
          }

          if (!matchCodes.has(r.department)) return false;
        } else if (matchedFloorGroup) {
          const codesOnFloor = new Set<string>();
          if (matchedFloorGroup.summaryDept) codesOnFloor.add(matchedFloorGroup.summaryDept.code);
          matchedFloorGroup.rooms.forEach((room: any) => codesOnFloor.add(room.code));

          const matchesFloor = codesOnFloor.has(r.department) || allDepts.some(
            (d: any) => d.code === r.department && d.floor === matchedFloorGroup.floorNum
          );
          if (!matchesFloor) return false;
        } else {
          if (r.department !== selectedDeptFilter) return false;
        }
      }

      // 3. Sana bo'yicha filtr
      const rDate = new Date(r.createdAt);
      if (dateFilter === 'today') {
        return rDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return rDate >= weekAgo;
      }
      if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return rDate >= monthAgo;
      }
      if (dateFilter === 'custom' && customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        return rDate >= start && rDate <= end;
      }
      return true;
    });
  }, [initialRatings, dateFilter, customRange, deptTypeFilter, selectedDeptFilter, deptTypeMap]);

  const totalRatings = filteredRatings.length;
  
  let positiveCount = 0;
  let validCount = 0;
  let totalIndexPoints = 0;

  filteredRatings.forEach((r: any) => {
    if (r.overallScore) {
      validCount++;
      if (r.overallScore >= 3) positiveCount++;
      
      if (r.overallScore === 4) totalIndexPoints += 100;
      else if (r.overallScore === 3) totalIndexPoints += 75;
      else if (r.overallScore === 2) totalIndexPoints += 50;
      else if (r.overallScore === 1) totalIndexPoints += 25;
    } else if (r.values && r.values.length > 0) {
      validCount++;
      const rAvg = r.values.reduce((acc: number, v: any) => acc + v.score, 0) / r.values.length;
      if (rAvg >= 3) positiveCount++;
      totalIndexPoints += (rAvg - 1) * 25; // old score to 0-100 logic
    }
  });

  const positiveShare = validCount > 0 ? Math.round((positiveCount / validCount) * 100) : 0;
  const happyIndex = validCount > 0 ? Math.round(totalIndexPoints / validCount) : 0;
  const voiceCount = filteredRatings.filter((r: any) => Boolean(r.audioUrl)).length;
  const textCommentCount = filteredRatings.filter((r: any) => Boolean(r.comment) && r.comment.trim() !== '').length;

  const selectedDeptObj = allDepts.find((d: any) => d.code === selectedDeptFilter);

  const stats = [
    { name: "Jami Baholar", value: totalRatings, icon: <Activity size={24} />, color: "bg-blue-500" },
    { 
      name: selectedDeptObj 
        ? `${selectedDeptObj.name} o'rtachasi` 
        : deptTypeFilter === 'general'
          ? "Ambulator O'rtachasi"
          : deptTypeFilter === 'floor'
            ? "Statsionar O'rtachasi"
            : "Klinika O'rtachasi", 
      value: `${happyIndex}%`, 
      icon: <Star size={24} />, 
      color: "bg-amber-500" 
    },
    { 
      name: "Mamnun Mijozlar", 
      value: `😊 ${positiveCount} ta`, 
      subValue: `(${positiveShare}%)`, 
      icon: <Users size={24} />, 
      color: "bg-emerald-500" 
    },
    { name: "Ovozli Xabarlar", value: `🎙 ${voiceCount}`, icon: <Mic size={24} />, color: "bg-purple-500" },
    { name: "Matnli Izohlar", value: `📝 ${textCommentCount}`, icon: <MessageSquare size={24} />, color: "bg-rose-500" },
    { 
      name: selectedDeptObj 
        ? "Tanlangan Bo'lim" 
        : deptTypeFilter === 'general'
          ? "Ambulator Bo'limlar"
          : deptTypeFilter === 'floor'
            ? "Statsionar Bo'limlar"
            : "Jami Bo'limlar", 
      value: selectedDeptObj ? selectedDeptObj.name : availableDepts.length, 
      icon: <Building2 size={24} />, 
      color: "bg-cyan-500" 
    },
  ];

  const mappedRatings = filteredRatings.map((r: any) => {
    let score = 0;
    if (r.overallScore) {
      if (r.overallScore === 4) score = 100;
      else if (r.overallScore === 3) score = 75;
      else if (r.overallScore === 2) score = 50;
      else score = 25;
    } else if (r.values && r.values.length > 0) {
      const rAvg = r.values.reduce((acc: number, v: any) => acc + v.score, 0) / r.values.length;
      score = (rAvg - 1) * 25; // 1-5 ni 0-100 ga o'tkazish
    }
    return {
      department: r.department,
      createdAt: r.createdAt,
      averageScore: score
    };
  });


  const getDeptRatings = (deptCode: string) => {
    const deptObj = allDepts.find((d: any) => d.code === deptCode);
    if (deptObj && ((deptObj.children && deptObj.children.length > 0) || allDepts.some((d: any) => d.parentId === deptObj.id))) {
      const matchCodes = new Set<string>();
      matchCodes.add(deptObj.code);
      if (deptObj.children) {
        deptObj.children.forEach((c: any) => matchCodes.add(c.code));
      }
      allDepts.filter((d: any) => d.parentId === deptObj.id).forEach((c: any) => matchCodes.add(c.code));
      if (deptObj.type === 'floor' && deptObj.floor !== null) {
        allDepts.filter((d: any) => d.floor === deptObj.floor).forEach((c: any) => matchCodes.add(c.code));
      }
      return filteredRatings.filter((r: any) => matchCodes.has(r.department));
    }
    if (deptObj && deptObj.floor !== null && !isRoom(deptObj)) {
      const matchedFloorGroup = floorGroups.find(
        fg => (fg.summaryDept && fg.summaryDept.code === deptCode) || fg.floorNum === deptObj.floor
      );
      if (matchedFloorGroup) {
        const codesOnFloor = new Set<string>();
        if (matchedFloorGroup.summaryDept) codesOnFloor.add(matchedFloorGroup.summaryDept.code);
        matchedFloorGroup.rooms.forEach((room: any) => codesOnFloor.add(room.code));
        return filteredRatings.filter((r: any) => codesOnFloor.has(r.department) || allDepts.some((d: any) => d.code === r.department && d.floor === matchedFloorGroup.floorNum));
      }
    }
    return filteredRatings.filter((r: any) => r.department === deptCode);
  };

  const getDeptOverall = (deptCode: string) => {
    const deptRatings = getDeptRatings(deptCode);
    if (deptRatings.length === 0) return "Baho yo'q";
    
    let posCount = 0;
    let vCount = 0;
    let totalIndex = 0;
    
    deptRatings.forEach((r: any) => {
      if (r.overallScore) {
        vCount++;
        if (r.overallScore >= 3) posCount++;
        if (r.overallScore === 4) totalIndex += 100;
        else if (r.overallScore === 3) totalIndex += 75;
        else if (r.overallScore === 2) totalIndex += 50;
        else if (r.overallScore === 1) totalIndex += 25;
      } else if (r.values && r.values.length > 0) {
        vCount++;
        const rAvg = r.values.reduce((a: number, b: any) => a + b.score, 0) / r.values.length;
        if (rAvg >= 3) posCount++;
        totalIndex += (rAvg - 1) * 25;
      }
    });
    
    if (vCount === 0) return "Baho yo'q";
    const pShare = Math.round((posCount / vCount) * 100);
    const hIdx = Math.round(totalIndex / vCount);
    
    return `🏆 ${hIdx}% | 😊 ${pShare}%`;
  };

  const calculateDeptCriterionAverage = (deptCode: string, criterionId: number) => {
    const deptRatings = getDeptRatings(deptCode);
    if (deptRatings.length === 0) return <span className="text-slate-300">-</span>;
    
    let sum = 0;
    let count = 0;
    const textAnswersCount: Record<string, number> = {};
    
    deptRatings.forEach((r: any) => {
      const v = r.values.find((val: any) => val.criterionId === criterionId);
      if (v) {
        if (v.textAnswer) {
          textAnswersCount[v.textAnswer] = (textAnswersCount[v.textAnswer] || 0) + 1;
        }
        sum += v.score;
        count++;
      }
    });

    if (count === 0) return <span className="text-slate-300">-</span>;
    
    if (Object.keys(textAnswersCount).length > 0) {
      let topAnswer = "";
      let topCount = 0;
      for (const [ans, c] of Object.entries(textAnswersCount)) {
        if (c > topCount) {
          topCount = c;
          topAnswer = ans;
        }
      }
      const percentage = Math.round((topCount / count) * 100);
      const breakdownText = Object.entries(textAnswersCount)
        .sort((a, b) => b[1] - a[1])
        .map(([ans, c]) => `• ${ans}: ${c} ta (${Math.round((c / count) * 100)}%)`)
        .join('\n');

      return (
        <div 
          className="flex flex-col items-end leading-tight text-right cursor-help group relative"
          title={`Barcha variantlar taqsimoti (${count} ta javob):\n${breakdownText}`}
        >
          <span className="font-bold text-slate-800 text-[13px] group-hover:text-[#0A9C54] transition-colors">{topAnswer}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">{percentage}% mijozlar shunday degan</span>
        </div>
      );
    }
    
    const avgScore = sum / count; // 1 to 5
    const percentage = Math.round((avgScore - 1) * 25);
    return <span className="font-bold text-slate-800">{percentage}% ijobiy</span>;
  };

  const displayedDepts = useMemo(() => {
    let list = allDepts;
    if (deptTypeFilter !== 'all') {
      if (deptTypeFilter === 'floor') {
        list = list.filter((d: any) => d.type === 'floor' || d.type === 'special');
      } else {
        list = list.filter((d: any) => d.type === deptTypeFilter);
      }
    }
    if (selectedDeptFilter !== 'all') {
      const selectedDept = allDepts.find((d: any) => d.code === selectedDeptFilter);
      const matchedFloorGroup = floorGroups.find(
        fg => (fg.summaryDept && fg.summaryDept.code === selectedDeptFilter) || `floor-${fg.floorNum}` === selectedDeptFilter
      );
      if (selectedDept && ((selectedDept.children && selectedDept.children.length > 0) || allDepts.some((d: any) => d.parentId === selectedDept.id))) {
        list = list.filter((d: any) => d.code === selectedDept.code || d.parentId === selectedDept.id || (selectedDept.type === 'floor' && selectedDept.floor !== null && d.floor === selectedDept.floor));
      } else if (matchedFloorGroup) {
        list = list.filter((d: any) => d.floor === matchedFloorGroup.floorNum || (matchedFloorGroup.summaryDept && d.code === matchedFloorGroup.summaryDept.code));
      } else {
        list = list.filter((d: any) => d.code === selectedDeptFilter);
      }
    }
    return list;
  }, [allDepts, deptTypeFilter, selectedDeptFilter, floorGroups]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Building2 className="text-[#0A9C54]" size={28} />
          Klinika ko'rsatkichlari
        </h2>
        <button
          type="button"
          onClick={() => setShowMethodology(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-[#0A9C54] hover:bg-emerald-100 font-bold text-xs border border-[#0A9C54]/20 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <HelpCircle size={16} />
          <span>Hisoblash metodologiyasi (Qanday ishlaydi?)</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 z-20 relative">
        <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto">
          {[
            { id: 'today', label: 'Bugun' },
            { id: 'week', label: 'Hafta' },
            { id: 'month', label: 'Oy' },
            { id: 'all', label: 'Barchasi' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                dateFilter === f.id ? 'bg-[#0A9C54] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
          {/* Turi filtri */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">Turi:</span>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => handleTypeFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  deptTypeFilter === 'all'
                    ? 'bg-[#0A9C54] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => handleTypeFilterChange('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  deptTypeFilter === 'general'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Ambulator
              </button>
              <button
                type="button"
                onClick={() => handleTypeFilterChange('floor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  deptTypeFilter === 'floor'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Statsionar
              </button>
            </div>
          </div>

          {/* Bo'lim filtri */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">Bo'lim:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-[#0A9C54] cursor-pointer transition-all shadow-xs"
            >
              <option value="all">
                {deptTypeFilter === 'all' ? "📋 Barcha bo'limlar" : deptTypeFilter === 'general' ? "📋 Barcha ambulator" : "📋 Barcha statsionar"}
              </option>

              {deptTypeFilter !== 'floor' && ambulatorDepts.length > 0 && (
                <optgroup label="─── Ambulator bo'limlar ───">
                  {ambulatorDepts.map((d: any) => {
                    const children = allDepts.filter((c: any) => c.parentId === d.id);
                    if (children.length > 0) {
                      return (
                        <React.Fragment key={d.code}>
                          <option value={d.code}>
                            🏥 {d.name} (Barcha xonalar va umumiy)
                          </option>
                          {children.map((child: any) => (
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

              {deptTypeFilter !== 'general' && specialDepts.length > 0 && (
                <optgroup label="─── Maxsus bo'limlar (Statsionar) ───">
                  {specialDepts.map((d: any) => {
                    const children = allDepts.filter((c: any) => c.parentId === d.id);
                    if (children.length > 0) {
                      return (
                        <React.Fragment key={d.code}>
                          <option value={d.code}>
                            ⭐ {d.name} (Barcha xonalar va umumiy)
                          </option>
                          {children.map((child: any) => (
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

              {deptTypeFilter !== 'general' && floorGroups.map(fg => (
                <optgroup key={fg.floorNum} label={`─── ${fg.floorNum}-qavat (Statsionar) ───`}>
                  <option value={fg.summaryDept ? fg.summaryDept.code : `floor-${fg.floorNum}`}>
                    🏢 {fg.summaryDept ? fg.summaryDept.name : `${fg.floorNum}-qavat`} (Barcha xonalar va umumiy)
                  </option>
                  {fg.rooms.map((room: any) => (
                    <option key={room.code} value={room.code}>
                      &nbsp;&nbsp;&nbsp;&nbsp;↳ {room.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Sana oraliq filtri */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">Oraliq:</span>
            <DatePicker
              selected={customRange.start}
              onChange={(date: Date | null) => {
                setCustomRange(prev => ({ ...prev, start: date }));
                if (date && customRange.end) setDateFilter('custom');
              }}
              selectsStart
              startDate={customRange.start ?? undefined}
              endDate={customRange.end ?? undefined}
              placeholderText="KK.OO.YYYY"
              locale={enUS}
              dateFormat="dd.MM.yyyy"
              className="text-sm font-medium outline-none bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 w-[110px] focus:border-[#0A9C54]"
              popperClassName="z-50"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
            <span className="text-slate-300">-</span>
            <DatePicker
              selected={customRange.end}
              onChange={(date: Date | null) => {
                setCustomRange(prev => ({ ...prev, end: date }));
                if (customRange.start && date) setDateFilter('custom');
              }}
              selectsEnd
              startDate={customRange.start ?? undefined}
              endDate={customRange.end ?? undefined}
              minDate={customRange.start ?? undefined}
              placeholderText="KK.OO.YYYY"
              locale={enUS}
              dateFormat="dd.MM.yyyy"
              className="text-sm font-medium outline-none bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 w-[110px] focus:border-[#0A9C54]"
              popperClassName="z-50"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-5 lg:p-6 flex items-center gap-4 lg:gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all overflow-hidden relative">
            <div className={`w-12 h-12 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg relative z-10 shrink-0`}>
              {stat.icon}
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-slate-500 text-[13px] font-bold">{stat.name}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
                {stat.subValue && <span className="text-[13px] font-bold text-emerald-500">{stat.subValue}</span>}
              </div>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-32 h-32 ${stat.color} opacity-5 rounded-full group-hover:scale-150 transition-all duration-500 z-0 pointer-events-none`} />
          </div>
        ))}
      </div>

      <div className="mb-12">
        <DashboardCharts 
          ratings={mappedRatings} 
          dateFilter={dateFilter} 
          customRange={{
            start: customRange.start?.toISOString() ?? '',
            end: customRange.end?.toISOString() ?? ''
          }}
          departments={allDepts}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>
            {selectedDeptFilter === 'all' 
              ? deptTypeFilter === 'all'
                ? "Barcha bo'limlar (Batafsil reyting)" 
                : deptTypeFilter === 'general'
                  ? "Ambulator bo'limlar (Batafsil reyting)"
                  : "Statsionar bo'limlar (Batafsil reyting)"
              : `${selectedDeptObj?.name || 'Tanlangan bo\'lim'} (Batafsil reyting)`}
          </span>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200/60">
            {displayedDepts.length} ta bo'lim
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {displayedDepts.map((dept: any) => (
          <div key={dept.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-50 gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800 text-lg">{dept.name}</span>
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg ${
                      dept.type === 'general' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : dept.type === 'special'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                          : 'bg-purple-50 text-purple-600 border border-purple-100'
                    }`}>
                      {dept.type === 'general' ? 'Ambulator' : dept.type === 'special' ? "⭐ Maxsus bo'lim" : 'Statsionar'}
                    </span>
                  </div>
                  {dept.floor !== null && dept.floor !== undefined && (
                    <span className="text-xs text-slate-400 font-medium">{dept.floor}-qavat</span>
                  )}
                </div>
                <span className="font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-xl text-xs whitespace-nowrap shrink-0 border border-amber-100/60">
                  {getDeptOverall(dept.code)}
                </span>
              </div>
              
              <div className="space-y-3">
                {dept.criteria && dept.criteria.length > 0 ? (
                  dept.criteria.map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center text-sm py-1">
                      <span className="text-slate-600 font-medium flex items-center gap-2 pr-2 truncate">{getIconForCriterion(c.name)} {c.name}</span>
                      {calculateDeptCriterionAverage(dept.code, c.id)}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-100 rounded-xl">
                    Mezonlar biriktirilmagan
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {displayedDepts.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl p-10 text-center border border-slate-100 text-slate-400 font-medium">
            Ushbu filtr bo'yicha hech qanday bo'lim topilmadi.
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-center flex flex-col items-center justify-center py-12 mt-8">
        <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-6 opacity-20 grayscale" />
        <h3 className="text-xl font-bold text-slate-400 mb-2">Smile Baby CRM tizimi</h3>
        <p className="text-slate-400 max-w-md">Chap tomondagi menyu orqali xodimlarni boshqarishingiz, QR kodlarni yuklab olishingiz va batafsil hisobotlarni ko'rishingiz mumkin.</p>
      </div>

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-[#0A9C54] flex items-center justify-center font-bold">
                  <HelpCircle size={26} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                    Baholash Tizimi Metodologiyasi
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Smile Baby klinikasida mijozlar mamnuniyatini hisoblash va boshqarish tizimi qoidalari
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMethodology(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-700">
              {/* Section 1: 4 Smilies */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A9C54]"></span>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-800">
                    1. 4 bosqichli baholash shkalasi (HappyOrNot modeli)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-center flex flex-col items-center">
                    <span className="text-4xl mb-2">😍</span>
                    <span className="font-black text-emerald-800 text-base">A'lo (100%)</span>
                    <span className="text-xs text-emerald-700 mt-1">To'liq mamnun, xizmat va muomala a'lo darajada</span>
                  </div>
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-center flex flex-col items-center">
                    <span className="text-4xl mb-2">🙂</span>
                    <span className="font-black text-blue-800 text-base">Yaxshi (75%)</span>
                    <span className="text-xs text-blue-700 mt-1">Umuman yaxshi, arzimas taklif yoki kamchilik</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-center flex flex-col items-center">
                    <span className="text-4xl mb-2">🙁</span>
                    <span className="font-black text-amber-800 text-base">Qoniqarsiz (50%)</span>
                    <span className="text-xs text-amber-700 mt-1">Ko'ngildagidek emas, kuttirilgan yoki e'tiroz bor</span>
                  </div>
                  <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-center flex flex-col items-center">
                    <span className="text-4xl mb-2">😡</span>
                    <span className="font-black text-rose-800 text-base">Yomon (25%)</span>
                    <span className="text-xs text-rose-700 mt-1">Jiddiy norozilik, xatolik yoki qo'pol muomala</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Formulas */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A9C54]"></span>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-800">
                    2. Hisoblash formulalari
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-[#0A9C54] font-black text-sm mb-2">
                      <Star size={18} />
                      <span>Happy Index (Mamnuniyat Indeksi)</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 font-medium leading-relaxed">
                      Klinika yoki bo'limdagi barcha baholarning o'rtacha foiz balli. Har bir berilgan baho o'z foiziga (100, 75, 50, 25) ko'ra umumiy ko'rsatkichni shakllantiradi.
                    </p>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-700">
                      Happy Index = Barcha ballar yig'indisi / Jami baholar
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-sm mb-2">
                      <Users size={18} />
                      <span>CSAT (Ijobiy Fikrlar Ulushi %)</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 font-medium leading-relaxed">
                      Klinikadan mamnun ketgan bemorlarning umumiy baholagan bemorlarga nisbati. Bunga faqat A'lo (😍) va Yaxshi (🙂) baholari kiradi.
                    </p>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-700">
                      CSAT = (Ijobiy baholar soni / Jami baholar) * 100%
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: KPI Benchmarks */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A9C54]"></span>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-800">
                    3. Ko'rsatkichlar mezonlari (KPI baholash)
                  </h4>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/70">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-sm">80% — 100% (A'lo daraja)</span>
                        <p className="text-xs text-slate-500 font-medium">Xizmat va sharoit mukammal. Bemorlarning katta qismi to'liq mamnun.</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold shrink-0">A'lo</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/70">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={20} className="text-amber-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-sm">60% — 79% (O'rtacha / E'tibor talab)</span>
                        <p className="text-xs text-slate-500 font-medium">Umumiy holat yaxshi, biroq xizmat ko'rsatishda takomillashtirilishi kerak bo'lgan joylar bor.</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-bold shrink-0">E'tibor talab</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/70">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={20} className="text-rose-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-sm">0% — 59% (Xavfli / Qoniqarsiz)</span>
                        <p className="text-xs text-slate-500 font-medium">Zudlik bilan choralar ko'rish, bo'lim xodimlari bilan muloqot qilish va kamchiliklarni bartaraf etish shart.</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-bold shrink-0">Qoniqarsiz</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Criteria Answers Breakdown */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A9C54]"></span>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-800">
                    4. Bo'lim va Statsionar mezonlari (Savol-javoblar qanday ko'rinadi?)
                  </h4>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Bemorlarga beriladigan savollar (masalan: <em>"Shifokor xonangizga necha marta kirdi?"</em>, <em>"Hamshiralar chaqirganda tez kelishdimi?"</em>) 3 yoki 4 ta tanlovli variantlardan iborat bo'ladi. Kartochkada:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 text-xs block mb-1">Eng ko'p tanlangan (dominant) javob</span>
                      <p className="text-[11px] text-slate-500 font-medium">Bemorlar orasida eng yuqori ovoz to'plagan variant qalin yozuvda va uning foiz ulushi ko'rsatiladi (masalan: <strong>"1 marta" — 75% mijozlar shunday degan</strong>).</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 text-xs block mb-1">Barcha variantlar taqsimoti (Hover)</span>
                      <p className="text-[11px] text-slate-500 font-medium">Sichqonchani javob ustiga olib borsangiz (hover), barcha qolgan variantlar nechtadan bemor tomonidan tanlanganini va foizlarini to'liq ko'rishingiz mumkin.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Telegram Notifications */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A9C54]"></span>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-800">
                    5. Telegram bot orqali tezkor xabardorlik
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-1.5">
                      <span>📢</span>
                      <span>Klinika Guruhi</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Barcha tushgan yangi baholar monitoring uchun umumiy ishchi guruhga avtomatik yetkaziladi.
                    </p>
                  </div>

                  <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 font-bold text-rose-800 text-sm mb-1.5">
                      <span>🚨</span>
                      <span>Klinika Egasi & HR</span>
                    </div>
                    <p className="text-xs text-rose-700 font-medium">
                      Faqat salbiy baholar (50%, 25%), matnli shikoyatlar va ovozli xabarlar zudlik bilan rahbar shaxsiyiga yuboriladi.
                    </p>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm mb-1.5">
                      <span>📊</span>
                      <span>Avtomatik Hisobotlar</span>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium">
                      Kunlik hisobot har kuni soat 20:00 da, haftalik batafsil tahlil har dushanba soat 08:30 da yetkaziladi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowMethodology(false)}
                className="px-6 py-2.5 bg-[#0A9C54] hover:bg-[#088246] text-white font-bold rounded-xl text-sm transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Tushundim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
