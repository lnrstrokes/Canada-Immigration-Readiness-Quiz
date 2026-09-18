import React from 'react';
import { ArrowLeft, ShieldCheck, CheckCircle2, FileText, Compass, Users, ExternalLink } from 'lucide-react';

interface BACSPremiumViewProps {
  onBack: () => void;
  onOpenAssessment?: () => void;
}

export const BACSPremiumView: React.FC<BACSPremiumViewProps> = ({ onBack, onOpenAssessment }) => {
  const premiumServices = [
    {
      number: '1',
      title: 'NOC & TEER DUTY MATCH AUDIT',
      description: 'Verify that actual job duties align with the applicable occupational classification.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      detail: 'Avoid misclassification and refusal at completeness check. We review your daily tasks against National Occupational Classification (NOC) lead statements.',
    },
    {
      number: '2',
      title: 'PROOF OF FUNDS & DOCUMENT REVIEW',
      description: 'Identify potential documentation and settlement-funds issues before they become costly problems.',
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      detail: 'Ensure your settlement funds, gift deeds, and reference letters meet strict IRCC guidelines without unencumbered fund flags.',
    },
    {
      number: '3',
      title: 'EXPRESS ENTRY & PNP ROADMAP',
      description: 'Identify realistic strategies for improving the immigration pathway and evaluating relevant provincial opportunities.',
      icon: <Compass className="w-5 h-5 text-sky-400" />,
      detail: 'Tailored strategy mapping targeting CLB 9 language boosts, spouse optimization, and targeted provincial tech streams (OINP, AAIP, BCPNP).',
    },
    {
      number: '4',
      title: 'STRATEGIC PROFILE ADVISORY',
      description: 'Receive personalized guidance based on the assessed profile.',
      icon: <Users className="w-5 h-5 text-purple-400" />,
      detail: 'Direct guidance to address profile-specific risks, timelines, and immigration navigation steps with an experienced strategist.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0f172a] border-2 border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-8 space-y-6">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <button
            onClick={onBack}
            id="premium-back-btn"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back</span>
          </button>

          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Downstream Advisory Service
          </span>
        </div>

        {/* Section Heading - Defensible Positioning */}
        <div className="text-center space-y-2">
          <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
            DOWNSTREAM PROFILE STRATEGY
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            NEED HELP TURNING YOUR PROFILE INTO A PR STRATEGY?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Positioned as immigration navigation insurance: protect your pathway from costly documentation oversights that could delay permanent residence.
          </p>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {premiumServices.map((service) => (
            <div
              key={service.number}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white flex items-center justify-center">
                    {service.number}
                  </span>
                  <h3 className="text-xs font-black text-white uppercase tracking-wide">
                    {service.title}
                  </h3>
                </div>
                {service.icon}
              </div>
              <p className="text-xs font-medium text-emerald-300 leading-snug">
                {service.description}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/60">
                {service.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Advisory Notice */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 leading-relaxed text-center">
          <strong className="text-slate-300">Important Advisory Notice:</strong> BACS provides strategic profile guidance and document compliance audits. We do not guarantee immigration outcomes, visa issuances, or Express Entry invitations.
        </div>

        {/* Primary Destination: Canada Intel Hub Free Assessment */}
        <div className="space-y-3 pt-2">
          <a
            href="https://bacs-canada.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            id="premium-intel-hub-cta-btn"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl p-3.5 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all text-sm uppercase tracking-wider"
          >
            <span>ACCESS CANADA INTEL HUB ASSESSMENT →</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="text-center text-xs font-mono text-slate-400">
            <a
              href="https://bacs-canada.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-300 transition-colors"
            >
              bacs-canada.vercel.app
            </a>
          </div>

          {onOpenAssessment && (
            <button
              onClick={onOpenAssessment}
              className="w-full text-center text-xs text-slate-400 hover:text-white py-1 transition-colors"
            >
              ← Return to Immigration Quiz Engine
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
