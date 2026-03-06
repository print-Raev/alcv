import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Zap,
  LogOut,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const navItems = [
    { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
    { name: "New Proposal", page: "NewProposal", icon: FileText },
    { name: "Projects", page: "Projects", icon: FolderOpen },
    { name: "References", page: "References", icon: Users },
    { name: "War Room", page: "WarRoom", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        :root {
          --ac-orange: #F97316;
          --ac-orange-light: #FB923C;
          --ac-dark: #0a0a0a;
          --ac-dark-card: #141414;
          --ac-dark-border: #1f1f1f;
          --ac-dark-hover: #1a1a1a;
          --ac-text: #e5e5e5;
          --ac-text-muted: #737373;
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center font-black text-sm">
            AC
          </div>
          <span className="font-semibold tracking-tight">AllClear</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-[#1a1a1a]">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0a0a0a] border-r border-[#1f1f1f]
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-orange-500/20">
                  AC
                </div>
                <div>
                  <div className="font-bold tracking-tight text-white">AllClear</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#737373]">Services</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                        : 'text-[#737373] hover:text-white hover:bg-[#1a1a1a]'}
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </Link>
                );
              })}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-[#1f1f1f]">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center text-xs font-semibold text-orange-400">
                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user.full_name || "User"}</div>
                    <div className="text-[10px] text-[#737373] truncate">{user.email}</div>
                  </div>
                  <button onClick={() => base44.auth.logout()} className="text-[#737373] hover:text-white transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main */}
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}