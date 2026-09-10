import React from 'react';
import { ArrowLeft, Video, Download, ShieldCheck, Youtube, HardDrive } from 'lucide-react';

interface VideoDownloadViewProps {
  onBack: () => void;
  onOpenRecorderStudio: () => void;
}

export const VideoDownloadView: React.FC<VideoDownloadViewProps> = ({ onBack, onOpenRecorderStudio }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0b132b] border-2 border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-black text-lg">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight">
                Stream Recording & Download Guide
              </h1>
              <p className="text-xs text-emerald-400 font-semibold">How to record, save, and broadcast your BACS immigration sessions</p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back to Studio Setup</span>
          </button>
        </div>

        {/* Content Guide */}
        <div className="space-y-4 text-xs md:text-sm text-slate-300">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-500" /> 1. Direct YouTube Live Broadcasting
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Launch the <strong>16:9 Broadcast Canvas</strong> from the setup screen. Open your streaming software (OBS Studio, Streamlabs, or Zoom/Meet screen share) and capture the browser window. The aspect ratio is locked to 16:9 with zero scrolling for a pristine game-show presentation.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" /> 2. Local Recording & Video Downloads
            </h3>
            <p className="text-slate-300 leading-relaxed">
              To record your session locally as an MP4/WebM file before uploading to YouTube (or for unlisted sharing):
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li>Use the <strong>Built-in Canvas Video Studio</strong> below for automatic rendering and recording.</li>
              <li>Alternatively, use <strong>OBS Studio</strong> while running the 16:9 canvas full-screen.</li>
            </ul>

            <button
              onClick={onOpenRecorderStudio}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-md text-xs"
            >
              <Video className="w-4 h-4 fill-slate-950" />
              <span>Launch Built-in Canvas Video Recorder Studio</span>
            </button>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> BACS Compliance Guarantee
            </span>
            <p className="text-slate-200 text-xs">
              Every video session generated features verified IRCC source citations, automated timer countdowns, and professional soft-sell closing milestones directing viewers to your WhatsApp (+2347089711946) and Canada Intel Hub.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
