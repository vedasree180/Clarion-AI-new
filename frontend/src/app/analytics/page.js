"use client";

import { useState, useEffect } from "react";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import StreakWidget from "@/components/StreakWidget";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Download, 
  Calendar, 
  Target, 
  Activity, 
  ChevronRight,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  History,
  LayoutGrid,
  Settings,
  BrainCircuit,
  MessageSquare,
  Clock,
  BarChart3,
  Lightbulb,
  Lock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function InsightsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      try {
        const [res, gamiRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics`, { headers: { Authorization: `Bearer ${user.token}` } }),
          fetch(`${API_URL}/api/gamification`, { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        const data = await res.json();
        const gamiData = await gamiRes.json();
        setAnalytics(data);
        setGamification(gamiData);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const displayAnalytics = analytics || {};
  const displayLoading = loading && !analytics;

  if (displayLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Processing Cognitive Map...</p>
        </div>
      </div>
    );
  }

  // Calculate mastery for donut
  // Calculate mastery for donut
  const averageMastery = displayAnalytics?.mastery_percentage || 0;

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIdx = new Date().getMonth();
  const displayMonthLabels = [
    monthLabels[(currentMonthIdx - 2 + 12) % 12],
    monthLabels[(currentMonthIdx - 1 + 12) % 12],
    monthLabels[currentMonthIdx]
  ];

  const handleExport = () => {
    toast.success("Cognitive Report generation started...");
    setTimeout(() => toast.success("Report downloaded."), 2000);
  };

  const displayGami = gamification;
  return (
    <div className="space-y-10 animate-fade-in pb-20 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Performance Insights</h2>
          <p className="text-slate-400 font-medium mt-1 max-w-2xl">
            Your learning velocity is trending <strong className="text-primary">{(displayAnalytics?.trend === "Improving" || !displayAnalytics?.trend) ? "Upwards" : "Downwards"}</strong>. Focus on <strong className="text-white">{displayAnalytics?.topic_performance?.[0]?.topic || "Backtracking"}</strong> to reach your monthly milestone.
          </p>
        </div>
        <div className="flex gap-4">
           <button className="bg-[#1a1412] border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-2 text-[11px] font-black text-white uppercase tracking-widest shadow-sm hover:border-primary/20 transition-all">
             <Calendar size={16} /> Last 30 Days
           </button>
           <button 
             onClick={handleExport}
             className="bg-white/5 border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all hover:bg-white/10"
           >
             <Download size={16} /> Export PDF
           </button>
        </div>
      </div>

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-card p-8 md:p-10 bg-[#140e0c]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xl font-black text-white">Score Progression</h3>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Holistic mastery score over time</p>
            </div>
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,122,33,0.5)]"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</span>
               </div>
            </div>
          </div>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayAnalytics?.scores_over_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b2b" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ff6b2b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} 
                  dy={15} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} 
                  dx={0}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#121214", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                  itemStyle={{ color: "#ff6b2b", fontWeight: "900" }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ff6b2b" 
                  strokeWidth={4} 
                  fill="url(#colorScore)" 
                  dot={{ r: 4, fill: '#ff6b2b', strokeWidth: 0, shadowBlur: 10, shadowColor: '#ff6b2b' }}
                  activeDot={{ r: 7, stroke: '#08080a', strokeWidth: 3, fill: '#ff6b2b' }}
                  animationDuration={1500} 
                />
                <Area type="monotone" dataKey="target" stroke="#334155" strokeWidth={2} strokeDasharray="6 6" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-10 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
           <h3 className="text-xl font-black text-white mb-10 w-full text-left tracking-tight">Knowledge Density</h3>
           <div className="relative w-52 h-52 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle cx="104" cy="104" r="85" stroke="rgba(255,255,255,0.05)" strokeWidth="20" fill="none" />
                 <circle cx="104" cy="104" r="85" stroke="#ff6b2b" strokeWidth="20" fill="none" strokeDasharray="534" strokeDashoffset={534 - (534 * averageMastery) / 100} strokeLinecap="round" className="transition-all duration-1000 shadow-[0_0_20px_rgba(255,107,43,0.4)]" />
              </svg>
              <div className="flex flex-col items-center justify-center">
                 <span className="text-6xl font-black text-white tracking-tighter text-glow">{averageMastery}<span className="text-primary text-3xl">%</span></span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Density</span>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-10 w-full mt-12">
              <div className="text-center group">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Concepts</p>
                 <p className="text-2xl font-black text-white tracking-tight">{displayAnalytics?.total_concepts || 0}</p>
              </div>
              <div className="text-center group">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Topics</p>
                 <p className="text-2xl font-black text-white tracking-tight">{displayAnalytics?.active_lessons || 0}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-5 glass-card p-10 bg-[#140e0c]">
            <h3 className="text-xl font-black text-white mb-6 tracking-tight">Topic Mastery</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Relative strength across domains</p>
            <div className="w-full h-[320px]">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={displayAnalytics?.topic_performance?.slice(0, 6) || []}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="topic" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="average_score"
                      stroke="#ff6b2b"
                      fill="#ff6b2b"
                      fillOpacity={0.5}
                      animationDuration={1500}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#121214", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      itemStyle={{ color: "#ff6b2b", fontWeight: "900" }}
                    />
                  </RadarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-7 glass-card p-10 bg-[#0f0f12]">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black text-white tracking-tight">Concept Drill-down</h3>
               <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full">
                  <thead>
                     <tr className="text-left text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                        <th className="pb-6">Concept Name</th>
                        <th className="pb-6">Difficulty</th>
                        <th className="pb-6 text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {(displayAnalytics?.concepts || []).slice(0, 6).map((c, i) => (
                       <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="py-6 text-[13px] font-bold text-white capitalize">{c.name?.replace(/_/g, ' ')}</td>
                          <td className="py-6">
                             <span className="px-3 py-1 rounded-full bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-white/5">
                                {c.difficulty}
                             </span>
                          </td>
                          <td className="py-6 text-right">
                             <span className={`text-[9px] font-black uppercase tracking-widest ${c.status === "Understood" ? "text-success" : "text-primary"}`}>
                                {c.status}
                             </span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* Activity Heatmap */}
      <div className="glass-card p-8 bg-[#140e0c]">
          <ActivityHeatmap
            heatmap={gamification?.heatmap || displayAnalytics?.yearly_activity || {}}
            title="Daily Activity"
          />
        </div>

      <div className="flex justify-center pt-10">
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">Cognitive Intelligence Engine</p>
      </div>
    </div>
  );
}
