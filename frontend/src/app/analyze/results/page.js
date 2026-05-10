"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit, Lightbulb, Zap, TrendingUp, AlertCircle, CheckCircle2,
  ChevronRight, Share2, Target, FileDown, Play, ArrowRight, Info, Clock,
  MessageSquare, Users, HelpCircle, BarChart3, GitBranch, Briefcase,
  Cpu, FlaskConical, BookOpen, Flame, RefreshCw, Star, Layers, Sparkles
} from "lucide-react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResultsPage() {
  const { user, isDemoMode } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get("id");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!attemptId) {
        setLoading(false);
        return;
      }

      if (!user?.token) return;
      try {
        const res = await fetch(`${API_URL}/api/history/${attemptId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch result:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId, user]);

  const handleExport = () => {
    toast.success("Cognitive Map serialized. Downloading PDF...");
  };

  const submitFeedback = async (type) => {
    if (feedbackGiven || feedbackLoading) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify({ attempt_id: attemptId, feedback: type })
      });
      setFeedbackGiven(type);
      toast.success("Feedback noted!");
    } catch (e) {
      toast.error("Failed to submit feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Assembling Synthesis...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center glass-card p-12">
        <AlertCircle size={48} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-white mb-2">Session Not Found</h2>
        <Link href="/analyze" className="px-8 py-4 bg-primary text-white font-black rounded-2xl uppercase text-[11px] tracking-widest">
           Start New Session
        </Link>
      </div>
    );
  }

  const score = Math.round(data.score || 0);
  const concepts = data.concepts || { understood: [], weak: [], missing: [] };
  const agents = data.agents || {};
  const attribution = data.attribution || { concept: 0, logic: 0, completeness: 0 };

  const tabs = [
    { id: "overview", label: "Overview", icon: BrainCircuit },
    { id: "concepts", label: "Concept Analysis", icon: Cpu },
    { id: "agents", label: "AI Experts", icon: Users },
    { id: "probes", label: "Neural Probes", icon: HelpCircle },
    { id: "attribution", label: "Score Breakdown", icon: BarChart3 },
    { id: "interview", label: "Interview Mode", icon: Briefcase },
  ];

  // Helper for dynamic score colors
  const getScoreColor = (s) => s >= 80 ? "text-success" : s >= 50 ? "text-primary" : "text-error";
  const getScoreBg = (s) => s >= 80 ? "stroke-success" : s >= 50 ? "stroke-primary" : "stroke-error";

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-8 pb-20 px-4">
      {/* Layer 1: Neural Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 glass-card p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-4 right-4">
             <span className={`text-[9px] font-black px-3 py-1 rounded-full bg-white/5 border border-white/10 uppercase tracking-widest ${score >= 80 ? "text-success" : score >= 50 ? "text-primary" : "text-error"}`}>
                Confidence: {data.confidence || "MEDIUM"}
             </span>
          </div>
          <div className="relative w-56 h-56 flex items-center justify-center mb-8">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="112" cy="112" r="96" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
              <circle cx="112" cy="112" r="96" className={`${getScoreBg(score)} transition-all duration-1000`} strokeWidth="12" fill="none"
                strokeDasharray={2 * Math.PI * 96}
                strokeDashoffset={2 * Math.PI * 96 * (1 - score / 100)}
                strokeLinecap="round" />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-7xl font-black text-white tracking-tighter">{score}%</span>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Clarity Score</p>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{data.topic}</h2>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
            {typeof data.domain === 'object' ? data.domain?.domain : (data.domain || "General Intelligence")}
          </p>
        </div>

        <div className="lg:col-span-8 glass-card p-10 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-primary" />
              <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Cognitive Summary</h3>
            </div>
            {data.depth_score !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <Cpu size={12} className="text-primary" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depth Score: {Math.round(data.depth_score * 100)}%</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <p className="text-xl text-slate-300 font-medium leading-relaxed italic">
              "{data.summary || "Neural synthesis successful. Mental model initialized."}"
            </p>
            
            <div className="h-[200px] w-full bg-white/5 rounded-3xl p-4 border border-white/5 relative">
               <span className="absolute top-4 left-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">Cognitive Radar</span>
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                     { subject: 'Signal', A: (data.reliability_stats?.Signal || 0.5) * 100, full: 100 },
                     { subject: 'Coverage', A: (data.reliability_stats?.Coverage || 0.5) * 100, full: 100 },
                     { subject: 'Depth', A: (data.reliability_stats?.Depth || 0.5) * 100, full: 100 },
                     { subject: 'Logic', A: (data.structural_score || 0.5) * 100, full: 100 },
                     { subject: 'Reliability', A: (data.reliability_stats?.Reliability || 0.5) * 100, full: 100 },
                  ]}>
                     <PolarGrid stroke="#334155" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'bold' }} />
                     <Radar name="Cognitive" dataKey="A" stroke="#ff6b2b" fill="#ff6b2b" fillOpacity={0.4} />
                  </RadarChart>
               </ResponsiveContainer>
            </div>
          </div>


          {data.structural_score !== undefined && (
            <div className="mb-8 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                     <GitBranch size={16} />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Structural Reasoning</h4>
                     <p className="text-[9px] text-slate-500 font-medium">Logical connectivity & causal chain strength</p>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-lg font-black text-primary">{Math.round(data.structural_score * 100)}%</span>
                  <div className="w-24 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: `${data.structural_score * 100}%` }} />
                  </div>
               </div>
            </div>
          )}

          
          {data.depth_breakdown && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
               {Object.entries(data.depth_breakdown).map(([key, val]) => (
                  <div key={key} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{key}</span>
                     <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${val * 100}%` }} />
                     </div>
                     <span className="text-[10px] font-bold text-white">{Math.round(val * 100)}%</span>
                  </div>
               ))}
            </div>
          )}

          {data.reliability_stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
               {Object.entries(data.reliability_stats).map(([key, val]) => (
                  <div key={key} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1 group/stat">
                     <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{key}</span>
                        <Info size={8} className="text-slate-700 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                     </div>
                     <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${val * 100}%` }} />
                     </div>
                     <span className="text-[10px] font-bold text-white">{Math.round(val * 100)}%</span>
                  </div>
               ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">

             {(Array.isArray(data.concepts?.understood) ? data.concepts.understood : []).map((s, i) => (
                <span key={i} className="px-4 py-2 rounded-xl bg-success/10 text-success text-[10px] font-black border border-success/20 uppercase tracking-widest">✔ {s}</span>
             ))}
             {(Array.isArray(data.concepts?.weak) ? data.concepts.weak : []).map((w, i) => (
                <span key={i} className="px-4 py-2 rounded-xl bg-error/10 text-error text-[10px] font-black border border-error/20 uppercase tracking-widest">⚠ {w}</span>
             ))}
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 flex-wrap bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-white"
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Layer 2: Concept Analysis */}
      {activeTab === "concepts" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <RubricCard title="Understood" items={concepts.understood} status="Mastered" color="text-success" icon={CheckCircle2} />
           <RubricCard title="Weak Areas" items={concepts.weak} status="Review Required" color="text-primary" icon={AlertCircle} />
           <RubricCard title="Critical Gaps" items={concepts.missing} status="Priority Fix" color="text-error" icon={Zap} />
        </div>
      )}

      {/* Layer 3: AI Experts */}
      {activeTab === "agents" && (
        <div className="space-y-6">
           <AgentCard label="Neural Critic" content={data.agent_thoughts?.["Neural Critic"]} color="text-error" icon={AlertCircle} />
           <AgentCard label="Cognitive Coach" content={data.agent_thoughts?.["Cognitive Coach"]} color="text-primary" icon={Lightbulb} />
           <AgentCard label="Master Evaluator" content={data.agent_thoughts?.["Master Evaluator"]} color="text-success" icon={Star} />
        </div>
      )}

      {/* Layer 4: Improvement Engine */}
      {activeTab === "probes" && (
        <div className="space-y-6">
           {data.probes?.map((probe, i) => (
             <div key={i} className="glass-card p-8 border border-white/5 hover:border-primary/20 transition-all flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                   <span className="text-xs font-black uppercase">{probe.type?.slice(0, 4) || "PRBE"}</span>
                </div>
                <div>
                   <h4 className="text-white font-black text-lg mb-2">{probe.question}</h4>
                   <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Question Type: {probe.type || "Logic"}</p>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Layer 5: Advanced Insights */}
      {activeTab === "attribution" && (
        <div className="space-y-8">
           <div className="glass-card p-10">
              <h3 className="text-xl font-black text-white mb-10 uppercase tracking-tight">Cognitive Attribution</h3>
              <div className="space-y-10">
                {[
                  { label: "Concept Understanding", score: attribution.concept, weight: 45 },
                  { label: "Logic Accuracy", score: attribution.logic, weight: 25 },
                  { label: "Completeness", score: attribution.completeness, weight: 30 }
                ].map((item, i) => (
                  <div key={i} className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[12px] font-black text-white uppercase tracking-widest">{item.label}</span>
                        <span className="text-lg font-black text-primary">{item.score}/{item.weight}</span>
                     </div>
                     <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                        <div className="h-full bg-primary shadow-[0_0_20px_rgba(255,107,43,0.4)]" style={{ width: `${(item.score/item.weight)*100}%` }} />
                     </div>
                  </div>
                ))}
              </div>
           </div>
           <div className="glass-card p-10">
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">AI Reasoning</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                 {data.reasoning || "Reasoning engine offline."}
              </p>
           </div>
        </div>
      )}

      {/* Interview Mode */}
      {activeTab === "interview" && (
        <div className="glass-card p-10 flex flex-col items-center text-center">
           <div className={`px-8 py-4 rounded-2xl mb-8 border font-black text-2xl uppercase tracking-tighter ${
              data.interview?.verdict?.includes("HIRE") ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"
           }`}>
              Verdict: {data.interview?.verdict || "NOT EVALUATED"}
           </div>
           <p className="text-xl text-white font-black max-w-2xl leading-tight">
              "{data.interview?.message || "Interview evaluation requires more neural data."}"
           </p>
        </div>
      )}
    </div>
  );
}

function RubricCard({ title, items, status, color, icon: Icon }) {
  return (
    <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className={color} />
        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{title}</h4>
      </div>
      <div className="space-y-2 flex-grow">
        {(Array.isArray(items) ? items : []).slice(0, 3).map((it, i) => (
          <div key={i} className="text-[11px] text-slate-400 font-medium truncate">• {String(it).replace(/_/g, ' ')}</div>
        ))}
      </div>
      <span className={`mt-4 text-[9px] font-black uppercase tracking-tighter ${color}`}>{status}</span>
    </div>
  );
}

function AgentCard({ label, content, color, icon: Icon }) {
  return (
    <div className="glass-card p-8 border border-white/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-lg"><Icon size={18} className={color} /></div>
        <h4 className={`text-lg font-black uppercase tracking-widest ${color}`}>{label}</h4>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed italic">"{content}"</p>
    </div>
  );
}
