import type { Instrument, InstrumentPreset, InstrumentParams } from './types';

interface SamplerParams extends InstrumentParams {
  volume: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFrequency: number;
  filterQ: number;
  filterType: BiquadFilterType;
  playbackRate: number;
  rootNote: number;
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
}

interface SampleVoice {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  ampGain: GainNode;
  note: number;
  released: boolean;
}

interface SampleMapping {
  note: number;
  buffer: AudioBuffer | null;
  url: string;
  loaded: boolean;
}

export class Sampler implements Instrument {
  readonly type = 'sampler' as const;
  readonly context: AudioContext;
  readonly output: GainNode;

  private params: SamplerParams;
  private activeVoices: Map<number, SampleVoice> = new Map();
  private samples: Map<number, SampleMapping> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();

  constructor(context: AudioContext) {
    this.context = context;
    this.output = context.createGain();

    this.params = {
      volume: 0.8,
      attack: 0.001,
      decay: 0.1,
      sustain: 0.8,
      release: 0.2,
      filterFrequency: 20000,
      filterQ: 1,
      filterType: 'lowpass',
      playbackRate: 1,
      rootNote: 60,
      loopStart: 0,
      loopEnd: 0,
      loopEnabled: false,
    };

    this.output.gain.value = this.params.volume;
  }

  async loadSample(note: number, url: string): Promise<void> {
    if (this.loadingPromises.has(url)) {
      const buffer = await this.loadingPromises.get(url);
      if (buffer) {
        this.samples.set(note, { note, buffer, url, loaded: true });
      }
      return;
    }

    const loadPromise = this.fetchAndDecode(url);
    this.loadingPromises.set(url, loadPromise);

    try {
      const buffer = await loadPromise;
      this.samples.set(note, { note, buffer, url, loaded: true });
    } catch (error) {
      console.error(`Failed to load sample for note ${note}:`, error);
      this.samples.set(note, { note, buffer: null, url, loaded: false });
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  async loadMultiSamples(sampleMap: Record<number, string>): Promise<void> {
    const promises = Object.entries(sampleMap).map(([note, url]) =>
      this.loadSample(parseInt(note, 10), url)
    );
    await Promise.all(promises);
  }

  private async fetchAndDecode(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return this.context.decodeAudioData(arrayBuffer);
  }

  noteOn(note: number, velocity: number, time?: number): void {
    const when = time ?? this.context.currentTime;
    const vel = velocity / 127;

    if (this.activeVoices.has(note)) {
      this.noteOff(note, when);
    }

    const sampleMapping = this.findClosestSample(note);
    if (!sampleMapping || !sampleMapping.buffer) {
      console.warn(`No sample loaded for note ${note}`);
      return;
    }

    const source = this.context.createBufferSource();
    source.buffer = sampleMapping.buffer;
    source.loop = this.params.loopEnabled;
    source.loopStart = this.params.loopStart;
    source.loopEnd = this.params.loopEnd > 0 ? this.params.loopEnd : sampleMapping.buffer.duration;

    const pitchShift = Math.pow(2, (note - sampleMapping.note) / 12);
    source.playbackRate.value = pitchShift * this.params.playbackRate;

    const filter = this.context.createBiquadFilter();
    filter.type = this.params.filterType;
    filter.frequency.value = this.params.filterFrequency;
    filter.Q.value = this.params.filterQ;

    const ampGain = this.context.createGain();
    ampGain.gain.value = 0;

    source.connect(filter);
    filter.connect(ampGain);
    ampGain.connect(this.output);

    const { attack, decay, sustain } = this.params;
    ampGain.gain.setValueAtTime(0, when);
    ampGain.gain.linearRampToValueAtTime(vel, when + attack);
    ampGain.gain.linearRampToValueAtTime(vel * sustain, when + attack + decay);

    source.start(when);

    const voice: SampleVoice = {
      source,
      filter,
      ampGain,
      note,
      released: false,
    };

    this.activeVoices.set(note, voice);
  }

  noteOff(note: number, time?: number): void {
    const voice = this.activeVoices.get(note);
    if (!voice || voice.released) return;

    const when = time ?? this.context.currentTime;
    const { release } = this.params;

    voice.ampGain.gain.cancelScheduledValues(when);
    voice.ampGain.gain.setValueAtTime(voice.ampGain.gain.value, when);
    voice.ampGain.gain.linearRampToValueAtTime(0, when + release);

    voice.released = true;

    const stopTime = when + release;
    voice.source.stop(stopTime);

    setTimeout(() => {
      this.cleanupVoice(note);
    }, (stopTime - this.context.currentTime + 0.1) * 1000);
  }

  allNotesOff(): void {
    this.activeVoices.forEach((_, note) => this.noteOff(note));
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
      case 'filterFrequency':
        if (typeof value === 'number') {
          this.params.filterFrequency = value;
          this.activeVoices.forEach((voice) => {
            voice.filter.frequency.setValueAtTime(value, when);
          });
        }
        break;
      case 'filterQ':
        if (typeof value === 'number') {
          this.params.filterQ = value;
          this.activeVoices.forEach((voice) => {
            voice.filter.Q.setValueAtTime(value, when);
          });
        }
        break;
      case 'filterType':
        if (typeof value === 'string') {
          this.params.filterType = value as BiquadFilterType;
        }
        break;
      case 'playbackRate':
        if (typeof value === 'number') {
          this.params.playbackRate = value;
        }
        break;
      case 'loopEnabled':
        if (typeof value === 'boolean') {
          this.params.loopEnabled = value;
        }
        break;
      case 'loopStart':
      case 'loopEnd':
        if (typeof value === 'number') {
          this.params[param] = value;
        }
        break;
      case 'attack':
      case 'decay':
      case 'sustain':
      case 'release':
        if (typeof value === 'number') {
          this.params[param as 'attack' | 'decay' | 'sustain' | 'release'] = value;
        }
        break;
    }
  }

  getParam(param: string): number | string | boolean | undefined {
    return this.params[param as keyof SamplerParams] as number | string | boolean | undefined;
  }

  loadPreset(preset: InstrumentPreset): void {
    if (preset.instrumentType !== this.type) {
      throw new Error(`Preset type ${preset.instrumentType} does not match instrument type ${this.type}`);
    }
    this.params = { ...this.params, ...preset.params } as SamplerParams;
    this.output.gain.value = this.params.volume;
  }

  getPreset(): InstrumentPreset {
    return {
      id: `sampler-${Date.now()}`,
      name: 'Custom Sampler Preset',
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
    this.allNotesOff();
    this.output.disconnect();
    this.activeVoices.clear();
    this.samples.clear();
    this.loadingPromises.clear();
  }

  private findClosestSample(note: number): SampleMapping | undefined {
    if (this.samples.has(note)) {
      return this.samples.get(note);
    }

    let closest: SampleMapping | undefined;
    let minDistance = Infinity;

    this.samples.forEach((mapping) => {
      if (!mapping.loaded || !mapping.buffer) return;
      const distance = Math.abs(mapping.note - note);
      if (distance < minDistance) {
        minDistance = distance;
        closest = mapping;
      }
    });

    return closest;
  }

  private cleanupVoice(note: number): void {
    const voice = this.activeVoices.get(note);
    if (!voice) return;

    try {
      voice.source.disconnect();
      voice.filter.disconnect();
      voice.ampGain.disconnect();
    } catch (e) {
      // ignore
    }

    this.activeVoices.delete(note);
  }
}
