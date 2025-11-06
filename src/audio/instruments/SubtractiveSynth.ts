import type { Instrument, InstrumentPreset, InstrumentParams, ADSREnvelope } from './types';

interface SubtractiveSynthParams extends InstrumentParams {
  volume: number;
  oscillatorType: OscillatorType;
  oscillator2Type: OscillatorType;
  oscillator2Detune: number;
  oscillator2Mix: number;
  filterType: BiquadFilterType;
  filterFrequency: number;
  filterQ: number;
  filterEnvAmount: number;
  ampEnvelope: ADSREnvelope;
  filterEnvelope: ADSREnvelope;
  lfoRate: number;
  lfoAmount: number;
  lfoDestination: 'pitch' | 'filter' | 'amplitude';
}

interface Voice {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  osc2Gain: GainNode;
  mixer: GainNode;
  filter: BiquadFilterNode;
  ampGain: GainNode;
  note: number;
  startTime: number;
  released: boolean;
}

export class SubtractiveSynth implements Instrument {
  readonly type = 'subtractive' as const;
  readonly context: AudioContext;
  readonly output: GainNode;

  private params: SubtractiveSynthParams;
  private activeVoices: Map<number, Voice> = new Map();
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  constructor(context: AudioContext) {
    this.context = context;
    this.output = context.createGain();

    this.params = {
      volume: 0.7,
      oscillatorType: 'sawtooth',
      oscillator2Type: 'square',
      oscillator2Detune: -7,
      oscillator2Mix: 0.3,
      filterType: 'lowpass',
      filterFrequency: 2000,
      filterQ: 1,
      filterEnvAmount: 2000,
      ampEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
      lfoRate: 5,
      lfoAmount: 0,
      lfoDestination: 'filter',
    };

    this.output.gain.value = this.params.volume;
    this.initializeLFO();
  }

  private initializeLFO(): void {
    if (this.lfo) {
      this.lfo.stop();
      this.lfo.disconnect();
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
    }

    this.lfo = this.context.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.params.lfoRate;

    this.lfoGain = this.context.createGain();
    this.lfoGain.gain.value = this.params.lfoAmount;

    this.lfo.connect(this.lfoGain);
    this.lfo.start();
  }

  noteOn(note: number, velocity: number, time?: number): void {
    const when = time ?? this.context.currentTime;
    const freq = this.midiNoteToFrequency(note);
    const vel = velocity / 127;

    if (this.activeVoices.has(note)) {
      this.noteOff(note, when);
    }

    const osc1 = this.context.createOscillator();
    osc1.type = this.params.oscillatorType;
    osc1.frequency.value = freq;

    const osc2 = this.context.createOscillator();
    osc2.type = this.params.oscillator2Type;
    osc2.frequency.value = freq;
    osc2.detune.value = this.params.oscillator2Detune * 100;

    const osc2Gain = this.context.createGain();
    osc2Gain.gain.value = this.params.oscillator2Mix;

    const mixer = this.context.createGain();
    mixer.gain.value = 1 - this.params.oscillator2Mix;

    const filter = this.context.createBiquadFilter();
    filter.type = this.params.filterType;
    filter.frequency.value = this.params.filterFrequency;
    filter.Q.value = this.params.filterQ;

    const ampGain = this.context.createGain();
    ampGain.gain.value = 0;

    osc1.connect(mixer);
    osc2.connect(osc2Gain);
    osc2Gain.connect(mixer);
    mixer.connect(filter);
    filter.connect(ampGain);
    ampGain.connect(this.output);

    if (this.lfoGain && this.params.lfoAmount > 0) {
      if (this.params.lfoDestination === 'filter') {
        this.lfoGain.connect(filter.frequency);
      } else if (this.params.lfoDestination === 'pitch') {
        this.lfoGain.connect(osc1.detune);
        this.lfoGain.connect(osc2.detune);
      } else if (this.params.lfoDestination === 'amplitude') {
        this.lfoGain.connect(ampGain.gain);
      }
    }

    const { attack, decay, sustain } = this.params.ampEnvelope;
    const filterEnv = this.params.filterEnvelope;

    ampGain.gain.setValueAtTime(0, when);
    ampGain.gain.linearRampToValueAtTime(vel, when + attack);
    ampGain.gain.linearRampToValueAtTime(vel * sustain, when + attack + decay);

    const filterPeak = this.params.filterFrequency + this.params.filterEnvAmount;
    filter.frequency.setValueAtTime(this.params.filterFrequency, when);
    filter.frequency.linearRampToValueAtTime(filterPeak, when + filterEnv.attack);
    filter.frequency.linearRampToValueAtTime(
      this.params.filterFrequency + this.params.filterEnvAmount * filterEnv.sustain,
      when + filterEnv.attack + filterEnv.decay
    );

    osc1.start(when);
    osc2.start(when);

    const voice: Voice = {
      osc1,
      osc2,
      osc2Gain,
      mixer,
      filter,
      ampGain,
      note,
      startTime: when,
      released: false,
    };

    this.activeVoices.set(note, voice);
  }

  noteOff(note: number, time?: number): void {
    const voice = this.activeVoices.get(note);
    if (!voice || voice.released) return;

    const when = time ?? this.context.currentTime;
    const { release } = this.params.ampEnvelope;
    const filterRelease = this.params.filterEnvelope.release;

    voice.ampGain.gain.cancelScheduledValues(when);
    voice.ampGain.gain.setValueAtTime(voice.ampGain.gain.value, when);
    voice.ampGain.gain.linearRampToValueAtTime(0, when + release);

    voice.filter.frequency.cancelScheduledValues(when);
    voice.filter.frequency.setValueAtTime(voice.filter.frequency.value, when);
    voice.filter.frequency.linearRampToValueAtTime(
      this.params.filterFrequency,
      when + filterRelease
    );

    voice.released = true;

    const stopTime = when + Math.max(release, filterRelease);
    voice.osc1.stop(stopTime);
    voice.osc2.stop(stopTime);

    setTimeout(() => {
      this.cleanupVoice(note);
    }, (stopTime - this.context.currentTime + 0.1) * 1000);
  }

  allNotesOff(): void {
    this.activeVoices.forEach((_, note) => {
      this.noteOff(note);
    });
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
      case 'oscillatorType':
        if (typeof value === 'string') {
          this.params.oscillatorType = value as OscillatorType;
        }
        break;
      case 'oscillator2Type':
        if (typeof value === 'string') {
          this.params.oscillator2Type = value as OscillatorType;
        }
        break;
      case 'oscillator2Detune':
        if (typeof value === 'number') {
          this.params.oscillator2Detune = value;
          this.activeVoices.forEach((voice) => {
            voice.osc2.detune.setValueAtTime(value * 100, when);
          });
        }
        break;
      case 'oscillator2Mix':
        if (typeof value === 'number') {
          this.params.oscillator2Mix = value;
          this.activeVoices.forEach((voice) => {
            voice.osc2Gain.gain.setValueAtTime(value, when);
            voice.mixer.gain.setValueAtTime(1 - value, when);
          });
        }
        break;
      case 'filterFrequency':
        if (typeof value === 'number') {
          this.params.filterFrequency = value;
          this.activeVoices.forEach((voice) => {
            if (!voice.released) {
              voice.filter.frequency.setValueAtTime(value, when);
            }
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
      case 'filterEnvAmount':
        if (typeof value === 'number') {
          this.params.filterEnvAmount = value;
        }
        break;
      case 'lfoRate':
        if (typeof value === 'number' && this.lfo) {
          this.params.lfoRate = value;
          this.lfo.frequency.setValueAtTime(value, when);
        }
        break;
      case 'lfoAmount':
        if (typeof value === 'number' && this.lfoGain) {
          this.params.lfoAmount = value;
          this.lfoGain.gain.setValueAtTime(value, when);
        }
        break;
    }
  }

  getParam(param: string): number | string | boolean | undefined {
    return this.params[param as keyof SubtractiveSynthParams] as number | string | boolean | undefined;
  }

  loadPreset(preset: InstrumentPreset): void {
    if (preset.instrumentType !== this.type) {
      throw new Error(`Preset type ${preset.instrumentType} does not match instrument type ${this.type}`);
    }
    this.params = { ...this.params, ...preset.params };
    this.output.gain.value = this.params.volume;
    this.initializeLFO();
  }

  getPreset(): InstrumentPreset {
    return {
      id: `subtractive-${Date.now()}`,
      name: 'Custom Preset',
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
    if (this.lfo) {
      this.lfo.stop();
      this.lfo.disconnect();
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
    }
    this.output.disconnect();
    this.activeVoices.clear();
  }

  private cleanupVoice(note: number): void {
    const voice = this.activeVoices.get(note);
    if (!voice) return;

    try {
      voice.osc1.disconnect();
      voice.osc2.disconnect();
      voice.osc2Gain.disconnect();
      voice.mixer.disconnect();
      voice.filter.disconnect();
      voice.ampGain.disconnect();
    } catch (e) {
      // Ignore disconnection errors
    }

    this.activeVoices.delete(note);
  }

  private midiNoteToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }
}
