"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  BrainCircuit, 
  CheckCircle2, 
  Trophy, 
  Clock, 
  Calendar,
  ArrowLeft,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch(`${API_URL}/api/history`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        setAttempts(data);
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const displayAttempts = attempts || [];
  const filteredAttempts = displayAttempts.filter(a => a.topic.toLowerCase().includes(search.toLowerCase()));

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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Retrieving Neural Archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight">Cognitive History</h1>
          <p className="text-slate-400 font-medium mt-1">Review your past sessions and track your growth across domains.</p>
        </div>
        <div className="flex bg-[#08080a] px-6 py-3 rounded-2xl border border-white/5 items-center gap-4 shadow-xl">
           <History size={20} className="text-primary" />
           <span className="text-2xl font-black text-white">{displayAttempts.length}</span>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sessions</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
          <input 
            type="text" 
            placeholder="Search by topic..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#08080a] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-slate-700"
          />
        </div>
        <button className="px-8 py-5 rounded-2xl bg-[#08080a] border border-white/5 text-slate-500 flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:text-white transition-all">
          <Filter size={18} /> All Domains
        </button>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredAttempts.map((item, i) => (
          <Link 
            href={`/analyze/results?id=${item.id || item._id}`}
            key={item.id || i}
            className="group block glass-card p-6 hover:border-primary/20 transition-all relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
               <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                    item.score >= 90 ? 'bg-primary/10 text-primary' : 
                    item.score >= 70 ? 'bg-success/10 text-success' : 'bg-white/5 text-slate-500'
                  } group-hover:scale-110`}>
                     {item.score >= 90 ? <Trophy size={28} /> : item.score >= 70 ? <CheckCircle2 size={28} /> : <BrainCircuit size={28} />}
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white tracking-tight capitalize group-hover:text-primary transition-colors">
                        {item.topic?.replace(/_/g, ' ')}
                     </h3>
                     <div className="flex items-center gap-4 mt-1 text-slate-500">
                        <div className="flex items-center gap-1.5">
                           <Calendar size={12} className="text-primary" />
                           <span className="text-[10px] font-black uppercase tracking-widest">{getRelativeTime(item.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-white/5 pl-4">
                           <Clock size={12} className="text-primary" />
                           <span className="text-[10px] font-black uppercase tracking-widest">42m session</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Clarity</p>
                     <p className={`text-3xl font-black tracking-tighter ${
                       item.score >= 90 ? 'text-primary' : 
                       item.score >= 70 ? 'text-success' : 'text-slate-400'
                     }`}>{item.score}%</p>
                  </div>
                  <ChevronRight size={24} className="text-slate-700 group-hover:text-white group-hover:translate-x-2 transition-all" />
               </div>
            </div>
          </Link>
        ))}

        {filteredAttempts.length === 0 && (
           <div className="text-center py-32 glass-card">
              <History size={48} className="text-slate-700 mx-auto mb-6" />
              <p className="text-xl font-black text-white tracking-tight mb-2">No archived sessions found</p>
              <p className="text-slate-500 font-medium">Try searching for a different domain or start a new analysis.</p>
           </div>
        )}
      </div>

      <div className="flex justify-center pt-10">
         <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em]">End of Cognitive Archive</p>
      </div>
    </div>
  );
}
