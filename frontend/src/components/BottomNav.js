"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BrainCircuit, BarChart3, User, Trophy } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: LayoutGrid },
  { label: "Analyze", href: "/analyze", icon: BrainCircuit },
  { label: "Progress", href: "/analytics", icon: BarChart3 },
  { label: "Badges", href: "/achievements", icon: Trophy },
  { label: "Profile", href: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0d0d0d]/95 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 relative ${
                isActive ? "text-primary" : "text-slate-600 hover:text-slate-300"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,122,33,0.8)]" />
              )}
              <Icon 
                size={20} 
                className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} 
              />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
