import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Video, Download, Play, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Youtube, Layers, Shuffle, CheckSquare, Square, Clock } from 'lucide-react';
import { DEFAULT_CHALLENGE } from '../data/defaultChallenge';
import { sounds } from '../utils/soundEffects';
import { Question } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface VideoRecorderStudioProps {
  onBack: () => void;
}

type PlatformTarget = 'youtube_shorts' | 'tiktok';

// Helper function to draw text bounded strictly inside a container box with dynamic font scaling & word wrapping
function drawWrappedTextInBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
  initialFontSize: number,
  fontFamily: string,
  fontWeight: string,
  textColor: string,
  padding: number = 24,
  align: 'left' | 'center' = 'left'
) {
  const contentWidth = boxWidth - padding * 2;
  const contentHeight = boxHeight - padding * 2;
  let fontSize = initialFontSize;
  let lines: string[] = [];
  let lineHeight = fontSize * 1.35;

  // Dynamically shrink font size if text exceeds container height/width
  while (fontSize >= 16) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    lines = [];
    const words = text.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > contentWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    lineHeight = fontSize * 1.35;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= contentHeight) {
      break; // Text fits inside container box!
    }
    fontSize -= 2; // shrink font size to fit inside box
  }

  // Render text lines inside bounding box
  ctx.fillStyle = textColor;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  // Vertically center lines inside container box padding
  const startY = boxY + padding + (contentHeight - lines.length * lineHeight) / 2;

  lines.forEach((line, idx) => {
    let xPos = boxX + padding;
    if (align === 'center') {
      const metrics = ctx.measureText(line);
      xPos = boxX + (boxWidth - metrics.width) / 2;
    }
    ctx.fillText(line, xPos, startY + idx * lineHeight);
  });
}

export const VideoRecorderStudio: React.FC<VideoRecorderStudioProps> = ({ onBack }) => {
  const [platform, setPlatform] = useState<PlatformTarget>('youtube_shorts');
  const [questionBank, setQuestionBank] = useState<Question[]>(DEFAULT_CHALLENGE.questions);
  const [selectedIds, setSelectedIds] = useState<string[]>([DEFAULT_CHALLENGE.questions[0].id, DEFAULT_CHALLENGE.questions[1].id]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [status, setStatus] = useState<'idle' | 'recording' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloadedFilename, setDownloadedFilename] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Categories list
  const categoriesList = ['ALL', ...Array.from(new Set(questionBank.map(q => q.category)))];

  // Filter questions by active category tab
  const displayedBank = activeCategoryFilter === 'ALL'
    ? questionBank
    : questionBank.filter(q => q.category === activeCategoryFilter);

  // Quick focus handler
  const selectFirstNInCategory = (cat: string, count: number) => {
    const matching = questionBank.filter(q => cat === 'ALL' || q.category === cat);
    const selected = matching.slice(0, count).map(q => q.id);
    if (selected.length > 0) {
      setSelectedIds(selected);
    }
  };

  // Selected question objects
  const activeQuestions = questionBank.filter(q => selectedIds.includes(q.id));
  const questionDurationSec = 40; // 25s reading/thinking + 15s answer reveal & CTA review
  const endingSceneDurationSec = 15; // 15s soft sell ending scene for Premium upgrade
  const questionsDurationSec = activeQuestions.length * questionDurationSec;
  const totalDurationSec = questionsDurationSec + endingSceneDurationSec;

  const logoImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/logo.svg';
    img.onload = () => {
      logoImageRef.current = img;
    };
  }, []);

  const toggleQuestionSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // keep at least 1 question
      setSelectedIds(prev => prev.filter(qId => qId !== id));
    } else {
      // Check max duration limit (120 seconds / 2 minutes max)
      const nextCount = selectedIds.length + 1;
      if (nextCount * questionDurationSec > 120) {
        setErrorMessage('Maximum video length is 2 minutes (120s) for YouTube Shorts & TikTok!');
        setTimeout(() => setErrorMessage(null), 3500);
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const shuffleQuestionBank = () => {
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    setQuestionBank(shuffled);
    // Auto-select first 2 shuffled questions
    setSelectedIds([shuffled[0].id, shuffled[1].id]);
  };

  const startRecording = async () => {
    if (activeQuestions.length === 0) {
      setStatus('error');
      setErrorMessage('Please select at least 1 question for video generation.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setStatus('error');
      setErrorMessage('Canvas element not found.');
      return;
    }

    // Set internal resolution for crisp 1080x1920 vertical video
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setStatus('error');
      setErrorMessage('Could not get 2D context from canvas.');
      return;
    }

    setStatus('recording');
    setProgress(0);
    chunksRef.current = [];

    try {
      // 1. Audio Setup using Web Audio API to record crisp sound ticks & reveal audio
      const audioCtx = sounds.getAudioContext() || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const audioDest = audioCtx.createMediaStreamDestination();

      // Silent audio keep-alive so audio stream tracks are continuous and active for MediaRecorder
      const silentOsc = audioCtx.createOscillator();
      const silentGain = audioCtx.createGain();
      silentGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      silentOsc.connect(silentGain);
      silentGain.connect(audioDest);
      silentOsc.start();

      sounds.setCustomDestination(audioDest);

      // 2. Capture canvas stream at 60 FPS for ultra-smooth 1080p motion
      const canvasStream = canvas.captureStream(60);

      // 3. Combine Video Tracks + Audio Tracks into unified MediaStream
      const audioTracks = audioDest.stream.getAudioTracks();
      const videoTracks = canvasStream.getVideoTracks();

      const combinedTracks = [...videoTracks, ...audioTracks];
      const combinedStream = new MediaStream(combinedTracks);

      // 4. Prioritize native MP4 (H.264 / AVC) encoders for YouTube Shorts, TikTok & Reels
      const mimeTypes = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=avc1',
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];

      const mimeType = mimeTypes.find(type => {
        try {
          return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      });

      // 12 Mbps video bitrate for crystal-clear 1080x1920 vertical video + 192 kbps audio
      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: 12000000,
        audioBitsPerSecond: 192000
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const recorder = new MediaRecorder(combinedStream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      const filename = `BACS_${platform === 'youtube_shorts' ? 'Shorts' : 'TikTok'}_${activeQuestions.length}Q_1080p_${Date.now()}.mp4`;
      setDownloadedFilename(filename);

      recorder.onstop = () => {
        sounds.setCustomDestination(null);
        try {
          silentOsc.stop();
          silentOsc.disconnect();
        } catch (e) {}

        const finalMime = mimeType && mimeType.includes('mp4') ? mimeType : (recorder.mimeType || 'video/mp4');
        const blob = new Blob(chunksRef.current, { type: finalMime.includes('mp4') ? 'video/mp4' : finalMime });
        
        if (blob.size < 500) {
          setStatus('error');
          setErrorMessage('Captured video blob is too small. Please try recording again.');
          return;
        }

        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setStatus('success');

        // Auto trigger download anchor
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 200);
      };

      recorder.start(500); // collect chunks every 500ms for safety

      // 5. Start Video Animation & Sound Audio Loop
      let startTime = performance.now();
      const totalDurationMs = totalDurationSec * 1000;
      let lastTickSec = -1;
      let lastPlayedQuestionIdx = -1;
      let hasPlayedAnswerReveal = false;
      let hasPlayedEndingSound = false;

      const renderFrame = (now: number) => {
        const elapsed = now - startTime;
        const currentProgress = Math.min(100, (elapsed / totalDurationMs) * 100);
        setProgress(Math.round(currentProgress));

        const elapsedSecTotal = Math.floor(elapsed / 1000);
        const isEndingScene = elapsed >= questionsDurationSec * 1000;

        if (isEndingScene) {
          if (!hasPlayedEndingSound) {
            sounds.playMilestone();
            hasPlayedEndingSound = true;
          }

          // --- FINAL PREMIUM SOFT SELL ENDING SCENE ---
          const endGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
          endGrad.addColorStop(0, '#0a172c');
          endGrad.addColorStop(0.5, '#070f1e');
          endGrad.addColorStop(1, '#020612');
          ctx.fillStyle = endGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Prominent Header Watermark Logo
          if (logoImageRef.current) {
            ctx.drawImage(logoImageRef.current, 390, 60, 300, 150);
          }

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🇨🇦 UPGRADE TO BACS PREMIUM', 540, 250);

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('🛡️ IMMIGRATION NAVIGATION INSURANCE', 540, 290);

          ctx.textAlign = 'left';

          // Main Premium Reasons Box (Box: 60, 320, 960, 1210)
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(60, 320, 960, 1210);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.strokeRect(60, 320, 960, 1210);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText('WHY UPGRADE TO BACS PREMIUM?', 90, 370);

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('Avoid costly errors that delay Permanent Residency by 1-2 years:', 90, 405);

          const benefits = [
            {
              num: '1️⃣',
              title: 'NOC & TEER Duty Match Audit',
              desc: 'Ensure job duties strictly align with IRCC lead statements to prevent application refusal.'
            },
            {
              num: '2️⃣',
              title: 'Proof of Funds & Letterhead Check',
              desc: 'Verify liquid settlement funds & employer reference letters to avoid A40 misrepresentation bans.'
            },
            {
              num: '3️⃣',
              title: 'Express Entry & PNP CRS Roadmap',
              desc: 'Tailored CRS point optimization & targeted provincial stream tracking for fast-track selection.'
            },
            {
              num: '4️⃣',
              title: '1-on-1 Strategic Consultation',
              desc: 'Direct expert advisory to transform your profile into a verified PR application.'
            }
          ];

          benefits.forEach((item, idx) => {
            const cardY = 435 + idx * 260;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(90, cardY, 900, 235);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.strokeRect(90, cardY, 900, 235);

            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 26px sans-serif';
            ctx.fillText(`${item.num} ${item.title}`, 115, cardY + 45);

            drawWrappedTextInBox(
              ctx,
              item.desc,
              115,
              cardY + 65,
              850,
              150,
              22,
              'sans-serif',
              'medium',
              '#e2e8f0',
              10,
              'left'
            );
          });

          // Footer Call-to-Action Box (Box: 60, 1560, 960, 280)
          ctx.fillStyle = '#022c22';
          ctx.fillRect(60, 1560, 960, 280);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.strokeRect(60, 1560, 960, 280);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('📩 Substack: substack.com/@canadaimmigrationguide', 90, 1620);

          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('📱 Book Consultation: WhatsApp +234 708 971 1946', 90, 1680);

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('🔔 SUBSCRIBE, LIKE & SHARE FOR DAILY IRCC GUIDANCE!', 90, 1740);

        } else {

          // Determine active question in current timeline window
          const currentQIndex = Math.max(0, Math.min(
            activeQuestions.length - 1,
            Math.floor(elapsedSecTotal / questionDurationSec)
          ));
          const currentQuestion = activeQuestions[currentQIndex] || activeQuestions[0] || questionBank[0];
          if (!currentQuestion) return;

          const elapsedInQuestionMs = elapsed % (questionDurationSec * 1000);
          const elapsedInQuestionSec = Math.floor(elapsedInQuestionMs / 1000);

          // Reset reveal sound trigger when switching questions
          if (currentQIndex !== lastPlayedQuestionIdx) {
            lastPlayedQuestionIdx = currentQIndex;
            hasPlayedAnswerReveal = false;
          }

          // --- SOUND EFFECTS TICK LOGIC ---
          if (elapsedSecTotal !== lastTickSec) {
            lastTickSec = elapsedSecTotal;
            if (elapsedInQuestionSec < 25) {
              const thinkingLeft = 25 - elapsedInQuestionSec;
              if (thinkingLeft <= 5 && thinkingLeft > 0) {
                sounds.playUrgentTick();
              } else if (thinkingLeft > 0) {
                sounds.playTick();
              }
            }
          }

          const isAnswerRevealed = elapsedInQuestionSec >= 25; // Reveal answer between 25s and 40s

          if (isAnswerRevealed && !hasPlayedAnswerReveal) {
            sounds.playCorrect();
            hasPlayedAnswerReveal = true;
          }

          // --- CANVAS BACKGROUND ---
          ctx.fillStyle = '#070d1e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Gradient glow
          const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
          bgGrad.addColorStop(0, '#0b132b');
          bgGrad.addColorStop(0.5, '#070d1e');
          bgGrad.addColorStop(1, '#050a18');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // --- 1. HEADER CONTAINER (Box: 60, 80, 960, 160) ---
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(60, 80, 960, 160);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 4;
          ctx.strokeRect(60, 80, 960, 160);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText('🇨🇦 BACS IMMIGRATION LIVE STREAM', 100, 135);

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 26px sans-serif';
          const platformBadge = platform === 'youtube_shorts' ? 'YOUTUBE SHORTS EDITION' : 'TIKTOK VIRAL EDITION';
          ctx.fillText(`Official IRCC Compliance • ${platformBadge}`, 100, 185);

          // Draw Watermark Logo in header right corner
          if (logoImageRef.current) {
            ctx.drawImage(logoImageRef.current, 810, 95, 190, 95);
          }

        // --- 2. QUESTION CONTAINER (Box: 60, 270, 960, 360) ---
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(60, 270, 960, 360);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 270, 960, 360);

        // Category Pill with Dynamic Alignment & Width Calculation
        const pillText = `QUESTION ${currentQIndex + 1} OF ${activeQuestions.length} • ${currentQuestion.category}`;
        ctx.font = 'bold 22px sans-serif';
        const textMetrics = ctx.measureText(pillText);
        const pillWidth = Math.min(900, textMetrics.width + 36);
        const pillX = 90;
        const pillY = 292;
        const pillHeight = 44;

        ctx.fillStyle = '#0284c7';
        if (typeof (ctx as any).roundRect === 'function') {
          ctx.beginPath();
          (ctx as any).roundRect(pillX, pillY, pillWidth, pillHeight, 8);
          ctx.fill();
        } else {
          ctx.fillRect(pillX, pillY, pillWidth, pillHeight);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(pillText, pillX + 18, pillY + pillHeight / 2);

        // Animated Question Text (Word Progressive Reveal)
        const textProgress = Math.min(1, elapsedInQuestionMs / 800); // 0.8s entrance
        const textCharsToShow = Math.floor(currentQuestion.text.length * textProgress);
        const animatedQuestionText = currentQuestion.text.substring(0, textCharsToShow);

        drawWrappedTextInBox(
          ctx,
          animatedQuestionText,
          80,
          355,
          920,
          260,
          38,
          'sans-serif',
          'bold',
          '#ffffff',
          16,
          'left'
        );

        // --- 3. OPTIONS CONTAINERS WITH STAGGERED ENTRANCE ANIMATION ---
        const optionKeys = ['A', 'B', 'C', 'D'] as const;
        const correctKey = currentQuestion.correctAnswer;

        optionKeys.forEach((key, idx) => {
          const yPos = 660 + idx * 125;
          const optText = `${key}: ${currentQuestion.options[key]}`;
          const isCorrect = key === correctKey;

          // Staggered slide-in animation calculation
          const optionDelayMs = idx * 150;
          const optionProgress = Math.min(1, Math.max(0, (elapsedInQuestionMs - optionDelayMs) / 300));
          const slideOffset = (1 - optionProgress) * 120; // slide in 120px from left

          const boxX = 60 + slideOffset;

          if (isAnswerRevealed && isCorrect) {
            // Glowing emerald correct option box
            ctx.save();
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 20;

            ctx.fillStyle = '#064e3b';
            ctx.fillRect(boxX, yPos, 960, 110);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 6;
            ctx.strokeRect(boxX, yPos, 960, 110);
            ctx.restore();

            drawWrappedTextInBox(
              ctx,
              `✅ ${optText}`,
              boxX,
              yPos,
              960,
              110,
              30,
              'sans-serif',
              'bold',
              '#34d399',
              18,
              'left'
            );
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(boxX, yPos, 960, 110);
            ctx.strokeStyle = isAnswerRevealed ? '#1e293b' : '#334155';
            ctx.lineWidth = 3;
            ctx.strokeRect(boxX, yPos, 960, 110);

            drawWrappedTextInBox(
              ctx,
              optText,
              boxX,
              yPos,
              960,
              110,
              28,
              'sans-serif',
              'bold',
              isAnswerRevealed ? '#64748b' : '#f8fafc',
              18,
              'left'
            );
          }
        });

        // --- 4. EXPLANATION / PARTICIPATION BOX (Box: 60, 1180, 960, 240) ---
        ctx.fillStyle = isAnswerRevealed ? '#0f172a' : '#0a101f';
        ctx.fillRect(60, 1180, 960, 240);
        ctx.strokeStyle = isAnswerRevealed ? '#10b981' : '#1e293b';
        ctx.lineWidth = isAnswerRevealed ? 4 : 2;
        ctx.strokeRect(60, 1180, 960, 240);

        if (isAnswerRevealed) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 24px sans-serif';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(`💡 OFFICIAL REASONING & IRCC REFERENCE`, 90, 1215);

          const fullSourceText = `${currentQuestion.reference} — ${currentQuestion.insight}`;
          drawWrappedTextInBox(
            ctx,
            fullSourceText,
            80,
            1235,
            920,
            170,
            24,
            'sans-serif',
            'medium',
            '#e2e8f0',
            12,
            'left'
          );
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 24px sans-serif';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(`💡 HOW TO PARTICIPATE IN THIS QUIZ`, 90, 1215);

          drawWrappedTextInBox(
            ctx,
            'Drop your choice (A, B, C or D) in the comments before timer expires! The official IRCC policy reference will be revealed next.',
            80,
            1235,
            920,
            170,
            24,
            'sans-serif',
            'medium',
            '#94a3b8',
            12,
            'left'
          );
        }

        // --- 5. TIMER / PARTICIPATION TIMER BADGE (Box: 60, 1440, 960, 130) ---
        ctx.fillStyle = isAnswerRevealed ? '#064e3b' : '#78350f';
        ctx.fillRect(60, 1440, 960, 130);
        ctx.strokeStyle = isAnswerRevealed ? '#10b981' : '#d97706';
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 1440, 960, 130);

        if (!isAnswerRevealed) {
          const thinkingLeft = Math.max(0, 25 - elapsedInQuestionSec);
          ctx.fillStyle = thinkingLeft <= 5 ? '#f87171' : '#fbbf24';
          ctx.font = 'bold 32px sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText(`💬 TYPE YOUR ANSWER IN COMMENTS! (${thinkingLeft}s LEFT)`, 90, 1505);
        } else {
          const reviewLeft = Math.max(0, questionDurationSec - elapsedInQuestionSec);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 34px sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText(`⚡ ANSWER REVEALED • REVIEW TIME: ${reviewLeft}s`, 90, 1505);
        }

        // --- 6. FOOTER CTA CONTAINER (Box: 60, 1600, 960, 240) ---
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(60, 1600, 960, 240);
        ctx.strokeStyle = isAnswerRevealed ? '#0284c7' : '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 1600, 960, 240);

        if (isAnswerRevealed) {
          // Post-Reveal CTA with Consultation, Substack & Engagement
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 28px sans-serif';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText('🇨🇦 Book Consultation: WhatsApp +234 708 971 1946', 90, 1655);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('Searching Canada Guide: substack.com/@canadaimmigrationguide', 90, 1710);

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('🔔 SUBSCRIBE, LIKE & SHARE FOR DAILY IRCC GUIDANCE!', 90, 1765);
        } else {
          // Question Screen Participation Instructions + Subscribe, Like & Share CTA (NO Consultation / Substack!)
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 28px sans-serif';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText('👇 HOW TO PARTICIPATE:', 90, 1655);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('1️⃣ Pick A, B, C or D and drop your answer in the comments!', 90, 1710);

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('🔔 SUBSCRIBE, LIKE & SHARE FOR DAILY QUIZ SHORTS!', 90, 1765);
        }

        } // End of question screen vs ending scene block

        if (elapsed < totalDurationMs) {
          animFrameIdRef.current = requestAnimationFrame(renderFrame);
        } else {
          sounds.playMilestone();
          recorder.stop();
        }
      };

      animFrameIdRef.current = requestAnimationFrame(renderFrame);

    } catch (err: any) {
      console.error('Recording error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to start video recording.');
    }
  };

  const stopRecordingEarly = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      sounds.setCustomDestination(null);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 select-none">
      <div className="w-full max-w-4xl bg-[#0b132b] border-2 border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-black text-lg">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                Shorts & TikTok Video Studio
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">
                  HD 1080x1920
                </span>
              </h1>
              <p className="text-xs text-emerald-400 font-semibold">
                Recorded audio • Animated bounded text • Substack CTA • Under 2-min limit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar: Platform & Shuffle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          
          {/* Target Platform Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-rose-500" /> Target Social Format:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('youtube_shorts')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  platform === 'youtube_shorts'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>YouTube Shorts</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('tiktok')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  platform === 'tiktok'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>TikTok Video</span>
              </button>
            </div>
          </div>

          {/* Quick Stats & Shuffle Action */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Est. Video Duration:
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                {totalDurationSec < 60 ? `${totalDurationSec}s` : `${Math.floor(totalDurationSec / 60)}m ${totalDurationSec % 60}s`}
              </span>
            </div>

            <button
              type="button"
              onClick={shuffleQuestionBank}
              disabled={status === 'recording'}
              className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-400 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle Questions Bank</span>
            </button>
          </div>

        </div>

        {/* Multi-Question Selection Checkboxes & Category Focus Tabs */}
        <div className="space-y-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" /> Select Questions for Video Output (Max 2 Minutes):
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30">
                {selectedIds.length} Selected ({totalDurationSec}s)
              </span>
              <button
                type="button"
                onClick={() => selectFirstNInCategory(activeCategoryFilter, 2)}
                className="text-[10px] font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded transition-all"
              >
                Auto-Pick 2 Qs
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoriesList.map((cat) => {
              const isActive = activeCategoryFilter === cat;
              const count = cat === 'ALL'
                ? questionBank.length
                : questionBank.filter(q => q.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all border ${
                    isActive
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Displayed Question Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {displayedBank.map((q) => {
              const isChecked = selectedIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => toggleQuestionSelection(q.id)}
                  disabled={status === 'recording'}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    isChecked
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="pt-0.5 shrink-0 text-emerald-400">
                    {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-emerald-400 text-[10px] block uppercase">
                      Q{q.number} • {q.category}
                    </span>
                    <p className="line-clamp-1 font-medium text-slate-200">{q.text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas Render Element (Kept active in rendering tree) */}
        <canvas
          ref={canvasRef}
          className="fixed pointer-events-none opacity-0 left-0 top-0 -z-50"
          width={1080}
          height={1920}
        />

        {/* Visual Preview Box Container */}
        <div className="relative flex justify-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="w-full max-w-xs aspect-[9/16] bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-5 text-center space-y-3 shadow-inner">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-lg">
              🇨🇦
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">
                {platform === 'youtube_shorts' ? 'YouTube Shorts Generator' : 'TikTok Viral Generator'}
              </h3>
              <p className="text-[10px] text-emerald-400 font-mono">
                Audio Included • Bounded Text • Substack CTA
              </p>
            </div>

            <div className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 p-2.5 rounded-lg w-full text-left space-y-1">
              <div className="font-bold text-emerald-400 text-[10px] uppercase">Active Quiz Content:</div>
              <p className="font-semibold text-white line-clamp-2">
                {activeQuestions.map(q => `Q${q.number}`).join(', ')} ({totalDurationSec}s Total Video)
              </p>
            </div>

            {status === 'recording' && (
              <div className="w-full space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] text-emerald-400 font-mono font-bold">
                  <span>RECORDING HIGH-QUALITY VIDEO & AUDIO...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300 shadow-glow"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-emerald-400 text-xs font-bold flex flex-col items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 p-2.5 rounded-xl w-full">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Video Downloaded with Audio!</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono truncate max-w-full">
                  {downloadedFilename}
                </span>
              </div>
            )}

            {status === 'error' && (
              <div className="text-rose-400 text-[11px] font-semibold flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" /> <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 pt-1">
          {status !== 'recording' ? (
            <button
              onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Record & Download {platform === 'youtube_shorts' ? 'YouTube Short' : 'TikTok Video'} (with Audio)</span>
            </button>
          ) : (
            <button
              onClick={stopRecordingEarly}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm"
            >
              <span>Stop Recording & Export Immediately</span>
            </button>
          )}

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadedFilename || 'BACS_Short_Video.webm'}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 px-4 py-3.5 rounded-xl text-xs font-bold transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Re-download</span>
            </a>
          )}
        </div>

      </div>
    </div>
  );
};
