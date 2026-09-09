"use client";

import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Printer, QrCode, ExternalLink } from 'lucide-react';

export default function QRPage() {
  const [depts, setDepts] = useState<any[]>([]);
  const [siteUrl, setSiteUrl] = useState("");
  const [lanUrl, setLanUrl] = useState("");
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSiteUrl(window.location.origin);
    
    // Tarmoqdagi IP va Global tunnel manzilini aniqlash (ixtiyoriy almashtirish uchun)
    fetch('/api/network-ip')
      .then(res => res.json())
      .then(data => {
        if (data.url) setLanUrl(data.url);
        if (data.tunnelUrl) setTunnelUrl(data.tunnelUrl);
      })
      .catch(() => {});

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/departments');
        if (res.ok) {
          const data = await res.json();
          setDepts(data);
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const availableFloors = useMemo(() => {
    const set = new Set<number>();
    depts.forEach(d => {
      if (d.floor !== null && d.floor !== undefined) {
        set.add(d.floor);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [depts]);

  const filteredDepts = useMemo(() => {
    return depts.filter(dept => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = dept.name.toLowerCase().includes(q);
        const matchesCode = dept.code.toLowerCase().includes(q);
        const matchesFloor = dept.floor !== null && `${dept.floor}`.includes(q);
        if (!matchesName && !matchesCode && !matchesFloor) return false;
      }

      if (typeFilter !== 'all') {
        if (typeFilter === 'floor') {
          if (dept.type !== 'floor' && dept.type !== 'special') return false;
        } else if (typeFilter === 'special') {
          if (dept.type !== 'special') return false;
        } else if (dept.type !== typeFilter) {
          return false;
        }
      }

      if (floorFilter !== 'all') {
        if (dept.floor === null || dept.floor === undefined || String(dept.floor) !== floorFilter) {
          return false;
        }
      }

      return true;
    });
  }, [depts, searchQuery, typeFilter, floorFilter]);

  const downloadQR = (id: string, name: string) => {
    const svg = document.getElementById(`qr-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `SmileBaby_QR_${name.replace(/\s+/g, '_')}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Card - Screen Only */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <QrCode className="text-[#0A9C54]" size={26} />
            QR Kodlar
          </h2>
          <p className="text-sm text-slate-500 mt-1">Bo'limlar va palatalar uchun baholash QR kodlarini yuklab oling yoki chop eting</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Printer size={18} />
          <span>Barchasini chop etish</span>
        </button>
      </div>

      {/* Filter and Search Bar - Screen Only */}
      <div className="print:hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Bo'lim yoki xona nomidan qidiring..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Turi filtri */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase">Turi:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3.5 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">Barcha turlar</option>
                <option value="general">Ambulator</option>
                <option value="floor">Statsionar (Barchasi)</option>
                <option value="special">Maxsus bo'limlar</option>
              </select>
            </div>

            {/* Qavat filtri */}
            {availableFloors.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase">Qavat:</span>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3.5 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="all">Barcha qavatlar</option>
                  {availableFloors.map((fl) => (
                    <option key={fl} value={String(fl)}>{fl}-qavat</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sayt domeni va Telefonda sinash tugmasi */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase">Domen:</span>
              <input
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://..."
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-bold rounded-xl py-2 px-3 focus:outline-none focus:bg-white focus:border-[#0A9C54] w-48 sm:w-60 transition-all"
                title="QR kodlar yaratiladigan sayt manzili"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {tunnelUrl && (
                  <button
                    type="button"
                    onClick={() => setSiteUrl(tunnelUrl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      siteUrl === tunnelUrl
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                    title="Mobil internet (4G/5G) orqali hamma joydan ochiladigan havola"
                  >
                    <span>🌐 Internet (4G/5G)</span>
                  </button>
                )}
                {lanUrl && (
                  <button
                    type="button"
                    onClick={() => setSiteUrl(lanUrl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      siteUrl === lanUrl
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                    title="Kompyuter Wi-Fi IP manzilini qo'llash"
                  >
                    <span>📱 Wi-Fi:</span>
                    <span className="font-mono text-[11px]">{lanUrl}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSiteUrl(window.location.origin)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    siteUrl === window.location.origin && siteUrl !== lanUrl && siteUrl !== tunnelUrl
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Localhost manzilini qo'llash"
                >
                  💻 Localhost
                </button>
              </div>
            </div>

            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-2 rounded-xl">
              {filteredDepts.length} ta QR kod
            </span>
          </div>
        </div>

        {/* Global Internet orqali sinash banneri */}
        {tunnelUrl && siteUrl === tunnelUrl && (
          <div className="bg-blue-50/90 border border-blue-200 text-blue-900 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">🌐</span>
            <div>
              <span className="font-bold block text-blue-950 mb-0.5">Global Internet rejimi faol (4G / 5G / Wi-Fi):</span>
              Telefoningiz qaysi internetda bo‘lishidan qat’i nazar (Ucell, Beeline, Mobiuz, Uztelecom yoki Wi-Fi), ekrandagi istalgan QR kodni telefoningiz kamerasi bilan to‘g‘ridan-to‘g‘ri skanerlab baho qoldira olasiz!
            </div>
          </div>
        )}

        {/* Wi-Fi orqali sinash banneri */}
        {!tunnelUrl && lanUrl && siteUrl === lanUrl && (
          <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">📱</span>
            <div>
              <span className="font-bold block text-emerald-900 mb-0.5">Wi-Fi orqali sinash rejimi faol:</span>
              Telefoningiz kompyuter bilan bir xil Wi-Fi tarmog‘iga ulangan bo‘lsa, ekrandagi istalgan QR kodni skanerlab sinashingiz mumkin!
            </div>
          </div>
        )}
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-8">
        {filteredDepts.map((dept) => {
          const cleanSiteUrl = (siteUrl || '').replace(/\/+$/, '');
          const url = `${cleanSiteUrl}/?dept=${dept.code}`;
          return (
            <div 
              key={dept.id} 
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center hover:-translate-y-1 transition-all duration-300 group print:border-2 print:border-slate-300 print:rounded-2xl print:break-inside-avoid"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  dept.type === 'general' 
                    ? 'bg-blue-50 text-blue-600' 
                    : dept.type === 'special'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                      : 'bg-purple-50 text-purple-600'
                }`}>
                  {dept.type === 'general' ? 'Ambulator' : dept.type === 'special' ? "⭐ Maxsus bo'lim" : 'Statsionar'}
                </span>
                {dept.floor !== null && dept.floor !== undefined && (
                  <span className="text-xs text-slate-400 font-semibold">{dept.floor}-qavat</span>
                )}
              </div>

              <h3 className="font-extrabold text-slate-900 text-lg mb-1 text-center">{dept.name}</h3>
              <span className="text-xs font-mono text-slate-400 mb-4 bg-slate-50 px-2 py-0.5 rounded">
                kod: {dept.code}
              </span>

              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-2 group-hover:shadow-md transition-all">
                <QRCodeSVG 
                  id={`qr-${dept.code}`}
                  value={url} 
                  size={150}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center w-full px-2 mb-4">
                <span className="text-[10px] font-mono text-slate-400 truncate block hover:text-[#0A9C54] select-all cursor-pointer transition-colors" title={url}>
                  {url}
                </span>
              </div>

              <div className="w-full print:hidden flex gap-2">
                <button 
                  onClick={() => downloadQR(dept.code, dept.name)}
                  className="flex-1 bg-slate-50 hover:bg-[#0A9C54] hover:text-white text-slate-700 font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-xs cursor-pointer"
                >
                  <Download size={15} />
                  <span>Yuklab olish</span>
                </button>
                <a 
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Havolani ochish"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          );
        })}
        {filteredDepts.length === 0 && !isLoading && (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 text-slate-400 font-medium">
            Hech qanday QR kod topilmadi.
          </div>
        )}
      </div>
    </div>
  );
}
