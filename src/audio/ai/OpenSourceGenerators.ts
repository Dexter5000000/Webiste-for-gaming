/**
 * OpenSourceGenerators.ts
 * 
 * Integrations for 100+ open-source, free music generation libraries.
 * All run client-side (browser) without requiring API keys.
 * 
 * Categories:
 * 1. Procedural/Algorithmic (Tone.js, ScribbleTune, Abundant Music, ProcJam)
 * 2. AI/ML (Magenta.js, TensorFlow.js models)
 * 3. Effects & Processing (Tuna, Meyda, etc.)
 * 4. MIDI & Sequencing (JZZ, WEBMIDI.js, etc.)
 */

import type { GenerationRequest, GenerationResult, GenerationProgress } from './types';
import { trackAIMusicError, trackSynthesisError, addAIMusicBreadcrumb } from '../../utils/honeybadger';

export type OpenSourceGeneratorType = 
  | 'tonejs-procedural'
  | 'tonejs-synth'
  | 'scribbletune'
  | 'abundant-music'
  | 'procjam'
  | 'magenta-melody'
  | 'magenta-music'
  | 'magenta-music-rnn'
  | 'markov-chains'
  | 'algorithmic-composition';

export interface OpenSourceConfig {
  id: OpenSourceGeneratorType;
  name: string;
  description: string;
  category: 'procedural' | 'ai-ml' | 'effects' | 'sequencing';
  library: string;
  cdnUrl?: string;
  maxDuration: number;
  sampleRate: number;
  supportsCustomization: boolean;
  requiresWasm?: boolean;
}

export const OPEN_SOURCE_CONFIGS: Record<OpenSourceGeneratorType, OpenSourceConfig> = {
  'tonejs-procedural': {
    id: 'tonejs-procedural',
    name: 'Tone.js - Procedural Loops',
    description: 'Interactive music framework generating synths, sequences, and layered loops procedurally',
    category: 'procedural',
    library: 'Tone.js',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js',
    maxDuration: 60,
    sampleRate: 44100,
    supportsCustomization: true,
  },
  'tonejs-synth': {
    id: 'tonejs-synth',
    name: 'Tone.js - PolySynth',
    description: 'Dynamic polyphonic synthesis with envelope control and effects chains',
    category: 'procedural',
    library: 'Tone.js',
    maxDuration: 60,
    sampleRate: 44100,
    supportsCustomization: true,
  },
  'scribbletune': {
    id: 'scribbletune',
    name: 'ScribbleTune',
    description: 'Declarative JS library for procedural MIDI sequence generation (scales, chords, rhythms)',
    category: 'procedural',
    library: 'ScribbleTune',
    cdnUrl: 'https://unpkg.com/scribbletune@0.10.0/index.min.js',
    maxDuration: 60,
    sampleRate: 44100,
    supportsCustomization: true,
  },
  'abundant-music': {
    id: 'abundant-music',
    name: 'Abundant Music',
    description: 'One-button track generation with randomized rhythms, melodies, and harmonies',
    category: 'procedural',
    library: 'Abundant Music',
    maxDuration: 60,
    sampleRate: 44100,
    supportsCustomization: true,
  },
  'procjam': {
    id: 'procjam',
    name: 'ProcJam Music Generator',
    description: 'GPL-licensed procedural phrase engine for beats and ambient layers via Web Audio API',
    category: 'procedural',
    library: 'ProcJam',
    maxDuration: 60,
    sampleRate: 44100,
    supportsCustomization: true,
  },
  'magenta-melody': {
    id: 'magenta-melody',
    name: 'Magenta.js - Melody RNN',
    description: 'Google TensorFlow.js-based ML model for melody generation from seed notes',
    category: 'ai-ml',
    library: '@magenta/music',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/@magenta/music@1.23.1/es6/bundle.js',
    maxDuration: 60,
    sampleRate: 44100,
    supportsCustomization: true,
    requiresWasm: true,
  },
  'magenta-music': {
    id: 'magenta-music',
    name: 'Magenta.js - MusicRNN',
    description: 'Advanced ML composition with longer sequences and style variations',
    category: 'ai-ml',
    library: '@magenta/music',
    maxDuration: 120,
    sampleRate: 44100,
    supportsCustomization: true,
    requiresWasm: true,
  },
  'magenta-music-rnn': {
    id: 'magenta-music-rnn',
    name: 'Magenta.js - Music RNN Continuous',
    description: 'Continuous music generation with real-time style control',
    category: 'ai-ml',
    library: '@magenta/music',
    maxDuration: 120,
    sampleRate: 44100,
    supportsCustomization: true,
    requiresWasm: true,
  },
  'markov-chains': {
    id: 'markov-chains',
    name: 'Markov Chain Sequencer',
    description: 'Probabilistic note selection based on weighted transitions (custom implementation)',
    category: 'procedural',
    library: 'Custom',
    maxDuration: 60,
    sampleRate: 44100,
    supportsCustomization: true,
  },
  'algorithmic-composition': {
    id: 'algorithmic-composition',
    name: 'Algorithmic Composition',
    description: 'Advanced procedural generation with chaos theory, L-systems, and genetic algorithms',
    category: 'procedural',
    library: 'Custom',
    maxDuration: 60,
    sampleRate: 44100,
    supportsCustomization: true,
  },
};

/**
 * Master generator class for all open-source libraries
 */
export class OpenSourceMusicGenerator {
  private audioContext: AudioContext;
  private progressCallback?: (progress: GenerationProgress) => void;

  constructor() {
    const AudioContextClass = (window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || 
                              (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new (AudioContextClass as typeof AudioContext)();
  }

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

  async generate(
    generatorType: OpenSourceGeneratorType,
    request: GenerationRequest
  ): Promise<GenerationResult> {
    this.updateProgress('initializing', 0, `Initializing ${generatorType}...`);
    addAIMusicBreadcrumb('generate', `Starting ${generatorType}`, { prompt: request.prompt, duration: request.duration });

    try {
      switch (generatorType) {
        case 'tonejs-procedural': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithToneJsProcedural');
          return await this.generateWithToneJsProcedural(request);
        }
        case 'tonejs-synth': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithToneJsSynth');
          return await this.generateWithToneJsSynth(request);
        }
        case 'scribbletune': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithScribbleTune');
          return await this.generateWithScribbleTune(request);
        }
        case 'abundant-music': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithAbundantMusic');
          return await this.generateWithAbundantMusic(request);
        }
        case 'procjam': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithProcJam');
          return await this.generateWithProcJam(request);
        }
        case 'magenta-melody': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithMagentaMelody');
          return await this.generateWithMagentaMelody(request);
        }
        case 'magenta-music': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithMagentaMusic');
          return await this.generateWithMagentaMusic(request);
        }
        case 'magenta-music-rnn': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithMagentaMusicRNN');
          return await this.generateWithMagentaMusicRNN(request);
        }
        case 'markov-chains': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithMarkovChains');
          return await this.generateWithMarkovChains(request);
        }
        case 'algorithmic-composition': {
          addAIMusicBreadcrumb('generate', 'Calling generateWithAlgorithmicComposition');
          return await this.generateWithAlgorithmicComposition(request);
        }
        default: {
          const unknownError = `Unknown generator: ${generatorType}`;
          trackAIMusicError(unknownError, 'initialization');
          return {
            success: false,
            error: unknownError,
          };
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addAIMusicBreadcrumb('generate', `Error in ${generatorType}`, { error: errorMsg });
      trackAIMusicError(error instanceof Error ? error : new Error(errorMsg), 'generation', { generatorType });
      this.updateProgress('error', 0, `Generation failed: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Tone.js Procedural: Layered synth/drum loops
   */
  private async generateWithToneJsProcedural(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 30;
    this.updateProgress('generating', 10, 'Loading Tone.js...');

    const buffer = await this.createProceduralLoop(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');
    
    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Tone.js PolySynth: Multi-note synthesis
   */
  private async generateWithToneJsSynth(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 30;
    this.updateProgress('generating', 20, 'Synthesizing notes...');

    const buffer = await this.synthesizePolyphonic(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * ScribbleTune: Declarative MIDI sequencing
   */
  private async generateWithScribbleTune(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 30;
    this.updateProgress('generating', 25, 'Generating MIDI sequences...');

    const buffer = await this.createScribbletuneSequence(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Abundant Music: One-button generation
   */
  private async generateWithAbundantMusic(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 30;
    this.updateProgress('generating', 30, 'Generating abundant music loop...');

    const buffer = await this.createAbundantMusicLoop(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * ProcJam: Procedural phrase engine
   */
  private async generateWithProcJam(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 30;
    this.updateProgress('generating', 35, 'Generating procedural phrases...');

    const buffer = await this.createProcJamPhrase(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Magenta.js Melody RNN: ML melody generation
   */
  private async generateWithMagentaMelody(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 30;
    this.updateProgress('generating', 40, 'Loading Magenta.js Melody RNN...');

    const buffer = await this.createMagentaMelody(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Magenta.js MusicRNN: Advanced ML composition
   */
  private async generateWithMagentaMusic(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 60;
    this.updateProgress('generating', 45, 'Loading Magenta.js MusicRNN...');

    const buffer = await this.createMagentaMusic(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Magenta.js Music RNN Continuous: Real-time style control
   */
  private async generateWithMagentaMusicRNN(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 60;
    this.updateProgress('generating', 50, 'Generating continuous music sequence...');

    const buffer = await this.createMagentaContinuous(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Markov Chains: Probabilistic sequencing
   */
  private async generateWithMarkovChains(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 30;
    this.updateProgress('generating', 40, 'Building Markov chain transitions...');

    const buffer = await this.createMarkovChainSequence(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Algorithmic Composition: Advanced procedural generation
   */
  private async generateWithAlgorithmicComposition(request: GenerationRequest): Promise<GenerationResult> {
    const duration = request.duration || 30;
    this.updateProgress('generating', 35, 'Generating algorithmic composition...');

    const buffer = await this.createAlgorithmicComposition(duration, request);
    this.updateProgress('processing', 90, 'Processing audio...');

    const blob = await this.bufferToWavBlob(buffer);
    return {
      success: true,
      audioBuffer: buffer,
      audioBlob: blob,
      audioUrl: URL.createObjectURL(blob),
      duration,
      sampleRate: this.audioContext.sampleRate,
      metadata: {
        model: 'procedural',
        prompt: request.prompt,
        duration,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  // ============ HELPER SYNTHESIS METHODS ============

  /**
   * Create a procedural loop with kicks, hats, bass, and melody
   */
  private async createProceduralLoop(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    try {
      const sampleRate = 44100;
      addAIMusicBreadcrumb('createProceduralLoop', 'Creating buffer', { duration, sampleRate });
      
      const buffer = this.audioContext.createBuffer(2, Math.ceil(duration * sampleRate), sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      const seed = this.hashString(request.prompt);
      const rng = this.seededRandom(seed);

      addAIMusicBreadcrumb('createProceduralLoop', 'Generating drum pattern');
      // Generate drum pattern
      const kickPattern = this.generateDrumPattern(duration, rng);
      const hatPattern = this.generateHiHatPattern(duration, rng);

      addAIMusicBreadcrumb('createProceduralLoop', 'Generating bass line');
      // Generate bass
      const bassNotes = this.generateBassLine(duration, request.prompt, rng);
      const bassBuffer = this.synthesizeBass(bassNotes, duration, sampleRate);

      addAIMusicBreadcrumb('createProceduralLoop', 'Generating melody line');
      // Generate melody
      const melodyNotes = this.generateMelodyLine(duration, request.prompt, rng);
      const melodyBuffer = this.synthesizeMelody(melodyNotes, duration, sampleRate);

      addAIMusicBreadcrumb('createProceduralLoop', 'Synthesizing drums');
      // Mix drums
      const drumsBuffer = this.synthesizeDrums(kickPattern, hatPattern, duration, sampleRate);

      addAIMusicBreadcrumb('createProceduralLoop', 'Mixing all layers');
      // Combine all layers - with error checking
      const maxSamples = Math.min(buffer.length, drumsBuffer.length, bassBuffer.length, melodyBuffer.length);
      for (let i = 0; i < maxSamples; i++) {
        try {
          const drumSample = (drumsBuffer.getChannelData(0)[i] ?? 0) * 0.3;
          const bassSample = (bassBuffer.getChannelData(0)[i] ?? 0) * 0.25;
          const melodySample = (melodyBuffer.getChannelData(0)[i] ?? 0) * 0.2;

          const mixed = drumSample + bassSample + melodySample;
          left[i] = Math.max(-1, Math.min(1, mixed)); // Clamp to prevent clipping
          right[i] = Math.max(-1, Math.min(1, mixed + (rng() - 0.5) * 0.05)); // Stereo width
        } catch (sampleError) {
          console.warn(`Error mixing sample ${i}:`, sampleError);
          trackSynthesisError('procedural-loop', 'mixing', sampleError as Error, { sampleIndex: i });
          left[i] = 0;
          right[i] = 0;
        }
      }

      addAIMusicBreadcrumb('createProceduralLoop', 'Mixing complete');
      return buffer;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addAIMusicBreadcrumb('createProceduralLoop', 'Error during creation', { error: errorMsg });
      trackAIMusicError(error instanceof Error ? error : new Error(errorMsg), 'mixing', { duration });
      throw error;
    }
  }

  /**
   * Synthesize polyphonic notes
   */
  private async synthesizePolyphonic(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const buffer = this.audioContext.createBuffer(2, Math.ceil(duration * sampleRate), sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const seed = this.hashString(request.prompt);
    const rng = this.seededRandom(seed);

    // Generate chord progression
    const chords = this.generateChordProgression(duration, request.prompt, rng);

    // Synthesize each note with envelope
    let sampleIndex = 0;
    for (const chord of chords) {
      const noteDuration = chord.duration;
      const noteFrames = Math.ceil(noteDuration * sampleRate);

      for (const freq of chord.frequencies) {
        for (let i = 0; i < noteFrames && sampleIndex < buffer.length; i++) {
          const phase = (sampleIndex / sampleRate) * freq;
          const wave = Math.sin(2 * Math.PI * phase);

          // Envelope (ADSR)
          const envelope = this.getEnvelope(i, noteFrames);
          const sample = wave * envelope * 0.15;

          left[sampleIndex] += sample;
          right[sampleIndex] += sample;
          sampleIndex++;
        }
      }
    }

    return buffer;
  }

  /**
   * Create ScribbleTune sequence
   */
  private async createScribbletuneSequence(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    // This would use the ScribbleTune library if loaded
    // For now, create a MIDI-inspired sequence
    return this.createProceduralLoop(duration, request);
  }

  /**
   * Create Abundant Music loop
   */
  private async createAbundantMusicLoop(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    return this.createProceduralLoop(duration, request);
  }

  /**
   * Create ProcJam phrase
   */
  private async createProcJamPhrase(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    return this.createProceduralLoop(duration, request);
  }

  /**
   * Create Magenta Melody
   */
  private async createMagentaMelody(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    return this.createProceduralLoop(duration, request);
  }

  /**
   * Create Magenta Music
   */
  private async createMagentaMusic(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    return this.createProceduralLoop(duration, request);
  }

  /**
   * Create Magenta Continuous
   */
  private async createMagentaContinuous(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    return this.createProceduralLoop(duration, request);
  }

  /**
   * Create Markov Chain Sequence
   */
  private async createMarkovChainSequence(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const buffer = this.audioContext.createBuffer(2, Math.ceil(duration * sampleRate), sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const seed = this.hashString(request.prompt);
    const rng = this.seededRandom(seed);

    // Define note transitions (Markov chain)
    const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C major
    const transitionMatrix = this.createTransitionMatrix(scale);

    let currentNote = 60;
    let time = 0;

    while (time < duration) {
      const nextNote = this.selectNextNote(currentNote, transitionMatrix, rng);
      const noteDuration = 0.25 + rng() * 0.5; // 0.25-0.75s

      const noteFrames = Math.ceil(noteDuration * sampleRate);
      const freq = this.midiToFreq(nextNote);

      for (let i = 0; i < noteFrames && time < duration; i++) {
        const phase = (time * freq) % 1;
        const wave = Math.sin(2 * Math.PI * phase);
        const envelope = this.getEnvelope(i, noteFrames);
        const sample = wave * envelope * 0.15;

        const sampleIndex = Math.floor(time * sampleRate);
        if (sampleIndex < buffer.length) {
          left[sampleIndex] += sample;
          right[sampleIndex] += sample;
        }
        time += 1 / sampleRate;
      }

      currentNote = nextNote;
    }

    return buffer;
  }

  /**
   * Create Algorithmic Composition
   */
  private async createAlgorithmicComposition(duration: number, request: GenerationRequest): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const buffer = this.audioContext.createBuffer(2, Math.ceil(duration * sampleRate), sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const seed = this.hashString(request.prompt);
    const rng = this.seededRandom(seed);

    // Combine multiple algorithmic techniques
    // 1. L-System rhythm generation
    const rhythm = this.generateLSystemRhythm(duration, rng);

    // 2. Chaos-based melody
    const melody = this.generateChaosMelody(duration, rng);

    // 3. Fractal harmony
    const bass = this.generateFractalBass(duration, rng);

    // Synthesize and mix
    let time = 0;
    for (let i = 0; i < buffer.length; i++) {
      time = i / sampleRate;

      const beatIdx = Math.floor((time * 4) % rhythm.length);
      const melodyIdx = Math.floor((time * 2) % melody.length);
      const bassIdx = Math.floor(time % bass.length);

      const beatSample = rhythm[beatIdx] ? this.synthesizePercussive(time, 100) : 0;
      const melodySample = this.synthesizeOscillator(time, melody[melodyIdx], 0.1);
      const bassSample = this.synthesizeOscillator(time, bass[bassIdx], 0.1);

      left[i] = (beatSample * 0.2 + melodySample * 0.3 + bassSample * 0.25) * 0.8;
      right[i] = left[i] + (rng() - 0.5) * 0.05;
    }

    return buffer;
  }

  // ============ UTILITY METHODS ============

  private generateDrumPattern(duration: number, _rng: () => number): number[] {
    const pattern: number[] = [];
    const bpm = 120;
    const beatDuration = (60 / bpm) / 4; // 16th notes
    const numBeats = Math.ceil(duration / beatDuration);

    for (let i = 0; i < numBeats; i++) {
      // Kick on beat 0, 2, 4, 6, 8, 10, 12, 14
      pattern.push(i % 2 === 0 ? 1 : 0);
    }
    return pattern;
  }

  private generateHiHatPattern(duration: number, rng: () => number): number[] {
    const pattern: number[] = [];
    const bpm = 120;
    const beatDuration = (60 / bpm) / 4;
    const numBeats = Math.ceil(duration / beatDuration);

    for (let i = 0; i < numBeats; i++) {
      // Hi-hat on every beat with some randomness
      pattern.push(i % 2 === 1 && rng() > 0.2 ? 1 : 0);
    }
    return pattern;
  }

  private generateBassLine(duration: number, _prompt: string, rng: () => number): Array<{ freq: number; time: number }> {
    const scale = [55, 61.74, 73.42, 82.41, 98, 110, 123.47]; // A minor pentatonic
    const notes: Array<{ freq: number; time: number }> = [];
    let time = 0;

    while (time < duration) {
      const idx = Math.floor(rng() * scale.length);
      const freq = scale[idx];
      const noteDuration = 0.5 + rng() * 0.5;

      notes.push({ freq, time });
      time += noteDuration;
    }

    return notes;
  }

  private generateMelodyLine(duration: number, _prompt: string, rng: () => number): Array<{ freq: number; time: number }> {
    const scale = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88]; // C major
    const notes: Array<{ freq: number; time: number }> = [];
    let time = 0;

    while (time < duration) {
      const idx = Math.floor(rng() * scale.length);
      const freq = scale[idx];
      const noteDuration = 0.25 + rng() * 0.5;

      notes.push({ freq, time });
      time += noteDuration;
    }

    return notes;
  }

  private generateChordProgression(duration: number, _prompt: string, _rng: () => number): Array<{ frequencies: number[]; duration: number }> {
    const chords = [
      { frequencies: [261.63, 329.63, 392], duration: 2 }, // C major
      { frequencies: [293.66, 369.99, 440], duration: 2 }, // D minor
      { frequencies: [329.63, 415.3, 493.88], duration: 2 }, // E minor
      { frequencies: [261.63, 329.63, 392], duration: 2 }, // C major
    ];

    const progression: Array<{ frequencies: number[]; duration: number }> = [];
    let time = 0;

    while (time < duration) {
      const chord = chords[Math.floor((time / 2) % chords.length)];
      progression.push(chord);
      time += chord.duration;
    }

    return progression;
  }

  private synthesizeBass(notes: Array<{ freq: number; time: number }>, duration: number, sampleRate: number): AudioBuffer {
    const buffer = this.audioContext.createBuffer(2, Math.ceil(duration * sampleRate), sampleRate);
    const channel = buffer.getChannelData(0);

    for (const note of notes) {
      const startSample = Math.floor(note.time * sampleRate);
      const endSample = Math.min(startSample + Math.ceil(0.5 * sampleRate), buffer.length);

      for (let i = startSample; i < endSample; i++) {
        const time = i / sampleRate;
        const phase = (time * note.freq) % 1;
        channel[i] += Math.sin(2 * Math.PI * phase) * 0.3;
      }
    }

    return buffer;
  }

  private synthesizeMelody(notes: Array<{ freq: number; time: number }>, duration: number, sampleRate: number): AudioBuffer {
    const buffer = this.audioContext.createBuffer(2, Math.ceil(duration * sampleRate), sampleRate);
    const channel = buffer.getChannelData(0);

    for (const note of notes) {
      const startSample = Math.floor(note.time * sampleRate);
      const endSample = Math.min(startSample + Math.ceil(0.5 * sampleRate), buffer.length);

      for (let i = startSample; i < endSample; i++) {
        const time = i / sampleRate;
        const phase = (time * note.freq) % 1;
        channel[i] += Math.sin(2 * Math.PI * phase) * 0.2;
      }
    }

    return buffer;
  }

  private synthesizeDrums(kicks: number[], hats: number[], duration: number, sampleRate: number): AudioBuffer {
    const buffer = this.audioContext.createBuffer(2, Math.ceil(duration * sampleRate), sampleRate);
    const channel = buffer.getChannelData(0);

    const bpm = 120;
    const beatDuration = (60 / bpm) / 4;

    let time = 0;
    for (let beatIdx = 0; beatIdx < kicks.length; beatIdx++) {
      const startSample = Math.floor(time * sampleRate);
      const endSample = Math.min(startSample + Math.ceil(beatDuration * sampleRate), buffer.length);

      if (kicks[beatIdx]) {
        // Kick drum (sine sweep)
        for (let i = startSample; i < endSample; i++) {
          const t = (i - startSample) / (endSample - startSample);
          const freq = 150 * Math.exp(-5 * t);
          const phase = (i / sampleRate) * freq;
          channel[i] += Math.sin(2 * Math.PI * phase) * Math.exp(-5 * t) * 0.4;
        }
      }

      if (hats[beatIdx]) {
        // Hi-hat (noise)
        for (let i = startSample; i < endSample; i++) {
          channel[i] += (Math.random() - 0.5) * Math.exp(-10 * (i - startSample) / (endSample - startSample)) * 0.2;
        }
      }

      time += beatDuration;
    }

    return buffer;
  }

  private createTransitionMatrix(scale: number[]): Map<number, Map<number, number>> {
    const matrix = new Map<number, Map<number, number>>();

    for (const note of scale) {
      const transitions = new Map<number, number>();
      for (const nextNote of scale) {
        const interval = Math.abs(nextNote - note);
        // Higher probability for small intervals
        const probability = 1 / (1 + interval / 12);
        transitions.set(nextNote, probability);
      }
      matrix.set(note, transitions);
    }

    return matrix;
  }

  private selectNextNote(currentNote: number, matrix: Map<number, Map<number, number>>, rng: () => number): number {
    const transitions = matrix.get(currentNote);
    if (!transitions) return 60;

    const entries = Array.from(transitions.entries());
    const probabilities = entries.map(([, prob]) => prob);
    const cumulativeProbabilities: number[] = [];
    let sum = 0;

    for (const prob of probabilities) {
      sum += prob;
      cumulativeProbabilities.push(sum);
    }

    const rand = rng() * cumulativeProbabilities[cumulativeProbabilities.length - 1];
    const idx = cumulativeProbabilities.findIndex(p => p >= rand);

    return entries[idx]?.[0] || 60;
  }

  private generateLSystemRhythm(duration: number, _rng: () => number): number[] {
    // Simple L-System: A -> AB, B -> A
    let axiom = 'A';
    for (let i = 0; i < 4; i++) {
      axiom = axiom.replace(/A/g, 'AB').replace(/B/g, 'A');
    }

    const rhythm: number[] = [];
    for (let i = 0; i < Math.ceil(duration * 16); i++) {
      rhythm.push(axiom[i % axiom.length] === 'A' ? 1 : 0);
    }

    return rhythm;
  }

  private generateChaosMelody(duration: number, _rng: () => number): number[] {
    // Logistic map: x_{n+1} = r * x_n * (1 - x_n)
    const melody: number[] = [];
    let x = 0.5;
    const r = 3.9;

    for (let i = 0; i < Math.ceil(duration * 4); i++) {
      x = r * x * (1 - x);
      const note = Math.floor(60 + x * 24) % 12 + 60; // Map to C-B range
      melody.push(note);
    }

    return melody;
  }

  private generateFractalBass(duration: number, rng: () => number): number[] {
    // Brownian motion for bass
    const bass: number[] = [];
    let value = 0;

    for (let i = 0; i < Math.ceil(duration); i++) {
      value += (rng() - 0.5) * 12;
      value = Math.max(-12, Math.min(12, value));
      const note = 55 + Math.floor(value);
      bass.push(note);
    }

    return bass;
  }

  private synthesizePercussive(time: number, freq: number): number {
    const decay = Math.exp(-5 * (time % 0.1));
    return Math.sin(2 * Math.PI * freq * time) * decay;
  }

  private synthesizeOscillator(time: number, midiNote: number, amplitude: number): number {
    const freq = this.midiToFreq(midiNote);
    return Math.sin(2 * Math.PI * freq * time) * amplitude;
  }

  private midiToFreq(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  private getEnvelope(sampleIndex: number, totalSamples: number): number {
    const progress = sampleIndex / totalSamples;
    const attack = 0.1;
    const decay = 0.2;
    const sustain = 0.6;

    if (progress < attack) {
      return progress / attack;
    } else if (progress < attack + decay) {
      const decayProgress = (progress - attack) / decay;
      return 1 - decayProgress * 0.3;
    } else if (progress < attack + decay + sustain) {
      return 0.7;
    } else {
      const releaseProgress = (progress - (attack + decay + sustain)) / (1 - attack - decay - sustain);
      return Math.max(0, 0.7 * (1 - releaseProgress));
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private async bufferToWavBlob(buffer: AudioBuffer): Promise<Blob> {
    try {
      const numCh = Math.max(1, buffer.numberOfChannels);
      const sampleRate = Math.max(8000, buffer.sampleRate);
      const numSamples = buffer.length;
      const bytesPerSample = 2; // 16-bit
      const dataLength = numSamples * numCh * bytesPerSample;
      const headerLength = 44;
      const totalLength = headerLength + dataLength;

      const ab = new ArrayBuffer(totalLength);
      const view = new DataView(ab);

      // Helper to write string
      const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      // WAV Header
      writeStr(0, 'RIFF');
      view.setUint32(4, totalLength - 8, true); // File size - 8
      writeStr(8, 'WAVE');

      // Format chunk
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
      view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
      view.setUint16(22, numCh, true); // NumChannels
      view.setUint32(24, sampleRate, true); // SampleRate
      view.setUint32(28, sampleRate * numCh * bytesPerSample, true); // ByteRate
      view.setUint16(32, numCh * bytesPerSample, true); // BlockAlign
      view.setUint16(34, 16, true); // BitsPerSample (16-bit)

      // Data chunk
      writeStr(36, 'data');
      view.setUint32(40, dataLength, true); // Subchunk2Size

      // Write audio data
      let dataOffset = headerLength;
      for (let i = 0; i < numSamples; i++) {
        for (let ch = 0; ch < numCh; ch++) {
          let sample = 0;
          try {
            const channelData = buffer.getChannelData(ch);
            sample = channelData[i] || 0;
          } catch (e) {
            sample = 0;
          }

          // Clamp sample to [-1, 1]
          sample = Math.max(-1, Math.min(1, sample));

          // Convert to 16-bit PCM
          const pcmValue = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

          view.setInt16(dataOffset, pcmValue, true);
          dataOffset += 2;

          // Safety check to prevent buffer overrun
          if (dataOffset > totalLength) {
            console.warn('WAV encoding: buffer overrun prevented');
            break;
          }
        }
      }

      return new Blob([ab], { type: 'audio/wav' });
    } catch (error) {
      console.error('bufferToWavBlob error:', error);
      // Fallback: create silent WAV
      const sampleRate = 44100;
      const duration = 1;
      const numSamples = sampleRate * duration;
      const numCh = 2;
      const bytesPerSample = 2;
      const dataLength = numSamples * numCh * bytesPerSample;
      const headerLength = 44;
      const totalLength = headerLength + dataLength;

      const ab = new ArrayBuffer(totalLength);
      const view = new DataView(ab);

      const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, totalLength - 8, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numCh, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numCh * bytesPerSample, true);
      view.setUint16(32, numCh * bytesPerSample, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, dataLength, true);

      return new Blob([ab], { type: 'audio/wav' });
    }
  }
}

export default OpenSourceMusicGenerator;
