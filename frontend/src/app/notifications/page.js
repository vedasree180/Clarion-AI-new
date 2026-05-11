"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Bell, 
  CheckCircle2, 
  MessageSquare, 
  Zap, 
  History, 
  Trash2, 
  ChevronRight,
  Sparkles,
  Lock,
  ArrowRight,
  Play,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        setNotifications(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const displayNotifications = notifications || [];
  const displayLoading = loading && !notifications;

  const archiveNotification = async (id) => {
    toast.success("Notification moved to archive.");
  };

  const selectedNotification = displayNotifications.find(n => n.id === selectedId) || (displayNotifications.length > 0 ? displayNotifications[0] : null);

  if (displayLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Syncing Notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-20 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Intelligence Briefings</h2>
          <p className="text-slate-400 font-medium mt-1">Real-time alerts, AI insights, and system updates.</p>
          <div className="flex gap-4 mt-8">
            {["all", "unread", "archived"].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-[#140e0c] text-slate-500 hover:text-white border border-white/5"}`}
              >
                {f} ({f === "all" ? displayNotifications.length : f === "unread" ? displayNotifications.filter(n => !n.read).length : 0})
              </button>
            ))}
          </div>
        </div>
        <button className="text-slate-500 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
           <Trash2 size={16} /> Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Notifications List */}
        <div className="lg:col-span-5 space-y-4 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
          {displayNotifications.map((n) => (
            <motion.div 
              key={n.id}
              layoutId={n.id}
              onClick={() => setSelectedId(n.id)}
              className={`glass-card p-6 rounded-[2rem] cursor-pointer transition-all border-2 relative overflow-hidden group ${selectedId === n.id ? "border-primary/40 bg-primary/5 shadow-2xl" : "border-white/5 hover:border-white/10 bg-[#140e0c]"}`}
            >
              {!n.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(255,122,33,0.8)]"></div>}
              <div className="flex gap-5 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${selectedId === n.id ? "bg-primary text-white" : "bg-[#261b17] text-primary"}`}>
                   {n.type === "ai_feedback" ? <Sparkles size={24} /> : n.type === "unlock" ? <Lock size={24} /> : n.type === "session" ? <Zap size={24} /> : <History size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-md font-black text-white group-hover:text-primary transition-colors">{n.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">
                     <Clock size={12} className="text-primary" /> {n.time}
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{n.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-7 sticky top-32">
          <AnimatePresence mode="wait">
            {selectedNotification ? (
              <motion.div 
                key={selectedId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-12 rounded-[2.5rem] min-h-[650px] flex flex-col bg-[#140e0c] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 opacity-8 pointer-events-none text-primary">
                   <Bell size={200} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="w-20 h-20 rounded-3xl bg-[#261b17] text-primary flex items-center justify-center shadow-inner">
                        <Sparkles size={38} />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black text-white tracking-tight">{selectedNotification.title}</h3>
                        <div className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                          Clarion AI Engine • Automated Protocol
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 space-y-10">
                    <p className="text-lg text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedNotification.detail || selectedNotification.message}
                    </p>
                    
                    {selectedNotification.type === "ai_feedback" && (
                      <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-5 shadow-inner">
                         <div className="flex items-center gap-2 text-primary font-black text-[11px] uppercase tracking-widest">
                            <Zap size={16} fill="currentColor" /> Neural Insight Highlight
                         </div>
                         <p className="text-md italic text-slate-400 leading-relaxed font-medium border-l-2 border-primary/30 pl-6">
                           "The correlation between your visual metaphors and the mathematical state transitions shows a high level of cognitive integration. Keep focusing on these intuitive bridges."
                         </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 mt-16 pt-12 border-t border-white/5">
                    <button className="flex-1 py-5 rounded-2xl bg-primary text-white font-black text-[13px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                      Start Optimization Session <ArrowRight size={18} />
                    </button>
                    <button 
                      onClick={() => archiveNotification(selectedId)}
                      className="px-10 py-5 rounded-2xl bg-white/5 border border-white/5 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                    >
                      Archive Briefing
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[650px] text-center p-12 border-2 border-dashed border-white/5 rounded-[3rem] bg-[#140e0c]/50">
                 <Bell size={80} className="text-slate-800 mb-8 animate-bounce" />
                 <h3 className="text-xl font-black text-slate-600 uppercase tracking-[0.3em]">Neural Silence</h3>
                 <p className="text-sm text-slate-700 font-bold mt-4 max-w-xs leading-relaxed">No selection identified. Choose a briefing from the archive to deconstruct its contents.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
