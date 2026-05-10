"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Lock, Star, Zap, Flame } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DEMO = {
  current_streak: 5, longest_streak: 12, level: 4, xp: 1450, pct: 7.1, progress: 50, needed: 700,
  badges: [
    { id: "first_analysis", name: "First Steps", emoji: "🚀", desc: "Complete your first analysis", xp: 50 },
    { id: "streak_3", name: "On a Roll", emoji: "🔥", desc: "3-day streak", xp: 75 },
    { id: "analysis_10", name: "Dedicated", emoji: "💪", desc: "Complete 10 analyses", xp: 100 },
  ],
  all_badges: [
    { id: "first_analysis", name: "First Steps", emoji: "🚀", desc: "Complete your first analysis", xp: 50 },
    { id: "streak_3", name: "On a Roll", emoji: "🔥", desc: "3-day streak", xp: 75 },
    { id: "streak_7", name: "7-Day Streak", emoji: "🥇", desc: "7-day streak", xp: 150 },
    { id: "streak_30", name: "Consistency King", emoji: "👑", desc: "30-day streak", xp: 500 },
    { id: "score_90", name: "Sharp Mind", emoji: "🧠", desc: "Score 90+ on any topic", xp: 100 },
    { id: "score_100", name: "Perfect Score", emoji: "💎", desc: "Score 100 on any topic", xp: 200 },
    { id: "topics_5", name: "Explorer", emoji: "🗺️", desc: "Attempt 5 different topics", xp: 100 },
    { id: "topics_10", name: "Concept Master", emoji: "📚", desc: "Attempt 10 different topics", xp: 200 },
    { id: "fast_learner", name: "Fast Learner", emoji: "⚡", desc: "Improve score by 20+ pts in same topic", xp: 150 },
    { id: "analysis_10", name: "Dedicated", emoji: "💪", desc: "Complete 10 analyses", xp: 100 },
    { id: "analysis_50", name: "Elite Scholar", emoji: "🏆", desc: "Complete 50 analyses", xp: 300 },
    { id: "analysis_100", name: "Legend", emoji: "🌟", desc: "Complete 100 analyses", xp: 1000 },
  ]
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) { setLoading(false); return; }
    fetch(`${API_URL}/gamification`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(setData)
      .catch((err) => console.error("Gamification fetch error:", err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const d = data || DEMO;
  const earnedIds = new Set((d.badges || []).map(b => b.id));
  const allBadges = d.all_badges || DEMO.all_badges;

  return (
    <div className="p-6 lg:p-12 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Achievements</h1>
        <p className="text-slate-500 text-sm mt-1">Your earned badges and progress</p>
      </div>

      {/* XP + Level Card */}
      <div className="glass-card p-8 bg-[#140e0c] grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="text-center">
          <div className="text-4xl font-black text-primary">{d.level || 1}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Level</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-white">{(d.xp || 0).toLocaleString()}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total XP</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-primary flex items-center justify-center gap-1">
            <Flame size={28} className="text-primary" />{d.current_streak || 0}
          </div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Streak</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-white">{earnedIds.size}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Badges</div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="glass-card p-8 bg-[#140e0c]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Level {d.level} → {(d.level || 1) + 1}</h3>
          <span className="text-primary text-sm font-black">{d.progress || 0} / {d.needed || 100} XP</span>
        </div>
        <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000 shadow-[0_0_16px_rgba(255,122,33,0.4)]"
            style={{ width: `${Math.min(100, d.pct || 0)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-2">{d.needed - d.progress} XP to next level • +{20 + 2 * 75} XP per analysis</p>
      </div>

      {/* All Badges */}
      <div>
        <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight">Badge Collection</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {allBadges.map(badge => {
            const earned = earnedIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`glass-card p-6 text-center transition-all duration-300 ${
                  earned 
                    ? "bg-[#1a1208] border border-primary/20 shadow-lg shadow-primary/5" 
                    : "bg-[#0f0f0f] border border-white/5 opacity-50 grayscale"
                }`}
              >
                <div className="text-4xl mb-3 transition-transform duration-300">{earned ? badge.emoji : "🔒"}</div>
                <h4 className={`text-sm font-black mb-1 ${earned ? "text-white" : "text-slate-600"}`}>{badge.name}</h4>
                <p className={`text-[11px] mb-3 ${earned ? "text-slate-400" : "text-slate-700"}`}>{badge.desc}</p>
                <div className={`text-[10px] font-black uppercase tracking-widest ${earned ? "text-primary" : "text-slate-700"}`}>
                  +{badge.xp} XP {earned ? "✓" : <Lock size={10} className="inline" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
