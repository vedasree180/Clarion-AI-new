"use client";

import { useState, useEffect } from "react";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import StreakWidget from "@/components/StreakWidget";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Trophy, Flame, Star, 
  BookOpen, 
  CheckCircle2,
  AlertCircle,
  History,
  MessageSquare,
  ArrowRight,
  BrainCircuit,
  LayoutGrid,
  FileText,
  Target,
  FlaskConical,
  Activity,
  Plus,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      try {
        const [dashRes, analyticRes, gamiRes] = await Promise.all([
          fetch(`${API_URL}/api/dashboard`, {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          fetch(`${API_URL}/api/analytics`, {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          fetch(`${API_URL}/api/gamification`, {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);

        const dashData = await dashRes.json();
        const analyticData = await analyticRes.json();
        const gamiData = await gamiRes.json();
        setGamification(gamiData);

        setStats(dashData);
        setAnalytics(analyticData);
        
        const chartData = analyticData.scores_over_time?.map((d, i) => ({
          name: `Day ${i + 1}`,
          score: d.score,
        })) || [];
        setPerformance(chartData);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Robust fallback logic
  const displayStats = stats || { average_score: 0, total_analyses: 0, global_rank: "N/A", streak: 0 };
  const displayAnalytics = analytics || [];
  const displayPerformance = performance || { current: 0, target: 100 };
  const displayLoading = loading && !stats;

  if (displayLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Accessing Secure Node...</p>
        </div>
      </div>
    );
  }

  // Calculate Relative Time
  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) {
      if (date.getDate() === now.getDate()) return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Cognitive Dashboard</h2>
          <p className="text-slate-400 font-medium mt-1">Real-time performance tracking and AI-driven skill mapping.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#0f172a] px-5 py-2.5 rounded-2xl border border-white/5">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span className="text-[11px] font-black text-white uppercase tracking-wider">AI Tutor Online</span>
        </div>
      </div>

      {/* Stats Grid - Pure Orange Monochrome */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 bg-[#140e0c] border border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Clarity Score</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-black text-white">{Math.round(displayStats?.average_score || 0)}%</span>
          </div>
          <span className="text-[11px] font-black text-primary uppercase tracking-widest">
            {(displayStats?.average_score || 0) >= 80 ? "Peak Mastery" : "Neural Growth"}
          </span>
        </div>

        <div className="glass-card p-6 bg-[#140e0c] border border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Concepts</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-black text-white">
               {displayAnalytics?.total_concepts || 0}
               <span className="text-lg text-slate-600">/{ (displayAnalytics?.total_concepts || 0) + (displayAnalytics?.weakest_concepts?.length || 0) }</span>
            </span>
          </div>
          <span className="text-[11px] font-black text-primary uppercase tracking-widest">Cognitive Map</span>
        </div>

        <div className="glass-card p-6 bg-[#140e0c] border border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Accuracy</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-black text-white">{Math.round(displayStats?.best_score || 0)}%</span>
          </div>
          <span className="text-[11px] font-black text-primary uppercase tracking-widest">High Fidelity</span>
        </div>

        <div className="glass-card p-6 bg-[#140e0c] border border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Streak</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black text-primary">{(gamification || displayStats)?.current_streak || 0}</span>
            <span className="text-lg font-black text-primary/60">Days</span>
          </div>
          <span className="text-[11px] font-black text-primary uppercase tracking-widest">Momentum</span>
        </div>
      </div>

      {/* Evolution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-card p-10 relative bg-[#140e0c]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Skill Evolution</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">(Cognitive Trajectory)</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayPerformance}>
                <defs>
                  <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b2b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ff6b2b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,43,0.05)" vertical={true} horizontal={true} />
                <XAxis 
                  dataKey="name" 
                  axisLine={true} 
                  tickLine={true} 
                  stroke="rgba(255,107,43,0.2)"
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={true} 
                  tickLine={true} 
                  stroke="rgba(255,107,43,0.2)"
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111114", border: "1px solid rgba(255,107,43,0.2)", borderRadius: "12px", color: "#fff" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ff6b2b" 
                  strokeWidth={3} 
                  fill="url(#colorOrange)"
                  dot={{ r: 4, fill: '#fff', stroke: '#ff6b2b', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#000', strokeWidth: 2, fill: '#ff6b2b' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/5">
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">XP Earned</p>
              <p className="text-3xl font-black text-primary">{((gamification || displayStats)?.xp || 0).toLocaleString()}</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rank</p>
              <p className="text-3xl font-black text-primary">
                 {(gamification || displayStats)?.level >= 10 ? "ELITE" : "ALPHA"}
              </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Engagement</p>
              <p className="text-3xl font-black text-white">{Math.round((displayStats?.total_attempts || 0) * 12)} <span className="text-lg text-slate-600">min</span></p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-10 bg-[#140e0c]">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-lg font-black text-white tracking-tight">Recent Insights</h3>
             <Link href="/history" className="text-primary text-[11px] font-black uppercase tracking-widest hover:underline">Full Logs</Link>
          </div>
          <div className="space-y-10">
             {displayStats?.recent_activity?.slice(0, 3).map((item, i) => (
                <Link href={`/analyze/results?id=${item.id || item._id}`} key={item.id || i} className="block group">
                  <FeedItem 
                    icon={BrainCircuit} 
                    title={item.topic}
                    desc={`Accuracy: ${item.score}%`}
                    time={getRelativeTime(item.timestamp)}
                    color="text-primary"
                  />
                </Link>
             ))}
          </div>
        </div>
      </div>

      {/* Gamification Row Monochrome Orange */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-card p-8 space-y-6 bg-[#140e0c]">
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 uppercase">
             Neural Progress
          </h3>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-black text-slate-400 uppercase">Level {(gamification || displayStats)?.level || 1}</span>
                <span className="text-[11px] font-black text-[#ff6b2b]">{((gamification || displayStats)?.xp || 0).toLocaleString()} XP</span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden shadow-inner border border-white/5">
                <div
                  className="h-full bg-[#ff6b2b] shadow-[0_0_20px_#ff6b2b] rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(5, (gamification || displayStats)?.xp_pct || (gamification || displayStats)?.pct || 0)}%` }}
                />
              </div>
          </div>
          <div className="flex gap-3">
             <div className="flex-1 bg-white/5 p-4 rounded-xl text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase">Streak</p>
                <p className="text-xl font-black text-primary">{(gamification || displayStats)?.current_streak || 0} D</p>
             </div>
             <div className="flex-1 bg-white/5 p-4 rounded-xl text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase">Best</p>
                <p className="text-xl font-black text-primary">{(gamification || displayStats)?.longest_streak || 0} D</p>
             </div>
          </div>
        </div>
        <div className="lg:col-span-2 glass-card p-8 bg-[#140e0c]">
          <ActivityHeatmap 
            heatmap={(gamification || displayStats)?.heatmap || displayStats?.heatmap || {}} 
            title="Cognitive Activity" 
          />
        </div>
      </div>

      {/* Vulnerability Mapping Pure Orange */}
      <div>
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">Vulnerability Mapping</h3>
            <div className="bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-primary/20 shadow-[0_0_15px_rgba(255,107,43,0.1)]">Neural Priority</div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayAnalytics?.weakest_concepts?.slice(0, 4).map((c, i) => (
               <VulnerabilityCard 
                 key={i}
                 label={c.concept} 
                 score={`${c.score}%`} 
                 color="text-primary" 
                 icon={AlertCircle} 
               />
            ))}
         </div>
      </div>
    </div>
  );
}

function VulnerabilityCard({ label, score, color, icon: Icon }) {
  const scoreNum = parseFloat(score);
  return (
    <div className="glass-card p-8 bg-[#140e0c] border border-white/5 hover:border-primary/20 transition-all duration-500 group">
       <div className="flex justify-between items-start mb-10">
          <div className={`p-4 bg-white/5 rounded-2xl text-primary shadow-inner group-hover:scale-110 transition-transform`}>
             <Icon size={24} className="text-[#ff6b2b]" />
          </div>
          <span className={`text-[12px] font-black text-white/90 tracking-tighter`}>{score} Score</span>
       </div>
       <h4 className="text-[18px] font-black text-white mb-6 leading-tight h-12 line-clamp-2 capitalize">{label?.replace(/_/g, ' ')}</h4>
       <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-8 shadow-inner border border-white/5">
          <div 
            className={`h-full rounded-full bg-[#ff6b2b] shadow-[0_0_20px_#ff6b2b] transition-all duration-1000 ease-out`} 
            style={{ width: score }}
          ></div>
       </div>
       <Link href={`/analyze?topic=${label}`} className="block w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-slate-300 text-center uppercase tracking-widest hover:bg-[#ff6b2b] hover:text-white hover:border-[#ff6b2b] transition-all">Review Insight</Link>
    </div>
  );
}

function StatCard({ label, value, trend, isPositive, icon: Icon }) {
  return (
    <div className="glass-card p-8 group overflow-hidden relative bg-[#140e0c]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
      <Icon size={64} className="absolute bottom-[-10px] right-[-10px] opacity-5 text-white group-hover:scale-125 transition-transform duration-500" />
      <div className="relative z-10">
        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.1em] mb-2">{label}</p>
        <h3 className="text-4xl font-black text-white tracking-tight mb-6">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <div className={`flex items-center gap-2 text-[12px] font-black ${
          isPositive ? "text-success" : isPositive === false ? "text-error" : "text-slate-400"
        }`}>
          {isPositive && <Plus size={14} />}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

function QuickMetric({ label, value }) {
  return (
    <div className="text-center group">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">{label}</p>
      <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
    </div>
  );
}

function FeedItem({ icon: Icon, title, desc, time, color }) {
  return (
    <div className="flex gap-6 group">
      <div className="relative">
        <div className={`w-14 h-14 rounded-full bg-[#261b17] ${color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/5 shadow-inner`}>
          <Icon size={22} />
        </div>
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-px h-10 bg-white/5 group-last:hidden"></div>
      </div>
      <div className="pt-1 overflow-hidden">
        <p className="text-[14px] text-white font-black leading-none mb-2 truncate group-hover:text-primary transition-colors capitalize">{title}</p>
        <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-2 line-clamp-1 capitalize">{desc?.replace(/_/g, ' ')}</p>
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{time}</p>
      </div>
    </div>
  );
}

