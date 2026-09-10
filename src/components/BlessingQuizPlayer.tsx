import React, { useState, useEffect } from 'react';
import { ChallengeConfig, Question, QuestionOption } from '../types';
import { sounds } from '../utils/soundEffects';
import { Volume2, VolumeX, Flame, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';

interface BlessingQuizPlayerProps {
  config: ChallengeConfig;
  onFinish: (score: number, total: number) => void;
  onBackToSetup: () => void;
}

export const BlessingQuizPlayer: React.FC<BlessingQuizPlayerProps> = ({
  config,
  onFinish,
  onBackToSetup,
}) => {
  // Shuffled questions for infinite progression
  const [questions, setQuestions] = useState<Question[]>(() => {
    const shuffled = [...config.questions].sort(() => Math.random() - 0.5);
    return shuffled;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<QuestionOption | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(5);

  const currentQ = questions[currentIndex % questions.length];

  // Toggle Mute
  const handleToggleMute = () => {
    const m = sounds.toggleMute();
    setIsMuted(m);
  };

  // Timer interval for thinking time
  useEffect(() => {
    let timer: any = null;
    if (!isRevealed) {
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          sounds.playTick();
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else {
        // Time out -> Reveal answer automatically
        setIsRevealed(true);
        sounds.playReveal();
      }
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isRevealed]);

  // Automatic next question countdown after reveal
  useEffect(() => {
    let nextTimer: any = null;
    if (isRevealed) {
      if (nextCountdown > 0) {
        nextTimer = setTimeout(() => {
          sounds.playTick();
          setNextCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        // Automatically advance to next question (infinite shuffle loop)
        handleNextQuestion();
      }
    }
    return () => clearTimeout(nextTimer);
  }, [isRevealed, nextCountdown]);

  const handleSelectOption = (opt: QuestionOption) => {
    if (isRevealed) return;
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

  const handleNextQuestion = () => {
    if (currentIndex >= 19) {
      // After 20 questions, finish and go to results
      onFinish(score, currentIndex + 1);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setIsRevealed(false);
    setTimeLeft(15);
    setNextCountdown(5);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-2 md:p-4 select-none overflow-hidden">
      {/* Fixed 16:9 / Broadcast Container (No Scrolling) */}
      <div className="w-full max-w-xl bg-[#0b132b] border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden relative aspect-[9/16] sm:aspect-[16/9] max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 font-black text-sm shadow-sm">
              🇨🇦
            </div>
            <div>
              <h2 className="text-xs font-black text-white tracking-wider">BLESSING CHIGOZIE</h2>
              <p className="text-[10px] text-sky-400 font-semibold tracking-wide">IMMIGRATION CHALLENGE</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-xs font-bold text-amber-400 flex items-center gap-1">
              <span>Q{(currentIndex % questions.length) + 1}/10</span>
              <span className="text-slate-500">({config.streamName})</span>
            </div>

            <button
              onClick={handleToggleMute}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Tags Row */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {currentQ.category}
            </span>
            <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {currentQ.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400 animate-pulse" />
            <span>Streak: {streak}</span>
          </div>
        </div>

        {/* Notice Banner / Thinking Time Bar */}
        {!isRevealed ? (
          <div className="bg-amber-500/10 border-y border-amber-500/30 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <span>💬 Lock in your answer – Type A, B, C or D in the chat!</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-amber-500/40 px-3 py-1 rounded-lg text-amber-400 text-xs font-mono font-bold">
              <span>THINKING TIME:</span>
              <span className="text-white bg-amber-600/40 px-1.5 py-0.5 rounded">{timeLeft}s</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/15 border-y border-emerald-500/40 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> CORRECT ANSWER REVEALED
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Next in <strong className="text-emerald-400">{nextCountdown}s</strong>
            </div>
          </div>
        )}

        {/* Main Content Area (No Scrolling, Fixed Aspect Container) */}
        <div className="flex-1 px-4 py-3 flex flex-col justify-center overflow-hidden space-y-3">
          {!isRevealed ? (
            <>
              {/* Question Text */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-inner">
                <p className="text-sm md:text-base font-bold text-white leading-snug">
                  {currentQ.text}
                </p>
              </div>

              {/* Options A, B, C, D */}
              <div className="grid grid-cols-1 gap-2">
                {(['A', 'B', 'C', 'D'] as QuestionOption[]).map((opt) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow">
                        {opt}
                      </span>
                      <span className="text-xs md:text-sm font-medium line-clamp-1">{currentQ.options[opt]}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Answer Reveal View (Blessing Chigozie Style) */
            <div className="bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                  VERIFIED RULE & ANSWER
                </span>
                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wide">
                  OPTION {currentQ.correctAnswer}: {currentQ.options[currentQ.correctAnswer]}
                </h3>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1 text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wide">REFERENCE:</span>
                <p className="text-slate-300 font-mono">{currentQ.reference}</p>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 space-y-1 text-xs">
                <span className="font-bold text-emerald-400 uppercase tracking-wide">STRATEGIC INSIGHT:</span>
                <p className="text-slate-200 leading-relaxed text-[11px] md:text-xs">{currentQ.insight}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Branding Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400 tracking-wider">
            ▶ More live challenges — Subscribe for more
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSetup}
              className="text-[10px] text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-950 border border-slate-800"
            >
              Exit
            </button>
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded transition-all shadow"
            >
              <span>Next</span> <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
