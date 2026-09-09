"use client";

import { useMemo, useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer,
  BarChart, Bar, LabelList
} from 'recharts';

interface RatingData {
  department: string;
  createdAt: string;
  averageScore: number;
}

interface Department {
  id?: number;
  code: string;
  name: string;
  [key: string]: any;
}

export default function DashboardCharts({ 
  ratings, 
  dateFilter = 'all', 
  customRange,
  departments = []
}: { 
  ratings: RatingData[]; 
  dateFilter?: string; 
  customRange?: { start: string; end: string };
  departments?: Department[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const deptNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (departments && Array.isArray(departments)) {
      departments.forEach(d => {
        if (d?.code && d?.name) {
          map.set(d.code, d.name);
        }
      });
    }
    return map;
  }, [departments]);

  const COLORS = [
    '#0A9C54', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', 
    '#6366f1', '#d946ef', '#eab308', '#64748b'
  ];

  // 1. Bo'limlar ulushi (Pie / Donut Chart)
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    ratings.forEach(r => {
      const name = deptNameMap.get(r.department) || r.department;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [ratings, deptNameMap]);

  const totalRatings = useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0);
  }, [pieData]);

  // 2. Kunlik baholar soni dinamikasi (Line Chart)
  const lineData = useMemo(() => {
    const counts: Record<string, number> = {};
    const formatDate = (dateObj: Date) => {
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      return `${d}.${m}`;
    };

    ratings.forEach(r => {
      const dateStr = formatDate(new Date(r.createdAt));
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    
    if (dateFilter === 'week' || dateFilter === 'month' || dateFilter === 'today') {
      const days = dateFilter === 'week' ? 7 : dateFilter === 'month' ? 30 : 1;
      const result = [];
      const loopDays = days === 1 ? 3 : days; 
      
      for (let i = loopDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        result.push({ date: dateStr, "Baholar soni": counts[dateStr] || 0 });
      }
      return result;
    }
    
    if (dateFilter === 'custom' && customRange?.start && customRange?.end) {
      const start = new Date(customRange.start);
      start.setHours(0,0,0,0);
      const end = new Date(customRange.end);
      end.setHours(23,59,59,999);
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays <= 90) {
        const result = [];
        for (let i = diffDays; i >= 0; i--) {
          const d = new Date(end);
          d.setDate(d.getDate() - i);
          const dateStr = formatDate(d);
          result.push({ date: dateStr, "Baholar soni": counts[dateStr] || 0 });
        }
        return result;
      }
    }

    return Object.entries(counts)
      .map(([date, count]) => ({ date, "Baholar soni": count }))
      .sort((a, b) => {
        const [d1, m1] = a.date.split('.');
        const [d2, m2] = b.date.split('.');
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, parseInt(m1)-1, parseInt(d1)).getTime() - new Date(currentYear, parseInt(m2)-1, parseInt(d2)).getTime();
      });
  }, [ratings, dateFilter, customRange]);

  // 3. O'rtacha baho bo'limlar bo'yicha (Bar Chart)
  const barData = useMemo(() => {
    const deptStats: Record<string, { sum: number; count: number }> = {};
    ratings.forEach(r => {
      const name = deptNameMap.get(r.department) || r.department;
      if (!deptStats[name]) deptStats[name] = { sum: 0, count: 0 };
      deptStats[name].sum += r.averageScore;
      deptStats[name].count += 1;
    });
    return Object.entries(deptStats).map(([name, stats]) => ({
      name,
      "O'rtacha baho": parseFloat((stats.sum / stats.count).toFixed(1)),
      count: stats.count
    })).sort((a, b) => b["O'rtacha baho"] - a["O'rtacha baho"]);
  }, [ratings, deptNameMap]);

  if (ratings.length === 0) {
    return <div className="text-center text-slate-500 py-10">Statistika uchun yetarli ma'lumot yo'q</div>;
  }

  if (!mounted) {
    return <div className="text-center text-slate-500 py-10 h-[300px] flex items-center justify-center">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-8">
      {/* 1-QATOR: Kunlik baholar dinamikasi (Full-width) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">Kunlik baholar dinamikasi</h3>
            <p className="text-xs text-slate-500 font-medium">Bemorlar faolligi va baholar sonining vaqt bo'yicha dinamikasi</p>
          </div>
          <div className="text-xs font-bold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-100 self-start sm:self-auto">
            Jami: <span className="text-[#0A9C54] font-black">{totalRatings}</span> ta baho
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData} margin={{ top: 10, right: 25, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-5} allowDecimals={false} />
              <LineTooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                formatter={(val: any) => [`${val} ta baho`, 'Baholar soni']}
              />
              <Line 
                type="monotone" 
                dataKey="Baholar soni" 
                stroke="#0A9C54" 
                strokeWidth={4} 
                dot={{ r: 4, strokeWidth: 2, fill: '#0A9C54' }} 
                activeDot={{ r: 7, stroke: '#0A9C54', strokeWidth: 3, fill: '#ffffff' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-QATOR: Bo'limlar reytingi (Full-width) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">Bo'limlar reytingi</h3>
            <p className="text-xs text-slate-500 font-medium">Har bir bo'limning o'rtacha ko'rsatkichi (0% dan 100% gacha)</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-bold text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0A9C54]"></span> A'lo (80-100%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> O'rtacha (50-79%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Qoniqarsiz (&lt;50%)</span>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData} margin={{ top: 25, right: 20, bottom: 65, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} 
                angle={-45}
                textAnchor="end"
                interval={0}
                height={75}
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                dx={-5} 
                domain={[0, 100]} 
                tickFormatter={(val) => `${val}%`}
              />
              <LineTooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: any, name: any, item: any) => [
                  `${value}% (${item?.payload?.count || 1} ta baho)`, 
                  "O'rtacha baho"
                ]}
              />
              <Bar dataKey="O'rtacha baho" fill="#3b82f6" radius={[7, 7, 0, 0]} maxBarSize={48}>
                <LabelList 
                  dataKey="O'rtacha baho" 
                  position="top" 
                  formatter={(val: any) => `${val}%`} 
                  style={{ fontSize: '11px', fontWeight: 'bold', fill: '#334155' }} 
                />
                {barData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry["O'rtacha baho"] >= 80 ? '#0A9C54' : entry["O'rtacha baho"] >= 50 ? '#f59e0b' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3-QATOR: Bo'limlarning ulushi (Full-width) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-6">
          <h3 className="text-lg font-black text-slate-800">Bo'limlarning ulushi</h3>
          <p className="text-xs text-slate-500 font-medium">Qaysi bo'limlarga ko'proq baho berilgan (umumiy ovozlar nisbati)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="lg:col-span-5 h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <PieTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value: any, name: any) => [
                    `${value} ta baho (${totalRatings > 0 ? ((Number(value) / totalRatings) * 100).toFixed(1) : 0}%)`, 
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bo'limlar ro'yxati va foizlari */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-2">
              {pieData.map((entry, index) => {
                const percent = totalRatings > 0 ? ((entry.value / totalRatings) * 100).toFixed(1) : '0';
                return (
                  <div key={entry.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      <span className="text-xs font-bold text-slate-800 truncate" title={entry.name}>
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-slate-900">{entry.value} ta</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200/80 text-slate-600 shadow-2xs">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
