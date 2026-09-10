// Type declarations for WebCodecs API
declare class VideoEncoder {
  constructor(init: { output: (chunk: any, metadata?: any) => void; error: (error: any) => void });
  readonly state: 'unconfigured' | 'configured' | 'closed';
  configure(config: { codec: string; width: number; height: number; bitrate?: number; framerate?: number }): void;
  encode(frame: VideoFrame, options?: { keyFrame?: boolean }): void;
  flush(): Promise<void>;
  close(): void;
}

declare class AudioEncoder {
  constructor(init: { output: (chunk: any, metadata?: any) => void; error: (error: any) => void });
  readonly state: 'unconfigured' | 'configured' | 'closed';
  configure(config: { codec: string; numberOfChannels: number; sampleRate: number; bitrate?: number }): void;
  encode(data: AudioData): void;
  flush(): Promise<void>;
  close(): void;
}

declare class VideoFrame {
  constructor(image: CanvasImageSource, init?: { timestamp: number; duration?: number });
  close(): void;
}

declare class AudioData {
  constructor(init: {
    format: string;
    sampleRate: number;
    numberOfFrames: number;
    numberOfChannels: number;
    timestamp: number;
    data: Float32Array;
  });
  close(): void;
}

interface Window {
  VideoEncoder: typeof VideoEncoder;
  AudioEncoder: typeof AudioEncoder;
  VideoFrame: typeof VideoFrame;
  AudioData: typeof AudioData;
}
