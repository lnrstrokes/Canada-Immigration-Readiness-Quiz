import React, { useState, useEffect } from 'react';
import { ChallengeConfig, Question, QuestionOption, isShortAnswerSet } from '../types';
import { sounds } from '../utils/soundEffects';
import {
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  BookOpen,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Pause,
  Play,
  ExternalLink,
} from 'lucide-react';

interface LivestreamBroadcastProps {
  config: ChallengeConfig;
  selectedCategories: string[];
  shuffle: boolean;
  questionCount: number;
  questionDuration?: number;
  revealDuration?: number;
  onBackToSetup: () => void;
  onOpenVideoStudio: () => void;
}

export type QuizPhase =
  | 'question'
  | 'times_up'
  | 'animating'
  | 'revealed'
  | 'transitioning';

export const getPerformanceMessage = (score: number, total: number): string => {
  if (total === 0) return 'OFF TO A STRONG START';
  const ratio = score / total;
  if (ratio >= 0.9) return 'EXCELLENT';
  if (ratio >= 0.66) return 'STRONG PERFORMANCE';
  if (ratio >= 0.33) return 'KEEP GOING';
  return 'ROOM TO IMPROVE';
};

export const LivestreamBroadcast: React.FC<LivestreamBroadcastProps> = ({
  config,
  selectedCategories,
  shuffle,
  questionCount = 3,
  questionDuration = 25, // Section 9: 25s Question Countdown
  revealDuration = 12,   // Section 9: 12s Review Countdown
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
  const [phase, setPhase] = useState<QuizPhase>('question');
  const [timeLeft, setTimeLeft] = useState(questionDuration);
  const [selectedOption, setSelectedOption] = useState<QuestionOption | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(revealDuration);
  const [isCompleted, setIsCompleted] = useState(false);

  // Section 11 & 14: Loop countdown for auto-restarting next round (9s)
  const [loopCountdown, setLoopCountdown] = useState(9);
  const [isLoopPaused, setIsLoopPaused] = useState(false);

  const currentQ = (questions && questions.length > 0)
    ? (questions[currentIndex % questions.length] || questions[0])
    : config.questions[0];

  // Re-initialize whenever config, categories, or counts change
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
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(questionDuration);
    setNextCountdown(revealDuration);
    setPhase('question');
    setSelectedOption(null);
    setIsCompleted(false);
    setLoopCountdown(9);
    setIsLoopPaused(false);
    sounds.playMilestone();
  }, [config, selectedCategories, shuffle, questionCount, questionDuration, revealDuration]);

  const handleToggleMute = () => {
    const m = sounds.toggleMute();
    setIsMuted(m);
  };

  // Phase 1: Question 25-second countdown (Section 5 & 9)
  useEffect(() => {
    let timer: any = null;
    if (!isCompleted && phase === 'question' && currentQ) {
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          if (timeLeft <= 4 && timeLeft > 1) {
            sounds.playUrgentTick();
          } else {
            sounds.playTick();
          }
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else {
        // Countdown hit 0 -> enter 0.5s TIME'S UP pause (Section 7)
        setPhase('times_up');
      }
    }
    return () => clearTimeout(timer);
  }, [isCompleted, phase, timeLeft, currentQ]);

  // Phase 2: TIME'S UP 0.5s pause (Section 7: Question -> 25s countdown -> TIME'S UP -> 0.5s pause)
  useEffect(() => {
    let pauseTimer: any = null;
    if (phase === 'times_up') {
      pauseTimer = setTimeout(() => {
        // Evaluate score if candidate had selected an option
        if (selectedOption) {
          if (selectedOption === currentQ.correctAnswer) {
            setScore((prev) => prev + 1);
            setStreak((prev) => prev + 1);
            sounds.playCorrect();
          } else {
            setStreak(0);
            sounds.playReveal();
          }
        } else {
          setStreak(0);
          sounds.playReveal();
        }
        setPhase('animating');
      }, 500); // 0.5s pause
    }
    return () => clearTimeout(pauseTimer);
  }, [phase, selectedOption, currentQ]);

  // Phase 3: Answer Reveal Animation (~1.5s) (Section 7)
  // - incorrect answers dim to ~40-50% opacity
  // - correct answer stays visually dominant
  // - correct answer border transitions to green with subtle glow/pulse
  // - checkmark animates in scale 0 -> 1
  useEffect(() => {
    let animTimer: any = null;
    if (phase === 'animating') {
      animTimer = setTimeout(() => {
        setNextCountdown(revealDuration);
        setPhase('revealed');
      }, 1500); // ~1.5s
    }
    return () => clearTimeout(animTimer);
  }, [phase, revealDuration]);

  // Phase 4: Official Reasoning Panel & 12-second review countdown (Section 7, 8, 9)
  useEffect(() => {
    let reviewTimer: any = null;
    if (!isCompleted && phase === 'revealed') {
      if (nextCountdown > 0) {
        reviewTimer = setTimeout(() => {
          if (nextCountdown <= 3) {
            sounds.playUrgentTick();
          } else {
            sounds.playTick();
          }
          setNextCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        // Review timer reached zero -> enter 0.5s transition phase
        setPhase('transitioning');
      }
    }
    return () => clearTimeout(reviewTimer);
  }, [isCompleted, phase, nextCountdown]);

  // Phase 5: ~0.5s fade transition before next question or completion (Section 7, 9)
  useEffect(() => {
    let transitionTimer: any = null;
    if (phase === 'transitioning') {
      transitionTimer = setTimeout(() => {
        if (currentIndex >= questions.length - 1) {
          setIsCompleted(true);
          setLoopCountdown(9); // Section 11: 9s countdown
          sounds.playFanfare();
        } else {
          setCurrentIndex((prev) => prev + 1);
          setTimeLeft(questionDuration);
          setNextCountdown(revealDuration);
          setSelectedOption(null);
          setPhase('question');
        }
      }, 500); // 0.5s fade transition
    }
    return () => clearTimeout(transitionTimer);
  }, [phase, currentIndex, questions.length, questionDuration, revealDuration]);

  // Section 11 & 14: Loop countdown for auto-restarting next round (9s)
  useEffect(() => {
    let loopTimer: any = null;
    if (isCompleted && !isLoopPaused) {
      if (loopCountdown > 0) {
        loopTimer = setTimeout(() => {
          setLoopCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        handleRestartQuiz();
      }
    }
    return () => clearTimeout(loopTimer);
  }, [isCompleted, isLoopPaused, loopCountdown]);

  // Manual option selection by user during thinking time
  const handleManualSelect = (opt: QuestionOption) => {
    if (phase !== 'question' || !currentQ || isCompleted) return;
    setSelectedOption(opt);
    // Move into times_up pause
    setPhase('times_up');
  };

  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(questionDuration);
    setNextCountdown(revealDuration);
    setPhase('question');
    setSelectedOption(null);
    setIsCompleted(false);
    setLoopCountdown(9);
    setIsLoopPaused(false);
    if (shuffle) {
      setQuestions([...questions].sort(() => Math.random() - 0.5));
    }
    sounds.playMilestone();
  };

  if (questions.length === 0 || !currentQ) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center p-4 text-white">
        <p>Loading BACS Immigration Quiz Engine...</p>
      </div>
    );
  }

  // =========================================================================
  // FINAL SCREEN (Section 11): One Conversion Destination (Assessment Only)
  // =========================================================================
  if (isCompleted) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center p-3 sm:p-4 select-none overflow-hidden">
        {/* Safe-Zone Layout Container */}
        <div className="w-full max-w-md bg-[#0f172a] border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden relative p-6 space-y-4 aspect-[9/16] max-h-[96vh]">
          
          {/* Top Branding (Section 2) */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2.5">
            <span className="font-semibold tracking-wider flex items-center gap-1.5 text-slate-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 🇨🇦 BACS IMMIGRATION QUIZ
            </span>
            <button
              onClick={handleToggleMute}
              className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>

          {/* Header Block: 🎯 QUIZ COMPLETE + Dynamic Score */}
          <div className="text-center space-y-2 pt-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>🎯 QUIZ COMPLETE</span>
            </h2>

            {/* Dynamic Score Indicator (Never hard-coded) */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 px-4 py-1.5 rounded-full text-base font-black font-mono tracking-wider">
              <span>{score}/{questions.length} — {percentage}%</span>
            </div>
          </div>

          {/* Section Divider 1 */}
          <div className="border-t border-slate-800/90 my-1"></div>

          {/* IMMIGRATION MILESTONES & NEXT STEPS */}
          <div className="text-center space-y-2">
            <h3 className="text-xs sm:text-sm font-black text-slate-300 tracking-wider uppercase font-mono">
              IMMIGRATION MILESTONES & NEXT STEPS
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
              Your quiz result is a starting point.<br />
              Your actual immigration options depend on your individual profile.
            </p>
          </div>

          {/* Section Divider 2 */}
          <div className="border-t border-slate-800/90 my-1"></div>

          {/* 🇨🇦 PRIMARY CONVERSION CTA: FREE PROFILE ASSESSMENT (Section 1 & 11) */}
          <div className="bg-slate-900/95 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-xl shadow-emerald-500/10">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">🇨🇦</span>
              <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                FREE PROFILE ASSESSMENT
              </h4>
            </div>

            {/* Exact required wording (Section 0.1 & 11) */}
            <p className="text-xs sm:text-sm text-emerald-300 font-semibold leading-relaxed">
              Find out your real chance of moving to Canada in 4 minutes.
            </p>

            <a
              href="https://bacs-canada.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              id="quiz-primary-assessment-cta-btn"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all text-xs sm:text-sm uppercase tracking-wider group"
            >
              <span>CANADA INTEL HUB →</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* URL Display (Section 11: fully readable as plain text beneath label) */}
            <div className="text-xs font-mono text-slate-400 hover:text-emerald-300 transition-colors">
              <a href="https://bacs-canada.vercel.app" target="_blank" rel="noopener noreferrer">
                bacs-canada.vercel.app
              </a>
            </div>
          </div>

          {/* Section Divider 3 */}
          <div className="border-t border-slate-800/90 my-1"></div>

          {/* Section 11 & 14: Loop Countdown: 🔔 NEXT QUIZ ROUND IN 9s */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <span>🔔 NEXT QUIZ ROUND IN {loopCountdown}s</span>
            </div>
            <button
              onClick={() => setIsLoopPaused((prev) => !prev)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
            >
              {isLoopPaused ? (
                <>
                  <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Resume
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-amber-400" /> Pause
                </>
              )}
            </button>
          </div>

          {/* Action Controls: Back to Setup, Video Studio, Replay Quiz (Section 14) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 shrink-0">
            <button
              onClick={onBackToSetup}
              id="quiz-back-setup-btn"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenVideoStudio}
                id="quiz-export-video-btn"
                className="text-[11px] bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Video Studio
              </button>

              <button
                onClick={handleRestartQuiz}
                id="quiz-replay-btn"
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Replay Quiz
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE QUESTION & REVEAL SCREEN (Questions 1–3) (Sections 2, 3, 5, 6, 7, 8)
  // =========================================================================
  const isRevealedState = phase === 'revealed' || phase === 'transitioning';
  const isSelectionHighlightState = phase === 'animating' || isRevealedState;
  const is2x2Layout = isShortAnswerSet(currentQ.options);

  return (
    <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      {/* 9:16 Safe Area Container (Section 12: Clear of top status & bottom/right chrome) */}
      <div
        className={`w-full max-w-md bg-[#0f172a] border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden relative aspect-[9/16] max-h-[96vh] transition-opacity duration-500 ${
          phase === 'transitioning' ? 'opacity-20 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
      >
        
        {/* 1. TOP HEADER (Section 2 & 3): Clean BACS IMMIGRATION QUIZ Branding */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToSetup}
              className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800 transition-colors"
              title="Back to Setup"
              id="quiz-top-back-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              {/* Question number & category (Section 3) */}
              <h2 className="text-xs font-black text-white tracking-wider uppercase font-mono leading-none">
                QUESTION {currentIndex + 1} OF {questions.length} • {(currentQ.category || 'EXPRESS ENTRY').toUpperCase()}
              </h2>
              {/* Official IRCC-Sourced branding (Section 2) */}
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wide pt-1 font-mono">
                🇨🇦 BACS IMMIGRATION QUIZ • IRCC-SOURCED KNOWLEDGE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <div className="bg-amber-500/20 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> {streak}
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

        {/* 2. SINGLE COMMENT PROMPT BAR (Section 5, 7, 9) */}
        {phase === 'question' && (
          <div className={`border-b px-4 py-2 flex items-center justify-between shrink-0 transition-colors ${
            timeLeft <= 4 ? 'bg-rose-500/20 border-rose-500/40 animate-pulse' : 'bg-slate-900/80 border-slate-800'
          }`}>
            {/* Exactly one comment prompt: COMMENT A, B, C OR D — 25s */}
            <div className="text-xs font-black tracking-wider text-amber-400 uppercase font-mono">
              💬 COMMENT A, B, C OR D — {timeLeft}s
            </div>
            <div className={`px-2 py-0.5 rounded text-xs font-mono font-black border ${
              timeLeft <= 4 ? 'bg-rose-950 text-rose-300 border-rose-500' : 'bg-slate-950 text-amber-400 border-amber-500/40'
            }`}>
              {timeLeft}s
            </div>
          </div>
        )}

        {phase === 'times_up' && (
          <div className="bg-amber-500/20 border-b border-amber-500/50 px-4 py-2 flex items-center justify-between shrink-0 animate-pulse">
            <div className="text-xs font-black tracking-wider text-amber-300 uppercase font-mono">
              💬 TIME'S UP
            </div>
            <div className="text-[10px] font-mono text-amber-400 font-bold">
              LOCKING IN
            </div>
          </div>
        )}

        {phase === 'animating' && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/50 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="text-xs font-black tracking-wider text-emerald-300 uppercase font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ANSWER REVEAL</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-bold">
              HIGHLIGHTING
            </div>
          </div>
        )}

        {isRevealedState && (
          /* Section 9: ⚡ ANSWER REVEALED • REVIEW TIME: 12s */
          <div className="bg-emerald-500/15 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
              ⚡ ANSWER REVEALED • REVIEW TIME: {nextCountdown}s
            </div>
            <div className="text-[11px] text-slate-300 font-mono font-bold">
              SCORE: {score}/{currentIndex + 1}
            </div>
          </div>
        )}

        {/* 3. QUESTION & RESPONSIVE ANSWER CARDS (Section 6: Responsive Layout) */}
        <div className="flex-1 px-4 py-3 flex flex-col justify-center space-y-3 overflow-y-auto">
          
          {/* Question Text (Dominant Element, 24px+ mobile-first proportion) */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-inner">
            <p className="text-sm sm:text-base md:text-lg font-bold text-white leading-snug">
              {currentQ.text || currentQ.question}
            </p>
          </div>

          {/* Section 6: Responsive Answer Card Layout: 2x2 grid if short, stacked cards if longer */}
          <div className={is2x2Layout ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1 gap-2.5'}>
            {(['A', 'B', 'C', 'D'] as QuestionOption[]).map((opt) => {
              const isSelected = selectedOption === opt;
              const isCorrect = isSelectionHighlightState && opt === currentQ.correctAnswer;
              const isWrongSelection = isSelectionHighlightState && isSelected && !isCorrect;
              const isSubdued = isSelectionHighlightState && !isCorrect;

              return (
                <button
                  key={opt}
                  onClick={() => handleManualSelect(opt)}
                  disabled={phase !== 'question'}
                  className={`w-full text-left rounded-xl border flex items-center gap-2.5 transition-all duration-700 ease-out ${
                    is2x2Layout ? 'p-3' : 'px-3.5 py-2.5'
                  } ${
                    isCorrect
                      ? 'bg-emerald-500/25 border-emerald-500 text-white font-bold scale-[1.02] shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-500/50 z-10 animate-pulse'
                      : isWrongSelection
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200 opacity-70'
                      : isSubdued
                      ? 'bg-slate-950/60 border-slate-800/80 text-slate-500 opacity-40 scale-[0.99] pointer-events-none'
                      : isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Badge with animated checkmark on reveal */}
                  <span
                    className={`w-6 h-6 rounded-md font-black text-xs flex items-center justify-center shrink-0 shadow transition-all duration-500 ${
                      isCorrect
                        ? 'bg-emerald-500 text-slate-950 scale-110 rotate-0'
                        : isWrongSelection
                        ? 'bg-rose-500 text-white'
                        : isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isCorrect ? '✓' : opt}
                  </span>
                  <span className={`text-xs sm:text-sm font-medium leading-snug flex-1 ${
                    isCorrect ? 'text-emerald-200 font-bold' : ''
                  }`}>
                    {currentQ.options[opt]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 4. OFFICIAL REASONING PANEL (Section 7 & 8) - Fades & slides in */}
          {isRevealedState && (
            <div className="bg-slate-900/95 border-2 border-emerald-500/60 rounded-2xl p-3.5 space-y-2 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>💡 OFFICIAL REASONING & IRCC REFERENCE</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  VERIFIED
                </span>
              </div>

              {/* 1-3 short sentences explaining the correct answer (Section 8) */}
              <div className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                {currentQ.insight || currentQ.explanation}
              </div>

              {/* Official Source: [IRCC source title] */}
              <div className="text-[11px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="line-clamp-2">
                  Official Source: {currentQ.sourceTitle || currentQ.reference}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* 5. SUBTLE BOTTOM WATERMARK (Section 2 & 10: No CTA on Questions or Reveals) */}
        <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between shrink-0 text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> BACS Immigration Quiz Engine
          </span>

          <button
            onClick={onOpenVideoStudio}
            className="text-[10px] text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
          >
            Video Studio
          </button>
        </div>

      </div>
    </div>
  );
};
