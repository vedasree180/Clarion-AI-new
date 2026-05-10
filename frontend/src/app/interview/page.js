"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  BrainCircuit,
  MessageSquare,
  Mic,
  MicOff
} from "lucide-react";
import toast from "react-hot-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { motion, AnimatePresence } from "framer-motion";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function InterviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [verdict, setVerdict] = useState(null);

  const [isHandsFree, setIsHandsFree] = useState(false);
  const submitTimeoutRef = useRef(null);

  const [interimText, setInterimText] = useState("");

  const refineTechnicalTerms = (text) => {
    let refined = text;
    const glossary = {
      "winding": "binding",
      "performaly": "preferably",
      "c o p 21": "COP21",
      "c o p": "COP",
      "degree centigrade": "°C",
      "pre industrial": "pre-industrial",
      "1.5": "1.5°C"
    };
    Object.keys(glossary).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      refined = refined.replace(regex, glossary[key]);
    });
    return refined.charAt(0).toUpperCase() + refined.slice(1);
  };

  const interruptionTimerRef = useRef(null);

  // Voice Engine Integration
  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput({
    onStart: () => {
       // We don't interrupt immediately on start anymore to avoid noise-triggers
    },
    onResult: (final, interim) => {
      // INTERRUPTION LOGIC: Only stop AI if we see actual interim text (likely speech)
      if (interim && interim.length > 3) {
         if (window.speechSynthesis && window.speechSynthesis.speaking) {
            if (!interruptionTimerRef.current) {
                // Wait 200ms of consistent interim text before cutting off AI
                interruptionTimerRef.current = setTimeout(() => {
                   window.speechSynthesis.cancel();
                   interruptionTimerRef.current = null;
                }, 200);
            }
         }
      }

      if (final) {
        if (interruptionTimerRef.current) {
            clearTimeout(interruptionTimerRef.current);
            interruptionTimerRef.current = null;
        }
        window.speechSynthesis.cancel(); // Definitely stop now

        const refined = refineTechnicalTerms(final);
        setInput(prev => (prev + " " + refined).trim());
        setInterimText("");
        
        // Auto-submit in hands-free mode
        if (isHandsFree) {
          if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
          submitTimeoutRef.current = setTimeout(() => {
            setInput(finalText => {
              handleSend(finalText);
              return "";
            });
          }, 1500);
        }
      } else {
        setInterimText(interim);
      }
    },
    onError: (msg) => toast.error(msg),
  });

  const [isThinking, setIsThinking] = useState(false);

  const startInterview = async () => {
    if (!topic.trim()) {
      toast.error("Please specify an interview topic.");
      return;
    }
    setLoading(true);
    setIsStarted(true);
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    const initialText = `Hello! I am your Senior Technical Interviewer. Let's begin the technical assessment on '${topic}'. Can you explain the fundamental mechanism and time complexity of how it works?`;

    
    const firstMsg = { role: "assistant", content: initialText };
    setMessages([firstMsg]);
    
    // AI Speaks the first question
    speak(initialText);
    setLoading(false);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05; // Slightly faster for modern feel
    utterance.pitch = 0.95; 
    
    utterance.onend = () => {
      if (isHandsFree) {
        // Delay slightly before listening to avoid echoing
        setTimeout(() => startListening(), 300);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (voiceInput = null) => {
    const textToSend = voiceInput || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: "user", content: textToSend };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!voiceInput) setInput("");
    
    // UI "Thinking" Phase
    setLoading(true);
    setIsThinking(true);

    try {
      // Simulate neural processing time for perceived intelligence
      await new Promise(r => setTimeout(r, 800));

      const res = await fetch(`${API_URL}/api/tutor/stream-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          session_id: sessionId,
          messages: [
            { 
              role: "system", 
              content: `You are a CRITICAL Senior Technical Interviewer at a top-tier firm like Google or Amazon. 
              The current topic is: ${topic}. 
              
              RULES:
              1. If the user gives a short or vague answer like "yes", "of course", or "I know", you MUST CALL THEM OUT.
              2. Every response you give MUST end with a deep, technical follow-up question.
              3. Maintain a cold, professional, and elite persona. 
              4. Read the entire history and challenge any inconsistencies.` 
            },
            ...newMessages 
          ] 
        })
      });

      if (!res.ok) throw new Error("Stream connection failed");

      setIsThinking(false);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";
      
      const newMsgObj = { role: "assistant", content: "", engine: "Initializing..." };
      setMessages(prev => [...prev, newMsgObj]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              
              if (data.type === "metadata") {
                setAgentThoughts(data.agent_thoughts);
                continue;
              }

              fullReply += data.token;
              
              setMessages(prev => {
                const last = [...prev];
                last[last.length - 1].content = fullReply;
                last[last.length - 1].engine = data.engine;
                return last;
              });
            } catch (e) {
              console.error("Error parsing stream chunk:", e);
            }
          }
        }

      }

      speak(fullReply); 
    } catch (err) {
      toast.error("Interviewer connection lost.");
    } finally {
      setLoading(false);
      setIsThinking(false);
    }

  };


  const finalizeInterview = async () => {
     setLoading(true);
     try {
       const res = await fetch(`${API_URL}/api/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [
            { role: "system", content: "Based on this technical interview, give a final HIRE or NO HIRE verdict. Explain why in 2 sentences." },
            ...messages 
          ] 
        })
      });
      const data = await res.json();
      setVerdict(data.reply);
     } catch (err) {
       toast.error("Evaluation failed.");
     } finally {
       setLoading(false);
     }
  };

  const [agentThoughts, setAgentThoughts] = useState(null);

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-20 px-4">
      {/* Side Panel: Agent Insights (NEW) */}
      <div className="lg:col-span-3 space-y-6 hidden lg:block">
         <div className="glass-card p-6 border-l-4 border-l-primary relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
               <BrainCircuit size={16} className="text-primary" />
               <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Live Neural Insights</h3>
            </div>
            
            <AnimatePresence mode="wait">
               {agentThoughts ? (
                  <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="space-y-4"
                  >
                     <AgentInsight label="Neural Critic" text={agentThoughts["Neural Critic"]} color="text-error" />
                     <AgentInsight label="Cognitive Coach" text={agentThoughts["Cognitive Coach"]} color="text-primary" />
                     <AgentInsight label="Master Evaluator" text={agentThoughts["Master Evaluator"]} color="text-success" />
                  </motion.div>
               ) : (
                  <div className="py-10 text-center space-y-3">
                     <RefreshCw size={20} className="text-slate-700 animate-spin mx-auto" />
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Listening for signals...</p>
                  </div>
               )}
            </AnimatePresence>
         </div>

         <div className="glass-card p-6 bg-white/[0.02]">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Vocal Indicators</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Fluency</span>
                  <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-success w-[80%]" />
                  </div>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Clarity</span>
                  <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-[65%]" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="lg:col-span-9 space-y-12">
        <div className="glass-card p-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5">
              <Briefcase size={150} className="text-primary" />
           </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                 <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase">AI Interview Simulator</h1>
                    <p className="text-slate-400 text-lg max-w-2xl font-medium">
                       Simulate high-stakes technical interviews with Clarion&apos;s Critical Neural Agents.
                    </p>
                 </div>
                  <div className="flex items-center gap-4">
                     {isListening && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full animate-pulse border border-primary/30">
                           <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                           <span className="text-[10px] font-black text-primary uppercase tracking-widest">Listening...</span>
                        </div>
                     )}
                     <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vocal Practice</span>
                           <span className="text-xs font-bold text-white">{isHandsFree ? "Hands-Free Active" : "Text Mode"}</span>
                        </div>

                    <button 
                       onClick={() => setIsHandsFree(!isHandsFree)}
                       className={`w-14 h-8 rounded-full p-1 transition-all ${isHandsFree ? "bg-primary" : "bg-white/10"}`}
                    >
                       <div className={`w-6 h-6 bg-white rounded-full transition-all transform ${isHandsFree ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                 </div>
               </div>
        </div>
        </div>

        {!isStarted ? (
          <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-8">
             <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-inner">
                <Zap size={40} fill="currentColor" />
             </div>
             <div className="w-full max-w-md space-y-4">
                <input 
                   type="text"
                   value={topic}
                   onChange={(e) => setTopic(e.target.value)}
                   placeholder="Enter interview topic (e.g. System Design)..."
                   className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-primary/30 transition-all text-center"
                />
                <button 
                   onClick={startInterview}
                   className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                   Initialize Interview Session
                </button>
             </div>
          </div>
        ) : (
          <div className="space-y-8">
             <div className="glass-card p-10 h-[500px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                   {(messages || []).map((m, i) => (
                     <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-6 rounded-3xl ${
                          m.role === 'user' ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'bg-white/5 border border-white/5 text-slate-300'
                        }`}>
                           <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50 flex items-center justify-between">
                              <span>{m.role === 'user' ? 'Candidate' : 'Neural Interviewer'}</span>
                              {m.engine && (
                                 <span className="bg-white/10 px-2 py-0.5 rounded text-[8px] border border-white/5">
                                    {m.engine.replace("_", " ")}
                                 </span>
                              )}
                           </p>
                           <p className="text-sm lg:text-base font-medium leading-relaxed">{m.content}</p>
                        </div>
                     </div>
                   ))}
                   {loading && (
                     <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/5 px-6 py-4 rounded-3xl text-slate-500 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                           {isThinking ? (
                             <>
                               <div className="flex gap-1">
                                 <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                 <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                 <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                               </div>
                               <span>Neural Processing...</span>
                             </>
                           ) : (
                             <span className="animate-pulse">Evaluating...</span>
                           )}
                        </div>
                     </div>
                   )}
                </div>

                {verdict && (
                  <div className="mt-8 p-8 bg-success/10 border border-success/20 rounded-[2rem] animate-slide-up">
                     <h3 className="text-success font-black uppercase tracking-widest text-xs mb-3">Final Interview Verdict</h3>
                     <p className="text-white text-lg font-black italic">"{verdict}"</p>
                  </div>
                )}

                <div className="mt-8 flex gap-4">
                   <div className="relative flex-1">
                     <input 
                       type="text"
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                       placeholder={isListening ? "Listening..." : "Type your technical response..."}
                       className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/20"
                     />
                     {interimText && (
                        <div className="absolute -bottom-6 left-2 flex items-center gap-2 text-primary/60 italic text-[10px] animate-pulse pointer-events-none">
                           <Mic size={10} className="animate-bounce" /> 
                           <span>Real-time: {interimText}...</span>
                        </div>
                     )}
                     {voiceSupported && (
                        <button 
                           onClick={() => isListening ? stopListening() : startListening()}
                           className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${
                              isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-slate-500 hover:text-primary"
                           }`}
                        >
                           {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                     )}
                   </div>
                   <button 
                     onClick={() => handleSend()}
                     disabled={loading}
                     className="p-5 bg-primary text-white rounded-2xl hover:scale-105 transition-all shadow-lg flex-shrink-0"
                   >
                      <Send size={20} />
                   </button>
                   <button 
                     onClick={finalizeInterview}
                     className="px-6 bg-white/5 border border-white/5 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-white"
                   >
                      Finish
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentInsight({ label, text, color }) {
   return (
      <div className="space-y-1">
         <p className={`text-[8px] font-black uppercase tracking-widest ${color}`}>{label}</p>
         <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic border-l border-white/10 pl-2">
            "{text || "Analyzing current turn..."}"
          </p>
      </div>
   );
}
