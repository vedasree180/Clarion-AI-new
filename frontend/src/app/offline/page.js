"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center text-white p-8">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 4C11.2 4 4 11.2 4 20s7.2 16 16 16 16-7.2 16-16S28.8 4 20 4zm0 28C13.4 32 8 26.6 8 20S13.4 8 20 8s12 5.4 12 12-5.4 12-12 12z" fill="#ff7a21"/>
            <path d="M21 11h-2v11l9.5 5.7 1-1.7-8.5-5V11z" fill="#ff7a21"/>
          </svg>
        </div>
        <h1 className="text-2xl font-black mb-3" style={{fontFamily: 'var(--font-h1)'}}>You&apos;re Offline</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Clarion AI needs a connection to sync your analytics. 
          Check your internet and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-white font-black rounded-xl text-sm hover:bg-primary/90 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
