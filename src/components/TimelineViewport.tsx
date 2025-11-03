import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import type { TimelineClip } from '../types';

interface TimelineViewportProps {
  playheadPosition: number;
  zoomLevel: number;
  tracks: Array<{ id: string; name: string }>;
  clips: TimelineClip[];
  onClipMove?: (clipId: string, newTrackId: string, newStartTime: number) => void;
  onClipResize?: (clipId: string, newStartTime: number, newDuration: number) => void;
  onClipSelect?: (clipId: string, multi?: boolean) => void;
}

const TOTAL_BARS = 16;
const BEATS_PER_BAR = 4;

const TimelineViewport = memo(function TimelineViewport({
  playheadPosition,
  zoomLevel,
  tracks,
  clips,
  onClipMove,
  onClipResize,
  onClipSelect,
}: TimelineViewportProps) {
  const pixelsPerBeat = 48 * zoomLevel;
  const totalBeats = TOTAL_BARS * BEATS_PER_BAR;
  const canvasWidth = Math.max(totalBeats * pixelsPerBeat, 960);

  // Drag state
  const [dragState, setDragState] = useState<{
    clipId: string | null;
    type: 'move' | 'resize-left' | 'resize-right' | null;
    startX: number;
    startY: number;
    originalStartTime: number;
    originalDuration: number;
    originalTrackId: string;
  }>({
    clipId: null,
    type: null,
    startX: 0,
    startY: 0,
    originalStartTime: 0,
    originalDuration: 0,
    originalTrackId: '',
  });

  const rulerMarkers = useMemo(() => {
    return Array.from({ length: TOTAL_BARS + 1 }, (_, index) => ({
      bar: index + 1,
      position: index * BEATS_PER_BAR * pixelsPerBeat,
    }));
  }, [pixelsPerBeat]);

  // Drag handlers
  const handleClipMouseDown = useCallback((
    event: React.MouseEvent,
    clipId: string,
    clip: TimelineClip,
    type: 'move' | 'resize-left' | 'resize-right'
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    setDragState({
      clipId,
      type,
      startX: event.clientX,
      startY: event.clientY,
      originalStartTime: clip.start,
      originalDuration: clip.length,
      originalTrackId: clip.trackId,
    });

    if (onClipSelect) {
      onClipSelect(clipId, event.ctrlKey || event.metaKey);
    }
  }, [onClipSelect]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.clipId || !dragState.type) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaBeats = deltaX / pixelsPerBeat;
    
    const clip = clips.find(c => c.id === dragState.clipId);
    if (!clip) return;

    if (dragState.type === 'move') {
      // Calculate new track based on Y position
      const trackHeight = 60; // pixels per track
      const trackIndex = Math.floor(event.clientY / trackHeight);
      const newTrackId = tracks[trackIndex]?.id || dragState.originalTrackId;
      
      const newStartTime = Math.max(0, dragState.originalStartTime + deltaBeats);
      
      if (onClipMove) {
        onClipMove(dragState.clipId, newTrackId, newStartTime);
      }
    } else if (dragState.type === 'resize-left') {
      const newStartTime = Math.min(
        dragState.originalStartTime + deltaBeats,
        dragState.originalStartTime + dragState.originalDuration - 0.25 // Minimum 1/4 beat
      );
      const newDuration = dragState.originalStartTime + dragState.originalDuration - newStartTime;
      
      if (onClipResize) {
        onClipResize(dragState.clipId, newStartTime, newDuration);
      }
    } else if (dragState.type === 'resize-right') {
      const newDuration = Math.max(0.25, dragState.originalDuration + deltaBeats); // Minimum 1/4 beat
      
      if (onClipResize) {
        onClipResize(dragState.clipId, dragState.originalStartTime, newDuration);
      }
    }
  }, [dragState, clips, tracks, pixelsPerBeat, onClipMove, onClipResize]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      clipId: null,
      type: null,
      startX: 0,
      startY: 0,
      originalStartTime: 0,
      originalDuration: 0,
      originalTrackId: '',
    });
  }, []);

  // Global mouse event listeners
  useEffect(() => {
    if (dragState.clipId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.clipId, handleMouseMove, handleMouseUp]);

  return (
    <section className="timeline-viewport" aria-label="Timeline viewport">
      <div
        className="timeline-canvas"
        style={{
          minWidth: `${canvasWidth}px`,
          backgroundSize: `${pixelsPerBeat}px var(--timeline-row-height)`,
        }}
      >
        <div className="timeline-ruler" aria-hidden="true">
          {rulerMarkers.map((marker) => (
            <div
              key={marker.bar}
              className="ruler-marker"
              style={{ left: `${marker.position}px` }}
            >
              <span className="text-xs text-muted">{marker.bar}</span>
            </div>
          ))}
        </div>

        <div
          className="playhead"
          style={{ left: `${playheadPosition * pixelsPerBeat}px` }}
          aria-hidden="true"
        />

        <div className="timeline-rows">
          {tracks.map((track) => {
            const trackClips = clips.filter(
              (clip) => clip.trackId === track.id
            );

            return (
              <div
                key={track.id}
                className="timeline-row"
                aria-label={`${track.name} lane`}
              >
                {trackClips.map((clip) => (
                  <div
                    key={clip.id}
                    className={`timeline-clip ${dragState.clipId === clip.id ? 'dragging' : ''}`}
                    style={{
                      left: `${clip.start * pixelsPerBeat}px`,
                      width: `${clip.length * pixelsPerBeat}px`,
                      backgroundColor: clip.color,
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${clip.name} clip`}
                    onMouseDown={(e) => handleClipMouseDown(e, clip.id, clip, 'move')}
                  >
                    <div
                      className="timeline-clip-resize-handle timeline-clip-resize-left"
                      onMouseDown={(e) => handleClipMouseDown(e, clip.id, clip, 'resize-left')}
                    />
                    <span className="timeline-clip-name text-xs">
                      {clip.name}
                    </span>
                    <div
                      className="timeline-clip-resize-handle timeline-clip-resize-right"
                      onMouseDown={(e) => handleClipMouseDown(e, clip.id, clip, 'resize-right')}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default TimelineViewport;
