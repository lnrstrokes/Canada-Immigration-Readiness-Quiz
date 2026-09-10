import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, render a subtle installed status badge
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>App Installed</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-emerald-500/50 text-emerald-300 font-bold px-3 py-1.5 rounded-xl text-xs transition-all"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-emerald-500/50 p-6 shadow-2xl relative space-y-4">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Install BACS App on iPhone / iPad</h3>
                  <p className="text-[11px] text-emerald-400 font-semibold">Home Screen PWA Experience</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">1.</span>
                  <span>Tap the <strong>Share</strong> button in Safari browser toolbar.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">2.</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 shrink-0">3.</span>
                  <span>Launch <strong>BACS Quiz</strong> directly from your home screen!</span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-white transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop or browsers prior to beforeinstallprompt event
  return (
    <button
      onClick={install}
      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
      title="Install as Progressive Web App"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span>Install PWA</span>
    </button>
  );
};
