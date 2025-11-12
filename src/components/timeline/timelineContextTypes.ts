import { createContext } from 'react';
import {
  TimelineStateStore,
  TimelineState,
  TimelineViewport,
  AudioClip,
  TrackConfig,
  ClipSelection,
} from '../../audio/clips';

export interface TimelineContextValue {
  state: TimelineState;
  store: TimelineStateStore;
  addTrack: (track: TrackConfig) => void;
  updateTrack: (trackId: string, updates: Partial<TrackConfig>) => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (sourceId: string, targetId: string) => void;
  addClip: (clip: AudioClip) => void;
  updateClip: (clipId: string, updates: Partial<AudioClip>) => void;
  removeClip: (clipId: string) => void;
  selectClips: (clipIds: string[], append?: boolean) => void;
  clearSelection: () => void;
  updateViewport: (updates: Partial<TimelineViewport>) => void;
  setSelectionState: (selection: ClipSelection) => void;
  setSelection: (selection: ClipSelection) => void;
}

export const TimelineContext = createContext<TimelineContextValue | null>(null);
