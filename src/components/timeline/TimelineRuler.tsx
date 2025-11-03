import React, { useRef, useEffect } from 'react';
import { useTimeline } from './TimelineContext';

interface TimelineRulerProps {
  tempo: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ tempo }) => {
  const { state } = useTimeline();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    const { pixelsPerBeat, scrollLeft } = state.viewport;
    
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    const startBeat = Math.floor(scrollLeft / pixelsPerBeat);
    const endBeat = Math.ceil((scrollLeft + rect.width) / pixelsPerBeat);
    
    ctx.strokeStyle = '#555';
    ctx.fillStyle = '#ccc';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let beat = startBeat; beat <= endBeat; beat++) {
      const x = beat * pixelsPerBeat - scrollLeft;
      const bar = Math.floor(beat / 4) + 1;
      const beatInBar = (beat % 4) + 1;
      
      if (beatInBar === 1) {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, rect.height * 0.3);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.fillText(`${bar}`, x, rect.height * 0.15);
      } else {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, rect.height * 0.6);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
    }
  }, [state.viewport, tempo]);

  return (
    <canvas 
      ref={canvasRef} 
      className="timeline-ruler"
      style={{ width: '100%', height: '40px' }}
    />
  );
};
