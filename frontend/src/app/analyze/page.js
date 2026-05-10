"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BrainCircuit, 
  Mic, 
  MicOff,
  Paperclip, 
  Zap, 
  Sparkles, 
  ArrowRight,
  Search,
  BookOpen,
  Cpu,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AnalyzePage() {
  const { user, isDemoMode, backendStatus } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [stats, setStats] = useState(null);
  
  // Real-Time & Tutor State
  const [liveScore, setLiveScore] = useState(0);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [isTutorMode, setIsTutorMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const [interimText, setInterimText] = useState("");
  
  // Pre-compiled Technical Glossary for zero-latency correction
  const glossary = {
    "winding": "binding",
    "performaly": "preferably",
    "c o p 21": "COP21",
    "c o p": "COP",
    "unfcc": "UNFCCC",
    "un f c c c": "UNFCCC",
    "bd": "Treaty",
    "kyoto": "Kyoto Protocol",
    "ghg": "GHG",
    "degree centigrade": "°C",
    "pre industrial": "pre-industrial",
    "1.5": "1.5°C"
  };

  const refineTechnicalTerms = (text) => {
    let refined = text;
    // Fast technical mapping
    for (const [key, value] of Object.entries(glossary)) {
      if (refined.toLowerCase().includes(key)) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        refined = refined.replace(regex, value);
      }
    }
    return refined.charAt(0).toUpperCase() + refined.slice(1);
  };

  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput({
    onResult: (final, interim) => {
      if (final) {
        const refined = refineTechnicalTerms(final);
        setExplanation(prev => (prev + " " + refined).trim());
      }
      setInterimText(interim);
    },
    onError: (msg) => toast.error(msg),
  });

  // Real-Time Feedback Effect (Debounced 500ms)
  useEffect(() => {
    if (!explanation.trim()) {
      setLiveScore(0);
      setLiveSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/analyze/live`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: explanation })
        });
        const data = await res.json();
        setLiveScore(data.live_score);
        setLiveSuggestions(data.suggestions);
      } catch (err) { console.error("Live analysis failed"); }
    }, 500);

    return () => clearTimeout(timeout);
  }, [explanation]);

  const [agentThoughts, setAgentThoughts] = useState(null);

  // Voice Tutor Logic (Upgraded to Streaming)
  const handleTutorStep = async (text) => {
    const newMessages = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages);
    
    try {
      const res = await fetch(`${API_URL}/api/tutor/stream-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          session_id: `tutor_${Date.now()}`,
          messages: [
            { 
              role: "system", 
              content: `You are the Clarion Neural Tutor. Help the user refine their explanation of '${topic}'.` 
            },
            ...newMessages 
          ] 
        })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";
      
      setChatMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.replace("data: ", ""));
            if (data.type === "metadata") {
               setAgentThoughts(data.agent_thoughts);
               continue;
            }
            fullReply += data.token;
            setChatMessages(prev => {
              const last = [...prev];
              last[last.length - 1].content = fullReply;
              return last;
            });
          }
        }
      }
      
      const speech = new SpeechSynthesisUtterance(fullReply);
      speechSynthesis.speak(speech);
    } catch (err) {
      toast.error("Tutor connection failed");
    }
  };


  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  useEffect(() => {
    setWordCount((explanation || "").trim().split(/\s+/).filter(w => (w?.length || 0) > 0).length);
  }, [explanation]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      try {
        const [dashRes] = await Promise.all([
          fetch(`${API_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${user.token}` } }),
        ]);
        setStats(await dashRes.json());
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [user]);

  const handleAnalyze = async () => {
    if (!explanation.trim()) {
      toast.error("Please provide an explanation to analyze.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Synthesizing Cognitive Map...");

    // Generate or use existing session_id
    const sId = `analyze_${Date.now()}`;

    try {
      console.log(`--- 🧪 Analysis Request: ${API_URL}/api/analyze?session_id=${sId} ---`);
      const res = await fetch(`${API_URL}/api/analyze?session_id=${sId}`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ topic, explanation }),
      });
      console.log(`--- 🧪 Analysis Response Status: ${res.status} ---`);

      if (res.ok) {
        const data = await res.json();
        toast.dismiss(loadingToast);
        toast.success("Analysis complete!");
        router.push(`/analyze/results?id=${data.attempt_id}`);
      } else {
        const errorData = await res.json();
        toast.dismiss(loadingToast);
        toast.error(`Neural Error: ${errorData.detail || "Connection Gap"}`);
        setLoading(false);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Neural connection timeout.");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { title: "Superposition Principles", desc: "Explore the probability cloud...", icon: Cpu },
    { title: "The Observer Effect", desc: "How measurement affects...", icon: Zap },
    { title: "Bell's Theorem", desc: "Local realism vs Quantum...", icon: BookOpen },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-12 animate-fade-in pb-8">
      {/* Header Card - mobile optimized */}
      <div className="bg-gradient-to-br from-[#08080a] to-[#111114] p-6 lg:p-12 rounded-[1.5rem] lg:rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
         <div className="absolute top-0 right-0 p-6 lg:p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform text-primary">
            <BrainCircuit size={100} className="lg:hidden" />
            <BrainCircuit size={180} className="hidden lg:block" />
         </div>
         <div className="relative z-10 flex flex-col gap-4 lg:gap-8">
            <div>
               <h2 className="text-2xl lg:text-5xl font-black text-white tracking-tighter mb-2 lg:mb-4">Refine Your Understanding</h2>
               <p className="text-slate-400 font-medium max-w-xl text-sm lg:text-lg leading-relaxed">
                 Explain the concept as if you were teaching someone. Clarion&apos;s AI will analyze your mental model for gaps.
               </p>
            </div>
            {/* Mobile quick nav pills */}
            <div className="flex gap-2 flex-wrap">
               <button onClick={() => router.push('/analyze')} className="px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl">Analyze</button>
               <button onClick={() => router.push('/courses')} className="px-4 py-2 bg-white/5 text-slate-400 text-xs font-black uppercase tracking-wider rounded-xl hover:text-white transition-colors">Library</button>
               <button onClick={() => router.push('/analytics')} className="px-4 py-2 bg-white/5 text-slate-400 text-xs font-black uppercase tracking-wider rounded-xl hover:text-white transition-colors">Progress</button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
         {/* Left Column: Sandbox */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-10">
            <div className="glass-card p-5 lg:p-10">
               <div className="flex items-center justify-between mb-5 lg:mb-10">
                  <div className="flex items-center gap-4">
                     <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Input</h3>
                     {liveScore > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
                           <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                           <span className="text-[10px] font-black text-primary uppercase">Live Score: {liveScore}%</span>
                        </div>
                     )}
                  </div>
                  <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setIsTutorMode(!isTutorMode)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isTutorMode ? "bg-primary text-white" : "bg-white/5 text-slate-500 border border-white/5"
                        }`}
                     >
                        {isTutorMode ? "✨ Conversation Active" : "Start Voice Tutor"}
                     </button>
                  </div>
               </div>
               
               {/* Live Suggestions (Brainchips) */}
               {(liveSuggestions?.length || 0) > 0 && (
                 <div className="flex flex-wrap gap-2 mb-6 animate-slide-up">
                    {liveSuggestions.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium text-slate-400 flex items-center gap-2">
                         <Sparkles size={12} className="text-primary" /> {s}
                      </span>
                    ))}
                 </div>
               )}

               {/* Topic Input */}
               <div className="relative mb-6 lg:mb-12 group">
                  <input 
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Auto-detecting topic focus..."
                    className="w-full bg-[#08080a] border border-white/5 rounded-[1.8rem] py-6 pl-6 pr-6 text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-slate-700 shadow-inner"
                  />
                  <div className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2">
                     <Search className="text-slate-600" size={18} />
                  </div>
               </div>

               <div className="relative">
                  <div className="flex justify-between items-center mb-4 lg:mb-6">
                     <div className="flex items-center gap-2 lg:gap-3 text-primary">
                        <Zap size={16} fill="currentColor" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Neural Workspace</span>
                     </div>
                     <div className="flex items-center gap-3 lg:gap-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <span>Words: <span className="text-white">{wordCount}</span></span>
                        {voiceSupported && (
                          <button
                            onClick={toggleVoice}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                              isListening 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-white/5 text-slate-500 border border-white/5'
                            }`}
                          >
                            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                            {isListening ? 'Listening' : 'Dictate'}
                          </button>
                        )}
                     </div>
                  </div>
                  
                  {isTutorMode && (
                    <div className="mb-6 space-y-4 max-h-40 overflow-y-auto custom-scrollbar p-4 bg-black/20 rounded-2xl border border-white/5">
                       {chatMessages.map((m, i) => (
                         <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-4 py-2 rounded-xl text-xs font-medium ${
                               m.role === 'user' ? 'bg-primary text-white' : 'bg-white/5 text-slate-300'
                            }`}>
                               {m.content}
                            </div>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="relative group">
                     <textarea 
                       value={explanation}
                       onChange={(e) => setExplanation(e.target.value)}
                       placeholder={isTutorMode ? "Speak to your tutor..." : "Explain the concept here..."}
                       className="w-full h-56 lg:h-96 bg-black/40 border border-white/5 rounded-2xl lg:rounded-[2.5rem] p-5 lg:p-10 text-slate-300 font-medium text-sm lg:text-lg leading-relaxed focus:outline-none focus:border-primary/30 transition-all resize-none custom-scrollbar shadow-inner"
                     />
                     {interimText && (
                       <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10 flex items-center gap-2 text-primary/60 italic text-xs lg:text-sm animate-pulse pointer-events-none bg-black/40 p-3 rounded-xl border border-primary/20">
                          <Mic size={14} className="animate-bounce" /> 
                          <span className="truncate">Listening: {interimText}...</span>
                       </div>
                     )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 lg:mt-10 gap-4 lg:gap-8">
                     <div className="flex gap-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Neural Depth</span>
                           <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary shadow-[0_0_10px_#ff6b2b]" style={{ width: `${liveScore}%` }} />
                           </div>
                        </div>
                     </div>
                     <button 
                       onClick={handleAnalyze}
                       disabled={loading || !explanation.trim()}
                       className="w-full sm:w-auto px-8 lg:px-12 py-4 lg:py-6 bg-primary text-white rounded-2xl lg:rounded-[1.8rem] font-black text-sm lg:text-[15px] flex items-center justify-center gap-3 lg:gap-4 shadow-[0_10px_40px_rgba(255,107,43,0.3)] hover:scale-105 transition-all disabled:opacity-50 uppercase tracking-widest"
                     >
                        Synthesize Map <ArrowRight size={18} strokeWidth={3} />
                     </button>
                  </div>
               </div>
            </div>
          </div>

         {/* Right Column */}
         <div className="lg:col-span-4 space-y-6 lg:space-y-10">
            {/* Live Agent Insights (NEW) */}
            <div className="glass-card p-6 border-l-4 border-l-primary relative overflow-hidden">
               <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit size={16} className="text-primary" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Neural Insights</h3>
               </div>
               {agentThoughts ? (
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-error">Neural Critic</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic border-l border-white/10 pl-2">
                           "{agentThoughts["Neural Critic"]}"
                        </p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary">Cognitive Coach</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic border-l border-white/10 pl-2">
                           "{agentThoughts["Cognitive Coach"]}"
                        </p>
                     </div>
                  </div>
               ) : (
                  <div className="py-6 text-center">
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic animate-pulse">Awaiting neural signals...</p>
                  </div>
               )}
            </div>

            <div className="glass-card p-5 lg:p-10">

               <div className="flex justify-between items-center mb-6 lg:mb-12">
                  <h3 className="text-base lg:text-xl font-black text-white tracking-tight">Suggested Concepts</h3>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles size={18} className="text-primary" />
                  </div>
               </div>
               <div className="space-y-3 lg:space-y-6 mb-6 lg:mb-12">
                  {suggestions.map((s, i) => (
                    <div 
                      key={i} 
                      onClick={() => setTopic(s.title)}
                      className="flex gap-3 lg:gap-5 p-4 lg:p-6 rounded-xl lg:rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-primary/20 transition-all cursor-pointer group"
                    >
                       <div className="w-10 h-10 lg:w-14 lg:h-14 bg-[#1e293b] rounded-xl lg:rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">
                          <s.icon size={18} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-sm lg:text-[15px] font-black text-white leading-none mb-1 lg:mb-2">{s.title}</p>
                          <p className="text-xs lg:text-[13px] text-slate-500 font-medium line-clamp-1">{s.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <button className="w-full py-4 lg:py-5 bg-white/5 border border-white/5 rounded-xl lg:rounded-2xl text-[12px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white hover:border-white/20 transition-all">Explore All Topics</button>
            </div>

            {/* Stats Card */}
            <div className="glass-card p-5 lg:p-10 relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 text-primary mb-6 lg:mb-8">
                     <Zap size={20} fill="currentColor" />
                     <span className="text-[11px] font-black uppercase tracking-[0.2em]">Learning Velocity</span>
                  </div>
                  <h3 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-3 text-glow">
                    {stats?.average_score || 0}<span className="text-primary text-2xl lg:text-4xl">%</span>
                  </h3>
                  <p className="text-sm lg:text-[15px] text-slate-400 font-medium leading-relaxed mb-6 lg:mb-12">
                     Mastering concepts <strong className="text-white">{stats?.score_trend || "0%"} faster</strong> than your average.
                  </p>
                  
                   <div className="space-y-4 lg:space-y-8">
                      <div className="space-y-2 lg:space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">Conceptual Clarity</span>
                            <span className="text-[#ff6b2b]">{stats?.average_score >= 80 ? "Superior" : stats?.average_score >= 60 ? "Good" : "Neural"}</span>
                         </div>
                         <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                            <div className="bg-[#ff6b2b] h-full shadow-[0_0_20px_#ff6b2b] transition-all duration-1000" style={{ width: `${stats?.average_score || 0}%` }} />
                         </div>
                      </div>
                      <div className="space-y-2 lg:space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">Retention Strength</span>
                            <span className="text-[#ff6b2b]">{stats?.total_attempts >= 5 ? "Stable" : "Initializing"}</span>
                         </div>
                         <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                            <div className="bg-[#ff6b2b] h-full shadow-[0_0_20px_#ff6b2b] transition-all duration-1000" style={{ width: `${Math.min(100, (stats?.total_attempts || 0) * 20)}%` }} />
                         </div>
                      </div>
                   </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
