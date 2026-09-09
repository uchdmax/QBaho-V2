"use client";
import { useState, useEffect } from 'react';
import { Insight } from '@/lib/analytics';
import { Sparkles, AlertTriangle, TrendingUp, AlertCircle, Lightbulb, Info } from 'lucide-react';

export default function AnalyticsClient() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insights')
      .then(res => res.json())
      .then(data => {
        setInsights(data);
        setLoading(false);
      });
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-orange-500" />;
      case 'positive': return <TrendingUp className="text-emerald-500" />;
      case 'alert': return <AlertCircle className="text-red-500" />;
      case 'tip': return <Lightbulb className="text-blue-500" />;
      default: return <Info className="text-slate-500" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'warning': return "bg-orange-50 border-orange-100";
      case 'positive': return "bg-emerald-50 border-emerald-100";
      case 'alert': return "bg-red-50 border-red-100";
      case 'tip': return "bg-blue-50 border-blue-100";
      default: return "bg-slate-50 border-slate-100";
    }
  };

  if (loading) return <div className="text-center py-10">Tahlil qilinmoqda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-[#0A9C54]" size={28} />
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">AI Tahlil va Maslahatlar</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border ${getColor(insight.type)} flex gap-4 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="mt-1 flex-shrink-0">
              {getIcon(insight.type)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{insight.title}</h3>
              {insight.department && <span className="inline-block px-2 py-1 bg-white border border-slate-200/60 shadow-sm text-slate-600 text-xs font-bold rounded-md mb-3">{insight.department}</span>}
              <p className="text-slate-700 text-sm leading-relaxed">{insight.description}</p>
              {insight.metric && (
                <div className="mt-4 text-xs font-bold text-slate-500 flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider mb-1">Oldin</span>
                    <span className="text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">{insight.metric.before}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-slate-300"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider mb-1">Hozir</span>
                    <span className="text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">{insight.metric.after}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Info className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Ma'lumot yetarli emas</h3>
            <p className="text-slate-500 max-w-md mx-auto">Tizim chuqur tahlil o'tkazishi va maslahatlar berishi uchun ko'proq bemorlar bahosi to'planishi kerak.</p>
          </div>
        )}
      </div>
    </div>
  );
}
