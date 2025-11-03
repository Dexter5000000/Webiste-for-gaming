export interface InstrumentVoice {
  noteOn(note: number, velocity: number, time?: number): void;
  noteOff(note: number, time?: number): void;
  dispose(): void;
}

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface FilterParams {
  type: BiquadFilterType;
  frequency: number;
  Q: number;
}

export interface LFOParams {
  rate: number;
  amount: number;
  destination: 'pitch' | 'filter' | 'amplitude';
}

export interface InstrumentParams {
  volume: number;
  [key: string]: number | string | boolean | ADSREnvelope | FilterParams | LFOParams;
}

export interface InstrumentPreset {
  id: string;
  name: string;
  instrumentType: InstrumentType;
  params: InstrumentParams;
  author?: string;
  description?: string;
  tags?: string[];
}

export type InstrumentType = 'subtractive' | 'fm' | 'sampler' | 'drums';

export interface Instrument {
  readonly type: InstrumentType;
  readonly context: AudioContext;
  readonly output: GainNode;
  
  setParam(param: string, value: number | string | boolean, time?: number): void;
  getParam(param: string): number | string | boolean | undefined;
  
  noteOn(note: number, velocity: number, time?: number): void;
  noteOff(note: number, time?: number): void;
  
  allNotesOff(): void;
  
  loadPreset(preset: InstrumentPreset): void;
  getPreset(): InstrumentPreset;
  
  connect(destination: AudioNode): void;
  disconnect(): void;
  
  dispose(): void;
}

export interface DrumPad {
  note: number;
  name: string;
  sampleUrl?: string;
  color?: string;
}

export interface DrumPattern {
  id: string;
  name: string;
  steps: number;
  beatDivision: number;
  pads: Map<number, boolean[]>;
}
