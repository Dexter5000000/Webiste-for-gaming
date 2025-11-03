import { memo, useEffect, useMemo, useRef } from 'react';
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
  const waveformCanvasRefs = useRef(new Map<string, HTMLCanvasElement>());

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

  useEffect(() => {
    clips.forEach((clip) => {
      if (!clip.waveform || clip.waveform.length === 0) {
        return;
      }

      const canvas = waveformCanvasRefs.current.get(clip.id);
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const width = Math.max(1, Math.round(clip.length * pixelsPerBeat));
      const height = Math.max(
        1,
        Math.round(canvas.clientHeight || canvas.height || 48)
      );

      if (canvas.width !== width) {
        canvas.width = width;
      }
      if (canvas.height !== height) {
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      const sampleCount = clip.waveform[0].length;
      if (sampleCount === 0) {
        return;
      }

      const centerY = height / 2;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';

      for (let x = 0; x < width; x++) {
        const sampleIndex = Math.min(
          sampleCount - 1,
          Math.floor((x / width) * sampleCount)
        );

        let amplitude = 0;
        for (const channel of clip.waveform) {
          const value = channel[sampleIndex] ?? 0;
          amplitude = Math.max(amplitude, Math.abs(value));
        }

        const y = centerY - amplitude * centerY;
        const y2 = centerY + amplitude * centerY;

        ctx.beginPath();
        ctx.moveTo(x + 0.5, y);
        ctx.lineTo(x + 0.5, y2);
        ctx.stroke();
      }
    });
  }, [clips, pixelsPerBeat]);

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
                    {clip.waveform && clip.waveform.length > 0 && (
                      <canvas
                        ref={(el) => {
                          if (el) {
                            waveformCanvasRefs.current.set(clip.id, el);
                          } else {
                            waveformCanvasRefs.current.delete(clip.id);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: '24px',
                          left: 0,
                          width: '100%',
                          height: 'calc(100% - 28px)',
                          opacity: 0.6,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
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
