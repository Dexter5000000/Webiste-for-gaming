import { AudioEngine } from '../audio/AudioEngine';
import { MidiClip, Project } from '../state/models';

/**
 * Schedules MIDI note playback for clips
 */
export class MidiPlaybackScheduler {
  private audioEngine: AudioEngine;
  private scheduledNotes: Map<string, ScheduledNote[]> = new Map();
  private currentPlaybackTime: number = 0;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  /**
   * Schedule notes for a clip at a specific playback time
   */
  scheduleClip(
    clip: MidiClip, 
    project: Project, 
    _playbackStartTime: number, 
    clipStartTime: number
  ): void {
    // Clear any previously scheduled notes for this clip
    this.unscheduleClip(clip.id);

    const scheduledNotes: ScheduledNote[] = [];
    const tempo = project.tempo;
    const beatDuration = 60 / tempo; // Duration of one beat in seconds

    // Calculate clip start time in seconds
    const clipStartSeconds = clipStartTime * beatDuration;

    clip.notes.forEach(note => {
      // Calculate note timing in seconds
      const noteStartTime = clipStartSeconds + (note.startTime * beatDuration);
      const noteDuration = note.duration * beatDuration;

      // Apply articulation modifications
      let adjustedDuration = noteDuration;
      let adjustedVelocity = note.velocity;

      switch (note.articulation) {
        case 'staccato':
          adjustedDuration = noteDuration * 0.5; // Half duration for staccato
          break;
        case 'legato':
          adjustedDuration = noteDuration * 1.2; // Slightly longer for legato
          break;
        case 'accent':
          adjustedVelocity = Math.min(127, note.velocity + 20); // Boost velocity for accent
          break;
      }

      const scheduledNote: ScheduledNote = {
        id: note.id,
        pitch: note.pitch,
        velocity: adjustedVelocity,
        startTime: noteStartTime,
        duration: adjustedDuration,
        endTime: noteStartTime + adjustedDuration,
        noteOnScheduled: false,
        noteOffScheduled: false,
      };

      scheduledNotes.push(scheduledNote);
    });

    this.scheduledNotes.set(clip.id, scheduledNotes);
  }

  /**
   * Process scheduled notes for current playback time
   */
  processSchedule(currentTime: number, trackId: string): void {
    this.currentPlaybackTime = currentTime;

    this.scheduledNotes.forEach((notes, _clipId) => {
      notes.forEach(note => {
        // Schedule note on
        if (!note.noteOnScheduled && note.startTime <= currentTime) {
          this.scheduleNoteOn(trackId, note);
          note.noteOnScheduled = true;
        }

        // Schedule note off
        if (!note.noteOffScheduled && note.endTime <= currentTime) {
          this.scheduleNoteOff(trackId, note);
          note.noteOffScheduled = true;
        }
      });
    });

    // Clean up completed notes
    this.cleanupCompletedNotes();
  }

  /**
   * Schedule a single note on event
   */
  private scheduleNoteOn(trackId: string, note: ScheduledNote): void {
    try {
      // Get the instrument for this track
      const instrument = this.audioEngine.getInstrument(trackId);
      if (instrument) {
        instrument.noteOn(note.pitch, note.velocity, note.startTime);
      }
    } catch (error) {
      console.warn(`Failed to schedule note on for track ${trackId}:`, error);
    }
  }

  /**
   * Schedule a single note off event
   */
  private scheduleNoteOff(trackId: string, note: ScheduledNote): void {
    try {
      // Get the instrument for this track
      const instrument = this.audioEngine.getInstrument(trackId);
      if (instrument) {
        instrument.noteOff(note.pitch, note.endTime);
      }
    } catch (error) {
      console.warn(`Failed to schedule note off for track ${trackId}:`, error);
    }
  }

  /**
   * Unscheduled all notes for a clip
   */
  unscheduleClip(clipId: string): void {
    const notes = this.scheduledNotes.get(clipId);
    if (notes) {
      // Send note off for any currently playing notes
      notes.forEach(note => {
        if (note.noteOnScheduled && !note.noteOffScheduled) {
          // Find the track ID for this clip (this would need to be passed in or stored)
          // For now, we'll send to all instruments as a fallback
          this.audioEngine.getAllInstruments().forEach(instrument => {
            try {
              instrument.noteOff(note.pitch);
            } catch (error) {
              // Ignore errors during cleanup
            }
          });
        }
      });
    }
    
    this.scheduledNotes.delete(clipId);
  }

  /**
   * Clear all scheduled notes
   */
  clearAll(): void {
    // Send note off for all playing notes
    this.scheduledNotes.forEach(notes => {
      notes.forEach(note => {
        if (note.noteOnScheduled && !note.noteOffScheduled) {
          this.audioEngine.getAllInstruments().forEach(instrument => {
            try {
              instrument.noteOff(note.pitch);
            } catch (error) {
              // Ignore errors during cleanup
            }
          });
        }
      });
    });

    this.scheduledNotes.clear();
  }

  /**
   * Clean up completed notes to prevent memory leaks
   */
  private cleanupCompletedNotes(): void {
    this.scheduledNotes.forEach((notes, clipId) => {
      const activeNotes = notes.filter(note => 
        !note.noteOffScheduled || note.endTime > this.currentPlaybackTime - 1.0
      );
      
      if (activeNotes.length !== notes.length) {
        this.scheduledNotes.set(clipId, activeNotes);
      }
    });
  }

  /**
   * Get currently playing notes for debugging
   */
  getPlayingNotes(): Map<string, ScheduledNote[]> {
    const playingNotes = new Map<string, ScheduledNote[]>();
    
    this.scheduledNotes.forEach((notes, clipId) => {
      const currentlyPlaying = notes.filter(note => 
        note.noteOnScheduled && !note.noteOffScheduled
      );
      if (currentlyPlaying.length > 0) {
        playingNotes.set(clipId, currentlyPlaying);
      }
    });
    
    return playingNotes;
  }

  /**
   * Preview a single note (for piano roll interaction)
   */
  previewNote(trackId: string, pitch: number, velocity: number = 100): void {
    try {
      const instrument = this.audioEngine.getInstrument(trackId);
      if (instrument) {
        const currentTime = this.audioEngine.getCurrentTime();
        instrument.noteOn(pitch, velocity, currentTime);
        
        // Auto note off after 200ms
        setTimeout(() => {
          try {
            instrument.noteOff(pitch, currentTime + 0.2);
          } catch (error) {
            // Ignore errors during preview cleanup
          }
        }, 200);
      }
    } catch (error) {
      console.warn(`Failed to preview note for track ${trackId}:`, error);
    }
  }
}

interface ScheduledNote {
  id: string;
  pitch: number;
  velocity: number;
  startTime: number;
  duration: number;
  endTime: number;
  noteOnScheduled: boolean;
  noteOffScheduled: boolean;
}