"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { 
  LayoutGrid, 
  BarChart3, 
  BookOpen, 
  BrainCircuit, 
  Settings,
  Shield,
  Rocket,
  LogOut,
  History as HistoryIcon,
  User,
  Trophy,
  Flame,
  X,
  Briefcase
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { logout, isDemoMode, toggleDemoMode } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutGrid },
    { label: "Analyze", href: "/analyze", icon: Rocket },
    { label: "Interview", href: "/interview", icon: Briefcase },
    { label: "History", href: "/history", icon: HistoryIcon },
    { label: "Progress", href: "/analytics", icon: BarChart3 },
    { label: "Library", href: "/courses", icon: BookOpen },
    { label: "Achievements", href: "/achievements", icon: Trophy },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Health", href: "/health", icon: Shield },
  ];

  const handleNavClick = () => {
    // Close sidebar on mobile when link is clicked
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-[#08080a] border-r border-white/5 
        flex flex-col z-50 py-10 antialiased shadow-2xl
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>

        <div className="px-8 mb-16">
          <Logo size="md" />
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-4 px-8 py-5 transition-all duration-300 relative group ${
                  isActive 
                  ? "text-primary" 
                  : "text-slate-500 hover:text-white"
                }`}
              >
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(255,122,33,0.5)]"></div>
                )}
                <Icon size={20} className={`${isActive ? "text-primary" : "group-hover:text-primary"} transition-colors`} />
                <span className="font-bold text-[13px] tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 mt-auto">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-white transition-colors py-4 group"
          >
            <LogOut size={14} className="group-hover:translate-x-[-2px] transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
