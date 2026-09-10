import React, { useState, useEffect, useRef } from 'react';
import { ChallengeConfig, Question, QuestionOption } from '../types';
import { sounds } from '../utils/soundEffects';
import { Volume2, VolumeX, Flame, CheckCircle2, Play, ShieldCheck, BookOpen, Layers, Award, MessageCircle, ExternalLink, RotateCcw } from 'lucide-react';

interface LivestreamQuizEngineProps {
  config: ChallengeConfig;
}

export const LivestreamQuizEngine: React.FC<LivestreamQuizEngineProps> = ({ config }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds reading/thinking time
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<QuestionOption | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(12); // 12 seconds answer review time
  const [isCompleted, setIsCompleted] = useState(false);
  const prevMilestoneIdRef = useRef<string | null>(null);

  // Initialize shuffled questions on mount
  useEffect(() => {
    const shuffled = [...config.questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, [config]);

  const currentQ = shuffledQuestions[currentIndex % shuffledQuestions.length];

  // Calculate current milestone
  const currentMilestone = config.milestones.find(
    (m) => currentQ && currentQ.number >= m.startQuestion && currentQ.number <= m.endQuestion
  ) || config.milestones[0];

  // Play milestone sound when milestone changes
  useEffect(() => {
    if (hasStarted && !isCompleted && currentMilestone && prevMilestoneIdRef.current !== currentMilestone.id) {
      if (prevMilestoneIdRef.current !== null) {
        sounds.playMilestone();
      }
      prevMilestoneIdRef.current = currentMilestone.id;
    }
  }, [hasStarted, isCompleted, currentMilestone]);

  const handleToggleMute = () => {
    const m = sounds.toggleMute();
    setIsMuted(m);
  };

  // Thinking time countdown timer (30 seconds) with urgent tick for last 5s
  useEffect(() => {
    let timer: any = null;
    if (hasStarted && !isCompleted && !isRevealed && currentQ) {
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
        // Time expired -> reveal answer automatically based on system correct answer
        setIsRevealed(true);
        setSelectedOption(null);
        sounds.playReveal();
      }
    }
    return () => clearTimeout(timer);
  }, [hasStarted, isCompleted, timeLeft, isRevealed, currentQ]);

  // Automatic next question countdown after reveal (12 seconds)
  useEffect(() => {
    let nextTimer: any = null;
    if (hasStarted && !isCompleted && isRevealed) {
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
        // Automatically advance to next question or show milestones summary after 10 questions
        if (currentIndex >= config.questions.length - 1) {
          setIsCompleted(true);
          sounds.playMilestone();
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
  }, [hasStarted, isCompleted, isRevealed, nextCountdown, currentIndex, config.questions.length]);

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

  const handleRestartStream = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setNextCountdown(12);
    setIsRevealed(false);
    setSelectedOption(null);
    setIsCompleted(false);
    const shuffled = [...config.questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    sounds.playMilestone();
  };

  if (!hasStarted || !currentQ) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-[#0b132b] border-2 border-slate-800 rounded-3xl shadow-2xl p-8 text-center space-y-6 aspect-[9/16] sm:aspect-[16/9] flex flex-col justify-center items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl font-black shadow-lg">
            🇨🇦
          </div>
          <div className="space-y-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider">
              BACS RELOCATION INTELLIGENCE
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {config.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto">
              Optimized for YouTube Live screencasting. 10 core immigration questions (language test quiz is standalone), official IRCC source citations, and automated milestone tracking.
            </p>
          </div>

          <button
            onClick={() => {
              setHasStarted(true);
              sounds.playMilestone();
            }}
            className="flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 text-base"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Start Live Challenge Stream</span>
          </button>
        </div>
      </div>
    );
  }

  // Milestones & Soft Sell summary screen after 10 questions
  if (isCompleted) {
    const percentage = Math.round((score / config.questions.length) * 100);
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-2 md:p-4 select-none overflow-hidden">
        <div className="w-full max-w-xl bg-[#0b132b] border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden relative aspect-[9/16] sm:aspect-[16/9] max-h-[92vh] p-5">
          
          <div className="text-center space-y-1.5 shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-3 py-0.5 rounded-full text-xs font-bold">
              <Award className="w-4 h-4 text-emerald-400" /> STREAM ROUND COMPLETE ({score}/10 — {percentage}%)
            </div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              Immigration Milestones & Next Steps
            </h2>
            <p className="text-[11px] text-slate-300 max-w-md mx-auto">
              {score >= 8
                ? 'Outstanding grasp of IRCC rules! You are well-positioned for Express Entry.'
                : score >= 5
                ? 'Good foundation! Fine-tuning documentation & pathways will maximize your CRS score.'
                : 'Review required. Expert guidance will protect your PR timeline from costly blindspots.'}
            </p>
          </div>

          {/* Soft Sell & Action Links Container */}
          <div className="space-y-2.5 my-auto">
            {/* Free Assessment CTA */}
            <a
              href="https://canadaintelhub.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-900 hover:bg-slate-850 border border-sky-500/40 rounded-xl p-3 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500 flex items-center justify-center text-sky-400 font-bold text-xs">
                  🇨🇦
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                    Canada Intel Hub — Free Profile Assessment
                  </h4>
                  <p className="text-[10px] text-slate-400">Discover your best immigration pathway instantly</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
            </a>

            {/* Paid 1-on-1 Premium Service via WhatsApp */}
            <a
              href="https://wa.me/"
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
                    Book Paid 1-on-1 Premium Consultation
                  </h4>
                  <p className="text-[10px] text-emerald-300/80">Secure expert roadmap review via WhatsApp</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 shrink-0">
            <span className="text-[9px] text-slate-400">BACS Relocation Intelligence</span>
            <button
              onClick={handleRestartStream}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition-all shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay Stream Round
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-2 md:p-4 select-none overflow-hidden">
      {/* Fixed 16:9 / Broadcast Container (No Scrolling) */}
      <div className="w-full max-w-xl bg-[#0b132b] border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden relative aspect-[9/16] sm:aspect-[16/9] max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-black text-xs shadow-sm">
              🇨🇦
            </div>
            <div>
              <h2 className="text-[11px] font-black text-white tracking-wider">BACS IMMIGRATION LIVE</h2>
              <p className="text-[9px] text-emerald-400 font-semibold tracking-wide">OFFICIAL IRCC COMPLIANCE</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <span>Q{currentQ.number}/10</span>
              <span className="text-slate-500">({config.streamName})</span>
            </div>

            <button
              onClick={handleToggleMute}
              className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Tags & Milestone Row */}
        <div className="px-4 py-1.5 bg-slate-950/60 border-b border-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              {currentQ.category}
            </span>
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" /> {currentMilestone.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[11px]">
            <div className="text-slate-400 font-medium">Score: <strong className="text-white">{score}</strong></div>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Flame className="w-3 h-3 fill-amber-400 animate-pulse" />
              <span>{streak}</span>
            </div>
          </div>
        </div>

        {/* Notice Banner / Thinking Time Bar (30s with urgent final 5s styling) */}
        {!isRevealed ? (
          <div className={`border-y px-4 py-1.5 flex items-center justify-between shrink-0 transition-colors ${
            timeLeft <= 5 ? 'bg-rose-500/20 border-rose-500/40 animate-pulse' : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className={`text-[11px] font-semibold flex items-center gap-1.5 ${timeLeft <= 5 ? 'text-rose-300 font-bold' : 'text-amber-300'}`}>
              <span>{timeLeft <= 5 ? '⚡ FINAL SECONDS — LOCK IN CHAT!' : '💬 Lock in your answer in chat! (30s reading time)'}</span>
            </div>
            <div className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${
              timeLeft <= 5 ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce' : 'bg-slate-950 text-amber-400 border-amber-500/40'
            }`}>
              <span>TIME:</span>
              <span className="text-white ml-1 px-1 py-0.5 rounded">{timeLeft}s</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/15 border-y border-emerald-500/40 px-4 py-1.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> REVIEW ANSWER & OFFICIAL SOURCE (12s)
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              Next in <strong className="text-emerald-400">{nextCountdown}s</strong>
            </div>
          </div>
        )}

        {/* Main Content Area (No Scrolling, Fixed Aspect Container) */}
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
                      className={`w-full text-left px-3 py-1.5 rounded-xl border flex items-center gap-2.5 transition-all ${
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
            </>
          ) : (
            /* Answer Reveal View with Official Sources & 12s Review Time */
            <div className="bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-3 space-y-2 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="text-center space-y-0.5">
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
                  OFFICIAL CORRECT ANSWER REVEALED
                </span>
                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wide">
                  OPTION {currentQ.correctAnswer}: {currentQ.options[currentQ.correctAnswer]}
                </h3>
              </div>

              <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-2 space-y-0.5 text-xs">
                <span className="font-bold text-emerald-300 uppercase tracking-wide text-[9px] flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-emerald-400" /> OFFICIAL SOURCE CITATION:
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

        {/* Footer / Branding Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-1.5 flex items-center justify-between shrink-0">
          <span className="text-[9px] text-slate-400 tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> BACS Relocation Intelligence Live Stream
          </span>
          <div className="text-[9px] text-emerald-400 font-semibold">
            Urgent Countdown • Milestone Chimes Active
          </div>
        </div>

      </div>
    </div>
  );
};
