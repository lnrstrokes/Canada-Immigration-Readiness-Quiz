import React, { useState } from 'react';
import { ChallengeConfig } from '../types';
import { Play, Shuffle, Sliders, CheckSquare, Square, Video, Target, BookOpen, ShieldCheck, Award, Zap, Compass, ExternalLink } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SetupViewProps {
  config: ChallengeConfig;
  onStartAssessment: (selectedCategories: string[], shuffle: boolean, questionCount: number) => void;
  onOpenVideoStudio: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ config, onStartAssessment, onOpenVideoStudio }) => {
  const allCategories: string[] = Array.from(new Set(config.questions.map((q) => q.category))) as string[];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(allCategories);
  const [shuffle, setShuffle] = useState(true);
  const [questionCount, setQuestionCount] = useState<number>(10);

  const getCategoryCount = (cat: string) => {
    return config.questions.filter((q) => q.category === cat).length;
  };

  const totalFilteredQuestions = config.questions.filter((q) => selectedCategories.includes(q.category)).length;

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const selectSingleCategoryOnly = (cat: string) => {
    setSelectedCategories([cat]);
  };

  const selectAllCategories = () => {
    setSelectedCategories(allCategories);
  };

  const countOptions = Array.from(new Set([5, 10, 20, totalFilteredQuestions]))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  const handleLaunch = () => {
    onStartAssessment(selectedCategories, shuffle, questionCount);
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-[#0f172a] border-2 border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 font-black text-xl shadow-lg">
              <Compass className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                BACS Canada Immigration Assessment
              </h1>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>IRCC Compliance Source Citations • {config.questions.length} Questions (25% A/B/C/D)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <PWAInstallButton />
            <button
              onClick={onOpenVideoStudio}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Video className="w-4 h-4 fill-slate-950" />
              <span>1080p Video Studio</span>
            </button>
          </div>
        </div>

        {/* Strategic Immigration Context Banner */}
        <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Canada Relocation Intelligence & Policy Audit
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              IRPA Compliance Verified
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Assess Express Entry CRS points, Provincial Nominee Program (PNP) tech draws, NYSC foreign work experience framing, reference letter letterhead standards, and LMIA work permits.
          </p>
        </div>

        {/* Category Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" /> Immigration Category Focus
            </label>
            <button
              onClick={selectAllCategories}
              className="text-xs font-bold text-sky-400 hover:underline"
            >
              Select All Categories
            </button>
          </div>

          {/* Category Toggle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {allCategories.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              const count = getCategoryCount(cat);
              const isOnly = selectedCategories.length === 1 && selectedCategories[0] === cat;

              return (
                <div
                  key={cat}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="text-xs font-bold text-left line-clamp-1 flex-1 pr-1"
                    >
                      {cat}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2">
                    <span className="text-[10px] font-mono text-emerald-300">
                      {count} {count === 1 ? 'Question' : 'Questions'}
                    </span>
                    {!isOnly && (
                      <button
                        type="button"
                        onClick={() => selectSingleCategoryOnly(cat)}
                        className="text-[9px] font-bold bg-slate-950/80 hover:bg-slate-900 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded transition-all flex items-center gap-1"
                      >
                        <Target className="w-2.5 h-2.5" /> Focus
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Options Row: Question Count & Shuffle */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Question Count selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" /> Questions Per Assessment Session:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {countOptions.map((num) => {
                const isSelected = questionCount === num;
                const isAll = num === totalFilteredQuestions;
                return (
                  <button
                    key={`qcount-${num}`}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isAll ? `All (${num})` : `${num} Qs`}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              Active Question Pool: <strong className="text-emerald-400">{Math.min(questionCount, totalFilteredQuestions)}</strong> questions from {selectedCategories.length} category filter(s)
            </p>
          </div>

          {/* Shuffle Toggle */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-sky-400" /> Question Shuffling
              </span>
              <p className="text-[11px] text-slate-400">Randomize question sequence for fresh practice sessions</p>
            </div>
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

        </div>

        {/* Start Button */}
        <div className="pt-2">
          <button
            onClick={handleLaunch}
            className="w-full flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 text-base"
          >
            <Zap className="w-5 h-5 fill-slate-950" />
            <span>Launch Immigration Assessment ({Math.min(questionCount, totalFilteredQuestions)} Questions)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
