"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (ios && !isStandalone) {
      setIsIOS(true);
      setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    // Listen for browser install prompt (Android/Desktop Chrome)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-50 animate-slide-up">
        <div className="bg-[#1a1412] border border-primary/20 rounded-2xl p-4 shadow-2xl shadow-black/50">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone size={20} className="text-primary" />
            </div>
            <div className="flex-1 pr-4">
              <p className="text-sm font-bold text-white mb-0.5">Install Clarion AI</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isIOS 
                  ? 'Add to Home Screen for the best experience' 
                  : 'Install as an app for faster access & offline use'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors border border-white/5 rounded-xl"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2 text-xs font-black text-white bg-primary rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Download size={13} />
              Install
            </button>
          </div>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end justify-center p-4">
          <div className="bg-[#1a1412] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-black text-lg mb-4 text-center">Install on iOS</h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Tap the Share button at the bottom of Safari' },
                { step: '2', text: 'Scroll down and tap "Add to Home Screen"' },
                { step: '3', text: 'Tap "Add" in the top right corner' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                    {step}
                  </div>
                  <p className="text-sm text-slate-300">{text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowIOSGuide(false); setShowPrompt(false); handleDismiss(); }}
              className="w-full mt-5 py-3 bg-primary text-white font-black rounded-xl text-sm active:scale-95 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
