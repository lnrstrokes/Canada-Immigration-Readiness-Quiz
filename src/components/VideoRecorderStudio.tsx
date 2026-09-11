import React, { useState, useEffect, useRef } from 'react';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { ChallengeConfig, Question, QuestionOption } from '../types';
import { sounds } from '../utils/soundEffects';
import { Video, Download, ArrowLeft, RefreshCw, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

interface VideoRecorderStudioProps {
  config: ChallengeConfig;
  onBack: () => void;
}

export const VideoRecorderStudio: React.FC<VideoRecorderStudioProps> = ({ config, onBack }) => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoPreset, setVideoPreset] = useState<'Shorts' | 'TikTok' | 'Reels'>('Shorts');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentQ = config.questions[selectedQuestionIndex] || config.questions[0];

  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;
  const FPS = 60;
  const DURATION_SEC = 15;

  const renderFrame = (ctx: CanvasRenderingContext2D, timeSec: number) => {
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0b132b');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Glow
    const glowGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, 400, 50,
      CANVAS_WIDTH / 2, 400, 600
    );
    glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Header Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(60, 80, CANVAS_WIDTH - 120, 140);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 80, CANVAS_WIDTH - 120, 140);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BACS CANADA IMMIGRATION REEL', CANVAS_WIDTH / 2, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(currentQ.category.toUpperCase(), CANVAS_WIDTH / 2, 180);

    // Question Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(60, 260, CANVAS_WIDTH - 120, 360);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 260, CANVAS_WIDTH - 120, 360);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`QUESTION ${currentQ.number} of ${config.questions.length} [${currentQ.difficulty}]`, 90, 310);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    const words = currentQ.text.split(' ');
    let line = '';
    let y = 370;
    const maxWidth = CANVAS_WIDTH - 180;
    const lineHeight = 46;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, 90, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 90, y);

    // Options Slide-in
    const isRevealed = timeSec >= 8.0;
    const options: QuestionOption[] = ['A', 'B', 'C', 'D'];
    const startY = 660;
    const optionHeight = 130;
    const gap = 25;

    options.forEach((opt, idx) => {
      const optY = startY + idx * (optionHeight + gap);
      const isCorrect = opt === currentQ.correctAnswer;
      const slideInTime = 1.0 + idx * 0.4;
      const progress = Math.min(1, Math.max(0, (timeSec - slideInTime) / 0.5));

      ctx.save();
      ctx.globalAlpha = progress;

      if (isRevealed && isCorrect) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fillRect(60, optY, CANVAS_WIDTH - 120, optionHeight);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 5;
        ctx.strokeRect(60, optY, CANVAS_WIDTH - 120, optionHeight);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(60, optY, CANVAS_WIDTH - 120, optionHeight);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(60, optY, CANVAS_WIDTH - 120, optionHeight);
      }

      ctx.fillStyle = isRevealed && isCorrect ? '#10b981' : '#38bdf8';
      ctx.fillRect(80, optY + 25, 80, 80);
      ctx.fillStyle = '#020617';
      ctx.font = 'black 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opt, 120, optY + 78);

      ctx.fillStyle = isRevealed && isCorrect ? '#34d399' : '#f8fafc';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(currentQ.options[opt], 185, optY + 75);

      ctx.restore();
    });

    // Answer Reveal Overlay at 8 seconds
    if (isRevealed) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.fillRect(60, 1310, CANVAS_WIDTH - 120, 100);
      ctx.fillStyle = '#020617';
      ctx.font = 'black 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`IRCC COMPLIANT ANSWER: OPTION ${currentQ.correctAnswer}`, CANVAS_WIDTH / 2, 1372);

      ctx.fillStyle = '#020617';
      ctx.fillRect(60, 1430, CANVAS_WIDTH - 120, 240);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 1430, CANVAS_WIDTH - 120, 240);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('IRCC REGULATION / SOURCE CITATION:', 90, 1475);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(currentQ.reference, 90, 1515);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '24px sans-serif';
      const insightWords = currentQ.insight.split(' ');
      let inLine = '';
      let inY = 1560;
      for (let i = 0; i < insightWords.length; i++) {
        const testInLine = inLine + insightWords[i] + ' ';
        if (ctx.measureText(testInLine).width > CANVAS_WIDTH - 200 && i > 0) {
          ctx.fillText(inLine, 90, inY);
          inLine = insightWords[i] + ' ';
          inY += 34;
        } else {
          inLine = testInLine;
        }
      }
      ctx.fillText(inLine, 90, inY);
    } else {
      const timerProgress = Math.max(0, (8 - timeSec) / 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(60, 1310, CANVAS_WIDTH - 120, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(60, 1310, (CANVAS_WIDTH - 120) * timerProgress, 20);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`THINKING TIME: ${Math.max(0, Math.ceil(8 - timeSec))}s`, CANVAS_WIDTH / 2, 1370);
    }

    // Watermark Footer
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(60, 1700, CANVAS_WIDTH - 120, 140);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 1700, CANVAS_WIDTH - 120, 140);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍁 BACS CANADA IMMIGRATION ASSESSMENT', CANVAS_WIDTH / 2, 1750);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Substack: Canada Immigration Guide • WA: +234 708 971 1946', CANVAS_WIDTH / 2, 1800);
  };

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
  }, [selectedQuestionIndex, config]);

  const handleStartRecording = async () => {
    if (!canvasRef.current) return;
    if (typeof VideoEncoder === 'undefined') {
      setErrorMsg('WebCodecs (VideoEncoder API) is not supported in this browser. Please use Chrome or Edge desktop.');
      return;
    }

    setIsRecording(true);
    setRecordingProgress(0);
    setDownloadUrl(null);
    setErrorMsg(null);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
          codec: 'avc',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        },
        audio: {
          codec: 'aac',
          numberOfChannels: 2,
          sampleRate: 48000,
        },
        firstTimestampBehavior: 'strict',
      });

      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => {
          console.error('VideoEncoder error:', e);
          setErrorMsg(`Video Encoding Error: ${e.message}`);
        },
      });

      videoEncoder.configure({
        codec: 'avc1.42E01E',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        bitrate: 12_000_000,
        framerate: FPS,
      });

      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error('AudioEncoder error:', e),
      });

      audioEncoder.configure({
        codec: 'mp4a.40.2',
        numberOfChannels: 2,
        sampleRate: 48000,
        bitrate: 192_000,
      });

      const totalFrames = FPS * DURATION_SEC;
      const sampleRate = 48000;
      const totalAudioSamples = sampleRate * DURATION_SEC;

      const offlineCtx = new OfflineAudioContext(2, totalAudioSamples, sampleRate);
      for (let sec = 0; sec < DURATION_SEC; sec++) {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = sec >= 8 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(sec >= 8 ? 880 : 440, sec);
        gain.gain.setValueAtTime(0.08, sec);
        gain.gain.exponentialRampToValueAtTime(0.001, sec + 0.1);
        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(sec);
        osc.stop(sec + 0.1);
      }

      const renderedAudioBuffer = await offlineCtx.startRendering();

      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfFrames: totalAudioSamples,
        numberOfChannels: 2,
        timestamp: 0,
        data: renderedAudioBuffer.getChannelData(0),
      });
      audioEncoder.encode(audioData);
      audioData.close();
      await audioEncoder.flush();

      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        const timeSec = frameIdx / FPS;
        const timestampMicroSec = Math.round(timeSec * 1_000_000);

        renderFrame(ctx, timeSec);

        const videoFrame = new VideoFrame(canvas, {
          timestamp: timestampMicroSec,
        });

        const keyFrame = frameIdx % (FPS * 2) === 0;
        videoEncoder.encode(videoFrame, { keyFrame });
        videoFrame.close();

        setRecordingProgress(Math.round(((frameIdx + 1) / totalFrames) * 100));
        if (frameIdx % 15 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      await videoEncoder.flush();
      muxer.finalize();

      const { buffer } = muxer.target;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setIsRecording(false);
      sounds.playCorrect();
    } catch (e: any) {
      console.error('Video rendering failure:', e);
      setErrorMsg(`Recording engine error: ${e.message || 'Failed to initialize WebCodecs export.'}`);
      setIsRecording(false);
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
                1080p Shorts/TikTok Video Studio
              </h1>
              <p className="text-xs text-emerald-400 font-semibold">WebCodecs + mp4-muxer Client-Side 1080x1920 MP4 Video Generator</p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back to Setup</span>
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
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
                    RENDERING 1080p MP4 ({recordingProgress}%)
                  </span>
                  <div className="w-full max-w-[180px] bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-150"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Encoding H.264 Video + AAC Audio at 60 FPS</p>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">1080x1920 Vertical Canvas @ 60 FPS</span>
          </div>

          <div className="space-y-4">
            
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>Select Question for Video Reel:</span>
                <span className="text-emerald-400 font-mono">Q{selectedQuestionIndex + 1} of {config.questions.length}</span>
              </label>
              <select
                value={selectedQuestionIndex}
                onChange={(e) => setSelectedQuestionIndex(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs font-medium rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
              >
                {config.questions.map((q, idx) => (
                  <option key={q.id} value={idx}>
                    Q{q.number}: {q.category} — {q.text.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-white block">Platform Target Preset:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['Shorts', 'TikTok', 'Reels'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVideoPreset(preset)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      videoPreset === preset
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {!downloadUrl ? (
                <button
                  onClick={handleStartRecording}
                  disabled={isRecording}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg text-sm"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>{isRecording ? `Encoding... ${recordingProgress}%` : 'Generate 1080p MP4 Video'}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <a
                    href={downloadUrl}
                    download={`bacs-canada-q${currentQ.number}.mp4`}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg text-sm"
                  >
                    <Download className="w-4 h-4 fill-slate-950" />
                    <span>Download Genuine 1080p MP4 File</span>
                  </a>
                  <button
                    onClick={() => setDownloadUrl(null)}
                    className="w-full text-xs text-slate-400 hover:text-white py-1 transition-colors"
                  >
                    Generate another video reel
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> High-FPS WebCodecs MP4 Export
              </span>
              <p className="leading-tight">
                Renders 1080x1920 video at 60 FPS with H.264 video + AAC audio. Perfect for instant social media uploads!
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
