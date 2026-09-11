import React, { useState, useEffect, useRef } from 'react';
import { ChallengeConfig, Question, QuestionOption, AssessmentResult } from '../types';
import { sounds } from '../utils/soundEffects';
import { Volume2, VolumeX, Flame, CheckCircle2, ShieldCheck, BookOpen, Layers, Award, MessageCircle, ExternalLink, RotateCcw, ArrowLeft, Zap, Sparkles, Compass } from 'lucide-react';

interface LivestreamBroadcastProps {
  config: ChallengeConfig;
  selectedCategories: string[];
  shuffle: boolean;
  questionCount: number;
  onBackToSetup: () => void;
  onOpenVideoStudio: () => void;
}

export const calculateAssessmentResult = (score: number, total: number): AssessmentResult => {
  if (total === 0) return { score: 0, total: 0, level: 'Assessment In Progress', readiness: 'Pending', recommendation: 'Complete practice session to view result', crsEstimate: 'N/A' };
  const pct = score / total;
  if (pct >= 0.85) {
    return {
      score,
      total,
      level: 'IRCC Policy Expert',
      readiness: 'High Readiness (Ready for Express Entry ITA)',
      recommendation: 'Your IRCC knowledge is excellent. Ensure your NYSC reference letters match lead NOC statements.',
      crsEstimate: '480 - 520+ CRS Target Range',
    };
  } else if (pct >= 0.70) {
    return {
      score,
      total,
      level: 'Strong Policy Understanding',
      readiness: 'Moderate-High Readiness',
      recommendation: 'Target CLB 9 in language testing (IELTS 8/7/7/7) to trigger maximum CRS Skills Transferability points.',
      crsEstimate: '450 - 480 CRS Target Range',
    };
  } else if (pct >= 0.50) {
    return {
      score,
      total,
      level: 'Intermediate Policy Awareness',
      readiness: 'Requires Strategic Optimization',
      recommendation: 'Review reference letter letterhead standards and explore PNP provincial pathways (OINP, AAIP).',
      crsEstimate: '420 - 450 CRS Target Range',
    };
  } else {
    return {
      score,
      total,
      level: 'Foundational Awareness',
      readiness: 'High Risk of Inadmissibility / Documentation Gaps',
      recommendation: 'Schedule a 1-on-1 strategy session to audit work experience evidence and prevent misrepresentation risks.',
      crsEstimate: '<420 CRS - PNP / C11 Exploration Recommended',
    };
  }
};

export const LivestreamBroadcast: React.FC<LivestreamBroadcastProps> = ({
  config,
  selectedCategories,
  shuffle,
  questionCount,
  onBackToSetup,
  onOpenVideoStudio,
}) => {
  const [questions, setQuestions] = useState<Question[]>(() => {
    let filtered = config.questions.filter((q) => q && q.category && selectedCategories.includes(q.category));
    if (filtered.length === 0) {
      filtered = config.questions;
    }
    if (shuffle) {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }
    return filtered.slice(0, questionCount);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<QuestionOption | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(12);
  const [isCompleted, setIsCompleted] = useState(false);
  const [ctaCountdown, setCtaCountdown] = useState(15);
  const prevMilestoneIdRef = useRef<string | null>(null);

  useEffect(() => {
    let filtered = config.questions.filter((q) => q && q.category && selectedCategories.includes(q.category));
    if (filtered.length === 0) {
      filtered = config.questions;
    }
    if (shuffle) {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }
    filtered = filtered.slice(0, questionCount);
    setQuestions(filtered);
    sounds.playMilestone();
  }, [config, selectedCategories, shuffle, questionCount]);

  const currentQ = (questions && questions.length > 0)
    ? (questions[currentIndex % questions.length] || questions[0])
    : config.questions[0];

  const currentMilestone = config.milestones.find(
    (m) => currentQ && currentQ.number >= m.startQuestion && currentQ.number <= m.endQuestion
  ) || config.milestones[0];

  useEffect(() => {
    if (!isCompleted && currentMilestone && prevMilestoneIdRef.current !== currentMilestone.id) {
      if (prevMilestoneIdRef.current !== null) {
        sounds.playMilestone();
      }
      prevMilestoneIdRef.current = currentMilestone.id;
    }
  }, [isCompleted, currentMilestone]);

  const handleToggleMute = () => {
    const m = sounds.toggleMute();
    setIsMuted(m);
  };

  // Thinking time countdown timer
  useEffect(() => {
    let timer: any = null;
    if (!isCompleted && !isRevealed && currentQ) {
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          if (timeLeft <= 5) {
            sounds.playUrgentTick();
          } else {
            sounds.playTick();
          }
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else {
        setIsRevealed(true);
        setSelectedOption(null);
        sounds.playReveal();
      }
    }
    return () => clearTimeout(timer);
  }, [isCompleted, timeLeft, isRevealed, currentQ]);

  // Review time countdown timer
  useEffect(() => {
    let nextTimer: any = null;
    if (!isCompleted && isRevealed) {
      if (nextCountdown > 0) {
        nextTimer = setTimeout(() => {
          if (nextCountdown <= 3) {
            sounds.playUrgentTick();
          } else {
            sounds.playTick();
          }
          setNextCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        if (currentIndex >= questions.length - 1) {
          setIsCompleted(true);
          setCtaCountdown(15);
          sounds.playFanfare();
        } else {
          setCurrentIndex((prev) => prev + 1);
          setTimeLeft(30);
          setNextCountdown(12);
          setIsRevealed(false);
          setSelectedOption(null);
        }
      }
    }
    return () => clearTimeout(nextTimer);
  }, [isCompleted, isRevealed, nextCountdown, currentIndex, questions.length]);

  // Summary loop timer
  useEffect(() => {
    let ctaTimer: any = null;
    if (isCompleted) {
      if (ctaCountdown > 0) {
        ctaTimer = setTimeout(() => {
          if (ctaCountdown <= 5) {
            sounds.playUrgentTick();
          } else {
            sounds.playTick();
          }
          setCtaCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        handleRestartAssessment();
      }
    }
    return () => clearTimeout(ctaTimer);
  }, [isCompleted, ctaCountdown]);

  const handleManualSelect = (opt: QuestionOption) => {
    if (isRevealed || !currentQ || isCompleted) return;
    setSelectedOption(opt);
    setIsRevealed(true);

    if (opt === currentQ.correctAnswer) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      sounds.playCorrect();
    } else {
      setStreak(0);
      sounds.playReveal();
    }
  };

  const handleRestartAssessment = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setNextCountdown(12);
    setCtaCountdown(15);
    setIsRevealed(false);
    setSelectedOption(null);
    setIsCompleted(false);
    if (shuffle) {
      setQuestions([...questions].sort(() => Math.random() - 0.5));
    }
    sounds.playMilestone();
  };

  if (questions.length === 0 || !currentQ) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center p-4 text-white">
        <p>Loading Canada Immigration Assessment Engine...</p>
      </div>
    );
  }

  // Assessment Completion Summary
  if (isCompleted) {
    const result = calculateAssessmentResult(score, questions.length);
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center p-3 sm:p-4 select-none overflow-hidden">
        <div className="w-full max-w-xl bg-[#0f172a] border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden relative p-5 space-y-4">
          
          <div className="text-center space-y-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold shadow-md">
              <Award className="w-4 h-4 text-amber-400" /> IMMIGRATION ASSESSMENT COMPLETE
            </div>
            
            {/* Score & Level Badge */}
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 my-2 text-center space-y-1 shadow-inner">
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">
                IMMIGRATION READINESS RATING
              </span>
              <div className="text-2xl md:text-3xl font-black text-amber-400 font-mono">
                {result.level}
              </div>
              <p className="text-xs font-bold text-white">
                Score: {score}/{questions.length} ({percentage}%) • <strong className="text-emerald-400">{result.readiness}</strong>
              </p>
              <p className="text-[11px] text-slate-300 pt-1">
                {result.recommendation}
              </p>
            </div>
          </div>

          {/* Action Links & Strategic Nudge */}
          <div className="space-y-2.5">
            <button
              onClick={onOpenVideoStudio}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl p-3 flex items-center justify-between shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-950/20 border border-slate-950/30 flex items-center justify-center text-slate-950 font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black">
                    Export Session to 1080p MP4 Video Reel
                  </h4>
                  <p className="text-[10px] text-slate-900/80 font-medium">Generate viral immigration video for YouTube Shorts & TikTok</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </button>

            {/* Substack Guide */}
            <a
              href="https://substack.com/@canadaimmigrationguide"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-900 hover:bg-slate-850 border border-sky-500/40 rounded-xl p-3 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500 flex items-center justify-center text-sky-400 font-bold text-xs">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                    Canada Immigration Guide on Substack
                  </h4>
                  <p className="text-[10px] text-slate-400">Daily Express Entry draw analysis & PNP tech strategies</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
            </a>

            {/* WhatsApp Consultation */}
            <a
              href="https://wa.me/2347089711946"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Book 1-on-1 Canada Immigration Strategy Call
                  </h4>
                  <p className="text-[10px] text-emerald-300/80">WhatsApp: +234 708 971 1946</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
            </a>
          </div>

          {/* Replay Loop Banner */}
          <div className={`px-4 py-2 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
            ctaCountdown <= 5 ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}>
            <span className="flex items-center gap-1.5">
              🔄 Next Assessment Loop Starting in:
            </span>
            <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-950 text-white border border-emerald-500/40">
              {ctaCountdown}s
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 shrink-0">
            <button
              onClick={onBackToSetup}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Setup
            </button>
            <button
              onClick={handleRestartAssessment}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition-all shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay Assessment
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      <div className="w-full max-w-xl bg-[#0f172a] border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden relative aspect-[9/16] sm:aspect-[16/9] max-h-[94vh]">
        
        {/* Top Status Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSetup}
              className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800 transition-colors"
              title="Back to Setup"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <h2 className="text-[11px] font-black text-white tracking-wider">BACS CANADA IMMIGRATION ASSESSMENT</h2>
              <p className="text-[9px] text-emerald-400 font-semibold tracking-wide">IRCC REGULATION & COMPLIANCE ENGINE</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <span>Score: {score}/{currentIndex + (isRevealed ? 1 : 0)}</span>
            </div>

            {streak >= 2 && (
              <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-rose-400 fill-rose-400" /> {streak} Streak
              </div>
            )}

            <button
              onClick={handleToggleMute}
              className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Category & Milestone Bar */}
        <div className="px-4 py-1.5 bg-slate-950/60 border-b border-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              {currentQ.category}
            </span>
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" /> {currentMilestone.name}
            </span>
          </div>

          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
            {currentQ.difficulty}
          </span>
        </div>

        {/* Timer Bar */}
        {!isRevealed ? (
          <div className={`border-y px-4 py-1.5 flex items-center justify-between shrink-0 transition-colors ${
            timeLeft <= 5 ? 'bg-rose-500/20 border-rose-500/40 animate-pulse' : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className={`text-[11px] font-semibold flex items-center gap-1.5 ${timeLeft <= 5 ? 'text-rose-300 font-bold' : 'text-amber-300'}`}>
              <span>{timeLeft <= 5 ? '⚡ FINAL SECONDS — CHOOSE YOUR ANSWER!' : '💬 Select Option A, B, C, or D'}</span>
            </div>
            <div className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${
              timeLeft <= 5 ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce' : 'bg-slate-950 text-amber-400 border-amber-500/40'
            }`}>
              <span>TIMER:</span>
              <span className="text-white ml-1 px-1 py-0.5 rounded">{timeLeft}s</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/15 border-y border-emerald-500/40 px-4 py-1.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> IRCC REGULATION ANALYSIS REVEALED ({nextCountdown}s)
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              Next Q in <strong className="text-emerald-400">{nextCountdown}s</strong>
            </div>
          </div>
        )}

        {/* Question & Options Area */}
        <div className="flex-1 px-4 py-2 flex flex-col justify-center overflow-hidden space-y-2">
          {!isRevealed ? (
            <>
              {/* Question Text */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-inner">
                <p className="text-xs md:text-sm font-bold text-white leading-snug">
                  {currentQ.text}
                </p>
              </div>

              {/* Options A, B, C, D */}
              <div className="grid grid-cols-1 gap-1.5">
                {(['A', 'B', 'C', 'D'] as QuestionOption[]).map((opt) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleManualSelect(opt)}
                      className={`w-full text-left px-3 py-2 rounded-xl border flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 shadow">
                        {opt}
                      </span>
                      <span className="text-xs md:text-sm font-medium line-clamp-1">{currentQ.options[opt]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tip Box */}
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-2.5 text-xs text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Test your IRCC policy compliance knowledge to optimize your immigration readiness score.</span>
              </div>
            </>
          ) : (
            /* Answer Reveal View */
            <div className="bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-3 space-y-2 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="text-center space-y-0.5">
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
                  OFFICIAL IRCC COMPLIANT ANSWER
                </span>
                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wide">
                  OPTION {currentQ.correctAnswer}: {currentQ.options[currentQ.correctAnswer]}
                </h3>
              </div>

              <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-2 space-y-0.5 text-xs">
                <span className="font-bold text-emerald-300 uppercase tracking-wide text-[9px] flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-emerald-400" /> OFFICIAL IRCC REGULATION CITATION:
                </span>
                <p className="text-emerald-400 font-mono text-[10px] md:text-[11px] leading-snug">{currentQ.reference}</p>
              </div>

              <div className="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-2 space-y-0.5 text-xs">
                <span className="font-bold text-emerald-400 uppercase tracking-wide text-[9px]">STRATEGIC COMPLIANCE INSIGHT:</span>
                <p className="text-slate-200 leading-relaxed text-[10px] md:text-[11px]">{currentQ.insight}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-[9px] text-slate-400 tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> BACS Relocation Intelligence Engine
          </span>

          <button
            onClick={onOpenVideoStudio}
            className="text-[10px] bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
          >
            <span>Generate 1080p Video</span>
          </button>
        </div>

      </div>
    </div>
  );
};
