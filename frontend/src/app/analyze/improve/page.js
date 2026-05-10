"use client";

import { useState } from "react";
import Link from "next/link";

export default function ImprovementLoopPage() {
  const [revisedInput, setRevisedInput] = useState("");

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-stack-lg pb-12">
      {/* Header */}
      <div>
        <h2 className="font-h1 text-4xl text-on-surface mb-2">Improvement Loop</h2>
        <p className="font-body-md text-slate-400">Refine your explanation based on the identified gaps. Recursive learning is the key to mastery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left Side: Discrepancy Analysis */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            </div>
            
            <h3 className="font-h1 text-xl mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">biotech</span>
              Discrepancy Analysis
            </h3>
            
            <div className="space-y-6">
              <DiscrepancyItem 
                type="Missing Link" 
                title="Superposition -> Entanglement" 
                desc="You haven't explained how single-particle superposition scales to multi-particle correlations." 
              />
              <DiscrepancyItem 
                type="Conceptual Blur" 
                title="Measurement vs Observation" 
                desc="You're using these terms interchangeably. In QM, 'measurement' implies an interaction that collapses the state." 
              />
              <DiscrepancyItem 
                type="Depth Gap" 
                title="Non-locality Proofs" 
                desc="Mentioning the Aspect experiment would strengthen your historical context." 
              />
            </div>
          </section>

          {/* Target Concept reference */}
          <section className="glass-card p-8 rounded-3xl border border-white/5 bg-white/5">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Target Concept: Bell States</h4>
            <div className="font-mono text-xs text-orange-400/80 p-4 bg-black/40 rounded-xl border border-white/5">
              |ψ⁺⟩ = 1/√2 (|01⟩ + |10⟩)<br/>
              |ψ⁻⟩ = 1/√2 (|01⟩ - |10⟩)<br/>
              |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)<br/>
              |φ⁻⟩ = 1/√2 (|00⟩ - |11⟩)
            </div>
            <p className="text-[10px] text-slate-500 mt-3 italic">Reference these states in your next explanation for higher semantic depth.</p>
          </section>
        </div>

        {/* Right Side: Recursive Sandbox */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-8 rounded-[2rem] border border-white/10 flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">restart_alt</span>
                <h3 className="font-h1 text-2xl">Recursive Sandbox</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Revision 2</span>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 opacity-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Original Explanation (Snippet)</p>
                <p className="text-sm text-slate-400 italic">"...when two particles are entangled, what happens to one instantly happens to the other, even if they are miles apart..."</p>
              </div>

              <textarea 
                className="flex-1 w-full bg-transparent border border-white/10 rounded-2xl p-6 text-lg text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all resize-none font-light leading-relaxed custom-scrollbar" 
                placeholder="Incorporate the feedback here... 'Entanglement is a physical phenomenon that occurs when a pair or group of particles is generated...'"
                value={revisedInput}
                onChange={(e) => setRevisedInput(e.target.value)}
              ></textarea>
            </div>

            <div className="mt-8 flex gap-4">
              <button className="flex-1 py-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-all">Save Draft</button>
              <button className="flex-[2] py-4 bg-gradient-to-r from-orange-600 to-orange-400 text-white font-black rounded-xl primary-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                Re-Analyze Explanation
                <span className="material-symbols-outlined">sync</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscrepancyItem({ type, title, desc }) {
  return (
    <div className="relative pl-6 border-l-2 border-orange-500/30 group">
      <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-orange-500 group-hover:scale-150 transition-transform"></div>
      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">{type}</p>
      <h4 className="font-bold text-on-surface mb-1 group-hover:text-orange-400 transition-colors">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
