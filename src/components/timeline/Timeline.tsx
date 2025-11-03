import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTimeline } from './TimelineContext';
import { TimelineCanvas } from './TimelineCanvas';
import { TrackList } from './TrackList';
import { TimelineRuler } from './TimelineRuler';
import { createDefaultTrack, createDefaultClip } from '../../audio/clips';
import './timeline.css';

interface TimelineProps {
  tempo: number;
  isPlaying: boolean;
  playheadPosition: number;
}

export const Timeline: React.FC<TimelineProps> = ({ tempo, isPlaying, playheadPosition }) => {
  const { state, addTrack, addClip, updateViewport } = useTimeline();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [scrollStartX, setScrollStartX] = useState(0);
  const [scrollStartY, setScrollStartY] = useState(0);

  useEffect(() => {
    if (state.tracks.size === 0) {
      const track1 = createDefaultTrack('Track 1', 0);
      const track2 = createDefaultTrack('Track 2', 1);
      addTrack(track1);
      addTrack(track2);

      const clip1 = createDefaultClip(track1.id, 0, 4, null);
      const clip2 = createDefaultClip(track1.id, 8, 3, null);
      const clip3 = createDefaultClip(track2.id, 4, 2, null);
      addClip(clip1);
      addClip(clip2);
      addClip(clip3);
    }
  }, [state.tracks.size, addTrack, addClip]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.01;
        const newZoom = Math.max(0.1, Math.min(10, state.viewport.zoom + delta));
        const newPixelsPerBeat = 100 * newZoom;
        updateViewport({ zoom: newZoom, pixelsPerBeat: newPixelsPerBeat });
      } else {
        const newScrollLeft = Math.max(0, state.viewport.scrollLeft + e.deltaX);
        const newScrollTop = Math.max(0, state.viewport.scrollTop + e.deltaY);
        updateViewport({ scrollLeft: newScrollLeft, scrollTop: newScrollTop });
      }
    },
    [state.viewport, updateViewport]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleAddTrack = () => {
    const maxOrder = Math.max(...Array.from(state.tracks.values()).map(t => t.order), -1);
    const newTrack = createDefaultTrack(`Track ${state.tracks.size + 1}`, maxOrder + 1);
    addTrack(newTrack);
  };

  const handleMiddleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsDraggingScroll(true);
      setScrollStartX(e.clientX + state.viewport.scrollLeft);
      setScrollStartY(e.clientY + state.viewport.scrollTop);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingScroll) {
      const newScrollLeft = scrollStartX - e.clientX;
      const newScrollTop = scrollStartY - e.clientY;
      updateViewport({ 
        scrollLeft: Math.max(0, newScrollLeft), 
        scrollTop: Math.max(0, newScrollTop) 
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 1) {
      setIsDraggingScroll(false);
    }
  };

  return (
    <div 
      className="timeline-container" 
      ref={containerRef}
      onMouseDown={handleMiddleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="timeline-header">
        <div className="timeline-controls">
          <button onClick={handleAddTrack} className="add-track-btn">
            + Add Track
          </button>
          <div className="zoom-controls">
            <button onClick={() => updateViewport({ zoom: Math.max(0.1, state.viewport.zoom - 0.2) })}>
              -
            </button>
            <span>{(state.viewport.zoom * 100).toFixed(0)}%</span>
            <button onClick={() => updateViewport({ zoom: Math.min(10, state.viewport.zoom + 0.2) })}>
              +
            </button>
          </div>
          <label className="snap-toggle">
            <input
              type="checkbox"
              checked={state.viewport.gridSnap}
              onChange={(e) => updateViewport({ gridSnap: e.target.checked })}
            />
            Snap to Grid
          </label>
        </div>
        <TimelineRuler tempo={tempo} />
      </div>
      <div
        className="timeline-content"
        ref={scrollContainerRef}
        onScroll={(e) => {
          const target = e.currentTarget;
          updateViewport({
            scrollLeft: target.scrollLeft,
            scrollTop: target.scrollTop,
          });
        }}
      >
        <div className="timeline-tracks-header">
          <TrackList />
        </div>
        <div className="timeline-canvas-container">
          <TimelineCanvas 
            tempo={tempo}
            isPlaying={isPlaying}
            playheadPosition={playheadPosition}
          />
        </div>
      </div>
    </div>
  );
};
