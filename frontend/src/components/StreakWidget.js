"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Flame, Zap, Trophy } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function StreakWidget({ compact = false }) {
  const { user, isDemoMode } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isDemoMode) {
      // Use rich mock data for demo mode
      setData({
        current_streak: 15,
        xp: 12450,
        level: 12,
        pct: 45
      });
      return;
    }
    if (!user?.token) return;
    fetch(`${API_URL}/api/gamification`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, [user, isDemoMode]);

  // Use a default state if data is missing but loading
  const displayData = data || { current_streak: 0, xp: 0, level: 1, pct: 0 };

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-primary font-black text-sm">
          <Flame size={16} className="animate-pulse" />
          <span>{displayData.current_streak || 0}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-black text-sm">
          <Zap size={16} className="text-yellow-400" />
          <span>{(displayData.xp || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-black text-sm">
          <Trophy size={16} className="text-primary/70" />
          <span>Lv{displayData.level || 1}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 bg-black/20 border border-white/5 rounded-2xl px-6 py-3">
      <div className="flex items-center gap-2">
        <Flame size={20} className="text-primary animate-pulse" />
        <div>
          <div className="text-lg font-black text-white">{displayData.current_streak || 0}</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Day Streak</div>
        </div>
      </div>
      <div className="w-px h-8 bg-white/5" />
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-yellow-400" />
        <div>
          <div className="text-lg font-black text-white">{(displayData.xp || 0).toLocaleString()}</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Total XP</div>
        </div>
      </div>
      <div className="w-px h-8 bg-white/5" />
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-primary/80" />
        <div>
          <div className="text-lg font-black text-white">Level {displayData.level || 1}</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black">{displayData.pct || 0}% to next</div>
        </div>
      </div>
    </div>
  );
}
