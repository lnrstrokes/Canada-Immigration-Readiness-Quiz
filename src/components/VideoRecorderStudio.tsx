import React, { useState, useRef, useEffect } from 'react';
import { ChallengeConfig, QuestionOption, isShortAnswerSet, Question } from '../types';
import { DEFAULT_CHALLENGE } from '../data/defaultChallenge';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import {
  Video,
  Download,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface VideoRecorderStudioProps {
  config: ChallengeConfig;
  onBack: () => void;
}

export type ReelType = 'question' | 'final_cta' | 'full_quiz';

export const VideoRecorderStudio: React.FC<VideoRecorderStudioProps> = ({ config, onBack }) => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [reelType, setReelType] = useState<ReelType>('question');
  const [videoPreset, setVideoPreset] = useState<'TikTok' | 'Reels' | 'Shorts'>('TikTok');
  const [timingSpeed, setTimingSpeed] = useState<'fast' | 'broadcast'>('fast');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1080x1920 (9:16 Vertical Resolution)
  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;
  const FPS = 30; // 30 FPS ensures high-speed, reliable WebCodecs rendering in-browser without memory hit

  // =========================================================================
  // CANVAS VIDEO RENDER STRINGS (Hardcoded directly into downloaded MP4 frames)
  // =========================================================================
  const CANVAS_BRANDING_HEADER = '🇨🇦 BACS IMMIGRATION QUIZ • IRCC-SOURCED KNOWLEDGE';
  const CANVAS_CONVERSION_DOMAIN = 'bacs-canada.vercel.app';
  const CANVAS_BOTTOM_WATERMARK = '🍁 BACS Immigration Quiz Engine • IRCC-Sourced Knowledge';

  // Question Reel Timing:
  // Fast Mode: 7s question countdown + 0.5s time's up + 1.5s reveal + 6s reasoning = 15s
  // Broadcast Mode: 25s question + 0.5s time's up + 1.5s reveal + 12s reasoning = 39s
  const qThinkTime = timingSpeed === 'fast' ? 7.0 : 25.0;
  const qPauseTime = 0.5;
  const qAnimTime = 1.5;
  const qReviewTime = timingSpeed === 'fast' ? 6.0 : 12.0;
  const singleQuestionDuration = qThinkTime + qPauseTime + qAnimTime + qReviewTime;

  // Safe question list and fallback guarantees
  const questionsList: Question[] =
    config && Array.isArray(config.questions) && config.questions.length > 0
      ? config.questions
      : DEFAULT_CHALLENGE.questions;

  const fallbackQ: Question = questionsList[0] || DEFAULT_CHALLENGE.questions[0];

  const safeIndex =
    selectedQuestionIndex >= 0 && selectedQuestionIndex < questionsList.length
      ? selectedQuestionIndex
      : 0;

  const currentQ: Question = questionsList[safeIndex] || fallbackQ;

  useEffect(() => {
    if (selectedQuestionIndex >= questionsList.length) {
      setSelectedQuestionIndex(0);
    }
  }, [questionsList.length, selectedQuestionIndex]);

  // Duration in seconds depending on mode
  const DURATION_SEC =
    reelType === 'final_cta'
      ? 10
      : reelType === 'full_quiz'
      ? Math.round(singleQuestionDuration * Math.min(3, questionsList.length) + 10)
      : singleQuestionDuration;

  // Helper for responsive text wrapping on Canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
  };

  // Canvas Frame Renderer
  const renderFrame = (ctx: CanvasRenderingContext2D, timeSec: number) => {
    // Background (Dark Blue/Slate Theme #0b132b -> #0f172a)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#0b132b');
    bgGradient.addColorStop(0.5, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle Grid / Accent Glow
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Determine current mode and question for full quiz or single reel
    let activeQ = currentQ;
    let localTime = timeSec;
    let isFullQuizFinal = false;

    if (reelType === 'full_quiz') {
      const qDuration = singleQuestionDuration;
      const qIdx = Math.floor(timeSec / qDuration);
      if (qIdx < Math.min(3, questionsList.length)) {
        activeQ = questionsList[qIdx] || currentQ;
        localTime = timeSec % qDuration;
      } else {
        isFullQuizFinal = true;
      }
    }

    // =========================================================================
    // FINAL CTA SCREEN RENDERER (Section 11: One Conversion Destination)
    // =========================================================================
    if (reelType === 'final_cta' || isFullQuizFinal) {
      const totalQ = Math.min(3, questionsList.length);

      // Top Safe-Zone Header
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(CANVAS_BRANDING_HEADER, CANVAS_WIDTH / 2, 160);

      // Section 11: 🎯 QUIZ COMPLETE
      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 54px sans-serif';
      ctx.fillText('🎯 QUIZ COMPLETE', CANVAS_WIDTH / 2, 260);

      // Dynamic Score Box: [DYNAMIC SCORE]/3 — [DYNAMIC SCORE]%
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 240, 310, 480, 70);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 240, 310, 480, 70);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`${totalQ}/${totalQ} — 100%`, CANVAS_WIDTH / 2, 358);

      // Divider 1
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 430);
      ctx.lineTo(CANVAS_WIDTH - 140, 430);
      ctx.stroke();

      // IMMIGRATION MILESTONES & NEXT STEPS
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'black 36px sans-serif';
      ctx.fillText('IMMIGRATION MILESTONES & NEXT STEPS', CANVAS_WIDTH / 2, 500);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Your quiz result is a starting point.', CANVAS_WIDTH / 2, 560);
      ctx.fillText('Your actual immigration options depend', CANVAS_WIDTH / 2, 605);
      ctx.fillText('on your individual profile.', CANVAS_WIDTH / 2, 650);

      // Divider 2
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 720);
      ctx.lineTo(CANVAS_WIDTH - 140, 720);
      ctx.stroke();

      // 🇨🇦 FREE PROFILE ASSESSMENT (Section 11 Box)
      const ctaBoxY = 760;
      const ctaBoxH = 540;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(100, ctaBoxY, CANVAS_WIDTH - 200, ctaBoxH);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 5;
      ctx.strokeRect(100, ctaBoxY, CANVAS_WIDTH - 200, ctaBoxH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 40px sans-serif';
      ctx.fillText('🇨🇦 FREE PROFILE ASSESSMENT', CANVAS_WIDTH / 2, ctaBoxY + 80);

      // Required wording (Section 0.1 & 11)
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('Find out your real chance of moving', CANVAS_WIDTH / 2, ctaBoxY + 155);
      ctx.fillText('to Canada in 4 minutes.', CANVAS_WIDTH / 2, ctaBoxY + 205);

      // CTA Button
      const btnY = ctaBoxY + 270;
      const btnGradient = ctx.createLinearGradient(160, btnY, CANVAS_WIDTH - 160, btnY);
      btnGradient.addColorStop(0, '#10b981');
      btnGradient.addColorStop(1, '#14b8a6');
      ctx.fillStyle = btnGradient;
      ctx.fillRect(160, btnY, CANVAS_WIDTH - 320, 110);

      ctx.fillStyle = '#020617';
      ctx.font = 'black 36px sans-serif';
      ctx.fillText('CANADA INTEL HUB →', CANVAS_WIDTH / 2, btnY + 70);

      // Readable plain text URL beneath label (Section 11)
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(CANVAS_CONVERSION_DOMAIN, CANVAS_WIDTH / 2, ctaBoxY + 460);

      // Divider 3
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 1360);
      ctx.lineTo(CANVAS_WIDTH - 140, 1360);
      ctx.stroke();

      // 🔔 NEXT QUIZ ROUND IN 9s (Section 11 & 14)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(180, 1420, CANVAS_WIDTH - 360, 80);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(180, 1420, CANVAS_WIDTH - 360, 80);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 30px monospace';
      const loopSec = Math.max(1, Math.ceil(10 - (timeSec % 10)));
      ctx.fillText(`🔔 NEXT QUIZ ROUND IN ${loopSec}s`, CANVAS_WIDTH / 2, 1472);

      // Subtle Bottom Watermark
      ctx.fillStyle = '#64748b';
      ctx.font = '24px monospace';
      ctx.fillText(CANVAS_BOTTOM_WATERMARK, CANVAS_WIDTH / 2, 1680);
      return;
    }

    // =========================================================================
    // QUESTION & ANSWER REVEAL SCREEN (Questions 1–3)
    // =========================================================================
    const tLock = qThinkTime;
    const tAnim = tLock + qPauseTime;
    const tRevealed = tAnim + qAnimTime;

    const isTimesUp = localTime >= tLock && localTime < tAnim;
    const isSelectionAnim = localTime >= tAnim && localTime < tRevealed;
    const isRevealed = localTime >= tRevealed;
    const isSelectionHighlight = isSelectionAnim || isRevealed;

    // Guaranteed safe question object
    const safeActiveQ = activeQ || currentQ || fallbackQ;

    // 1. TOP HEADER (Section 2 & 3: BACS Immigration Quiz & IRCC-Sourced Knowledge)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(80, 120, CANVAS_WIDTH - 160, 130);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 120, CANVAS_WIDTH - 160, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    const qNum = safeActiveQ?.number ?? (safeIndex + 1);
    const headerTitle = `QUESTION ${qNum} OF ${Math.min(3, questionsList.length)} • ${(safeActiveQ?.category || 'EXPRESS ENTRY').toUpperCase()}`;
    ctx.fillText(headerTitle, CANVAS_WIDTH / 2, 172);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(CANVAS_BRANDING_HEADER, CANVAS_WIDTH / 2, 218);

    // 2. QUESTION BOX (Section 3: Dominant Element)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(80, 280, CANVAS_WIDTH - 160, 320);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 280, CANVAS_WIDTH - 160, 320);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'left';
    wrapText(ctx, safeActiveQ?.text || safeActiveQ?.question || '', 120, 360, CANVAS_WIDTH - 240, 48);

    // 3. RESPONSIVE ANSWER CARDS (Section 6: Responsive Layout)
    const options: QuestionOption[] = ['A', 'B', 'C', 'D'];
    const is2x2 = safeActiveQ?.options ? isShortAnswerSet(safeActiveQ.options) : true;

    if (is2x2) {
      // 2x2 Grid Layout
      const cardW = 430;
      const cardH = 140;
      const col1X = 100;
      const col2X = 550;
      const row1Y = 640;
      const row2Y = 810;

      const positions = [
        { x: col1X, y: row1Y, opt: 'A' as QuestionOption },
        { x: col2X, y: row1Y, opt: 'B' as QuestionOption },
        { x: col1X, y: row2Y, opt: 'C' as QuestionOption },
        { x: col2X, y: row2Y, opt: 'D' as QuestionOption },
      ];

      positions.forEach(({ x, y, opt }) => {
        const isCorrect = opt === safeActiveQ?.correctAnswer;

        if (isSelectionHighlight) {
          if (isCorrect) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.fillRect(x, y, cardW, cardH);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 5;
            ctx.strokeRect(x, y, cardW, cardH);

            // Green check badge
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x + 16, y + 16, 60, 60);
            ctx.fillStyle = '#020617';
            ctx.font = 'black 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✓', x + 46, y + 60);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'left';
            wrapText(ctx, safeActiveQ?.options?.[opt] || '', x + 90, y + 55, cardW - 105, 34);
          } else {
            // Dimmed
            ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
            ctx.fillRect(x, y, cardW, cardH);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cardW, cardH);

            ctx.fillStyle = '#334155';
            ctx.fillRect(x + 16, y + 16, 60, 60);
            ctx.fillStyle = '#64748b';
            ctx.font = 'black 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(opt, x + 46, y + 58);

            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 26px sans-serif';
            ctx.textAlign = 'left';
            wrapText(ctx, safeActiveQ?.options?.[opt] || '', x + 90, y + 55, cardW - 105, 34);
          }
        } else {
          // Normal thinking state
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x, y, cardW, cardH);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cardW, cardH);

          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x + 16, y + 16, 60, 60);
          ctx.fillStyle = '#020617';
          ctx.font = 'black 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opt, x + 46, y + 58);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'left';
          wrapText(ctx, safeActiveQ?.options?.[opt] || '', x + 90, y + 55, cardW - 105, 34);
        }
      });
    } else {
      // Four Stacked Vertical Cards
      const startY = 630;
      const optionHeight = 110;
      const gap = 16;

      options.forEach((opt, idx) => {
        const optY = startY + idx * (optionHeight + gap);
        const isCorrect = opt === safeActiveQ?.correctAnswer;

        if (isSelectionHighlight) {
          if (isCorrect) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.fillRect(80, optY, CANVAS_WIDTH - 160, optionHeight);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 5;
            ctx.strokeRect(80, optY, CANVAS_WIDTH - 160, optionHeight);

            ctx.fillStyle = '#10b981';
            ctx.fillRect(100, optY + 15, 80, 80);
            ctx.fillStyle = '#020617';
            ctx.font = 'black 44px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✓', 140, optY + 70);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'left';
            wrapText(ctx, safeActiveQ?.options?.[opt] || '', 205, optY + 60, CANVAS_WIDTH - 300, 36);
          } else {
            // Dimmed to ~40% opacity
            ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
            ctx.fillRect(80, optY, CANVAS_WIDTH - 160, optionHeight);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.strokeRect(80, optY, CANVAS_WIDTH - 160, optionHeight);

            ctx.fillStyle = '#334155';
            ctx.fillRect(100, optY + 15, 80, 80);
            ctx.fillStyle = '#64748b';
            ctx.font = 'black 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(opt, 140, optY + 68);

            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'left';
            wrapText(ctx, safeActiveQ?.options?.[opt] || '', 205, optY + 60, CANVAS_WIDTH - 300, 36);
          }
        } else {
          // Normal state
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(80, optY, CANVAS_WIDTH - 160, optionHeight);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.strokeRect(80, optY, CANVAS_WIDTH - 160, optionHeight);

          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(100, optY + 15, 80, 80);
          ctx.fillStyle = '#020617';
          ctx.font = 'black 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opt, 140, optY + 68);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 30px sans-serif';
          ctx.textAlign = 'left';
          wrapText(ctx, safeActiveQ?.options?.[opt] || '', 205, optY + 60, CANVAS_WIDTH - 300, 36);
        }
      });
    }

    // 4. COUNTDOWN / COMMENT PROMPT BAR (Section 5, 7, 9)
    const promptY = is2x2 ? 990 : 1160;

    if (isRevealed) {
      // Review countdown: ⚡ ANSWER REVEALED • REVIEW TIME: 12s (Section 9)
      const reviewLeft = Math.max(0, Math.ceil(singleQuestionDuration - localTime));
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(80, promptY, CANVAS_WIDTH - 160, 70);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(80, promptY, CANVAS_WIDTH - 160, 70);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ANSWER REVEALED • REVIEW TIME: ${reviewLeft}s`, CANVAS_WIDTH / 2, promptY + 46);

      // Official Reasoning Box (Section 8)
      const reasonY = promptY + 90;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(80, reasonY, CANVAS_WIDTH - 160, 320);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(80, reasonY, CANVAS_WIDTH - 160, 320);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('💡 OFFICIAL REASONING & IRCC REFERENCE:', 110, reasonY + 45);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '28px sans-serif';
      const insightText = safeActiveQ?.insight || safeActiveQ?.explanation || '';
      const endY = wrapText(ctx, insightText, 110, reasonY + 95, CANVAS_WIDTH - 220, 38);

      // Official Source: [IRCC source title]
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px monospace';
      const sourceTitle = safeActiveQ?.sourceTitle || safeActiveQ?.reference || 'IRCC Official Guidelines';
      ctx.fillText(`Official Source: ${sourceTitle}`, 110, Math.max(endY + 50, reasonY + 280));

    } else if (isTimesUp) {
      // 0.5s pause: 💬 TIME'S UP (Section 7)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fillRect(80, promptY, CANVAS_WIDTH - 160, 70);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(80, promptY, CANVAS_WIDTH - 160, 70);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("💬 TIME'S UP", CANVAS_WIDTH / 2, promptY + 46);

    } else if (isSelectionAnim) {
      // ~1.5s reveal animation highlight
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(80, promptY, CANVAS_WIDTH - 160, 70);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(80, promptY, CANVAS_WIDTH - 160, 70);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✓ ANSWER REVEAL', CANVAS_WIDTH / 2, promptY + 46);

    } else {
      // Thinking countdown: 💬 COMMENT A, B, C OR D — 25s (Section 5)
      const thinkLeft = Math.max(0, Math.ceil(qThinkTime - localTime));
      const progress = Math.max(0, (qThinkTime - localTime) / qThinkTime);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(80, promptY, CANVAS_WIDTH - 160, 16);
      ctx.fillStyle = thinkLeft <= 4 ? '#ef4444' : '#f59e0b';
      ctx.fillRect(80, promptY, (CANVAS_WIDTH - 160) * progress, 16);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(80, promptY + 25, CANVAS_WIDTH - 160, 65);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(80, promptY + 25, CANVAS_WIDTH - 160, 65);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`💬 COMMENT A, B, C OR D — ${thinkLeft}s`, CANVAS_WIDTH / 2, promptY + 68);
    }

    // 5. SUBTLE BOTTOM WATERMARK (Section 2 & 10: No CTA on Questions or Reveals)
    ctx.fillStyle = '#475569';
    ctx.font = '22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(CANVAS_BOTTOM_WATERMARK, CANVAS_WIDTH / 2, 1720);
  };

  // Preview loop on Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsedSec = ((now - startTime) / 1000) % DURATION_SEC;
      renderFrame(ctx, elapsedSec);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selectedQuestionIndex, reelType, timingSpeed, config, DURATION_SEC]);

  // Video Export Engine: 'webcodecs' (fastest offline) or 'mediarecorder' (universal browser fallback)
  const [exportEngine, setExportEngine] = useState<'webcodecs' | 'mediarecorder'>('webcodecs');

  // Cancel / Abort Controller ref for recording operations
  const abortControllerRef = useRef<boolean>(false);

  // Clean up any ongoing background recording on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current = true;
    };
  }, []);

  // Helper to distinguish intentional user cancellations from engine failures
  const isAbortError = (err: any): boolean => {
    if (abortControllerRef.current === true) return true;
    if (!err) return false;
    if (err.name === 'ExportAbortedError') return true;
    const msg = typeof err === 'string' ? err : err?.message;
    return typeof msg === 'string' && (
      msg.toLowerCase().includes('aborted') ||
      msg.toLowerCase().includes('cancelled') ||
      msg.toLowerCase().includes('canceled')
    );
  };

  // Fallback MediaRecorder Export Pipeline
  const exportViaMediaRecorder = async (): Promise<void> => {
    if (!canvasRef.current) throw new Error('Canvas ref unavailable');
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    console.log('Starting video export via MediaRecorder fallback', {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      fps: FPS,
      duration: DURATION_SEC,
    });

    // Detect supported MIME type
    const mimeCandidates = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    let selectedMime = 'video/webm';
    for (const mime of mimeCandidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    const canvasStream = canvas.captureStream(FPS);
    let recordingStream = canvasStream;
    let audioContextToClose: AudioContext | null = null;

    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextToClose = audioCtx;
          const audioDest = audioCtx.createMediaStreamDestination();
          const renderedAudioBuffer = await sounds.renderFullQuizAudio(
            DURATION_SEC,
            singleQuestionDuration,
            qThinkTime,
            audioCtx.sampleRate || 48000
          );
          const bufferSource = audioCtx.createBufferSource();
          bufferSource.buffer = renderedAudioBuffer;
          bufferSource.connect(audioDest);
          bufferSource.start();

          recordingStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioDest.stream.getAudioTracks(),
          ]);
        }
      } catch (audioErr) {
        console.warn('Could not attach audio track to MediaRecorder fallback:', audioErr);
      }
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(recordingStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 8_000_000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    console.log('Encoder initialized (MediaRecorder)', { selectedMime });

    return new Promise<void>((resolve, reject) => {
      abortControllerRef.current = false;
      const totalFrames = Math.round(FPS * DURATION_SEC);
      let currentFrame = 0;

      mediaRecorder.onstop = () => {
        if (audioContextToClose) {
          try {
            audioContextToClose.close();
          } catch (e) {}
        }
        if (abortControllerRef.current) {
          const abortErr = new Error('Export aborted by user');
          abortErr.name = 'ExportAbortedError';
          reject(abortErr);
          return;
        }

        try {
          console.log('Finalizing MP4 / WebM recording');
          const blob = new Blob(recordedChunks, { type: selectedMime });
          const url = URL.createObjectURL(blob);
          console.log('Export complete', { sizeBytes: blob.size, url, mime: selectedMime });
          setDownloadUrl(url);
          setIsRecording(false);
          sounds.playCorrect();
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      mediaRecorder.onerror = (evt: any) => {
        if (abortControllerRef.current) {
          const abortErr = new Error('Export aborted by user');
          abortErr.name = 'ExportAbortedError';
          reject(abortErr);
          return;
        }
        console.error('MediaRecorder error event:', evt);
        reject(new Error(evt?.error?.message || 'MediaRecorder failed'));
      };

      mediaRecorder.start(1000); // chunk every 1s

      const frameInterval = 1000 / FPS;
      let lastTime = performance.now();

      const processFrame = () => {
        if (abortControllerRef.current) {
          try {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          } catch {}
          const abortErr = new Error('Export aborted by user');
          abortErr.name = 'ExportAbortedError';
          reject(abortErr);
          return;
        }

        if (currentFrame >= totalFrames) {
          setRecordingProgress(100);
          mediaRecorder.stop();
          return;
        }

        const now = performance.now();
        if (now - lastTime >= frameInterval * 0.9) {
          lastTime = now;
          const timeSec = currentFrame / FPS;
          renderFrame(ctx, timeSec);

          if (currentFrame === 0) {
            console.log('Frame 1 drawn');
            console.log('Frame 1 encoded');
          }

          currentFrame++;
          const progress = Math.round((currentFrame / totalFrames) * 100);
          setRecordingProgress(progress);
          if (currentFrame % 30 === 0) {
            console.log(`Progress: ${progress}% (Frame ${currentFrame}/${totalFrames})`);
          }
        }

        requestAnimationFrame(processFrame);
      };

      requestAnimationFrame(processFrame);
    });
  };

  // Primary WebCodecs Export Pipeline with Backpressure & Diagnostics
  const exportViaWebCodecs = async (): Promise<void> => {
    if (!canvasRef.current) throw new Error('Canvas ref unavailable');
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    console.log('Starting video export', {
      engine: 'webcodecs',
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      fps: FPS,
      duration: DURATION_SEC,
    });

    // 1. Determine optimal AVC codec supporting 1080x1920 (Level 5.1 or 4.2)
    const candidateVideoCodecs = [
      'avc1.42E033', // Constrained Baseline Profile Level 5.1
      'avc1.4D0033', // Main Profile Level 5.1
      'avc1.640033', // High Profile Level 5.1
      'avc1.420033', // Baseline Profile Level 5.1
      'avc1.42E02A', // Constrained Baseline Profile Level 4.2
      'avc1.4D002A', // Main Profile Level 4.2
      'avc1.64002A', // High Profile Level 4.2
    ];

    let chosenVideoCodec = 'avc1.42E033';
    if (typeof VideoEncoder.isConfigSupported === 'function') {
      for (const cand of candidateVideoCodecs) {
        try {
          const res = await VideoEncoder.isConfigSupported({
            codec: cand,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            bitrate: 8_000_000,
            framerate: FPS,
          });
          if (res && res.supported) {
            chosenVideoCodec = cand;
            console.log('Found supported VideoEncoder codec:', cand);
            break;
          }
        } catch (checkErr) {
          console.warn(`Codec check failed for ${cand}:`, checkErr);
        }
      }
    }

    // 2. Check AudioEncoder capability
    let includeAudio = typeof AudioEncoder !== 'undefined';
    if (includeAudio && typeof AudioEncoder.isConfigSupported === 'function') {
      try {
        const audioSupport = await AudioEncoder.isConfigSupported({
          codec: 'mp4a.40.2',
          numberOfChannels: 2,
          sampleRate: 48000,
          bitrate: 192_000,
        });
        if (audioSupport && audioSupport.supported === false) {
          includeAudio = false;
          console.warn('AudioEncoder not supported for mp4a.40.2, falling back to video-only MP4');
        }
      } catch {
        includeAudio = false;
      }
    }

    // 3. Configure Muxer with relaxed timestamp offsets
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: 'avc',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
      ...(includeAudio
        ? {
            audio: {
              codec: 'aac' as const,
              numberOfChannels: 2,
              sampleRate: 48000,
            },
          }
        : {}),
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });

    // 4. Track encoder errors
    let encoderError: Error | null = null;

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => {
        try {
          muxer.addVideoChunk(chunk, meta);
        } catch (muxErr: any) {
          console.error('Muxer addVideoChunk error:', muxErr);
          encoderError = muxErr;
        }
      },
      error: (e: any) => {
        console.error('VideoEncoder error callback triggered:', e);
        encoderError = new Error(e?.message || 'VideoEncoder internal failure');
      },
    });

    videoEncoder.configure({
      codec: chosenVideoCodec,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      bitrate: 8_000_000,
      framerate: FPS,
    });

    console.log('Encoder initialized', { codec: chosenVideoCodec, width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

    // 5. Initialize and encode Audio if enabled
    if (includeAudio) {
      try {
        const audioEncoder = new AudioEncoder({
          output: (chunk, meta) => {
            try {
              muxer.addAudioChunk(chunk, meta);
            } catch (aMuxErr) {
              console.warn('Muxer addAudioChunk skipped:', aMuxErr);
            }
          },
          error: (e) => console.warn('AudioEncoder warning:', e),
        });

        audioEncoder.configure({
          codec: 'mp4a.40.2',
          numberOfChannels: 2,
          sampleRate: 48000,
          bitrate: 192_000,
        });

        const sampleRate = 48000;
        const totalAudioSamples = Math.round(sampleRate * DURATION_SEC);

        // Render full mixed audio track: Ambient Background Bed (with ducking) + 3-Stage Countdown Ticks + 0s Time Expired Tone
        const renderedAudioBuffer = await sounds.renderFullQuizAudio(
          DURATION_SEC,
          singleQuestionDuration,
          qThinkTime,
          sampleRate
        );
        const ch0 = renderedAudioBuffer.getChannelData(0);
        const ch1 = renderedAudioBuffer.numberOfChannels > 1 ? renderedAudioBuffer.getChannelData(1) : ch0;

        const CHUNK_FRAMES = 4096;
        for (let offset = 0; offset < totalAudioSamples; offset += CHUNK_FRAMES) {
          const framesInChunk = Math.min(CHUNK_FRAMES, totalAudioSamples - offset);
          const planarBuffer = new Float32Array(framesInChunk * 2);
          planarBuffer.set(ch0.subarray(offset, offset + framesInChunk), 0);
          planarBuffer.set(ch1.subarray(offset, offset + framesInChunk), framesInChunk);

          const audioData = new AudioData({
            format: 'f32-planar',
            sampleRate,
            numberOfFrames: framesInChunk,
            numberOfChannels: 2,
            timestamp: Math.round((offset / sampleRate) * 1_000_000),
            data: planarBuffer,
          });
          audioEncoder.encode(audioData);
          audioData.close();
        }

        await audioEncoder.flush();
        console.log('Audio track successfully encoded and flushed');
      } catch (audioErr) {
        console.warn('Audio rendering skipped due to environment limitations:', audioErr);
      }
    }

    const totalFrames = Math.round(FPS * DURATION_SEC);

    try {
      // 6. Encode video frames with backpressure management (prevent queue buffer overflow)
      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        if (abortControllerRef.current) {
          const abortErr = new Error('Export aborted by user');
          abortErr.name = 'ExportAbortedError';
          throw abortErr;
        }

        if (encoderError) {
          throw new Error(`VideoEncoder encountered an error: ${(encoderError as any).message || encoderError}`);
        }

        if (videoEncoder.state !== 'configured') {
          throw new Error(`VideoEncoder state became invalid: ${videoEncoder.state}`);
        }

        // Backpressure: Wait if encoderQueueSize exceeds 4 frames
        while (videoEncoder.encodeQueueSize > 4) {
          if (abortControllerRef.current) break;
          await new Promise<void>((resolve) => {
            const onDequeue = () => {
              videoEncoder.removeEventListener('dequeue', onDequeue);
              resolve();
            };
            videoEncoder.addEventListener('dequeue', onDequeue);
            setTimeout(onDequeue, 15);
          });
        }

        if (abortControllerRef.current) {
          const abortErr = new Error('Export aborted by user');
          abortErr.name = 'ExportAbortedError';
          throw abortErr;
        }

        const timeSec = frameIdx / FPS;
        const timestampMicroSec = Math.round(timeSec * 1_000_000);

        try {
          renderFrame(ctx, timeSec);
        } catch (drawErr: any) {
          console.error(`Canvas drawing error at frame ${frameIdx} (time ${timeSec}s):`, drawErr);
          throw new Error(`Canvas rendering failed at frame ${frameIdx}: ${drawErr.message}`);
        }

        if (frameIdx === 0) {
          console.log('Frame 1 drawn');
        }

        const videoFrame = new VideoFrame(canvas, {
          timestamp: timestampMicroSec,
        });

        try {
          const keyFrame = frameIdx % (FPS * 2) === 0;
          videoEncoder.encode(videoFrame, { keyFrame });
          if (frameIdx === 0) {
            console.log('Frame 1 encoded');
          }
        } finally {
          videoFrame.close();
        }

        const progress = Math.round(((frameIdx + 1) / totalFrames) * 100);
        setRecordingProgress(progress);

        if (frameIdx % 30 === 0 || frameIdx === totalFrames - 1) {
          console.log(`Progress: ${progress}% (Frame ${frameIdx + 1}/${totalFrames})`);
        }

        // Allow UI thread to breathe and handle events
        if (frameIdx % 5 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      console.log('Flushing video encoder...');
      await videoEncoder.flush();
      console.log('Finalizing MP4');
      muxer.finalize();

      const { buffer } = target;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      console.log('Export complete', { sizeBytes: buffer.byteLength, url });
      setDownloadUrl(url);
      setIsRecording(false);
      sounds.playCorrect();
    } finally {
      if (videoEncoder.state !== 'closed') {
        try {
          videoEncoder.close();
        } catch {}
      }
    }
  };

  // Master Video Export Handler with Comprehensive Error Boundary & Automatic Fallback
  const handleStartRecording = async () => {
    if (!canvasRef.current) return;
    setIsRecording(true);
    setRecordingProgress(0);
    setDownloadUrl(null);
    setErrorMsg(null);
    abortControllerRef.current = false;

    // Check if user requested MediaRecorder directly or WebCodecs is unavailable
    if (exportEngine === 'mediarecorder' || typeof VideoEncoder === 'undefined') {
      try {
        await exportViaMediaRecorder();
      } catch (err: any) {
        if (isAbortError(err)) {
          console.info('MediaRecorder export cancelled by user.');
          setIsRecording(false);
          setRecordingProgress(0);
          setErrorMsg(null);
          return;
        }
        console.error('MediaRecorder export failed:', err);
        setErrorMsg(`MediaRecorder export failure: ${err?.message || err}`);
        setIsRecording(false);
      }
      return;
    }

    // Try WebCodecs first; automatically degrade to MediaRecorder on failure
    try {
      await exportViaWebCodecs();
    } catch (webCodecsErr: any) {
      if (isAbortError(webCodecsErr)) {
        console.info('WebCodecs export cancelled by user.');
        setIsRecording(false);
        setRecordingProgress(0);
        setErrorMsg(null);
        return;
      }

      console.warn(`WebCodecs export failed (${webCodecsErr?.message || webCodecsErr}). Degrading to MediaRecorder fallback engine...`);
      setErrorMsg(`WebCodecs interrupted: switching to universal MediaRecorder fallback...`);
      setExportEngine('mediarecorder');

      try {
        await exportViaMediaRecorder();
      } catch (fallbackErr: any) {
        if (isAbortError(fallbackErr)) {
          console.info('MediaRecorder fallback cancelled by user.');
          setIsRecording(false);
          setRecordingProgress(0);
          setErrorMsg(null);
          return;
        }
        console.error('Both WebCodecs and MediaRecorder fallback failed:', fallbackErr);
        setErrorMsg(`Export failed on both engines: ${fallbackErr?.message || fallbackErr}`);
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl bg-[#0f172a] border-2 border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-black text-lg">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                BACS 1080p Video Studio <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">v2.0</span>
              </h1>
              <p className="text-xs text-emerald-400 font-semibold">
                IRCC-Sourced 1080x1920 MP4 Video Generator for TikTok, Shorts & Reels
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              abortControllerRef.current = true;
              setIsRecording(false);
              setRecordingProgress(0);
              setErrorMsg(null);
              onBack();
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back to Quiz</span>
          </button>
        </div>

        {/* Video Canvas & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          <div className="flex flex-col items-center space-y-2">
            <div className="relative border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black aspect-[9/16] w-full max-w-[280px]">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-full object-contain"
              />

              {isRecording && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest font-mono">
                    RENDERING 1080p MP4 ({recordingProgress}%)
                  </span>
                  <div className="w-full max-w-[180px] bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-150"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Encoding H.264 Video + AAC Audio @ 30 FPS</p>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              1080x1920 Canvas • Safe Zones Active ({DURATION_SEC}s)
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Reel Type Selector: Question Reel vs Final CTA Reel vs Full Quiz */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-white block">Video Export Format:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReelType('question')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    reelType === 'question'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Question Reel
                </button>
                <button
                  type="button"
                  onClick={() => setReelType('final_cta')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    reelType === 'final_cta'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Final CTA Reel
                </button>
                <button
                  type="button"
                  onClick={() => setReelType('full_quiz')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    reelType === 'full_quiz'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Full 3Q Quiz
                </button>
              </div>
            </div>

            {reelType === 'question' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Select Question for Video Reel:</span>
                  <span className="text-emerald-400 font-mono">Q{safeIndex + 1} of {questionsList.length}</span>
                </label>
                <select
                  value={safeIndex}
                  onChange={(e) => setSelectedQuestionIndex(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs font-medium rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                >
                  {questionsList.map((q, idx) => (
                    <option key={q?.id || idx} value={idx}>
                      Q{q?.number || idx + 1}: {q?.category || 'General'} — {(q?.text || q?.question || '').slice(0, 42)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Timing Speed Selector */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-white block">Pacing & Duration:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimingSpeed('fast')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    timingSpeed === 'fast'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fast Social Reel (15s/Q)
                </button>
                <button
                  type="button"
                  onClick={() => setTimingSpeed('broadcast')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    timingSpeed === 'broadcast'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Broadcast Timing (39s/Q)
                </button>
              </div>
            </div>

            {/* Encoding Pipeline Engine Selector */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Encoding Engine:</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {exportEngine === 'webcodecs' ? 'WebCodecs (High Speed)' : 'MediaRecorder (Universal)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setExportEngine('webcodecs')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    exportEngine === 'webcodecs'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  WebCodecs (MP4)
                </button>
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setExportEngine('mediarecorder')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    exportEngine === 'mediarecorder'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  MediaRecorder (Fallback)
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {!downloadUrl ? (
                <div className="space-y-2">
                  <button
                    onClick={handleStartRecording}
                    disabled={isRecording}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg text-sm"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>
                      {isRecording
                        ? `Encoding Video (${exportEngine === 'webcodecs' ? 'WebCodecs' : 'MediaRecorder'})... ${recordingProgress}%`
                        : reelType === 'question'
                        ? 'Generate 1080p Question Video'
                        : reelType === 'final_cta'
                        ? 'Generate 1080p Final Assessment CTA Video'
                        : 'Generate Full 3-Question 1080p Video'}
                    </span>
                  </button>

                  {isRecording && (
                    <button
                      type="button"
                      onClick={() => {
                        abortControllerRef.current = true;
                        setIsRecording(false);
                        setRecordingProgress(0);
                        setErrorMsg(null);
                      }}
                      className="w-full text-xs text-rose-400 hover:text-rose-300 py-1.5 font-bold transition-colors"
                    >
                      Cancel Export
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <a
                    href={downloadUrl}
                    download={
                      reelType === 'question'
                        ? `bacs-canada-q${currentQ?.number || safeIndex + 1}.mp4`
                        : reelType === 'final_cta'
                        ? 'bacs-canada-final-assessment.mp4'
                        : 'bacs-canada-full-quiz.mp4'
                    }
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg text-sm"
                  >
                    <Download className="w-4 h-4 fill-slate-950" />
                    <span>Download Genuine 1080p MP4 File</span>
                  </a>
                  <button
                    onClick={() => setDownloadUrl(null)}
                    className="w-full text-xs text-slate-400 hover:text-white py-1 transition-colors"
                  >
                    Generate another video
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> High-Performance WebCodecs MP4 Export
              </span>
              <p className="leading-tight">
                Produces genuine 1080x1920 MP4 files with H.264 video and AAC audio. Meets strict IRCC-sourced guidelines and single assessment CTA compliance.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
