import React, { useState, useCallback } from 'react';
import { PianoRollEditor } from './PianoRollEditor';
import { MidiClip, MidiNote } from '../../state/models';
import { quantizeNotes, transposeNotes, copyNotes } from '../../utils/midiUtils';
import './MidiClipEditor.css';

interface MidiClipEditorProps {
  clip: MidiClip;
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  pixelsPerBeat: number;
  onClose?: () => void;
  onSave?: (clip: MidiClip) => void;
}

export const MidiClipEditor: React.FC<MidiClipEditorProps> = ({
  clip,
  tempo,
  timeSignature,
  pixelsPerBeat,
  onClose,
  onSave,
}) => {
  const [currentClip, setCurrentClip] = useState<MidiClip>(clip);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [quantizeDivision, setQuantizeDivision] = useState(16);
  const [zoomVertical, setZoomVertical] = useState(20);

  const handleNotesChange = useCallback((notes: MidiNote[]) => {
    const updatedClip = { ...currentClip, notes };
    setCurrentClip(updatedClip);
  }, [currentClip]);

  const handleNoteSelect = useCallback((noteIds: string[]) => {
    setSelectedNoteIds(noteIds);
  }, []);

  const handleQuantize = useCallback(() => {
    const quantizedNotes = quantizeNotes(currentClip.notes, quantizeDivision);
    const updatedClip = { ...currentClip, notes: quantizedNotes };
    setCurrentClip(updatedClip);
  }, [currentClip, quantizeDivision]);

  const handleTranspose = useCallback((semitones: number) => {
    const transposedNotes = transposeNotes(
      currentClip.notes.filter(note => selectedNoteIds.length === 0 || selectedNoteIds.includes(note.id)),
      semitones
    );
    
    const otherNotes = currentClip.notes.filter(note => 
      selectedNoteIds.length > 0 && !selectedNoteIds.includes(note.id)
    );
    
    const updatedClip = { ...currentClip, notes: [...otherNotes, ...transposedNotes] };
    setCurrentClip(updatedClip);
  }, [currentClip, selectedNoteIds]);

  const handleCopy = useCallback(() => {
    const notesToCopy = selectedNoteIds.length > 0 
      ? currentClip.notes.filter(note => selectedNoteIds.includes(note.id))
      : currentClip.notes;
    
    const copiedNotes = copyNotes(notesToCopy);
    const updatedClip = { ...currentClip, notes: [...currentClip.notes, ...copiedNotes] };
    setCurrentClip(updatedClip);
  }, [currentClip, selectedNoteIds]);

  const handleDelete = useCallback(() => {
    const notesToKeep = selectedNoteIds.length > 0
      ? currentClip.notes.filter(note => !selectedNoteIds.includes(note.id))
      : currentClip.notes;
    
    const updatedClip = { ...currentClip, notes: notesToKeep };
    setCurrentClip(updatedClip);
    setSelectedNoteIds([]);
  }, [currentClip, selectedNoteIds]);

  const handleSave = useCallback(() => {
    onSave?.(currentClip);
    onClose?.();
  }, [currentClip, onSave, onClose]);

  const handleZoomIn = useCallback(() => {
    setZoomVertical(prev => Math.min(100, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomVertical(prev => Math.max(10, prev / 1.2));
  }, []);

  return (
    <div className="midi-clip-editor">
      <div className="midi-clip-editor-header">
        <h3>MIDI Clip Editor: {currentClip.name}</h3>
        <div className="midi-clip-editor-controls">
          <div className="zoom-controls">
            <button onClick={handleZoomOut}>-</button>
            <span>{Math.round(zoomVertical)}px</span>
            <button onClick={handleZoomIn}>+</button>
          </div>
          <div className="edit-controls">
            <select 
              value={quantizeDivision} 
              onChange={(e) => setQuantizeDivision(Number(e.target.value))}
            >
              <option value="4">Quarter</option>
              <option value="8">Eighth</option>
              <option value="16">Sixteenth</option>
              <option value="32">Thirty-second</option>
            </select>
            <button onClick={handleQuantize}>Quantize</button>
            <button onClick={() => handleTranspose(-1)}>Transpose -</button>
            <button onClick={() => handleTranspose(1)}>Transpose +</button>
            <button onClick={handleCopy}>Copy</button>
            <button onClick={handleDelete}>Delete</button>
          </div>
          <div className="action-controls">
            <button onClick={onClose}>Cancel</button>
            <button onClick={handleSave} className="save-btn">Save</button>
          </div>
        </div>
      </div>
      
      <div className="midi-clip-editor-content">
        <PianoRollEditor
          clip={currentClip}
          tempo={tempo}
          timeSignature={timeSignature}
          pixelsPerBeat={pixelsPerBeat}
          zoomVertical={zoomVertical}
          onNotesChange={handleNotesChange}
          onNoteSelect={handleNoteSelect}
          selectedNoteIds={selectedNoteIds}
        />
      </div>
      
      <div className="midi-clip-editor-footer">
        <div className="clip-info">
          <span>Notes: {currentClip.notes.length}</span>
          <span>Duration: {currentClip.duration} beats</span>
          <span>Selected: {selectedNoteIds.length}</span>
        </div>
        <div className="tempo-info">
          <span>Tempo: {tempo} BPM</span>
          <span>Time Signature: {timeSignature.numerator}/{timeSignature.denominator}</span>
        </div>
      </div>
    </div>
  );
};