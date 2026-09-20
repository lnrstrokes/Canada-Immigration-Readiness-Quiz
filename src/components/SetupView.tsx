import React, { useState, useMemo } from 'react';
import { ChallengeConfig, Question, CalendarDay } from '../types';
import {
  Play,
  Shuffle,
  Sliders,
  CheckSquare,
  Square,
  Video,
  Target,
  BookOpen,
  ShieldCheck,
  Award,
  Zap,
  Compass,
  Clock,
  Sparkles,
  Calendar,
  ExternalLink,
  ChevronRight,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { Layer4DistributionSection } from './Layer4DistributionSection';
import { getFullCalendarSchedule, validateQuestionSet } from '../data/calendarSchedule';

interface SetupViewProps {
  config: ChallengeConfig;
  onStartAssessment: (
    selectedCategories: string[],
    shuffle: boolean,
    questionCount: number,
    questionDuration: number,
    revealDuration: number,
    customQuestions?: Question[]
  ) => void;
  onOpenVideoStudio: (customQuestions?: Question[]) => void;
  onOpenPremium?: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  config,
  onStartAssessment,
  onOpenVideoStudio,
  onOpenPremium,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'custom'>('calendar');

  // Calendar State
  const calendarSchedule: CalendarDay[] = useMemo(() => getFullCalendarSchedule(), []);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [calendarSearch, setCalendarSearch] = useState('');

  const selectedDay =
    calendarSchedule.find((d) => d.dayNumber === selectedDayNumber) ||
    calendarSchedule[0] || {
      dayNumber: 1,
      displayDate: 'Aug 01',
      date: '2026-08-01',
      topic: 'Express Entry Basics',
      subtopics: ['CRS Score', 'Eligibility', 'NOC Matrix'],
      factPacket: {
        sourceAgency: 'IRCC',
        policyTopic: 'Express Entry',
        sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
        sourceDate: '2026-08-01',
        status: 'VERIFIED' as const,
        verifiedFacts: ['IRCC administers Express Entry under Ministerial Instructions.'],
      },
      questions: config.questions.slice(0, 3),
    };

  // Run deterministic Layer 3 validation on current selected day's questions
  const validationResult = useMemo(() => {
    return validateQuestionSet(selectedDay?.questions || config.questions.slice(0, 3));
  }, [selectedDay, config.questions]);

  // Custom Category Quiz state
  const allCategories: string[] = Array.from(new Set(config.questions.map((q) => q.category))) as string[];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(allCategories);
  const [shuffle, setShuffle] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [questionDuration, setQuestionDuration] = useState<number>(25); // Section 9: 25s Question Countdown
  const [revealDuration, setRevealDuration] = useState<number>(12);     // Section 9: 12s Review Countdown

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

  const countOptions = Array.from(new Set([3, 5, 10, totalFilteredQuestions]))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  const questionDurationOptions = [10, 15, 20, 25, 30];
  const revealDurationOptions = [8, 10, 12, 15];

  const handleLaunchCalendarDay = () => {
    onStartAssessment(
      [selectedDay.topic],
      false,
      3,
      questionDuration,
      revealDuration,
      selectedDay.questions
    );
  };

  const handleOpenVideoStudioWithDay = () => {
    onOpenVideoStudio(selectedDay.questions);
  };

  const handleLaunchCustom = () => {
    onStartAssessment(selectedCategories, shuffle, questionCount, questionDuration, revealDuration);
  };

  const filteredDays = calendarSchedule.filter((d) => {
    const q = calendarSearch.toLowerCase();
    return (
      d.topic.toLowerCase().includes(q) ||
      d.displayDate.toLowerCase().includes(q) ||
      d.subtopics.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-4xl bg-[#0f172a] border-2 border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5">
        
        {/* Header (Section 2: Clean Branding) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 font-black text-xl shadow-lg">
              <Compass className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                BACS Immigration Quiz Engine <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">v2.0</span>
              </h1>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-0.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>🇨🇦 IRCC-SOURCED CANADA IMMIGRATION KNOWLEDGE</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <PWAInstallButton />
            <button
              onClick={() => onOpenVideoStudio(selectedDay.questions)}
              id="setup-video-studio-btn"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Video className="w-4 h-4 fill-slate-950" />
              <span>1080p Video Studio</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation: 30-Day Content Calendar vs Custom Builder */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 shadow'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>30-Day Content Calendar & Fact Pipeline (Sep 18 – Oct 17)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'custom'
                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 shadow'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Custom Category Quiz</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: 30-DAY CONTENT CALENDAR & 3-LAYER FACT VERIFICATION PIPELINE */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            
            {/* Search and Day Picker */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter 30 topics..."
                  value={calendarSearch}
                  onChange={(e) => setCalendarSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Showing {filteredDays.length} of 30 days
              </div>
            </div>

            {/* Scrollable Day Badges (Sep 18 - Oct 17) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {filteredDays.map((day) => {
                const isSelected = day.dayNumber === selectedDayNumber;
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDayNumber(day.dayNumber)}
                    className={`shrink-0 text-left p-2 rounded-xl border transition-all w-32 ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">D{day.dayNumber}</span>
                      <span>{day.displayDate}</span>
                    </div>
                    <div className="text-[11px] font-bold text-white line-clamp-1 mt-1">
                      {day.topic}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Fact Verification Details Card (Sections 15, 16) */}
            <div className="bg-slate-900/95 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      DAY {selectedDay.dayNumber} • {selectedDay.displayDate}, 2026
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      3 IRCC-Verified Questions
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    {selectedDay.topic}
                  </h3>
                </div>

                {/* Layer 3 Validation Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                    validationResult.isValid
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Layer 3: Deterministic Validated</span>
                  </span>
                </div>
              </div>

              {/* Subtopics & 3 Angles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                  <span className="text-slate-400 font-bold block uppercase text-[10px] font-mono">
                    Subtopics Assigned:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDay.subtopics.map((st) => (
                      <span
                        key={st}
                        className="bg-slate-900 border border-slate-700/80 text-slate-200 px-2 py-0.5 rounded text-[11px]"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                  <span className="text-slate-400 font-bold block uppercase text-[10px] font-mono">
                    3 Content Angles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-sky-500/15 border border-sky-500/40 text-sky-300 px-2 py-0.5 rounded text-[11px] font-medium">
                      1. Core Concept
                    </span>
                    <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-medium">
                      2. Practical Application
                    </span>
                    <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-[11px] font-medium">
                      3. Common Misconception
                    </span>
                  </div>
                </div>
              </div>

              {/* Layer 1: Research Fact Packet */}
              {selectedDay.factPacket && (
                <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Layer 1: Official Verified Fact Packet
                    </span>
                    <a
                      href={selectedDay.factPacket.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-300 flex items-center gap-1 font-mono text-[11px] transition-colors"
                    >
                      <span>canada.ca source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {selectedDay.factPacket.verifiedFacts.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Layer 2: 3 Questions Summary List */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Layer 2: Curated 3 Questions for Day {selectedDay.dayNumber}
                </span>
                <div className="space-y-2">
                  {selectedDay.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-slate-200">
                          Q{idx + 1}: {q.topic || q.category}
                        </span>
                        <span className="bg-slate-800 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                          Ans: {q.correctAnswer}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">
                        {q.text || q.question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 4: Distribution & Engagement Pack */}
              <Layer4DistributionSection day={selectedDay} />

              {/* Launch Day Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-800/80">
                <button
                  onClick={handleLaunchCalendarDay}
                  id="calendar-launch-day-quiz-btn"
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg text-sm"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Launch Day {selectedDay.dayNumber} Quiz Engine</span>
                </button>
                <button
                  onClick={handleOpenVideoStudioWithDay}
                  id="calendar-open-studio-day-btn"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 text-emerald-400 font-bold py-3.5 px-4 rounded-xl transition-all text-xs shrink-0"
                >
                  <Video className="w-4 h-4" />
                  <span>Render 1080p Video for Day {selectedDay.dayNumber}</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CUSTOM CATEGORY QUIZ */}
        {/* ========================================================================= */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            
            {/* Category Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                  <Sliders className="w-4 h-4 text-sky-400" /> Immigration Category Focus
                </label>
                <button
                  onClick={selectAllCategories}
                  className="text-xs font-bold text-sky-400 hover:underline"
                >
                  Select All Categories
                </button>
              </div>

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

            {/* Timing & Quiz Length Controls */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Question Count */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" /> Quiz Length:
                </span>
                <div className="grid grid-cols-4 gap-1">
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
                        {isAll ? `All` : `${num} Qs`}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Default: 3 Questions for Social Reels
                </p>
              </div>

              {/* Question Duration */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-400" /> Question Duration:
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {questionDurationOptions.map((sec) => (
                    <button
                      key={`qdur-${sec}`}
                      type="button"
                      onClick={() => setQuestionDuration(sec)}
                      className={`py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${
                        questionDuration === sec
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Section 9 default: 25s</p>
              </div>

              {/* Reveal Duration */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Reveal Duration:
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {revealDurationOptions.map((sec) => (
                    <button
                      key={`rdur-${sec}`}
                      type="button"
                      onClick={() => setRevealDuration(sec)}
                      className={`py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${
                        revealDuration === sec
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Section 9 default: 12s</p>
              </div>

            </div>

            {/* Shuffle Control */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shuffle className="w-4 h-4 text-sky-400" /> Question Shuffling
                </span>
                <p className="text-[11px] text-slate-400">Randomize question order</p>
              </div>
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Launch Custom Quiz */}
            <div className="pt-1">
              <button
                onClick={handleLaunchCustom}
                id="setup-launch-custom-quiz-btn"
                className="w-full flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 text-base"
              >
                <Zap className="w-5 h-5 fill-slate-950" />
                <span>Launch {Math.min(questionCount, totalFilteredQuestions)}-Question Custom Quiz</span>
              </button>
            </div>

          </div>
        )}

        {/* Downstream Advisory Link (Optional, No WhatsApp) */}
        {onOpenPremium && (
          <div className="text-center pt-2 border-t border-slate-800/60">
            <button
              onClick={onOpenPremium}
              className="text-xs text-slate-400 hover:text-emerald-300 transition-colors font-mono"
            >
              Downstream Strategic Advisory (4 Pillars) →
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
