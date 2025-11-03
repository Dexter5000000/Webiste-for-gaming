import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTimeline } from './TimelineContext';
import { AudioClip, ClipInteraction } from '../../audio/clips';
import { secondsToBeats, beatsToSeconds } from '../../audio/utils/tempo';
import { generatePlaceholderWaveform } from './waveformGenerator';

interface TimelineCanvasProps {
  tempo: number;
  isPlaying: boolean;
  playheadPosition: number;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  tempo,
  isPlaying,
  playheadPosition,
}) => {
  const { state, updateClip, removeClip, addClip, selectClips, clearSelection, setSelectionState } = useTimeline();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [interaction, setInteraction] = useState<ClipInteraction | null>(null);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number>();

  const timeToPixel = useCallback((timeInBeats: number) => {
    return timeInBeats * state.viewport.pixelsPerBeat - state.viewport.scrollLeft;
  }, [state.viewport]);

  const pixelToTime = useCallback((pixel: number) => {
    return (pixel + state.viewport.scrollLeft) / state.viewport.pixelsPerBeat;
  }, [state.viewport]);

  const snapTime = useCallback((timeInBeats: number) => {
    if (!state.viewport.gridSnap) return timeInBeats;
    const snapValue = state.viewport.snapValue;
    return Math.round(timeInBeats / snapValue) * snapValue;
  }, [state.viewport]);

  const getTrackAtY = useCallback((y: number) => {
    const tracks = Array.from(state.tracks.values()).sort((a, b) => a.order - b.order);
    let currentY = 0;
    for (const track of tracks) {
      if (y >= currentY && y < currentY + track.height) {
        return { track, yOffset: currentY };
      }
      currentY += track.height;
    }
    return null;
  }, [state.tracks]);

  const getClipAtPosition = useCallback((x: number, y: number) => {
    const timeInBeats = pixelToTime(x);
    const trackInfo = getTrackAtY(y + state.viewport.scrollTop);
    
    if (!trackInfo) return null;

    const clipsOnTrack = Array.from(state.clips.values()).filter(
      (clip) => clip.trackId === trackInfo.track.id
    );

    for (const clip of clipsOnTrack) {
      const clipStartBeats = secondsToBeats(clip.startTime, tempo);
      const clipEndBeats = clipStartBeats + secondsToBeats(clip.duration, tempo);
      
      if (timeInBeats >= clipStartBeats && timeInBeats <= clipEndBeats) {
        const clipStartX = timeToPixel(clipStartBeats);
        const clipEndX = timeToPixel(clipEndBeats);
        
        const isNearStart = x - clipStartX < 10;
        const isNearEnd = clipEndX - x < 10;
        
        return { clip, isNearStart, isNearEnd };
      }
    }
    return null;
  }, [pixelToTime, getTrackAtY, state.clips, state.viewport, tempo, timeToPixel]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clipInfo = getClipAtPosition(x, y);

    if (clipInfo) {
      const { clip, isNearStart, isNearEnd } = clipInfo;
      const isSelected = state.selection.clipIds.has(clip.id);
      
      if (!isSelected && !event.shiftKey) {
        selectClips([clip.id]);
      } else if (event.shiftKey) {
        selectClips([clip.id], true);
      }

      if (event.altKey) {
        setInteraction({
          type: 'slip',
          clipId: clip.id,
          startX: x,
          startY: y,
          startValue: clip.offset,
        });
      } else if (isNearStart) {
        setInteraction({
          type: 'trim-start',
          clipId: clip.id,
          startX: x,
          startY: y,
          startValue: clip.startTime,
        });
      } else if (isNearEnd) {
        setInteraction({
          type: 'trim-end',
          clipId: clip.id,
          startX: x,
          startY: y,
          startValue: clip.duration,
        });
      } else {
        setInteraction({
          type: 'move',
          clipId: clip.id,
          startX: x,
          startY: y,
          startValue: clip.startTime,
        });
        
        const selectedClips = Array.from(state.selection.clipIds).map(id => state.clips.get(id)).filter(Boolean) as AudioClip[];
        const originalPositions = new Map(
          selectedClips.map(c => [c.id, { startTime: c.startTime, trackId: c.trackId }])
        );
        setSelectionState({
          ...state.selection,
          originalPositions,
        });
      }
    } else {
      clearSelection();
      setMarqueeStart({ x, y });
    }
  }, [getClipAtPosition, state.selection, state.clips, selectClips, clearSelection, setSelectionState]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (marqueeStart) {
      setMarqueeEnd({ x, y });
      return;
    }

    if (interaction) {
      const deltaX = x - interaction.startX;
      const deltaBeats = deltaX / state.viewport.pixelsPerBeat;

      if (interaction.type === 'slip') {
        const clip = state.clips.get(interaction.clipId);
        if (clip) {
          const deltaSeconds = (deltaBeats * 60) / tempo;
          const newOffset = Math.max(0, interaction.startValue + deltaSeconds);
          updateClip(clip.id, { offset: newOffset });
        }
      } else if (interaction.type === 'move') {
        const selectedClips = Array.from(state.selection.clipIds)
          .map(id => state.clips.get(id))
          .filter(Boolean) as AudioClip[];

        const trackInfo = getTrackAtY(y + state.viewport.scrollTop);
        
        for (const clip of selectedClips) {
          const originalPos = state.selection.originalPositions?.get(clip.id);
          if (originalPos) {
            const newStartBeats = secondsToBeats(originalPos.startTime, tempo) + deltaBeats;
            const snappedBeats = snapTime(newStartBeats);
            const newStartTime = beatsToSeconds(snappedBeats, tempo);

            const updates: Partial<AudioClip> = {
              startTime: Math.max(0, newStartTime),
            };

            if (trackInfo && clip.id === interaction.clipId) {
              updates.trackId = trackInfo.track.id;
            }

            updateClip(clip.id, updates);
          }
        }
      } else if (interaction.type === 'trim-start') {
        const clip = state.clips.get(interaction.clipId);
        if (clip) {
          const currentStartBeats = secondsToBeats(clip.startTime, tempo);
          const currentDurationBeats = secondsToBeats(clip.duration, tempo);
          const newStartBeats = snapTime(currentStartBeats + deltaBeats);
          const newDurationBeats = Math.max(0.25, currentDurationBeats - (newStartBeats - currentStartBeats));
          
          updateClip(clip.id, {
            startTime: beatsToSeconds(newStartBeats, tempo),
            duration: beatsToSeconds(newDurationBeats, tempo),
          });
        }
      } else if (interaction.type === 'trim-end') {
        const clip = state.clips.get(interaction.clipId);
        if (clip) {
          const currentDurationBeats = secondsToBeats(clip.duration, tempo);
          const newDurationBeats = snapTime(Math.max(0.25, currentDurationBeats + deltaBeats));
          
          updateClip(clip.id, {
            duration: beatsToSeconds(newDurationBeats, tempo),
          });
        }
      }
    }
  }, [interaction, marqueeStart, state.viewport, state.clips, state.selection, tempo, updateClip, snapTime, getTrackAtY]);

  const handleMouseUp = useCallback(() => {
    if (marqueeStart && marqueeEnd) {
      const minX = Math.min(marqueeStart.x, marqueeEnd.x);
      const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
      const minY = Math.min(marqueeStart.y, marqueeEnd.y);
      const maxY = Math.max(marqueeStart.y, marqueeEnd.y);

      const selectedClipIds: string[] = [];

      for (const clip of state.clips.values()) {
        const clipStartBeats = secondsToBeats(clip.startTime, tempo);
        const clipEndBeats = clipStartBeats + secondsToBeats(clip.duration, tempo);
        const clipStartX = timeToPixel(clipStartBeats);
        const clipEndX = timeToPixel(clipEndBeats);

        const track = state.tracks.get(clip.trackId);
        if (!track) continue;

        const tracks = Array.from(state.tracks.values()).sort((a, b) => a.order - b.order);
        let trackY = 0;
        for (const t of tracks) {
          if (t.id === track.id) break;
          trackY += t.height;
        }
        trackY -= state.viewport.scrollTop;

        if (clipStartX < maxX && clipEndX > minX && trackY < maxY && trackY + track.height > minY) {
          selectedClipIds.push(clip.id);
        }
      }

      if (selectedClipIds.length > 0) {
        selectClips(selectedClipIds);
      }

      setMarqueeStart(null);
      setMarqueeEnd(null);
    }

    setInteraction(null);
  }, [marqueeStart, marqueeEnd, state.clips, state.tracks, state.viewport, tempo, timeToPixel, selectClips]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (state.selection.clipIds.size > 0) {
          event.preventDefault();
          for (const clipId of state.selection.clipIds) {
            removeClip(clipId);
          }
        }
      } else if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (state.selection.clipIds.size > 0) {
          const newClipIds: string[] = [];
          for (const clipId of state.selection.clipIds) {
            const clip = state.clips.get(clipId);
            if (clip) {
              const durationBeats = secondsToBeats(clip.duration, tempo);
              const newClip = {
                ...clip,
                id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                startTime: clip.startTime + beatsToSeconds(durationBeats, tempo),
              };
              addClip(newClip);
              newClipIds.push(newClip.id);
            }
          }
          if (newClipIds.length > 0) {
            selectClips(newClipIds);
          }
        }
      } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (state.selection.clipIds.size === 1) {
          const clipId = Array.from(state.selection.clipIds)[0];
          const clip = state.clips.get(clipId);
          if (clip && clip.duration > 0.5) {
            const splitTime = clip.startTime + clip.duration / 2;
            const leftClip = {
              ...clip,
              duration: clip.duration / 2,
            };
            const rightClip = {
              ...clip,
              id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              startTime: splitTime,
              duration: clip.duration / 2,
            };
            updateClip(clip.id, leftClip);
            addClip(rightClip);
            selectClips([rightClip.id]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.selection, state.clips, removeClip, addClip, selectClips, updateClip, tempo]);

  useEffect(() => {
    state.clips.forEach((clip) => {
      const durationBeats = secondsToBeats(clip.duration, tempo);
      const targetWidth = Math.max(64, Math.floor(durationBeats * state.viewport.pixelsPerBeat));
      const existingLength = clip.waveformPeaks?.length ?? 0;
      if (!clip.waveformPeaks || existingLength !== targetWidth * 2) {
        const channelData = generatePlaceholderWaveform(clip.id, clip.duration, clip.offset);
        const peaks: number[] = [];
        const samplesPerPixel = Math.max(1, Math.floor(channelData[0].length / targetWidth));
        for (let pixel = 0; pixel < targetWidth; pixel++) {
          const startSample = pixel * samplesPerPixel;
          const endSample = Math.min(startSample + samplesPerPixel, channelData[0].length);
          let min = 1;
          let max = -1;
          for (let channel = 0; channel < channelData.length; channel++) {
            for (let i = startSample; i < endSample; i++) {
              const sample = channelData[channel][i];
              if (sample < min) min = sample;
              if (sample > max) max = sample;
            }
          }
          peaks.push(min, max);
        }
        updateClip(clip.id, { waveformPeaks: peaks });
      }
    });
  }, [state.clips, state.viewport.pixelsPerBeat, tempo, updateClip]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, rect.width, rect.height);

      const tracks = Array.from(state.tracks.values()).sort((a, b) => a.order - b.order);
      let currentY = -state.viewport.scrollTop;

      for (const track of tracks) {
        ctx.fillStyle = track.order % 2 === 0 ? '#222' : '#252525';
        ctx.fillRect(0, currentY, rect.width, track.height);

        const clipsOnTrack = Array.from(state.clips.values()).filter(
          (clip) => clip.trackId === track.id
        );

        for (const clip of clipsOnTrack) {
          const clipStartBeats = secondsToBeats(clip.startTime, tempo);
          const clipEndBeats = clipStartBeats + secondsToBeats(clip.duration, tempo);
          const clipX = timeToPixel(clipStartBeats);
          const clipWidth = (clipEndBeats - clipStartBeats) * state.viewport.pixelsPerBeat;
          const clipY = currentY + 5;
          const clipHeight = track.height - 10;

          const isSelected = state.selection.clipIds.has(clip.id);

          ctx.fillStyle = isSelected ? '#5a7fc7' : '#3a5a8a';
          ctx.fillRect(clipX, clipY, clipWidth, clipHeight);

          ctx.strokeStyle = isSelected ? '#7a9fe7' : '#4a6a9a';
          ctx.lineWidth = 1;
          ctx.strokeRect(clipX, clipY, clipWidth, clipHeight);

          ctx.fillStyle = '#fff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(clip.name, clipX + 5, clipY + 5);

          if (clip.waveformPeaks && clip.waveformPeaks.length > 0 && clipWidth > 0) {
            ctx.fillStyle = '#88aadd44';
            ctx.strokeStyle = '#88aadd';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            
            const numPeaks = clip.waveformPeaks.length / 2;
            const centerY = clipY + clipHeight / 2;
            
            for (let i = 0; i < Math.floor(clipWidth); i++) {
              const peakIndex = Math.floor((i / clipWidth) * numPeaks);
              const min = clip.waveformPeaks[peakIndex * 2] || 0;
              const max = clip.waveformPeaks[peakIndex * 2 + 1] || 0;
              
              const y1 = centerY - min * (clipHeight * 0.4);
              const y2 = centerY - max * (clipHeight * 0.4);
              
              ctx.moveTo(clipX + i, y1);
              ctx.lineTo(clipX + i, y2);
            }
            ctx.stroke();
          }
        }

        currentY += track.height;
      }

      if (state.viewport.gridSnap) {
        const startBeat = Math.floor(state.viewport.scrollLeft / state.viewport.pixelsPerBeat);
        const endBeat = Math.ceil((state.viewport.scrollLeft + rect.width) / state.viewport.pixelsPerBeat);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let beat = startBeat; beat <= endBeat; beat++) {
          if (beat % 4 === 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          }
          
          const x = beat * state.viewport.pixelsPerBeat - state.viewport.scrollLeft;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rect.height);
          ctx.stroke();
        }
      }

      if (marqueeStart && marqueeEnd) {
        const minX = Math.min(marqueeStart.x, marqueeEnd.x);
        const minY = Math.min(marqueeStart.y, marqueeEnd.y);
        const width = Math.abs(marqueeEnd.x - marqueeStart.x);
        const height = Math.abs(marqueeEnd.y - marqueeStart.y);

        ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
        ctx.fillRect(minX, minY, width, height);

        ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(minX, minY, width, height);
      }

      const playheadBeats = secondsToBeats(playheadPosition, tempo);
      const playheadX = timeToPixel(playheadBeats);

      ctx.strokeStyle = '#ff5555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, rect.height);
      ctx.stroke();

      if (state.loopRegion.enabled) {
        const loopStartBeats = secondsToBeats(state.loopRegion.start, tempo);
        const loopEndBeats = secondsToBeats(state.loopRegion.end, tempo);
        const loopStartX = timeToPixel(loopStartBeats);
        const loopEndX = timeToPixel(loopEndBeats);

        ctx.fillStyle = 'rgba(255, 200, 100, 0.1)';
        ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, rect.height);

        ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(loopStartX, 0);
        ctx.lineTo(loopStartX, rect.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(loopEndX, 0);
        ctx.lineTo(loopEndX, rect.height);
        ctx.stroke();
      }
    };

    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, tempo, playheadPosition, timeToPixel, marqueeStart, marqueeEnd]);

  return (
    <canvas
      ref={canvasRef}
      className="timeline-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ width: '100%', height: '100%', cursor: interaction ? 'grabbing' : isPlaying ? 'not-allowed' : 'default' }}
    />
  );
};
