import React, { useState, useMemo } from 'react';
import { CalendarDay, Layer4DistributionPack } from '../types';
import {
  generateDistributionPack,
  validateDistributionPack,
  BACS_ASSESSMENT_CTA,
} from '../utils/distributionPackGenerator';
import {
  Share2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Video,
  Hash,
  FileText,
  Youtube,
} from 'lucide-react';

interface Layer4DistributionSectionProps {
  day: CalendarDay;
}

export const Layer4DistributionSection: React.FC<Layer4DistributionSectionProps> = ({ day }) => {
  const [variantIndex, setVariantIndex] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'all' | 'tiktok' | 'youtube'>('all');

  // Generate metadata deterministically based strictly on the day's validated data
  const pack: Layer4DistributionPack = useMemo(() => {
    return generateDistributionPack(day, variantIndex);
  }, [day, variantIndex]);

  // Validate metadata strictly
  const validation = useMemo(() => {
    return validateDistributionPack(pack, day);
  }, [pack, day]);

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers / iframe contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldId);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  const handleRegenerate = () => {
    setVariantIndex((prev) => prev + 1);
  };

  const hashtagsText = pack.tiktok.hashtags.join(' ');
  const youtubeTagsText = pack.youtubeShorts.tags.join(', ');

  return (
    <div className="bg-slate-950/90 border border-sky-500/30 rounded-xl p-3.5 space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sky-400 flex items-center gap-1.5 text-xs">
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>LAYER 4: DISTRIBUTION & ENGAGEMENT PACK</span>
          </span>
          <span className="text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
            Day {day.dayNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRegenerate}
            id="regenerate-metadata-btn"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all"
            title="Cycle metadata variant using the same validated facts & questions"
          >
            <RefreshCw className="w-3 h-3 text-sky-400" />
            <span>Regenerate Metadata</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Layer 4' : 'Collapse Layer 4'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-3.5">
          
          {/* Validation Notice */}
          <div className="flex items-center justify-between text-[11px] bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Auto-generated from Layer 1 Facts & 3 Validated Questions • Zero answer reveals</span>
            </div>
            <span className="text-emerald-400 font-bold hidden sm:inline">
              CTA: {BACS_ASSESSMENT_CTA}
            </span>
          </div>

          {/* Platform Tab Filters */}
          <div className="flex gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-[11px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setActivePlatformTab('all')}
              className={`flex-1 py-1 px-2 rounded-md transition-all ${
                activePlatformTab === 'all'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Platforms (TikTok + Shorts)
            </button>
            <button
              type="button"
              onClick={() => setActivePlatformTab('tiktok')}
              className={`flex-1 py-1 px-2 rounded-md transition-all ${
                activePlatformTab === 'tiktok'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TikTok
            </button>
            <button
              type="button"
              onClick={() => setActivePlatformTab('youtube')}
              className={`flex-1 py-1 px-2 rounded-md transition-all ${
                activePlatformTab === 'youtube'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              YouTube Shorts
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            
            {/* ================================================================= */}
            {/* A. TIKTOK PUBLISHING BLOCK */}
            {/* ================================================================= */}
            {(activePlatformTab === 'all' || activePlatformTab === 'tiktok') && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 font-mono">
                    <Video className="w-3.5 h-3.5" />
                    <span>A. TIKTOK PUBLISHING BLOCK</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${pack.tiktok.caption}\n\n${pack.tiktok.hashtags.join(' ')}`,
                        'tiktok-all'
                      )
                    }
                    className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-rose-300 bg-slate-950 border border-slate-800 hover:border-rose-500/40 px-2 py-0.5 rounded transition-all"
                  >
                    {copiedField === 'tiktok-all' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied Pack!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Full Post</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Field 1: Caption */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      1. Caption (Hook + CTA)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pack.tiktok.caption, 'tiktok-caption')}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedField === 'tiktok-caption' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {pack.tiktok.caption}
                  </div>
                </div>

                {/* Field 2: Short Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      2. Short Description
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pack.tiktok.shortDescription, 'tiktok-desc')}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedField === 'tiktok-desc' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed font-sans">
                    {pack.tiktok.shortDescription}
                  </div>
                </div>

                {/* Field 3: Hashtags */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      <Hash className="w-3 h-3 text-rose-400" /> 3. Topic Hashtags
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(hashtagsText, 'tiktok-hashtags')}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedField === 'tiktok-hashtags' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-wrap gap-1.5">
                    {pack.tiktok.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ================================================================= */}
            {/* B. YOUTUBE SHORTS PUBLISHING BLOCK */}
            {/* ================================================================= */}
            {(activePlatformTab === 'all' || activePlatformTab === 'youtube') && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 font-mono">
                    <Youtube className="w-3.5 h-3.5" />
                    <span>B. YOUTUBE SHORTS PUBLISHING BLOCK</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${pack.youtubeShorts.title}\n\n${pack.youtubeShorts.description}\n\nTags:\n${youtubeTagsText}`,
                        'yt-all'
                      )
                    }
                    className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-red-300 bg-slate-950 border border-slate-800 hover:border-red-500/40 px-2 py-0.5 rounded transition-all"
                  >
                    {copiedField === 'yt-all' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied Pack!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Full Post</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Field 1: YouTube Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      1. YouTube Title
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pack.youtubeShorts.title, 'yt-title')}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedField === 'yt-title' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-bold font-sans">
                    {pack.youtubeShorts.title}
                  </div>
                </div>

                {/* Field 2: YouTube Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      2. YouTube Description
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pack.youtubeShorts.description, 'yt-desc')}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedField === 'yt-desc' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto scrollbar-thin font-sans">
                    {pack.youtubeShorts.description}
                  </div>
                </div>

                {/* Field 3: YouTube Tags */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      3. YouTube Search Tags
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(youtubeTagsText, 'yt-tags')}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedField === 'yt-tags' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                    {pack.youtubeShorts.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-red-500/10 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-[11px] font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
};
