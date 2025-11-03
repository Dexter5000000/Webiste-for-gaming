export type TransportState = 'stopped' | 'playing' | 'paused';

export type AudioEngineListener = (state: AudioEngineState) => void;

export interface EffectState {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface EffectChainState {
  id: string;
  effects: EffectState[];
  level: number;
}

export interface AudioEngineState {
  transport: {
    state: TransportState;
    position: number;
    tempo: number;
    loop: boolean;
    loopStart: number;
    loopEnd: number;
  };
  tracks: Map<string, TrackState>;
  masterGain: number;
  metronomeEnabled: boolean;
  effects: {
    master: EffectChainState;
    tracks: Record<string, EffectChainState>;
  };
}

export interface TrackState {
  id: string;
  name: string;
  type: 'audio' | 'instrument';
  gain: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  sends: Map<string, number>;
}

export class AudioStateStore {
  private state: AudioEngineState;
  private listeners: Set<AudioEngineListener>;

  constructor() {
    this.state = {
      transport: {
        state: 'stopped',
        position: 0,
        tempo: 120,
        loop: false,
        loopStart: 0,
        loopEnd: 16,
      },
      tracks: new Map(),
      masterGain: 0.8,
      metronomeEnabled: false,
      effects: {
        master: {
          id: 'master',
          effects: [],
          level: 1,
        },
        tracks: {},
      },
    };
    this.listeners = new Set();
  }

  getState(): AudioEngineState {
    return this.state;
  }

  setState(updates: Partial<AudioEngineState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.notifyListeners();
  }

  updateTransport(updates: Partial<AudioEngineState['transport']>): void {
    this.state.transport = {
      ...this.state.transport,
      ...updates,
    };
    this.notifyListeners();
  }

  addTrack(track: TrackState): void {
    this.state.tracks.set(track.id, track);
    this.notifyListeners();
  }

  removeTrack(trackId: string): void {
    this.state.tracks.delete(trackId);
    this.notifyListeners();
  }

  updateTrack(trackId: string, updates: Partial<TrackState>): void {
    const track = this.state.tracks.get(trackId);
    if (track) {
      this.state.tracks.set(trackId, { ...track, ...updates });
      this.notifyListeners();
    }
  }

  subscribe(listener: AudioEngineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Effects management methods
  setEffectsState(effectsState: AudioEngineState['effects']): void {
    this.state.effects = effectsState;
    this.notifyListeners();
  }

  updateMasterEffectChain(updates: Partial<EffectChainState>): void {
    this.state.effects.master = {
      ...this.state.effects.master,
      ...updates,
    };
    this.notifyListeners();
  }

  updateTrackEffectChain(trackId: string, updates: Partial<EffectChainState>): void {
    if (!this.state.effects.tracks[trackId]) {
      this.state.effects.tracks[trackId] = {
        id: `track-${trackId}`,
        effects: [],
        level: 1,
      };
    }
    this.state.effects.tracks[trackId] = {
      ...this.state.effects.tracks[trackId],
      ...updates,
    };
    this.notifyListeners();
  }

  removeTrackEffectChain(trackId: string): void {
    delete this.state.effects.tracks[trackId];
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}
