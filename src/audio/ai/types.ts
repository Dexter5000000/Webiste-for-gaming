export type AIModelType = 
  | 'stable-audio-open'
  | 'musicgen-large'
  | 'musicgen-medium'
  | 'riffusion'
  | 'audioldm2'
  | 'dance-diffusion'
  | 'bark';

export type MusicGenre =
  | 'electronic'
  | 'dance'
  | 'ambient'
  | 'rock'
  | 'jazz'
  | 'classical'
  | 'hip-hop'
  | 'pop'
  | 'experimental'
  | 'custom';

export interface AIModelConfig {
  id: AIModelType;
  name: string;
  description: string;
  provider: 'huggingface' | 'replicate' | 'local';
  modelId: string;
  maxDuration: number;
  sampleRate: number;
  channels: number;
  supportedGenres: MusicGenre[];
  quality: 'high' | 'medium';
  free: boolean;
  requiresApiKey: boolean;
}

export interface GenerationRequest {
  model: AIModelType;
  prompt: string;
  duration: number;
  genre?: MusicGenre;
  temperature?: number;
  guidanceScale?: number;
  negativePrompt?: string;
  seed?: number;
}

export interface GenerationResult {
  success: boolean;
  audioBuffer?: AudioBuffer;
  audioBlob?: Blob;
  audioUrl?: string;
  duration?: number;
  sampleRate?: number;
  error?: string;
  metadata?: {
    model: AIModelType;
    prompt: string;
    duration: number;
    generatedAt: string;
  };
}

export interface GenerationProgress {
  stage: 'initializing' | 'generating' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}
