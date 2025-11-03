import { Midi } from '@tonejs/midi';
import { MidiClip, MidiNote, Project } from '../state/models';

/**
 * Convert a MidiClip to Tone.js MIDI format
 */
export function midiClipToToneMidi(clip: MidiClip, project: Project): Midi {
  const midi = new Midi();
  
  // Set tempo and time signature
  midi.header.setTempo(project.tempo);
  midi.header.timeSignature = `${project.timeSignature.numerator}/${project.timeSignature.denominator}`;
  
  // Create a track for this clip
  const track = midi.addTrack();
  
  // Add notes to the track
  clip.notes.forEach(note => {
    // Convert beat-based timing to seconds
    const beatDuration = 60 / project.tempo; // Duration of one beat in seconds
    const startTime = note.startTime * beatDuration;
    const duration = note.duration * beatDuration;
    
    track.addNote({
      midi: note.pitch,
      time: startTime,
      duration: duration,
      velocity: note.velocity / 127, // Normalize to 0-1
    });
  });
  
  return midi;
}

/**
 * Convert Tone.js MIDI to MidiClip format
 */
export function toneMidiToMidiClip(midi: Midi, clipId: string, trackId: string): MidiClip {
  if (midi.tracks.length === 0) {
    throw new Error('MIDI file contains no tracks');
  }
  
  const track = midi.tracks[0]; // Use first track
  const tempo = midi.header.tempos[0]?.bpm || 120;
  
  const notes: MidiNote[] = track.notes.map((note, index) => {
    // Convert time-based timing to beats
    const beatDuration = 60 / tempo;
    const startTime = note.time / beatDuration;
    const duration = note.duration / beatDuration;
    
    // Determine articulation based on note characteristics
    let articulation: 'normal' | 'staccato' | 'legato' | 'accent' = 'normal';
    if (duration < 0.1) {
      articulation = 'staccato';
    } else if (duration > 1.0) {
      articulation = 'legato';
    }
    if (note.velocity > 0.8) {
      articulation = 'accent';
    }
    
    return {
      id: `note-${clipId}-${index}`,
      pitch: note.midi,
      velocity: Math.round(note.velocity * 127),
      startTime,
      duration,
      articulation,
    };
  });
  
  // Calculate clip duration based on last note
  const lastNote = notes.reduce((latest, note) => 
    note.startTime + note.duration > latest ? note.startTime + note.duration : latest, 0
  );
  
  return {
    id: clipId,
    name: `Imported MIDI`,
    type: 'midi' as const,
    trackId,
    startTime: 0,
    duration: Math.ceil(lastNote), // Round up to nearest beat
    color: '#66d6b6',
    muted: false,
    solo: false,
    gain: 1,
    pan: 0,
    notes,
    velocity: 100,
    quantize: 16, // Default to 16th note quantization
    length: Math.ceil(lastNote),
  };
}

/**
 * Import MIDI file and convert to MidiClip
 */
export async function importMidiFile(file: File, clipId: string, trackId: string): Promise<MidiClip> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);
    return toneMidiToMidiClip(midi, clipId, trackId);
  } catch (error) {
    throw new Error(`Failed to import MIDI file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export MidiClip to MIDI file
 */
export async function exportMidiFile(clip: MidiClip, project: Project): Promise<Blob> {
  try {
    const midi = midiClipToToneMidi(clip, project);
    const arrayBuffer = midi.toArray();
    return new Blob([arrayBuffer], { type: 'audio/midi' });
  } catch (error) {
    throw new Error(`Failed to export MIDI file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download a MidiClip as a MIDI file
 */
export async function downloadMidiFile(clip: MidiClip, project: Project, filename?: string): Promise<void> {
  try {
    const blob = await exportMidiFile(clip, project);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${clip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download MIDI file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Quantize notes to a grid
 */
export function quantizeNotes(notes: MidiNote[], division: number): MidiNote[] {
  return notes.map(note => {
    const quantizedStartTime = Math.round(note.startTime * division) / division;
    const quantizedDuration = Math.round(note.duration * division) / division;
    
    return {
      ...note,
      startTime: quantizedStartTime,
      duration: Math.max(quantizedDuration, 1 / division), // Minimum duration is one grid division
    };
  });
}

/**
 * Transpose notes by semitones
 */
export function transposeNotes(notes: MidiNote[], semitones: number): MidiNote[] {
  return notes.map(note => {
    const newPitch = note.pitch + semitones;
    if (newPitch < 0 || newPitch > 127) {
      return note; // Skip notes that would be out of MIDI range
    }
    
    return {
      ...note,
      pitch: newPitch,
    };
  });
}

/**
 * Copy notes
 */
export function copyNotes(notes: MidiNote[]): MidiNote[] {
  return notes.map(note => ({
    ...note,
    id: `note-${Date.now()}-${Math.random()}`,
  }));
}

/**
 * Get note name from MIDI pitch
 */
export function getNoteName(pitch: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const noteName = noteNames[pitch % 12];
  return `${noteName}${octave}`;
}

/**
 * Get MIDI pitch from note name (e.g., "C4", "A#3")
 */
export function getNotePitch(noteName: string): number {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = noteName.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60; // Default to middle C
  
  const [, name, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const noteIndex = noteNames.indexOf(name);
  
  if (noteIndex === -1) return 60;
  
  return (octave + 1) * 12 + noteIndex;
}