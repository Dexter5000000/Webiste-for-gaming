// DAW-specific types

export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'instrument';
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  selected: boolean;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  name: string;
  start: number;
  length: number;
  color: string;
}

export interface MixerChannel {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  color: string;
}

export interface AudioSettings {
  sampleRate: number;
  bufferSize: number;
  inputDevice?: string;
  outputDevice?: string;
}

export interface ProjectSettings {
  name: string;
  tempo: number;
  timeSignature: string;
  sampleRate: number;
}