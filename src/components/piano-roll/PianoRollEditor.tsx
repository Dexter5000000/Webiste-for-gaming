import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { MidiNote, MidiClip } from '../../state/models';
import './PianoRollEditor.css';

interface PianoRollEditorProps {
  clip: MidiClip;
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  pixelsPerBeat: number;
  zoomVertical: number;
  onNotesChange: (notes: MidiNote[]) => void;
  onNoteSelect: (noteIds: string[]) => void;
  selectedNoteIds: string[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PITCHES = 128; // MIDI standard
const BLACK_KEYS = [1, 3, 6, 8, 10]; // Black key positions in octave

export const PianoRollEditor: React.FC<PianoRollEditorProps> = ({
  clip,
  tempo,
  timeSignature,
  pixelsPerBeat,
  zoomVertical,
  onNotesChange,
  onNoteSelect,
  selectedNoteIds,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({
    startBeat: 0,
    endBeat: 16,
    startPitch: 60, // Middle C
    endPitch: 84, // Higher range
  });
  const [dragState, setDragState] = useState<{
    type: 'draw' | 'select' | 'move' | 'resize' | null;
    startX: number;
    startY: number;
    noteId?: string;
    originalNotes?: MidiNote[];
  }>({ type: null, startX: 0, startY: 0 });

  // Calculate dimensions
  const width = (viewport.endBeat - viewport.startBeat) * pixelsPerBeat;
  const height = (viewport.endPitch - viewport.startPitch) * zoomVertical;
  const keyboardWidth = 60;

  // Convert pixel coordinates to note/beat coordinates
  const pixelToNote = useCallback((y: number) => {
    return viewport.endPitch - Math.floor(y / zoomVertical);
  }, [viewport, zoomVertical]);

  const pixelToBeat = useCallback((x: number) => {
    return viewport.startBeat + (x - keyboardWidth) / pixelsPerBeat;
  }, [viewport, pixelsPerBeat]);

  const noteToPixel = useCallback((pitch: number) => {
    return (viewport.endPitch - pitch) * zoomVertical;
  }, [viewport, zoomVertical]);

  const beatToPixel = useCallback((beat: number) => {
    return keyboardWidth + (beat - viewport.startBeat) * pixelsPerBeat;
  }, [viewport, pixelsPerBeat]);

  // Draw the piano roll
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Draw vertical grid lines (beats)
    for (let beat = Math.ceil(viewport.startBeat); beat <= viewport.endBeat; beat++) {
      const x = beatToPixel(beat);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      
      // Highlight measure boundaries
      if (beat % timeSignature.numerator === 0) {
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    }

    // Draw horizontal grid lines (notes)
    for (let pitch = viewport.startPitch; pitch <= viewport.endPitch; pitch++) {
      const y = noteToPixel(pitch);
      ctx.beginPath();
      ctx.moveTo(keyboardWidth, y);
      ctx.lineTo(width, y);
      
      // Highlight C notes
      if (pitch % 12 === 0) {
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 0.5;
      }
      ctx.stroke();
    }

    // Draw keyboard
    for (let pitch = viewport.startPitch; pitch <= viewport.endPitch; pitch++) {
      const y = noteToPixel(pitch);
      const isBlack = BLACK_KEYS.includes(pitch % 12);
      
      if (isBlack) {
        ctx.fillStyle = '#333';
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.fillRect(0, y, keyboardWidth, zoomVertical);
      
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, keyboardWidth, zoomVertical);
      
      // Draw note names for C notes
      if (pitch % 12 === 0 && pitch >= 0 && pitch <= 127) {
        ctx.fillStyle = isBlack ? '#fff' : '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const octave = Math.floor(pitch / 12) - 1;
        ctx.fillText(`${NOTE_NAMES[pitch % 12]}${octave}`, keyboardWidth / 2, y + zoomVertical / 2);
      }
    }

    // Draw notes
    clip.notes.forEach(note => {
      const x = beatToPixel(note.startTime);
      const y = noteToPixel(note.pitch);
      const noteWidth = note.duration * pixelsPerBeat;
      const noteHeight = zoomVertical * 0.8;
      
      // Note color based on velocity
      const velocityIntensity = note.velocity / 127;
      const hue = 200; // Blue-ish
      const lightness = 50 + (1 - velocityIntensity) * 30;
      ctx.fillStyle = selectedNoteIds.includes(note.id) 
        ? `hsl(120, 70%, 40%)` // Green when selected
        : `hsl(${hue}, 70%, ${lightness}%)`;
      
      ctx.fillRect(x, y + zoomVertical * 0.1, noteWidth, noteHeight);
      
      // Note border
      ctx.strokeStyle = selectedNoteIds.includes(note.id) ? '#0a0' : '#333';
      ctx.lineWidth = selectedNoteIds.includes(note.id) ? 2 : 1;
      ctx.strokeRect(x, y + zoomVertical * 0.1, noteWidth, noteHeight);
      
      // Draw articulation indicators
      if (note.articulation && note.articulation !== 'normal') {
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        const articulationSymbols = {
          staccato: '•',
          legato: '—',
          accent: '>'
        };
        ctx.fillText(
          articulationSymbols[note.articulation],
          x + noteWidth / 2,
          y + zoomVertical / 2
        );
      }
    });

    // Draw selection rectangle if selecting
    if (dragState.type === 'select' && dragState.startX && dragState.startY) {
      ctx.strokeStyle = '#00f';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const currentX = dragState.startX;
      const currentY = dragState.startY;
      ctx.strokeRect(currentX, currentY, 0, 0);
      ctx.setLineDash([]);
    }
  }, [clip.notes, viewport, width, height, keyboardWidth, pixelsPerBeat, zoomVertical, 
      timeSignature.numerator, beatToPixel, noteToPixel, selectedNoteIds, dragState]);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking in keyboard area
    if (x < keyboardWidth) {
      const pitch = pixelToNote(y);
      if (pitch >= 0 && pitch <= 127) {
        // Play preview note
        // TODO: Connect to audio engine
        console.log('Preview note:', pitch);
      }
      return;
    }
    
    const beat = pixelToBeat(x);
    const pitch = pixelToNote(y);
    
    // Check if clicking on existing note
    const clickedNote = clip.notes.find(note => 
      pitch === note.pitch &&
      beat >= note.startTime &&
      beat <= note.startTime + note.duration
    );
    
    if (clickedNote) {
      if (e.shiftKey) {
        // Multi-select
        const newSelection = e.ctrlKey 
          ? [...selectedNoteIds, clickedNote.id]
          : [clickedNote.id];
        onNoteSelect(newSelection);
      } else {
        // Start moving note
        setDragState({
          type: 'move',
          startX: x,
          startY: y,
          noteId: clickedNote.id,
          originalNotes: clip.notes.filter(n => selectedNoteIds.includes(n.id) || n.id === clickedNote.id)
        });
      }
    } else {
      if (e.shiftKey) {
        // Start selection
        setDragState({
          type: 'select',
          startX: x,
          startY: y
        });
      } else {
        // Start drawing new note
        setDragState({
          type: 'draw',
          startX: x,
          startY: y
        });
      }
    }
  }, [clip.notes, keyboardWidth, pixelToNote, pixelToBeat, selectedNoteIds, onNoteSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.type) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (dragState.type === 'draw') {
      // Preview note being drawn
      draw();
    } else if (dragState.type === 'move' && dragState.originalNotes) {
      // Move notes
      const deltaBeat = pixelToBeat(x) - pixelToBeat(dragState.startX);
      const deltaPitch = pixelToNote(y) - pixelToNote(dragState.startY);
      
      const updatedNotes = dragState.originalNotes.map(note => ({
        ...note,
        startTime: Math.max(0, note.startTime + deltaBeat),
        pitch: Math.max(0, Math.min(127, note.pitch + deltaPitch))
      }));
      
      const otherNotes = clip.notes.filter(n => !dragState.originalNotes!.some(on => on.id === n.id));
      onNotesChange([...otherNotes, ...updatedNotes]);
    }
  }, [dragState, clip.notes, pixelToBeat, pixelToNote, onNotesChange, draw]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.type) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (dragState.type === 'draw') {
      const beat = pixelToBeat(dragState.startX);
      const pitch = pixelToNote(dragState.startY);
      const endBeat = pixelToBeat(x);
      
      if (pitch >= 0 && pitch <= 127 && beat >= 0 && endBeat > beat) {
        const newNote: MidiNote = {
          id: `note-${Date.now()}-${Math.random()}`,
          pitch,
          velocity: 100,
          startTime: Math.min(beat, endBeat),
          duration: Math.abs(endBeat - beat),
          articulation: 'normal'
        };
        
        onNotesChange([...clip.notes, newNote]);
      }
    }
    
    setDragState({ type: null, startX: 0, startY: 0 });
  }, [dragState, pixelToBeat, pixelToNote, clip.notes, onNotesChange]);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoomVertical = Math.max(10, Math.min(100, zoomVertical * delta));
      // TODO: Update zoomVertical through props
    }
  }, [zoomVertical]);

  return (
    <div className="piano-roll-editor" ref={containerRef}>
      <div className="piano-roll-toolbar">
        <div className="zoom-controls">
          <button onClick={() => {/* TODO: Zoom in */}}>+</button>
          <span>{Math.round(zoomVertical)}px</span>
          <button onClick={() => {/* TODO: Zoom out */}}>-</button>
        </div>
        <div className="tools">
          <button className={dragState.type === 'draw' ? 'active' : ''} 
                  onClick={() => setDragState({ type: null, startX: 0, startY: 0 })}>
            Draw
          </button>
          <button className={dragState.type === 'select' ? 'active' : ''} 
                  onClick={() => setDragState({ type: null, startX: 0, startY: 0 })}>
            Select
          </button>
        </div>
        <div className="quantize">
          <label>Quantize:</label>
          <select defaultValue="16">
            <option value="4">Quarter</option>
            <option value="8">Eighth</option>
            <option value="16">Sixteenth</option>
            <option value="32">Thirty-second</option>
          </select>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={width + keyboardWidth}
        height={height}
        className="piano-roll-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragState({ type: null, startX: 0, startY: 0 })}
        onWheel={handleWheel}
      />
    </div>
  );
};