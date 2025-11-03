import React, { useState } from 'react';
import { TrackConfig } from '../../audio/clips';
import { useTimeline } from './TimelineContext';

interface TrackHeaderProps {
  track: TrackConfig;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDrop,
}) => {
  const { updateTrack, removeTrack } = useTimeline();
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(track.height);

  const handleResizeStart = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    setStartY(event.clientY);
    setStartHeight(track.height);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.max(60, startHeight + delta);
      updateTrack(track.id, { height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`track-header ${isDragging ? 'dragging' : ''}`}
      style={{ height: `${track.height}px` }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', track.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop?.();
      }}
    >
      <div className="track-title">
        <span>{track.name}</span>
        <button className="track-button" onClick={() => removeTrack(track.id)} title="Remove track">
          ×
        </button>
      </div>
      <div className="track-controls">
        <button
          className={`track-button ${track.muted ? 'active' : ''}`}
          onClick={() => updateTrack(track.id, { muted: !track.muted })}
        >
          M
        </button>
        <button
          className={`track-button ${track.solo ? 'active' : ''}`}
          onClick={() => updateTrack(track.id, { solo: !track.solo })}
        >
          S
        </button>
        <button
          className={`track-button ${track.armed ? 'active' : ''}`}
          onClick={() => updateTrack(track.id, { armed: !track.armed })}
        >
          R
        </button>
      </div>
      <div
        className={`track-resize-handle ${isResizing ? 'dragging' : ''}`}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};
