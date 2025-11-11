import type {
  AIModelType,
  GenerationRequest,
  GenerationResult,
  GenerationProgress,
  AIModelConfig,
} from './types';
import { AI_MODELS } from './models';

export class AIMusicGenerator {
  private progressCallback?: (progress: GenerationProgress) => void;

  setProgressCallback(callback: (progress: GenerationProgress) => void): void {
    this.progressCallback = callback;
  }

  private updateProgress(
    stage: GenerationProgress['stage'],
    progress: number,
    message: string
  ): void {
    this.progressCallback?.({
      stage,
      progress: Math.min(100, Math.max(0, progress)),
      message,
    });
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const modelConfig = AI_MODELS[request.model];

    if (!modelConfig) {
      return {
        success: false,
        error: `Unknown model: ${request.model}`,
      };
    }

    try {
      this.updateProgress('initializing', 0, `Initializing ${modelConfig.name}...`);

      if (request.model === 'procedural') {
        return await this.generateProcedural(request, modelConfig);
      }

      if (modelConfig.provider === 'huggingface') {
        try {
          return await this.generateWithHuggingFace(request, modelConfig);
        } catch (err) {
          const msg = (err as Error).message;
          // Auto-fallback: if auth/token related or generic network failure, provide procedural alternative
          if (/token required|Authentication required|Failed to fetch|network/i.test(msg)) {
            this.updateProgress('generating', 5, 'Falling back to local procedural generator...');
            return await this.generateProcedural(request, AI_MODELS['procedural']);
          }
          throw err;
        }
      } else if (modelConfig.provider === 'replicate') {
        return await this.generateWithReplicate(request, modelConfig);
      } else if (modelConfig.provider === 'local') {
        return await this.generateWithLocalInference(request, modelConfig);
      }

      return {
        success: false,
        error: `Unsupported provider: ${modelConfig.provider}`,
      };
    } catch (error) {
      this.updateProgress('error', 0, `Generation failed: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Simple fully local procedural music generator (tokenless fallback)
  private async generateProcedural(
    request: GenerationRequest,
    modelConfig: AIModelConfig
  ): Promise<GenerationResult> {
    const duration = Math.min(request.duration, modelConfig.maxDuration);
    this.updateProgress('initializing', 0, 'Preparing procedural generation...');

    // OfflineAudioContext for rendering
    const sampleRate = modelConfig.sampleRate;
    const totalFrames = Math.ceil(duration * sampleRate);
    const offline = new OfflineAudioContext(2, totalFrames, sampleRate);

    // Interpreting prompt to influence style
    const prompt = request.prompt.toLowerCase();
    const isAmbient = /ambient|pad|atmospheric|space|calm|relax|drone/.test(prompt);
    const isDance = /dance|edm|club|house|techno|trance|party|beat/.test(prompt);
    const isDark = /dark|ominous|minor|moody|sad|melancholic/.test(prompt);
    const isHappy = /happy|bright|uplift|joy|cheer/.test(prompt);

    // Tempo heuristic from prompt
    let tempo = isAmbient ? 80 : isDance ? 128 : 100;
    if (/\b(\d{2,3})\s?bpm\b/.test(prompt)) {
      const match = prompt.match(/\b(\d{2,3})\s?bpm\b/);
      if (match) tempo = Math.min(180, Math.max(60, parseInt(match[1], 10)));
    }

    // Scale & root note selection
    const pentatonicMinor = [0, 3, 5, 7, 10];
    const major = [0, 2, 4, 5, 7, 9, 11];
    const scale = isDark ? pentatonicMinor : isHappy ? major : pentatonicMinor;
    const root = isHappy ? 60 : isDark ? 48 : 54; // MIDI-ish base reference

    // Utility: create envelope
  const applyEnvelope = (_ctx: BaseAudioContext, node: GainNode, time: number, a: number, d: number, s: number, r: number, peak = 1) => {
      node.gain.cancelScheduledValues(time);
      node.gain.setValueAtTime(0, time);
      node.gain.linearRampToValueAtTime(peak, time + a);
      node.gain.linearRampToValueAtTime(peak * s, time + a + d);
      node.gain.setValueAtTime(peak * s, time + a + d + Math.max(0.001, r));
    };

    // Drum layer: simple kick + hat pattern
    const drumGain = offline.createGain();
    drumGain.gain.value = isAmbient ? 0.15 : 0.35;
    drumGain.connect(offline.destination);

    const secondsPerBeat = 60 / tempo;
    const beats = Math.ceil((duration / secondsPerBeat));

    for (let beat = 0; beat < beats; beat++) {
      const t = beat * secondsPerBeat;
      // Kick on quarter notes
      if (beat % 1 === 0 && !isAmbient) {
        const osc = offline.createOscillator();
        osc.type = 'sine';
        const gain = offline.createGain();
        gain.gain.value = 0;
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        osc.connect(gain).connect(drumGain);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.7, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.start(t);
        osc.stop(t + 0.3);
      }
      // Hats every 1/2 beat
      if (beat % 0.5 === 0 && !isAmbient) {
        const bufferSize = 256;
        const noiseBuffer = offline.createBuffer(1, bufferSize, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = offline.createBufferSource();
        noise.buffer = noiseBuffer;
        const bandpass = offline.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 8000;
        const gain = offline.createGain();
        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        noise.connect(bandpass).connect(gain).connect(drumGain);
        noise.start(t);
        noise.stop(t + 0.1);
      }
    }

    // Bass layer: step sequence
    const bassGain = offline.createGain();
    bassGain.gain.value = isAmbient ? 0.2 : 0.3;
    bassGain.connect(offline.destination);
    const bassOsc = offline.createOscillator();
    bassOsc.type = 'sawtooth';
    const bassEnv = offline.createGain();
    bassEnv.gain.value = 0;
    bassOsc.connect(bassEnv).connect(bassGain);
    bassOsc.start(0);
    const bassBeats = beats;
    for (let i = 0; i < bassBeats; i += 2) {
      const t = i * secondsPerBeat;
      const pitchIndex = scale[Math.floor(Math.random() * scale.length)];
      const freq = 440 * Math.pow(2, (root + pitchIndex - 69) / 12);
      bassOsc.frequency.setValueAtTime(freq, t);
      applyEnvelope(offline, bassEnv, t, 0.005, 0.08, 0.3, 0.25, 0.8);
    }
    bassOsc.stop(duration);

    // Melody layer (skips if ambient -> pads instead)
    const melodyGain = offline.createGain();
    melodyGain.gain.value = isAmbient ? 0.15 : 0.25;
    melodyGain.connect(offline.destination);
    if (!isAmbient) {
      const melOsc = offline.createOscillator();
      melOsc.type = 'triangle';
      const melEnv = offline.createGain();
      melEnv.gain.value = 0;
      melOsc.connect(melEnv).connect(melodyGain);
      melOsc.start(0);
      for (let i = 0; i < beats; i += 1) {
        const t = i * secondsPerBeat + (Math.random() * secondsPerBeat * 0.2);
        if (t + 0.5 > duration) break;
        const pitchIndex = scale[Math.floor(Math.random() * scale.length)];
        const freq = 440 * Math.pow(2, (root + pitchIndex + 12 - 69) / 12);
        melOsc.frequency.setValueAtTime(freq, t);
        applyEnvelope(offline, melEnv, t, 0.01, 0.12, 0.4, 0.2, 0.6);
      }
      melOsc.stop(duration);
    } else {
      // Ambient pad: slow evolving noise filtered
      const padSrc = offline.createOscillator();
      padSrc.type = 'sine';
      const padGain = offline.createGain();
      padGain.gain.setValueAtTime(0.001, 0);
      padGain.gain.exponentialRampToValueAtTime(0.25, 2);
      padGain.gain.setValueAtTime(0.25, duration - 2);
      padGain.gain.exponentialRampToValueAtTime(0.001, duration);
      padSrc.connect(padGain).connect(melodyGain);
      for (let i = 0; i < duration; i += 4) {
        const freq = 220 * Math.pow(2, (Math.random() * 4) / 12);
        padSrc.frequency.linearRampToValueAtTime(freq, i + 2);
      }
      padSrc.start(0);
      padSrc.stop(duration);
    }

    // Light stereo widening
    const splitter = offline.createChannelSplitter(2);
    const merger = offline.createChannelMerger(2);
    melodyGain.connect(splitter);
    const leftGain = offline.createGain();
    const rightGain = offline.createGain();
    leftGain.gain.value = 0.9;
    rightGain.gain.value = 1.1;
    splitter.connect(leftGain, 0);
    splitter.connect(rightGain, 1);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    merger.connect(offline.destination);

    this.updateProgress('generating', 40, 'Synthesizing layers...');
    const buffer = await offline.startRendering();

    this.updateProgress('processing', 80, 'Finalizing procedural audio...');
    this.updateProgress('complete', 100, 'Procedural generation complete!');

    const blob = await this.bufferToWavBlob(buffer);

    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      metadata: {
        model: request.model,
        prompt: request.prompt,
        duration: request.duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private async bufferToWavBlob(buffer: AudioBuffer): Promise<Blob> {
    const numCh = buffer.numberOfChannels;
    const length = buffer.length * numCh * 2;
    const header = 44;
    const ab = new ArrayBuffer(header + length);
    const view = new DataView(ab);
    const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, length, true);
    let offset = header;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const sample = buffer.getChannelData(ch)[i];
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  private async generateWithHuggingFace(
    request: GenerationRequest,
    modelConfig: AIModelConfig
  ): Promise<GenerationResult> {
    this.updateProgress('generating', 10, 'Connecting to HuggingFace Inference API...');

    const inputs = {
      prompt: request.prompt,
      duration: Math.min(request.duration, modelConfig.maxDuration),
      temperature: request.temperature ?? 0.7,
      guidance_scale: request.guidanceScale ?? 7.5,
      negative_prompt: request.negativePrompt ?? '',
    };

    try {
      this.updateProgress('generating', 30, 'Sending generation request...');

      // Get HuggingFace token from environment (optional - improves reliability)
      const hfToken = import.meta.env.VITE_HUGGINGFACE_TOKEN;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization if token is available
      if (hfToken && hfToken !== 'your_token_here') {
        headers['Authorization'] = `Bearer ${hfToken}`;
      }

      // HuggingFace Inference API endpoint
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${modelConfig.modelId}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ inputs: request.prompt, parameters: inputs }),
        }
      );

      this.updateProgress('generating', 60, 'Receiving audio data...');

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 503) {
          throw new Error(
            'Model is loading (cold start). This can take 1-2 minutes. Please try again shortly.'
          );
        }
        
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'HuggingFace API token required. Get a free token at https://huggingface.co/settings/tokens and add to .env.local as VITE_HUGGINGFACE_TOKEN'
          );
        }
        
        if (response.status === 429) {
          throw new Error(
            'Rate limit exceeded. Please wait a moment and try again.'
          );
        }
        
        throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      
      // Check if response is audio
      if (!contentType?.includes('audio')) {
        const responseText = await response.text();
        throw new Error(`Unexpected response format: ${responseText.substring(0, 200)}`);
      }

      const audioBlob = await response.blob();
      this.updateProgress('processing', 80, 'Converting audio format...');

      const audioBuffer = await this.blobToAudioBuffer(audioBlob);

      this.updateProgress('complete', 100, 'Generation complete!');

      return {
        success: true,
        audioBuffer,
        audioBlob,
        audioUrl: URL.createObjectURL(audioBlob),
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        metadata: {
          model: request.model,
          prompt: request.prompt,
          duration: request.duration,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      throw new Error(`HuggingFace generation failed: ${errorMessage}`);
    }
  }

  private async generateWithReplicate(
    _request: GenerationRequest,
    _modelConfig: AIModelConfig
  ): Promise<GenerationResult> {
    this.updateProgress('generating', 10, 'Connecting to Replicate API...');

    return {
      success: false,
      error: 'Replicate integration coming soon. Use HuggingFace models for now.',
    };
  }

  private async generateWithLocalInference(
    _request: GenerationRequest,
    _modelConfig: AIModelConfig
  ): Promise<GenerationResult> {
    this.updateProgress('generating', 10, 'Starting local inference...');

    return {
      success: false,
      error:
        'Local ONNX inference coming soon. Use cloud-based models (HuggingFace) for now.',
    };
  }

  private async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 44100 });
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      await audioContext.close();
      return audioBuffer;
    } catch (error) {
      await audioContext.close();
      throw new Error(`Failed to decode audio: ${(error as Error).message}`);
    }
  }

  getBestModelForGenre(genre: string): AIModelType {
    const genreModels: Record<string, AIModelType> = {
      electronic: 'stable-audio-open',
      dance: 'dance-diffusion',
      ambient: 'musicgen-large',
      rock: 'musicgen-large',
      jazz: 'musicgen-large',
      classical: 'musicgen-large',
      'hip-hop': 'stable-audio-open',
      pop: 'stable-audio-open',
      experimental: 'riffusion',
    };

    return genreModels[genre.toLowerCase()] ?? 'stable-audio-open';
  }
}

export const aiMusicGenerator = new AIMusicGenerator();
