"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut, QrCode, Star, Menu, X, Building2, CheckSquare, Sparkles, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<{ clinicName?: string; logoUrl?: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Failed to load settings', err));
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Yuklanmoqda...</div>;
  }

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Baholar", href: "/admin/ratings", icon: <Star size={20} /> },
    { name: "Xodimlar", href: "/admin/employees", icon: <Users size={20} /> },
    { name: "Bo'limlar", href: "/admin/departments", icon: <Building2 size={20} /> },
    { name: "Mezonlar", href: "/admin/criteria", icon: <CheckSquare size={20} /> },
    { name: "QR Kodlar", href: "/admin/qr", icon: <QrCode size={20} /> },
    { name: "AI Tahlil", href: "/admin/analytics", icon: <Sparkles size={20} /> },
    { name: "Sozlamalar", href: "/admin/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col shadow-xl lg:shadow-sm transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={settings?.logoUrl || "/logo.png"} alt="Logo" className="w-8 h-8 object-contain rounded-lg flex-shrink-0" />
            <div className="overflow-hidden">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                {settings?.clinicName || "Admin Panel"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Boshqaruv</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                  isActive 
                    ? "bg-[#0A9C54]/10 text-[#0A9C54]" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="px-4 py-3 bg-slate-50 rounded-xl mb-4 flex items-center gap-3 border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-[#0A9C54] text-white flex items-center justify-center font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={20} />
            Tizimdan chiqish
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <div className="h-16 bg-white border-b border-slate-100 flex items-center px-4 lg:px-8 shadow-sm justify-between gap-4">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 truncate">
              {menuItems.find((m) => m.href === pathname)?.name || "Dashboard"}
            </h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
