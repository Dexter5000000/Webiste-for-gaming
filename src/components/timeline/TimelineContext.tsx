import React, { useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { TimelineStateStore } from '../../audio/clips';
import { TimelineContext, TimelineContextValue } from './timelineContextTypes';
// Re-export for backward compatibility with files that import from TimelineContext
import { useTimeline as _useTimeline } from './useTimeline';
// eslint-disable-next-line react-refresh/only-export-components
export const useTimeline = _useTimeline;

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
