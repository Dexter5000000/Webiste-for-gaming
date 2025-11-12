import type {
  AIModelType,
  GenerationRequest,
  GenerationResult,
  GenerationProgress,
  AIModelConfig,
} from './types';
import { AI_MODELS } from './models';
import { getHuggingFaceToken } from '../../utils/storage';
import OpenSourceMusicGenerator from './OpenSourceGenerators';

export class AIMusicGenerator {
  private progressCallback?: (progress: GenerationProgress) => void;
  private openSourceGenerator: OpenSourceMusicGenerator;

  constructor() {
    this.openSourceGenerator = new OpenSourceMusicGenerator();
  }

  setProgressCallback(callback: (progress: GenerationProgress) => void): void {
    this.progressCallback = callback;
    this.openSourceGenerator.setProgressCallback(callback);
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

      // Open-source generators (local provider with specific model IDs)
      if (request.model === 'procedural') {
        return await this.generateProcedural(request, modelConfig);
      }

      if (request.model === 'tonejs-procedural' ||
          request.model === 'tonejs-synth' ||
          request.model === 'scribbletune' ||
          request.model === 'abundant-music' ||
          request.model === 'procjam' ||
          request.model === 'magenta-melody' ||
          request.model === 'magenta-music' ||
          request.model === 'magenta-music-rnn' ||
          request.model === 'markov-chains' ||
          request.model === 'algorithmic-composition') {
        return await this.openSourceGenerator.generate(request.model, request);
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

    // Interpreting prompt to influence style - more granular analysis
    const prompt = request.prompt.toLowerCase();
    
    // Genre detection
    const isAmbient = /ambient|pad|atmospheric|space|calm|relax|drone|zen|meditation|sleep/.test(prompt);
    const isDance = /dance|edm|club|house|techno|trance|party|beat|electronic|synth|disco/.test(prompt);
    const isDark = /dark|ominous|minor|moody|sad|melancholic|goth|industrial|metal|horror/.test(prompt);
    const isHappy = /happy|bright|uplift|joy|cheer|funk|pop|upbeat|energetic|playful/.test(prompt);
    const isJazz = /jazz|swing|smooth|cool|sophisticated/.test(prompt);
    const isClassical = /classical|orchestral|symphon|baroque|romantic/.test(prompt);
    const isBlues = /blues|bluesy|jazz|swing/.test(prompt);
    const isMinimal = /minimal|simple|sparse|empty|quiet/.test(prompt);
    const isComplex = /complex|intricate|complicated|layered|rich|dense/.test(prompt);
    
    // Use prompt hash for deterministic but unique randomness per prompt
    const promptHash = this.hashString(request.prompt);
    const seededRandom = this.seededRandom(promptHash);

    // Tempo heuristic from prompt
    let tempo = isAmbient ? 60 + seededRandom() * 20 : isDance ? 120 + seededRandom() * 30 : 90 + seededRandom() * 20;
    if (/\b(\d{2,3})\s?bpm\b/.test(prompt)) {
      const match = prompt.match(/\b(\d{2,3})\s?bpm\b/);
      if (match) tempo = Math.min(180, Math.max(60, parseInt(match[1], 10)));
    }

    // Key & scale selection - more variety
    const pentatonicMinor = [0, 3, 5, 7, 10];
    const major = [0, 2, 4, 5, 7, 9, 11];
    const harmonic = [0, 2, 3, 5, 7, 8, 11];
    const dorian = [0, 2, 3, 5, 7, 9, 10];
    const blues = [0, 3, 5, 6, 7, 10];
    
    let scale: number[];
    if (isDark) scale = harmonic;
    else if (isJazz) scale = dorian;
    else if (isBlues) scale = blues;
    else if (isHappy) scale = major;
    else scale = pentatonicMinor;

    const roots = [48, 50, 52, 54, 55, 57, 59, 60];
    const rootIndex = Math.floor(seededRandom() * roots.length);
    const root = roots[rootIndex];

    // Utility: create envelope
    const applyEnvelope = (_ctx: BaseAudioContext, node: GainNode, time: number, a: number, d: number, s: number, r: number, peak = 1) => {
      node.gain.cancelScheduledValues(time);
      node.gain.setValueAtTime(0, time);
      node.gain.linearRampToValueAtTime(peak, time + a);
      node.gain.linearRampToValueAtTime(peak * s, time + a + d);
      node.gain.setValueAtTime(peak * s, time + a + d + Math.max(0.001, r));
    };

    const secondsPerBeat = 60 / tempo;
    const beats = Math.ceil((duration / secondsPerBeat));

    // Choose drum pattern based on genre
    const drumPattern = this.generateDrumPattern(beats, isDance, isJazz, isDark, seededRandom);
    
    // Drum layer
    const drumGain = offline.createGain();
    drumGain.gain.value = isAmbient ? 0 : isMinimal ? 0.2 : isDance ? 0.4 : 0.3;
    drumGain.connect(offline.destination);

    // Apply drum pattern
    drumPattern.kicks.forEach(beat => {
      const t = beat * secondsPerBeat;
      const osc = offline.createOscillator();
      osc.type = 'sine';
      const gain = offline.createGain();
      gain.gain.value = 0;
      const kickPitch = 80 + seededRandom() * 60;
      const kickDecay = 0.15 + seededRandom() * 0.15;
      osc.frequency.setValueAtTime(kickPitch, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + kickDecay);
      osc.connect(gain).connect(drumGain);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.8, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (kickDecay + 0.1));
      osc.start(t);
      osc.stop(t + kickDecay + 0.1);
    });

    drumPattern.hats.forEach(beat => {
      const t = beat * secondsPerBeat;
      const bufferSize = 256;
      const noiseBuffer = offline.createBuffer(1, bufferSize, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = offline.createBufferSource();
      noise.buffer = noiseBuffer;
      const bandpass = offline.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 8000 + seededRandom() * 4000;
      const gain = offline.createGain();
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      noise.connect(bandpass).connect(gain).connect(drumGain);
      noise.start(t);
      noise.stop(t + 0.08);
    });

    // Snare layer
    if (drumPattern.snares.length > 0 && !isAmbient) {
      drumPattern.snares.forEach(beat => {
        const t = beat * secondsPerBeat;
        const bufferSize = 512;
        const noiseBuffer = offline.createBuffer(1, bufferSize, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = offline.createBufferSource();
        noise.buffer = noiseBuffer;
        const hpf = offline.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 200;
        const gain = offline.createGain();
        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        noise.connect(hpf).connect(gain).connect(drumGain);
        noise.start(t);
        noise.stop(t + 0.15);
      });
    }

    // Bass layer: varied patterns
    const bassGain = offline.createGain();
    bassGain.gain.value = isAmbient ? 0 : isMinimal ? 0.1 : isDance ? 0.35 : 0.25;
    bassGain.connect(offline.destination);
    
    const bassOsc = offline.createOscillator();
    bassOsc.type = isDance ? 'square' : isJazz ? 'sine' : 'sawtooth';
    const bassEnv = offline.createGain();
    bassEnv.gain.value = 0;
    bassOsc.connect(bassEnv).connect(bassGain);
    bassOsc.start(0);
    
    const bassPattern = this.generateBassPattern(beats, isDance, isJazz, scale, root, seededRandom);
    bassPattern.forEach(({ beat, note }) => {
      const t = beat * secondsPerBeat;
      const freq = 440 * Math.pow(2, (note - 69) / 12);
      bassOsc.frequency.setValueAtTime(freq, t);
      const attackTime = isDance ? 0.01 : 0.05;
      applyEnvelope(offline, bassEnv, t, attackTime, 0.1, 0.4, 0.2, 0.9);
    });
    bassOsc.stop(duration);

    // Melody/Pad layer
    const melodyGain = offline.createGain();
    melodyGain.gain.value = isAmbient ? 0.25 : isMinimal ? 0.05 : isDance ? 0.15 : 0.2;
    melodyGain.connect(offline.destination);
    
    if (isAmbient || isMinimal) {
      // Pad/ambient layer
      const padOsc = offline.createOscillator();
      padOsc.type = 'sine';
      const padEnv = offline.createGain();
      padEnv.gain.setValueAtTime(0.0001, 0);
      padEnv.gain.exponentialRampToValueAtTime(0.3, 3);
      padEnv.gain.setValueAtTime(0.3, Math.max(3, duration - 3));
      padEnv.gain.exponentialRampToValueAtTime(0.0001, duration);
      padOsc.connect(padEnv).connect(melodyGain);
      
      const padNotes = this.generatePadSequence(duration, scale, root, seededRandom);
      padNotes.forEach(({ time, note }) => {
        const freq = 440 * Math.pow(2, (note - 69) / 12);
        padOsc.frequency.linearRampToValueAtTime(freq, time);
      });
      padOsc.start(0);
      padOsc.stop(duration);
    } else {
      // Melody layer
      const melOsc = offline.createOscillator();
      melOsc.type = isJazz ? 'sine' : isClassical ? 'sine' : 'triangle';
      const melEnv = offline.createGain();
      melEnv.gain.value = 0;
      melOsc.connect(melEnv).connect(melodyGain);
      melOsc.start(0);
      
      const melodyPattern = this.generateMelodyPattern(beats, scale, root, isDance, isJazz, seededRandom);
      melodyPattern.forEach(({ beat, note, duration: noteDuration }) => {
        const t = beat * secondsPerBeat;
        if (t + noteDuration > duration) return;
        const freq = 440 * Math.pow(2, (note - 69) / 12);
        melOsc.frequency.setValueAtTime(freq, t);
        const attackTime = isJazz ? 0.02 : isDance ? 0.01 : 0.03;
        applyEnvelope(offline, melEnv, t, attackTime, 0.15, 0.5, 0.15, 0.7);
      });
      melOsc.stop(duration);
    }

    // Reverb/Echo layer for depth
    if (isComplex || !isMinimal) {
      const delayTime = secondsPerBeat * (seededRandom() > 0.5 ? 2 : 1);
      const dryGain = offline.createGain();
      const wetGain = offline.createGain();
      dryGain.gain.value = 0.8;
      wetGain.gain.value = isAmbient ? 0.3 : 0.15;
      
      melodyGain.connect(dryGain).connect(offline.destination);
      const delay = offline.createDelay(delayTime);
      delay.delayTime.value = delayTime;
      melodyGain.connect(delay).connect(wetGain).connect(offline.destination);
    } else {
      melodyGain.connect(offline.destination);
    }

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

      // Get HuggingFace token from localStorage (user-entered) or environment (developer)
      const hfToken = getHuggingFaceToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization if token is available
      if (hfToken) {
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

  // Helper: Hash string to seed random generator
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Helper: Seeded random number generator (0-1)
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Helper: Generate drum patterns based on genre
  private generateDrumPattern(
    beats: number,
    isDance: boolean,
    isJazz: boolean,
    isDark: boolean,
    random: () => number
  ): { kicks: number[]; hats: number[]; snares: number[] } {
    const kicks: number[] = [];
    const hats: number[] = [];
    const snares: number[] = [];

    if (isDance) {
      // 4 on the floor kick pattern
      for (let i = 0; i < beats; i += 4) kicks.push(i);
      // Hats every 8th
      for (let i = 0; i < beats; i += 2) hats.push(i);
      // Snares on 2 and 4
      for (let i = 8; i < beats; i += 8) {
        snares.push(i);
        if (i + 8 < beats) snares.push(i + 8);
      }
    } else if (isJazz) {
      // Swing pattern - kick on beats 1 and 3
      for (let i = 0; i < beats; i += 8) {
        kicks.push(i);
        if (i + 8 < beats) kicks.push(i + 8);
      }
      // Swung hats
      for (let i = 0; i < beats; i += 3) hats.push(i);
      // Snares on swing beats
      for (let i = 4; i < beats; i += 8) snares.push(i);
    } else if (isDark) {
      // Sparse, syncopated pattern
      for (let i = 0; i < beats; i += 6 + Math.floor(random() * 4)) {
        kicks.push(i);
      }
      for (let i = 1; i < beats; i += 5 + Math.floor(random() * 3)) {
        hats.push(i);
      }
      for (let i = 3; i < beats; i += 7 + Math.floor(random() * 4)) {
        snares.push(i);
      }
    } else {
      // Standard pattern
      for (let i = 0; i < beats; i += 4) kicks.push(i);
      for (let i = 0; i < beats; i += 2) hats.push(i);
      for (let i = 4; i < beats; i += 8) snares.push(i);
    }

    return { kicks, hats, snares };
  }

  // Helper: Generate bass line patterns
  private generateBassPattern(
    beats: number,
    isDance: boolean,
    isJazz: boolean,
    scale: number[],
    root: number,
    random: () => number
  ): Array<{ beat: number; note: number }> {
    const pattern: Array<{ beat: number; note: number }> = [];

    if (isDance) {
      // Hypnotic repeating bass pattern
      const bassNotes = [0, 5, 7, 5];
      for (let i = 0; i < beats; i += 2) {
        const noteIndex = Math.floor((i / 2) % bassNotes.length);
        pattern.push({
          beat: i,
          note: root + scale[noteIndex % scale.length],
        });
      }
    } else if (isJazz) {
      // Walking bass pattern
      for (let i = 0; i < beats; i += 2) {
        const scaleIdx = Math.floor(random() * scale.length);
        const octaveOffset = Math.floor(random() * 2) * 12;
        pattern.push({
          beat: i,
          note: root + scale[scaleIdx] + octaveOffset,
        });
      }
    } else {
      // Varied bass pattern
      for (let i = 0; i < beats; i += 4 - Math.floor(random() * 2)) {
        if (i < beats) {
          const scaleIdx = Math.floor(random() * Math.max(1, scale.length - 2));
          pattern.push({
            beat: i,
            note: root + scale[scaleIdx],
          });
        }
      }
    }

    return pattern;
  }

  // Helper: Generate melody patterns
  private generateMelodyPattern(
    beats: number,
    scale: number[],
    root: number,
    isDance: boolean,
    isJazz: boolean,
    random: () => number
  ): Array<{ beat: number; note: number; duration: number }> {
    const pattern: Array<{ beat: number; note: number; duration: number }> = [];

    if (isDance) {
      // Repetitive arpeggio pattern
      const arpNotes = [0, 2, 4, 2];
      for (let i = 0; i < beats; i += 1) {
        if (i % 2 === 0) {
          const noteIndex = Math.floor((i / 2) % arpNotes.length);
          const scaleIdx = arpNotes[noteIndex] % scale.length;
          pattern.push({
            beat: i,
            note: root + 12 + scale[scaleIdx],
            duration: 0.5,
          });
        }
      }
    } else if (isJazz) {
      // Syncopated jazzy melody
      let i = 0;
      while (i < beats) {
        const scaleIdx = Math.floor(random() * scale.length);
        const octave = Math.floor(random() * 3) * 12;
        const duration = 0.5 + random() * 1.5;
        pattern.push({
          beat: i,
          note: root + 12 + octave + scale[scaleIdx],
          duration,
        });
        i += duration + random() * 0.5;
      }
    } else {
      // Varied melodic line
      let i = 0;
      while (i < beats) {
        const scaleIdx = Math.floor(random() * scale.length);
        const duration = 0.5 + random() * 1.2;
        const octave = (Math.random() > 0.7 ? 1 : 0) * 12;
        pattern.push({
          beat: i,
          note: root + 12 + octave + scale[scaleIdx],
          duration,
        });
        i += duration;
      }
    }

    return pattern;
  }

  // Helper: Generate pad/ambient sequences
  private generatePadSequence(
    duration: number,
    scale: number[],
    root: number,
    random: () => number
  ): Array<{ time: number; note: number }> {
    const sequence: Array<{ time: number; note: number }> = [];

    for (let t = 0; t < duration; t += 2 + random() * 3) {
      const scaleIdx = Math.floor(random() * scale.length);
      const octave = Math.floor(random() * 2) * 12;
      sequence.push({
        time: t,
        note: root + octave + scale[scaleIdx],
      });
    }

    return sequence;
  }
}

export const aiMusicGenerator = new AIMusicGenerator();
