export interface AudioClip {
  id: string;
  trackId: string;
  name: string;
  bufferId: string | null;
  startTime: number;
  duration: number;
  offset: number;
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
  gain: number;
  muted: boolean;
  color?: string;
  waveformPeaks?: number[];
}

export interface ClipSelection {
  clipIds: Set<string>;
  dragStartX?: number;
  dragStartY?: number;
  originalPositions?: Map<string, { startTime: number; trackId: string }>;
}

export interface ClipInteraction {
  type: 'move' | 'trim-start' | 'trim-end' | 'fade-in' | 'fade-out' | 'slip';
  clipId: string;
  startX: number;
  startY: number;
  startValue: number;
}

export interface TimelineViewport {
  scrollLeft: number;
  scrollTop: number;
  zoom: number;
  pixelsPerBeat: number;
  trackHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  gridSnap: boolean;
  snapUnit: 'bar' | 'beat' | 'grid' | 'off';
  snapValue: number;
}

export interface TrackConfig {
  id: string;
  name: string;
  type: 'audio' | 'instrument';
  height: number;
  order: number;
  color?: string;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  gain: number;
  pan: number;
  collapsed: boolean;
}

export interface TimelineState {
  tracks: Map<string, TrackConfig>;
  clips: Map<string, AudioClip>;
  selection: ClipSelection;
  viewport: TimelineViewport;
  playheadPosition: number;
  loopRegion: {
    enabled: boolean;
    start: number;
    end: number;
  };
}

export const DEFAULT_VIEWPORT: TimelineViewport = {
  scrollLeft: 0,
  scrollTop: 0,
  zoom: 1,
  pixelsPerBeat: 100,
  trackHeight: 80,
  viewportWidth: 1000,
  viewportHeight: 600,
  gridSnap: true,
  snapUnit: 'beat',
  snapValue: 0.25,
};

export const DEFAULT_TIMELINE_STATE: TimelineState = {
  tracks: new Map(),
  clips: new Map(),
  selection: {
    clipIds: new Set(),
  },
  viewport: DEFAULT_VIEWPORT,
  playheadPosition: 0,
  loopRegion: {
    enabled: false,
    start: 0,
    end: 16,
  },
};

export function createDefaultClip(
  trackId: string,
  startTime: number,
  duration: number = 2,
  bufferId: string | null = null
): AudioClip {
  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    trackId,
    name: bufferId || 'New Clip',
    bufferId,
    startTime,
    duration,
    offset: 0,
    trimStart: 0,
    trimEnd: 0,
    fadeIn: 0,
    fadeOut: 0,
    gain: 1,
    muted: false,
  };
}

export function createDefaultTrack(
  name: string,
  order: number,
  type: 'audio' | 'instrument' = 'audio'
): TrackConfig {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    height: 80,
    order,
    muted: false,
    solo: false,
    armed: false,
    gain: 0.8,
    pan: 0,
    collapsed: false,
  };
}

export class TimelineStateStore {
  private state: TimelineState = DEFAULT_TIMELINE_STATE;
  private listeners: Set<(state: TimelineState) => void> = new Set();

  getState(): TimelineState {
    return this.state;
  }

  setState(updates: Partial<TimelineState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.notifyListeners();
  }

  updateViewport(updates: Partial<TimelineViewport>): void {
    this.state = {
      ...this.state,
      viewport: {
        ...this.state.viewport,
        ...updates,
      },
    };
    this.notifyListeners();
  }

  addTrack(track: TrackConfig): void {
    const newTracks = new Map(this.state.tracks);
    newTracks.set(track.id, track);
    this.state = {
      ...this.state,
      tracks: newTracks,
    };
    this.notifyListeners();
  }

  removeTrack(trackId: string): void {
    const newTracks = new Map(this.state.tracks);
    newTracks.delete(trackId);
    const newClips = new Map(this.state.clips);
    for (const [clipId, clip] of newClips.entries()) {
      if (clip.trackId === trackId) {
        newClips.delete(clipId);
      }
    }
    this.state = {
      ...this.state,
      tracks: newTracks,
      clips: newClips,
    };
    this.notifyListeners();
  }

  updateTrack(trackId: string, updates: Partial<TrackConfig>): void {
    const track = this.state.tracks.get(trackId);
    if (track) {
      const newTracks = new Map(this.state.tracks);
      newTracks.set(trackId, { ...track, ...updates });
      this.state = {
        ...this.state,
        tracks: newTracks,
      };
      this.notifyListeners();
    }
  }

  reorderTracks(sourceId: string, targetId: string): void {
    const sourceTrack = this.state.tracks.get(sourceId);
    const targetTrack = this.state.tracks.get(targetId);
    
    if (!sourceTrack || !targetTrack) return;

    const tracks = Array.from(this.state.tracks.values()).sort((a, b) => a.order - b.order);
    const sourceIndex = tracks.findIndex(t => t.id === sourceId);
    const targetIndex = tracks.findIndex(t => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    tracks.splice(sourceIndex, 1);
    tracks.splice(targetIndex, 0, sourceTrack);

    const newTracks = new Map<string, TrackConfig>();
    tracks.forEach((track, index) => {
      newTracks.set(track.id, { ...track, order: index });
    });

    this.state = {
      ...this.state,
      tracks: newTracks,
    };
    this.notifyListeners();
  }

  addClip(clip: AudioClip): void {
    const newClips = new Map(this.state.clips);
    newClips.set(clip.id, clip);
    this.state = {
      ...this.state,
      clips: newClips,
    };
    this.notifyListeners();
  }

  removeClip(clipId: string): void {
    const newClips = new Map(this.state.clips);
    newClips.delete(clipId);
    const newSelection = new Set(this.state.selection.clipIds);
    newSelection.delete(clipId);
    this.state = {
      ...this.state,
      clips: newClips,
      selection: {
        ...this.state.selection,
        clipIds: newSelection,
      },
    };
    this.notifyListeners();
  }

  updateClip(clipId: string, updates: Partial<AudioClip>): void {
    const clip = this.state.clips.get(clipId);
    if (clip) {
      const newClips = new Map(this.state.clips);
      newClips.set(clipId, { ...clip, ...updates });
      this.state = {
        ...this.state,
        clips: newClips,
      };
      this.notifyListeners();
    }
  }

  selectClips(clipIds: string[], append: boolean = false): void {
    const newSelection = append
      ? new Set([...this.state.selection.clipIds, ...clipIds])
      : new Set(clipIds);
    this.state = {
      ...this.state,
      selection: {
        ...this.state.selection,
        clipIds: newSelection,
      },
    };
    this.notifyListeners();
  }

  clearSelection(): void {
    this.state = {
      ...this.state,
      selection: {
        clipIds: new Set(),
      },
    };
    this.notifyListeners();
  }

  setSelection(selection: ClipSelection): void {
    this.state = {
      ...this.state,
      selection: {
        ...selection,
        clipIds: new Set(selection.clipIds),
      },
    };
    this.notifyListeners();
  }

  subscribe(listener: (state: TimelineState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}
