import type { Instrument, InstrumentPreset, InstrumentParams, DrumPad, DrumPattern } from './types';

interface DrumVoice {
  buffer: AudioBuffer | null;
  gain: GainNode;
  pan?: StereoPannerNode;
}

interface DrumMachineParams extends InstrumentParams {
  volume: number;
  swing: number;
  stepLength: number;
  patternLength: number;
  pads: DrumPad[];
  padVolumes: Record<number, number>;
  padPans: Record<number, number>;
}

export class DrumMachine implements Instrument {
  readonly type = 'drums' as const;
  readonly context: AudioContext;
  readonly output: GainNode;

  private params: DrumMachineParams;
  private padVoices: Map<number, DrumVoice> = new Map();
  private patterns: Map<string, DrumPattern> = new Map();
  private currentPatternId: string | null = null;
  private samples: Map<number, AudioBuffer> = new Map();
  private loading: Map<string, Promise<AudioBuffer>> = new Map();
  private stepIndex = 0;
  private isPlayingPattern = false;
  private nextStepTime = 0;

  constructor(context: AudioContext) {
    this.context = context;
    this.output = context.createGain();

    this.params = {
      volume: 0.8,
      swing: 0,
      stepLength: 0.25,
      patternLength: 16,
      pads: [
        { note: 36, name: 'Kick', color: '#f97316' },
        { note: 38, name: 'Snare', color: '#f43f5e' },
        { note: 42, name: 'Closed Hat', color: '#14b8a6' },
        { note: 46, name: 'Open Hat', color: '#3b82f6' },
      ],
      padVolumes: {},
      padPans: {},
    };

    this.params.pads.forEach((pad) => {
      this.params.padVolumes[pad.note] = 0.8;
      this.params.padPans[pad.note] = 0;
    });

    this.output.gain.value = this.params.volume;
  }

  async loadPadSample(note: number, url: string): Promise<void> {
    if (this.loading.has(url)) {
      const buffer = await this.loading.get(url);
      if (buffer) {
        this.samples.set(note, buffer);
      }
      return;
    }

    const loadPromise = this.fetchAndDecode(url);
    this.loading.set(url, loadPromise);

    try {
      const buffer = await loadPromise;
      this.samples.set(note, buffer);
    } catch (error) {
      console.error(`Failed to load drum sample for note ${note}`, error);
    } finally {
      this.loading.delete(url);
    }
  }

  setPattern(pattern: DrumPattern): void {
    this.patterns.set(pattern.id, pattern);
    this.currentPatternId = pattern.id;
  }

  setActivePattern(patternId: string): void {
    if (!this.patterns.has(patternId)) {
      throw new Error(`Pattern ${patternId} not found`);
    }
    this.currentPatternId = patternId;
    this.stepIndex = 0;
  }

  startPattern(startTime?: number): void {
    if (!this.currentPatternId) return;
    this.isPlayingPattern = true;
    this.stepIndex = 0;
    this.nextStepTime = startTime ?? this.context.currentTime;
  }

  stopPattern(): void {
    this.isPlayingPattern = false;
  }

  schedulePattern(scheduler: (time: number, callback: () => void) => void): void {
    if (!this.isPlayingPattern || !this.currentPatternId) return;

    const pattern = this.patterns.get(this.currentPatternId);
    if (!pattern) return;

    const stepDuration = this.params.stepLength;
    const swingAmount = Math.max(0, Math.min(this.params.swing, 0.75));

    while (this.nextStepTime < this.context.currentTime + 0.2) {
      const step = this.stepIndex % pattern.steps;
      const isSwingStep = step % 2 === 1;
      const swingOffset = isSwingStep ? stepDuration * swingAmount : 0;
      const scheduledTime = this.nextStepTime + swingOffset;

      pattern.pads.forEach((steps, note) => {
        if (steps[step]) {
          scheduler(scheduledTime, () => this.triggerPad(note, 100, scheduledTime));
        }
      });

      this.nextStepTime += stepDuration;
      this.stepIndex += 1;

      if (this.stepIndex >= pattern.steps) {
        this.stepIndex = 0;
      }
    }
  }

  noteOn(note: number, velocity: number, time?: number): void {
    this.triggerPad(note, velocity, time);
  }

  noteOff(): void {
    // Drum hits are one-shot
  }

  allNotesOff(): void {
    // Nothing to stop explicitly
  }

  setParam(param: string, value: number | string | boolean, time?: number): void {
    const when = time ?? this.context.currentTime;

    switch (param) {
      case 'volume':
        if (typeof value === 'number') {
          this.params.volume = value;
          this.output.gain.setValueAtTime(value, when);
        }
        break;
      case 'swing':
        if (typeof value === 'number') {
          this.params.swing = value;
        }
        break;
      case 'stepLength':
        if (typeof value === 'number') {
          this.params.stepLength = value;
        }
        break;
      case 'patternLength':
        if (typeof value === 'number') {
          this.params.patternLength = value;
        }
        break;
      default:
        if (param.startsWith('padVolume-') && typeof value === 'number') {
          const note = parseInt(param.split('-')[1] ?? '0', 10);
          this.params.padVolumes[note] = value;
        }
        if (param.startsWith('padPan-') && typeof value === 'number') {
          const note = parseInt(param.split('-')[1] ?? '0', 10);
          this.params.padPans[note] = value;
        }
        break;
    }
  }

  getParam(param: string): number | string | boolean | undefined {
    if (param.startsWith('padVolume-')) {
      const note = parseInt(param.split('-')[1] ?? '0', 10);
      return this.params.padVolumes[note] ?? 0;
    }
    if (param.startsWith('padPan-')) {
      const note = parseInt(param.split('-')[1] ?? '0', 10);
      return this.params.padPans[note] ?? 0;
    }
    return this.params[param as keyof DrumMachineParams] as number | string | boolean | undefined;
  }

  loadPreset(preset: InstrumentPreset): void {
    if (preset.instrumentType !== this.type) {
      throw new Error(`Preset type ${preset.instrumentType} does not match instrument type ${this.type}`);
    }
    this.params = { ...this.params, ...preset.params } as DrumMachineParams;
    this.output.gain.value = this.params.volume;
  }

  getPreset(): InstrumentPreset {
    return {
      id: `drum-${Date.now()}`,
      name: 'Custom Drum Preset',
      instrumentType: this.type,
      params: { ...this.params },
    };
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }

  dispose(): void {
    this.output.disconnect();
    this.samples.clear();
    this.padVoices.clear();
    this.patterns.clear();
  }

  private triggerPad(note: number, velocity: number, time?: number): void {
    const buffer = this.samples.get(note);
    if (!buffer) {
      console.warn(`No drum sample loaded for note ${note}`);
      return;
    }

    const when = time ?? this.context.currentTime;
    const vel = velocity / 127;

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const gain = this.context.createGain();
    const padVolume = this.params.padVolumes[note] ?? 0.8;
    gain.gain.value = vel * padVolume;

    let panNode: StereoPannerNode | undefined;
    if (this.context.createStereoPanner) {
      panNode = this.context.createStereoPanner();
      panNode.pan.value = this.params.padPans[note] ?? 0;
      source.connect(gain);
      gain.connect(panNode);
      panNode.connect(this.output);
    } else {
      source.connect(gain);
      gain.connect(this.output);
    }

    source.start(when);

    const voice: DrumVoice = {
      buffer,
      gain,
      pan: panNode,
    };
    this.padVoices.set(note, voice);

    setTimeout(() => {
      try {
        source.disconnect();
        gain.disconnect();
        panNode?.disconnect();
      } catch (e) {
        // ignore
      }
      this.padVoices.delete(note);
    }, buffer.duration * 1000 + 50);
  }

  private async fetchAndDecode(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return this.context.decodeAudioData(arrayBuffer);
  }
}
