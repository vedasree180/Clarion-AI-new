"use client";
import StreakWidget from "@/components/StreakWidget";

import { useAuth } from "@/context/AuthContext";
import { Search, Bell, HelpCircle, ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TopNav({ onMenuToggle }) {
  const { user, logout, isDemoMode, toggleDemoMode, backendStatus } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(/[ @._]/);
    return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
  };

  const displayName = (isDemoMode || backendStatus === "demo") 
    ? "Alex Sterling" 
    : (user?.username || user?.email?.split('@')[0] || "Scholar");

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 bg-[#0d0d0d]/80 backdrop-blur-md border-b border-white/5 z-40 px-4 lg:px-10 py-4 lg:py-5 flex justify-between items-center antialiased"
      style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
    >
      {/* Mobile: Hamburger + Logo area */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMenuToggle}
          className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 active:scale-95"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
        <div className="text-primary font-black text-sm tracking-tight">CLARION</div>
      </div>

      {/* Desktop: Search bar */}
      <div className="hidden lg:flex flex-1 justify-center max-w-2xl">
        <div className="relative w-full group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-primary/20 transition-all" 
            placeholder="Search analytics, lessons, or performance data..." 
            type="text"
          />
        </div>
      </div>

      {/* Mobile: Search icon only */}
      <div className="lg:hidden">
        <button className="text-slate-500 hover:text-white transition-all p-1.5">
          <Search size={20} />
        </button>
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-3 lg:gap-8 ml-2 lg:ml-8">
        <div className="flex items-center gap-3 lg:gap-5">
          {/* Streak Widget */}
          <div className="hidden lg:block"><StreakWidget compact={true} /></div>
          {/* Demo Mode Toggle - hide on small mobile */}
          <button 
            onClick={toggleDemoMode}
            className={`hidden sm:block px-3 lg:px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
              isDemoMode 
                ? "bg-primary text-white border-primary/50" 
                : "bg-white/5 text-slate-600 border-white/5 hover:text-slate-300"
            }`}
          >
            {isDemoMode ? "Mock ON" : "Mock"}
          </button>

          <Link href="/notifications" className="text-slate-500 hover:text-white transition-all relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-[#0d0d0d]"></span>
          </Link>
          <button className="hidden lg:block text-slate-500 hover:text-white transition-all">
            <HelpCircle size={20} />
          </button>
        </div>
        
        <div className="hidden lg:block h-8 w-px bg-white/5"></div>
        
        <div className="flex items-center gap-2 lg:gap-4 cursor-pointer group relative">
          <Link href="/settings" className="flex items-center gap-2 lg:gap-4">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-on-surface leading-none mb-1 group-hover:text-primary transition-colors">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                {user?.is_pro ? "Pro Engine" : "Premium Scholar"}
              </p>
            </div>
            <div className="relative">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-white/5 group-hover:border-primary/50 transition-all flex items-center justify-center overflow-hidden bg-white/5">
                {user?.avatar ? (
                  <img 
                    alt="User" 
                    className="w-full h-full object-cover" 
                    src={user.avatar}
                  />
                ) : (
                  <span className="text-xs font-black text-slate-600 group-hover:text-primary transition-colors">
                    {getInitials(displayName)}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-3.5 lg:h-3.5 bg-emerald-500 rounded-full border-2 border-[#0d0d0d]"></div>
            </div>
          </Link>
          <ChevronDown size={14} className="hidden lg:block text-slate-600 group-hover:text-white transition-all" />
        </div>
      </div>
    </header>
  );
}
