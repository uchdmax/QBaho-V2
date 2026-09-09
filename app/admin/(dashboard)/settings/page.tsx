"use client";

import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/Toast";
import { 
  Building2, 
  Upload, 
  MapPin, 
  Send, 
  Globe, 
  Bot, 
  Layers, 
  Save, 
  RotateCcw, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Info 
} from "lucide-react";

const InstagramIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

interface SystemSettings {
  clinicName: string;
  logoUrl: string;
  googleMapsUrl: string;
  telegramLink: string;
  instagramLink: string;
  websiteLink: string;
  telegramBotToken?: string;
  telegramAdminGroupId?: string;
  telegramCriticalAdminId?: string;
  statsionarOrder: 'special_first' | 'floors_first';
}

export default function SettingsPage() {
  const { addToast, ToastContainer } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [settings, setSettings] = useState<SystemSettings>({
    clinicName: "Smile Baby",
    logoUrl: "/logo.png",
    googleMapsUrl: "https://maps.google.com/?q=Smile+Baby+Andijan",
    telegramLink: "https://t.me/smilebaby_uz",
    instagramLink: "https://instagram.com/smilebaby.uz",
    websiteLink: "https://migroup.uz",
    telegramBotToken: "",
    telegramAdminGroupId: "",
    telegramCriticalAdminId: "",
    statsionarOrder: "special_first"
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      } else {
        addToast("Sozlamalarni yuklab bo'lmadi", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Tarmoq xatosi yuz berdi", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        addToast("Sozlamalar muvaffaqiyatli saqlandi!", "success");
      } else {
        addToast("Sozlamalarni saqlashda xatolik", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server bilan ulanishda xatolik", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("Rasm hajmi 5MB dan oshmasligi kerak", "warning");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setSettings(prev => ({ ...prev, logoUrl: data.url }));
        addToast("Logotip muvaffaqiyatli yuklandi!", "success");
      } else {
        addToast(data.error || "Rasm yuklashda xatolik", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Fayl yuklashda xatolik", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resetLogoToDefault = () => {
    setSettings(prev => ({ ...prev, logoUrl: "/logo.png" }));
    addToast("Standart logotip tanlandi. Saqlashni unutmang.", "info" as any);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-[#0A9C54] border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-slate-500">Sozlamalar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#0A9C54]/10 text-[#0A9C54]">
              <Sparkles size={20} />
            </span>
            <h1 className="text-xl font-black text-slate-900">Tizim Sozlamalari</h1>
          </div>
          <p className="text-sm text-slate-500">
            Klinika brendi, logotip, Google Maps, ijtimoiy tarmoqlar va Telegram bildirishnomalari
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-[#0A9C54] hover:bg-[#088246] text-white px-6 py-3.5 rounded-2xl font-bold shadow-[0_8px_20px_rgba(10,156,84,0.25)] transition-all active:scale-95 disabled:opacity-50 text-sm cursor-pointer"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span>{isSaving ? "Saqlanmoqda..." : "Saqlash"}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* 1. Klinika brendi va logotipi */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="text-[#0A9C54]" size={20} />
              Klinika Brendi va Logotip
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bemor oynasida va admin panelda aks etuvchi asosiy ma'lumotlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Logo Preview & Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Klinika Logotipi
              </label>
              
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center p-2 shrink-0">
                  <img
                    src={settings.logoUrl || "/logo.png"}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo.png";
                    }}
                  />
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-[#0A9C54] text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-[#0A9C54] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={14} className="text-[#0A9C54]" />
                    )}
                    <span>{isUploading ? "Yuklanmoqda..." : "Yangi rasm yuklash"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetLogoToDefault}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] text-slate-500 hover:text-slate-800 transition-colors font-medium"
                  >
                    <RotateCcw size={12} />
                    Standart logoga qaytarish
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Tavsiya: Shaffof fonli PNG yoki SVG format (maks. 5MB).
              </p>
            </div>

            {/* Clinic Name */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Klinika Nomi
              </label>
              <input
                type="text"
                value={settings.clinicName}
                onChange={(e) => setSettings(prev => ({ ...prev, clinicName: e.target.value }))}
                placeholder="Masalan: Smile Baby, Medion, Akfa Medline..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54] transition-all"
                required
              />
              <p className="text-[11px] text-slate-400">
                Ushbu nom mijoz baholash formasida, xaritada baholash chaqiruvida va hisobotlarda ko'rsatiladi.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Ijtimoiy tarmoqlar va havolalar */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Globe className="text-[#0A9C54]" size={20} />
              Ijtimoiy Tarmoqlar va Havolalar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              QR stendlar va mijoz oynasidagi tashqi havolalar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Google Maps Link */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-red-500" />
                  Google Maps Xarita Havolasi (5 yulduz uchun)
                </label>
                {settings.googleMapsUrl && (
                  <a
                    href={settings.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Tekshirib ko'rish <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={settings.googleMapsUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0A9C54] transition-all"
              />
            </div>

            {/* Telegram Channel / Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Send size={14} className="text-sky-500" />
                Telegram Havolasi
              </label>
              <input
                type="url"
                value={settings.telegramLink}
                onChange={(e) => setSettings(prev => ({ ...prev, telegramLink: e.target.value }))}
                placeholder="https://t.me/smilebaby_uz"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0A9C54] transition-all"
              />
            </div>

            {/* Instagram Profile */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <InstagramIcon size={14} className="text-pink-500" />
                Instagram Havolasi
              </label>
              <input
                type="url"
                value={settings.instagramLink}
                onChange={(e) => setSettings(prev => ({ ...prev, instagramLink: e.target.value }))}
                placeholder="https://instagram.com/smilebaby.uz"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0A9C54] transition-all"
              />
            </div>

            {/* Official Website */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-indigo-500" />
                Rasmiy Veb-sayt
              </label>
              <input
                type="url"
                value={settings.websiteLink}
                onChange={(e) => setSettings(prev => ({ ...prev, websiteLink: e.target.value }))}
                placeholder="https://migroup.uz"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0A9C54] transition-all"
              />
            </div>
          </div>
        </div>

        {/* 3. Telegram Bot Bildirishnomalari */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bot className="text-[#0A9C54]" size={20} />
              Telegram Bildirishnomalari (Ixtiyoriy)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Boshqa klinikaga ulaganda o'zlarining Telegram boti va guruhlarini kiritish maydoni.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 text-xs flex items-start gap-2.5">
            <Info size={16} className="shrink-0 text-amber-600 mt-0.5" />
            <p>
              Ushbu maydonlar bo'sh qoldirilsa, tizim serverdagi mavjud (.env) bot va guruh sozlamalaridan avtomatik foydalanishda davom etadi.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Telegram Bot Token
              </label>
              <input
                type="text"
                value={settings.telegramBotToken || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:border-[#0A9C54] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Barcha baholar boradigan Guruh ID
                </label>
                <input
                  type="text"
                  value={settings.telegramAdminGroupId || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegramAdminGroupId: e.target.value }))}
                  placeholder="-1001234567890"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:border-[#0A9C54] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Shikoyat & Past baholar (Rahbar ID)
                </label>
                <input
                  type="text"
                  value={settings.telegramCriticalAdminId || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, telegramCriticalAdminId: e.target.value }))}
                  placeholder="-1009876543210 yoki admin ID si"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:border-[#0A9C54] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Statsionar bo'limlar ko'rinishi */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="text-[#0A9C54]" size={20} />
              Statsionar Bo'limlar Ko'rinishi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bemor statsionar bo'limini tanlaganda birinchi bo'lib qaysi bo'limlar ko'rinishini belgilash
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.statsionarOrder === 'special_first'
                  ? 'border-[#0A9C54] bg-[#0A9C54]/5'
                  : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
              }`}
            >
              <input
                type="radio"
                name="statsionarOrder"
                checked={settings.statsionarOrder === 'special_first'}
                onChange={() => setSettings(prev => ({ ...prev, statsionarOrder: 'special_first' }))}
                className="mt-1 text-[#0A9C54] focus:ring-[#0A9C54]"
              />
              <div>
                <p className="text-sm font-bold text-slate-800">Maxsus bo'limlar birinchi</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tug'ruqxona, Neonatologiya, Reanimatsiya tepada, qavatlar (3, 4, 5, 6) esa pastda chiqadi.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.statsionarOrder === 'floors_first'
                  ? 'border-[#0A9C54] bg-[#0A9C54]/5'
                  : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
              }`}
            >
              <input
                type="radio"
                name="statsionarOrder"
                checked={settings.statsionarOrder === 'floors_first'}
                onChange={() => setSettings(prev => ({ ...prev, statsionarOrder: 'floors_first' }))}
                className="mt-1 text-[#0A9C54] focus:ring-[#0A9C54]"
              />
              <div>
                <p className="text-sm font-bold text-slate-800">Qavatlar va xonalar birinchi</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  3, 4, 5, 6-qavat xonalari tepada, maxsus bo'limlar esa pastda chiqadi.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 bg-[#0A9C54] hover:bg-[#088246] text-white px-8 py-4 rounded-2xl font-bold shadow-[0_8px_25px_rgba(10,156,84,0.3)] transition-all active:scale-95 disabled:opacity-50 text-sm cursor-pointer"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={18} />
            )}
            <span>{isSaving ? "Saqlanmoqda..." : "Barcha sozlamalarni saqlash"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
