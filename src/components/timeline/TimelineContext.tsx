import React, { createContext, useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import {
  TimelineStateStore,
  TimelineState,
  TimelineViewport,
  AudioClip,
  TrackConfig,
  ClipSelection,
} from '../../audio/clips';

interface TimelineContextValue {
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

const TimelineContext = createContext<TimelineContextValue | null>(null);

export const TimelineProvider: React.FC<{ store: TimelineStateStore; children: React.ReactNode }>
  = ({ store, children }) => {
  const subscribe = (onStoreChange: () => void) =>
    store.subscribe(() => {
      onStoreChange();
    });
  const getSnapshot = () => store.getState();

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const value = useMemo<TimelineContextValue>(() => ({
    state,
    store,
    addTrack: (track) => store.addTrack(track),
    updateTrack: (trackId, updates) => store.updateTrack(trackId, updates),
    removeTrack: (trackId) => store.removeTrack(trackId),
    reorderTracks: (sourceId, targetId) => store.reorderTracks(sourceId, targetId),
    addClip: (clip) => store.addClip(clip),
    updateClip: (clipId, updates) => store.updateClip(clipId, updates),
    removeClip: (clipId) => store.removeClip(clipId),
    selectClips: (clipIds, append = false) => store.selectClips(clipIds, append),
    clearSelection: () => store.clearSelection(),
    updateViewport: (updates) => store.updateViewport(updates),
    setSelectionState: (selection) => {
      store.setSelection(selection);
    },
    setSelection: (selection) => store.setSelection(selection),
  }), [state, store]);

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
};

export function useTimeline(): TimelineContextValue {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}
