"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = pathname.startsWith("/auth") || pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace("/login");
    }
  }, [loading, user, isAuthPage, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="mb-4">
            <img src="/logo.png" alt="Clarion Logo" className="w-16 h-16 object-contain animate-bounce" />
          </div>
          <Loader2 className="animate-spin text-primary w-8 h-8" />
          <p className="font-bold text-sm tracking-widest text-slate-500 uppercase">Synchronizing Neural Links...</p>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-transparent text-on-surface min-h-screen selection:bg-primary selection:text-white relative">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Sidebar - desktop always visible, mobile collapsible */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <TopNav onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        
        <main className="
          pt-[72px] pb-24 lg:pb-20 px-4 sm:px-6 lg:px-12 flex-1 relative overflow-x-hidden custom-scrollbar
          lg:pt-32
        ">
          <div className="relative z-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
