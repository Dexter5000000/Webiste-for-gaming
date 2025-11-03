import { memo, useMemo } from 'react';
import type { TimelineClip } from '../types';

interface TimelineViewportProps {
  playheadPosition: number;
  zoomLevel: number;
  tracks: Array<{ id: string; name: string }>;
  clips: TimelineClip[];
}

const TOTAL_BARS = 16;
const BEATS_PER_BAR = 4;

const TimelineViewport = memo(function TimelineViewport({
  playheadPosition,
  zoomLevel,
  tracks,
  clips,
}: TimelineViewportProps) {
  const pixelsPerBeat = 48 * zoomLevel;
  const totalBeats = TOTAL_BARS * BEATS_PER_BAR;
  const canvasWidth = Math.max(totalBeats * pixelsPerBeat, 960);

  const rulerMarkers = useMemo(() => {
    return Array.from({ length: TOTAL_BARS + 1 }, (_, index) => ({
      bar: index + 1,
      position: index * BEATS_PER_BAR * pixelsPerBeat,
    }));
  }, [pixelsPerBeat]);

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
                    className="timeline-clip"
                    style={{
                      left: `${clip.start * pixelsPerBeat}px`,
                      width: `${clip.length * pixelsPerBeat}px`,
                      backgroundColor: clip.color,
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${clip.name} clip`}
                  >
                    <span className="timeline-clip-name text-xs">
                      {clip.name}
                    </span>
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
