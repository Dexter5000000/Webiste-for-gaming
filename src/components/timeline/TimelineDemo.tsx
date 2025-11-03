import React, { useState, useEffect, useMemo } from 'react';
import { Timeline } from './Timeline';
import { TimelineProvider } from './TimelineContext';
import { TimelineStateStore } from '../../audio/clips';
import './timeline.css';

export const TimelineDemo: React.FC = () => {
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const store = useMemo(() => new TimelineStateStore(), []);

  useEffect(() => {
    if (isPlaying) {
      const startPos = playheadPosition;
      const start = performance.now();
      setStartTime(start);

      const animate = () => {
        const now = performance.now();
        const elapsed = (now - start) / 1000;
        const secondsPerBeat = 60 / tempo;
        const beatsElapsed = elapsed / secondsPerBeat;
        setPlayheadPosition(startPos + beatsElapsed * secondsPerBeat);

        if (isPlaying) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isPlaying, tempo]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setPlayheadPosition(0);
    setStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="transport-controls">
        <button
          className={`transport-button ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlayPause}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="transport-button" onClick={handleStop}>
          ⏹
        </button>
        <div className="position-display">
          <span>{formatTime(playheadPosition)}</span>
        </div>
        <div className="tempo-display">
          <label>BPM:</label>
          <input
            type="number"
            value={tempo}
            onChange={(e) => setTempo(Math.max(20, Math.min(300, parseInt(e.target.value) || 120)))}
            min="20"
            max="300"
          />
        </div>
      </div>
      <TimelineProvider store={store}>
        <Timeline tempo={tempo} isPlaying={isPlaying} playheadPosition={playheadPosition} />
      </TimelineProvider>
    </div>
  );
};
