// Project domain models for the DAW state management

// Enums
export enum TrackType {
  AUDIO = 'audio',
  MIDI = 'midi',
  EFFECT = 'effect',
  BUS = 'bus',
  MASTER = 'master',
}

export enum EffectType {
  REVERB = 'reverb',
  DELAY = 'delay',
  COMPRESSOR = 'compressor',
  EQ = 'eq',
  DISTORTION = 'distortion',
  CHORUS = 'chorus',
  FILTER = 'filter',
  GATE = 'gate',
  LIMITER = 'limiter',
}

export enum ClipType {
  AUDIO = 'audio',
  MIDI = 'midi',
}

// Base interfaces
export interface BaseClip {
  id: string;
  name: string;
  type: ClipType;
  trackId: string;
  startTime: number; // in beats
  duration: number; // in beats
  color: string;
  muted: boolean;
  solo: boolean;
  gain: number; // 0-2
  pan: number; // -1 to 1
}

export interface AudioClip extends BaseClip {
  type: ClipType.AUDIO;
  audioFileId: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  offset: number; // sample offset within the audio file
  fadeIn: number; // in beats
  fadeOut: number; // in beats
  warping: {
    enabled: boolean;
    algorithm: 'beats' | 'tones' | 'complex' | 'complexpro' | 're-pitch';
  };
}

export interface MidiClip extends BaseClip {
  type: ClipType.MIDI;
  notes: MidiNote[];
  velocity: number; // 0-127
  quantize: number; // division (4 = 16th notes, 8 = 8th notes, etc.)
  length: number; // in beats
}

export interface MidiNote {
  id: string;
  pitch: number; // 0-127 (MIDI note number)
  velocity: number; // 0-127
  startTime: number; // relative to clip start, in beats
  duration: number; // in beats
}

export interface Effect {
  id: string;
  name: string;
  type: EffectType;
  enabled: boolean;
  bypassed: boolean;
  parameters: Record<string, number | string | boolean>;
  position: number; // position in the effect chain
}

export interface EffectChain {
  id: string;
  trackId: string;
  effects: Effect[];
}

// Track models
export interface BaseTrack {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  muted: boolean;
  solo: boolean;
  armed: boolean; // for recording
  volume: number; // 0-2, where 1 is unity gain
  pan: number; // -1 to 1
  height: number; // track height in pixels
  visible: boolean;
  locked: boolean;
  effectChainId: string;
}

export interface AudioTrack extends BaseTrack {
  type: TrackType.AUDIO;
  inputDevice?: string;
  outputDevice?: string;
  monitoring: boolean;
  inputGain: number;
  recordEnabled: boolean;
}

export interface MidiTrack extends BaseTrack {
  type: TrackType.MIDI;
  inputDevice?: string;
  outputDevice?: string;
  instrument: {
    type: 'vsti' | 'external';
    pluginId?: string;
    midiChannel: number; // 0-15
  };
  midiThru: boolean;
}

export interface EffectTrack extends BaseTrack {
  type: TrackType.EFFECT;
  receives: TrackReceive[];
}

export interface BusTrack extends BaseTrack {
  type: TrackType.BUS;
  receives: TrackReceive[];
}

export interface MasterTrack extends BaseTrack {
  type: TrackType.MASTER;
  limiter: {
    enabled: boolean;
    ceiling: number; // in dB
    release: number; // in ms
  };
}

export interface TrackReceive {
  id: string;
  sourceTrackId: string;
  amount: number; // 0-1
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
}

// Union type for all track types
export type Track =
  | AudioTrack
  | MidiTrack
  | EffectTrack
  | BusTrack
  | MasterTrack;

// Union type for all clip types
export type Clip = AudioClip | MidiClip;

// Project model
export interface Project {
  id: string;
  name: string;
  tempo: number; // BPM
  timeSignature: {
    numerator: number; // beats per measure
    denominator: number; // beat type (4 = quarter note, 8 = eighth note, etc.)
  };
  sampleRate: number;
  bitDepth: number;
  buffer: number;
  tracks: Track[];
  clips: Clip[];
  effectChains: EffectChain[];
  audioFiles: AudioFile[];
  metadata: {
    createdAt: Date;
    modifiedAt: Date;
    version: string;
    author?: string;
    description?: string;
    tags: string[];
  };
}

export interface AudioFile {
  id: string;
  name: string;
  path: string;
  size: number; // in bytes
  duration: number; // in seconds
  sampleRate: number;
  bitDepth: number;
  channels: number;
  format: string; // wav, mp3, flac, etc.
  metadata?: {
    artist?: string;
    title?: string;
    album?: string;
    genre?: string;
    year?: number;
  };
}

// Transport state
export interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  isLooping: boolean;
  isMetronomeEnabled: boolean;
  currentTime: number; // in beats
  loopStart: number; // in beats
  loopEnd: number; // in beats
  punchIn: number; // in beats
  punchOut: number; // in beats
  countIn: number; // number of bars for count-in
  playbackSpeed: number; // 1.0 = normal speed
}

// Selection state
export interface SelectionState {
  selectedTrackIds: string[];
  selectedClipIds: string[];
  selectedEffectIds: string[];
  selectionStartTime?: number;
  selectionEndTime?: number;
  selectionTrackStart?: number;
  selectionTrackEnd?: number;
}

// Grid settings
export interface GridSettings {
  snapEnabled: boolean;
  snapDivision: number; // division for snapping (4 = 16th notes, etc.)
  gridDivision: number; // visual grid division
  showGrid: boolean;
  showTimeRuler: boolean;
  showTrackNumbers: boolean;
  zoomHorizontal: number; // pixels per beat
  zoomVertical: number; // pixels per track
  scrollPosition: {
    x: number; // horizontal scroll in pixels
    y: number; // vertical scroll in pixels
  };
}

// History state for undo/redo
export interface HistoryState {
  past: Project[];
  present: Project;
  future: Project[];
  maxSize: number;
}

// Main application state
export interface AppState {
  project: Project;
  transport: TransportState;
  selection: SelectionState;
  grid: GridSettings;
  history: HistoryState;
  ui: {
    showMixer: boolean;
    showBrowser: boolean;
    showInspector: boolean;
    showAutomation: boolean;
    focusedPanel?:
      | 'timeline'
      | 'mixer'
      | 'browser'
      | 'inspector'
      | 'automation';
  };
}
