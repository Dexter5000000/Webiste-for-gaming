import type { Instrument, InstrumentPreset, InstrumentParams } from './types';

interface FMSynthParams extends InstrumentParams {
  volume: number;
  carrierType: OscillatorType;
  modulatorType: OscillatorType;
  carrierRatio: number;
  modulatorRatio: number;
  modulationIndex: number;
  feedback: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

interface FMVoice {
  carrier: OscillatorNode;
  modulator: OscillatorNode;
  modGain: GainNode;
  ampGain: GainNode;
  note: number;
  released: boolean;
}

export class FMSynth implements Instrument {
  readonly type = 'fm' as const;
  readonly context: AudioContext;
  readonly output: GainNode;

  private params: FMSynthParams;
  private activeVoices: Map<number, FMVoice> = new Map();

  constructor(context: AudioContext) {
    this.context = context;
    this.output = context.createGain();

    this.params = {
      volume: 0.6,
      carrierType: 'sine',
      modulatorType: 'sine',
      carrierRatio: 1,
      modulatorRatio: 2,
      modulationIndex: 150,
      feedback: 0,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.5,
      release: 0.4,
    };

    this.output.gain.value = this.params.volume;
  }

  noteOn(note: number, velocity: number, time?: number): void {
    const when = time ?? this.context.currentTime;
    const freq = this.midiNoteToFrequency(note);
    const vel = velocity / 127;

    if (this.activeVoices.has(note)) {
      this.noteOff(note, when);
    }

    const carrier = this.context.createOscillator();
    carrier.type = this.params.carrierType;
    carrier.frequency.value = freq * this.params.carrierRatio;

    const modulator = this.context.createOscillator();
    modulator.type = this.params.modulatorType;
    modulator.frequency.value = freq * this.params.modulatorRatio;

    const modGain = this.context.createGain();
    modGain.gain.value = this.params.modulationIndex;

    const ampGain = this.context.createGain();
    ampGain.gain.value = 0;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    carrier.connect(ampGain);
    ampGain.connect(this.output);

    carrier.start(when);
    modulator.start(when);

    const { attack, decay, sustain } = this.params;
    ampGain.gain.setValueAtTime(0, when);
    ampGain.gain.linearRampToValueAtTime(vel, when + attack);
    ampGain.gain.linearRampToValueAtTime(vel * sustain, when + attack + decay);

    this.activeVoices.set(note, {
      carrier,
      modulator,
      modGain,
      ampGain,
      note,
      released: false,
    });
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
    voice.carrier.stop(stopTime);
    voice.modulator.stop(stopTime);

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
      case 'carrierType':
        if (typeof value === 'string') {
          this.params.carrierType = value as OscillatorType;
        }
        break;
      case 'modulatorType':
        if (typeof value === 'string') {
          this.params.modulatorType = value as OscillatorType;
        }
        break;
      case 'carrierRatio':
        if (typeof value === 'number') {
          this.params.carrierRatio = value;
          this.activeVoices.forEach((voice) => {
            voice.carrier.frequency.setValueAtTime(
              this.midiNoteToFrequency(voice.note) * value,
              when
            );
          });
        }
        break;
      case 'modulatorRatio':
        if (typeof value === 'number') {
          this.params.modulatorRatio = value;
          this.activeVoices.forEach((voice) => {
            voice.modulator.frequency.setValueAtTime(
              this.midiNoteToFrequency(voice.note) * value,
              when
            );
          });
        }
        break;
      case 'modulationIndex':
        if (typeof value === 'number') {
          this.params.modulationIndex = value;
          this.activeVoices.forEach((voice) => {
            voice.modGain.gain.setValueAtTime(value, when);
          });
        }
        break;
      case 'feedback':
        if (typeof value === 'number') {
          this.params.feedback = value;
          // Feedback would require a delay line; simplified placeholder
        }
        break;
      case 'attack':
      case 'decay':
      case 'sustain':
      case 'release':
        if (typeof value === 'number') {
          this.params[param as keyof Pick<FMSynthParams, 'attack' | 'decay' | 'sustain' | 'release'>] = value;
        }
        break;
    }
  }

  getParam(param: string): number | string | boolean | undefined {
    return this.params[param as keyof FMSynthParams] as number | string | boolean | undefined;
  }

  loadPreset(preset: InstrumentPreset): void {
    if (preset.instrumentType !== this.type) {
      throw new Error(`Preset type ${preset.instrumentType} does not match instrument type ${this.type}`);
    }
    this.params = { ...this.params, ...preset.params } as FMSynthParams;
    this.output.gain.value = this.params.volume;
  }

  getPreset(): InstrumentPreset {
    return {
      id: `fm-${Date.now()}`,
      name: 'Custom FM Preset',
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
  }

  private cleanupVoice(note: number): void {
    const voice = this.activeVoices.get(note);
    if (!voice) return;

    try {
      voice.carrier.disconnect();
      voice.modulator.disconnect();
      voice.modGain.disconnect();
      voice.ampGain.disconnect();
    } catch (e) {
      // ignore
    }

    this.activeVoices.delete(note);
  }

  private midiNoteToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }
}
