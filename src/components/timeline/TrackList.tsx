import React, { useMemo, useState } from 'react';
import { useTimeline } from './TimelineContext';
import { TrackHeader } from './TrackHeader';

export const TrackList: React.FC = () => {
  const { state, reorderTracks } = useTimeline();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sortedTracks = useMemo(
    () => Array.from(state.tracks.values()).sort((a, b) => a.order - b.order),
    [state.tracks]
  );

  const viewportTop = state.viewport.scrollTop;
  const viewportBottom = viewportTop + state.viewport.viewportHeight;

  let paddingTop = 0;
  let paddingBottom = 0;
  let currentOffset = 0;
  const visibleTracks = [] as typeof sortedTracks;

  sortedTracks.forEach((track) => {
    const start = currentOffset;
    const end = start + track.height;

    if (end < viewportTop) {
      paddingTop += track.height;
    } else if (start > viewportBottom) {
      paddingBottom += track.height;
    } else {
      visibleTracks.push(track);
    }

    currentOffset = end;
  });

  const handleDragStart = (trackId: string) => setDraggingId(trackId);
  const handleDragEnd = () => setDraggingId(null);

  const handleDrop = (targetId: string) => {
    if (draggingId && draggingId !== targetId) {
      reorderTracks(draggingId, targetId);
    }
    setDraggingId(null);
  };

  return (
    <div className="track-list">
      {paddingTop > 0 && <div style={{ height: paddingTop }} />}
      {visibleTracks.map((track) => (
        <TrackHeader
          key={track.id}
          track={track}
          isDragging={draggingId === track.id}
          onDragStart={() => handleDragStart(track.id)}
          onDragEnd={handleDragEnd}
          onDrop={() => handleDrop(track.id)}
        />
      ))}
      {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}
    </div>
  );
};
