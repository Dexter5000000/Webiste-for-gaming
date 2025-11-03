import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { 
  AppState, 
  Project, 
  Track, 
  Clip, 
  Effect, 
  EffectChain, 
  AudioFile,
  TransportState,
  SelectionState,
  GridSettings,
  HistoryState,
  TrackType,
  ClipType,
  EffectType
} from './models';

// Initial state helpers
const createEmptyProject = (): Project => ({
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  tempo: 120,
  timeSignature: {
    numerator: 4,
    denominator: 4
  },
  sampleRate: 44100,
  bitDepth: 24,
  buffer: 256,
  tracks: [],
  clips: [],
  effectChains: [],
  audioFiles: [],
  metadata: {
    createdAt: new Date(),
    modifiedAt: new Date(),
    version: '1.0.0',
    tags: []
  }
});

const createInitialTransport = (): TransportState => ({
  isPlaying: false,
  isRecording: false,
  isLooping: false,
  isMetronomeEnabled: true,
  currentTime: 0,
  loopStart: 0,
  loopEnd: 16, // 4 bars at 4/4
  punchIn: 0,
  punchOut: 16,
  countIn: 2,
  playbackSpeed: 1.0
});

const createInitialSelection = (): SelectionState => ({
  selectedTrackIds: [],
  selectedClipIds: [],
  selectedEffectIds: []
});

const createInitialGrid = (): GridSettings => ({
  snapEnabled: true,
  snapDivision: 4, // 16th notes
  gridDivision: 4, // 16th notes
  showGrid: true,
  showTimeRuler: true,
  showTrackNumbers: true,
  zoomHorizontal: 20, // pixels per beat
  zoomVertical: 60, // pixels per track
  scrollPosition: {
    x: 0,
    y: 0
  }
});

const createInitialHistory = (): HistoryState => ({
  past: [],
  present: createEmptyProject(),
  future: [],
  maxSize: 50
});

// Store interface with all actions
interface AppStore extends AppState {
  // Transport actions
  play: () => void;
  stop: () => void;
  togglePlayback: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  toggleLoop: () => void;
  toggleMetronome: () => void;
  setCurrentTime: (time: number) => void;
  setLoopStart: (time: number) => void;
  setLoopEnd: (time: number) => void;
  setTempo: (tempo: number) => void;
  setTimeSignature: (numerator: number, denominator: number) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Track CRUD actions
  addTrack: (type: TrackType, position?: number) => void;
  removeTrack: (trackId: string) => void;
  renameTrack: (trackId: string, name: string) => void;
  duplicateTrack: (trackId: string) => void;
  moveTrack: (trackId: string, newPosition: number) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  setTrackMute: (trackId: string, muted: boolean) => void;
  setTrackSolo: (trackId: string, solo: boolean) => void;
  setTrackArm: (trackId: string, armed: boolean) => void;
  setTrackHeight: (trackId: string, height: number) => void;
  setTrackColor: (trackId: string, color: string) => void;

  // Clip CRUD actions
  addClip: (clip: Omit<Clip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  duplicateClip: (clipId: string) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  resizeClip: (clipId: string, newStartTime: number, newDuration: number) => void;
  setClipGain: (clipId: string, gain: number) => void;
  setClipPan: (clipId: string, pan: number) => void;
  setClipMute: (clipId: string, muted: boolean) => void;
  setClipSolo: (clipId: string, solo: boolean) => void;
  setClipColor: (clipId: string, color: string) => void;

  // Effect actions
  addEffect: (trackId: string, effect: Omit<Effect, 'id'>) => void;
  removeEffect: (effectId: string) => void;
  moveEffect: (effectId: string, newPosition: number) => void;
  setEffectParameter: (effectId: string, parameter: string, value: number | string | boolean) => void;
  setEffectEnabled: (effectId: string, enabled: boolean) => void;
  setEffectBypassed: (effectId: string, bypassed: boolean) => void;

  // Selection actions
  selectTrack: (trackId: string, multi?: boolean) => void;
  selectClip: (clipId: string, multi?: boolean) => void;
  selectEffect: (effectId: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  selectTimeRange: (startTime: number, endTime: number) => void;

  // Grid actions
  setZoomHorizontal: (zoom: number) => void;
  setZoomVertical: (zoom: number) => void;
  setScrollPosition: (x: number, y: number) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setSnapDivision: (division: number) => void;
  setGridDivision: (division: number) => void;
  toggleGrid: () => void;
  toggleTimeRuler: () => void;
  toggleTrackNumbers: () => void;

  // UI actions
  toggleMixer: () => void;
  toggleBrowser: () => void;
  toggleInspector: () => void;
  toggleAutomation: () => void;
  setFocusedPanel: (panel: 'timeline' | 'mixer' | 'browser' | 'inspector' | 'automation' | undefined) => void;

  // Project actions
  newProject: () => void;
  loadProject: (project: Project) => void;
  setProjectName: (name: string) => void;
  addAudioFile: (audioFile: AudioFile) => void;
  removeAudioFile: (fileId: string) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  clearHistory: () => void;

  // Derived selectors
  getSelectedTracks: () => Track[];
  getSelectedClips: () => Clip[];
  getTrackById: (trackId: string) => Track | undefined;
  getClipById: (clipId: string) => Clip | undefined;
  getEffectById: (effectId: string) => Effect | undefined;
  getEffectChainByTrackId: (trackId: string) => EffectChain | undefined;
  getClipsByTrackId: (trackId: string) => Clip[];
  getTracksInRange: (startTime: number, endTime: number, startTrackIndex?: number, endTrackIndex?: number) => Track[];
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// Event emitters for audio engine integration
export interface AudioEngineEvents {
  onTransportStart: () => void;
  onTransportStop: () => void;
  onTransportPositionChange: (time: number) => void;
  onTempoChange: (tempo: number) => void;
  onTimeSignatureChange: (numerator: number, denominator: number) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackPanChange: (trackId: string, pan: number) => void;
  onTrackMuteChange: (trackId: string, muted: boolean) => void;
  onTrackSoloChange: (trackId: string, solo: boolean) => void;
  onClipAdd: (clip: Clip) => void;
  onClipRemove: (clipId: string) => void;
  onClipMove: (clipId: string, newTrackId: string, newStartTime: number) => void;
  onEffectAdd: (effect: Effect) => void;
  onEffectRemove: (effectId: string) => void;
  onEffectParameterChange: (effectId: string, parameter: string, value: number | string | boolean) => void;
}

// Create the store
export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    // Initial state
    project: createEmptyProject(),
    transport: createInitialTransport(),
    selection: createInitialSelection(),
    grid: createInitialGrid(),
    history: createInitialHistory(),
    ui: {
      showMixer: false,
      showBrowser: true,
      showInspector: true,
      showAutomation: false,
      focusedPanel: 'timeline'
    },

    // Transport actions
    play: () => {
      set((state) => {
        state.transport.isPlaying = true;
        state.transport.isRecording = false;
      });
      // Emit event for audio engine
      const events = get() as unknown as AudioEngineEvents;
      events.onTransportStart?.();
    },

    stop: () => {
      set((state) => {
        state.transport.isPlaying = false;
        state.transport.isRecording = false;
        state.transport.currentTime = 0;
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onTransportStop?.();
    },

    togglePlayback: () => {
      const { isPlaying } = get().transport;
      if (isPlaying) {
        get().stop();
      } else {
        get().play();
      }
    },

    startRecording: () => {
      set((state) => {
        state.transport.isRecording = true;
        state.transport.isPlaying = true;
      });
    },

    stopRecording: () => {
      set((state) => {
        state.transport.isRecording = false;
        state.transport.isPlaying = false;
      });
    },

    toggleRecording: () => {
      const { isRecording } = get().transport;
      if (isRecording) {
        get().stopRecording();
      } else {
        get().startRecording();
      }
    },

    toggleLoop: () => {
      set((state) => {
        state.transport.isLooping = !state.transport.isLooping;
      });
    },

    toggleMetronome: () => {
      set((state) => {
        state.transport.isMetronomeEnabled = !state.transport.isMetronomeEnabled;
      });
    },

    setCurrentTime: (time: number) => {
      set((state) => {
        state.transport.currentTime = Math.max(0, time);
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onTransportPositionChange?.(time);
    },

    setLoopStart: (time: number) => {
      set((state) => {
        state.transport.loopStart = Math.max(0, time);
      });
    },

    setLoopEnd: (time: number) => {
      set((state) => {
        state.transport.loopEnd = Math.max(state.transport.loopStart + 1, time);
      });
    },

    setTempo: (tempo: number) => {
      set((state) => {
        state.project.tempo = Math.max(20, Math.min(300, tempo));
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onTempoChange?.(tempo);
    },

    setTimeSignature: (numerator: number, denominator: number) => {
      set((state) => {
        state.project.timeSignature = {
          numerator: Math.max(1, Math.min(32, numerator)),
          denominator: [1, 2, 4, 8, 16, 32].includes(denominator) ? denominator : 4
        };
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onTimeSignatureChange?.(numerator, denominator);
    },

    setPlaybackSpeed: (speed: number) => {
      set((state) => {
        state.transport.playbackSpeed = Math.max(0.1, Math.min(4.0, speed));
      });
    },

    // Track CRUD actions
    addTrack: (type: TrackType, position?: number) => {
      set((state) => {
        const trackId = crypto.randomUUID();
        const effectChainId = crypto.randomUUID();
        
        let newTrack: Track;
        const baseTrack = {
          id: trackId,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${state.project.tracks.length + 1}`,
          type,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          muted: false,
          solo: false,
          armed: false,
          volume: 1,
          pan: 0,
          height: 60,
          visible: true,
          locked: false,
          effectChainId
        };

        switch (type) {
          case TrackType.AUDIO:
            newTrack = {
              ...baseTrack,
              type: TrackType.AUDIO,
              monitoring: false,
              inputGain: 1,
              recordEnabled: false
            } as AudioTrack;
            break;
          case TrackType.MIDI:
            newTrack = {
              ...baseTrack,
              type: TrackType.MIDI,
              instrument: {
                type: 'vsti',
                midiChannel: 0
              },
              midiThru: false
            } as MidiTrack;
            break;
          case TrackType.EFFECT:
            newTrack = {
              ...baseTrack,
              type: TrackType.EFFECT,
              receives: []
            } as EffectTrack;
            break;
          case TrackType.BUS:
            newTrack = {
              ...baseTrack,
              type: TrackType.BUS,
              receives: []
            } as BusTrack;
            break;
          case TrackType.MASTER:
            newTrack = {
              ...baseTrack,
              type: TrackType.MASTER,
              limiter: {
                enabled: true,
                ceiling: -0.1,
                release: 10
              }
            } as MasterTrack;
            break;
          default:
            return;
        }

        const insertIndex = position !== undefined ? Math.min(Math.max(0, position), state.project.tracks.length) : state.project.tracks.length;
        state.project.tracks.splice(insertIndex, 0, newTrack);

        // Add effect chain
        state.project.effectChains.push({
          id: effectChainId,
          trackId,
          effects: []
        });
      });
    },

    removeTrack: (trackId: string) => {
      set((state) => {
        const trackIndex = state.project.tracks.findIndex(t => t.id === trackId);
        if (trackIndex === -1) return;

        const track = state.project.tracks[trackIndex];
        
        // Remove track
        state.project.tracks.splice(trackIndex, 1);
        
        // Remove associated clips
        state.project.clips = state.project.clips.filter(c => c.trackId !== trackId);
        
        // Remove effect chain
        state.project.effectChains = state.project.effectChains.filter(ec => ec.trackId !== trackId);
        
        // Remove from selection
        state.selection.selectedTrackIds = state.selection.selectedTrackIds.filter(id => id !== trackId);
      });
    },

    renameTrack: (trackId: string, name: string) => {
      set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (track) {
          track.name = name.trim();
        }
      });
    },

    duplicateTrack: (trackId: string) => {
      const state = get();
      const track = state.project.tracks.find(t => t.id === trackId);
      if (!track) return;

      const newTrackId = crypto.randomUUID();
      const newEffectChainId = crypto.randomUUID();
      
      set((draftState) => {
        const trackIndex = draftState.project.tracks.findIndex(t => t.id === trackId);
        
        // Deep clone the track
        const newTrack = JSON.parse(JSON.stringify(track));
        newTrack.id = newTrackId;
        newTrack.name = `${track.name} Copy`;
        newTrack.effectChainId = newEffectChainId;
        newTrack.armed = false; // Don't arm duplicated tracks
        
        // Insert after original
        draftState.project.tracks.splice(trackIndex + 1, 0, newTrack);
        
        // Clone effect chain
        const originalEffectChain = draftState.project.effectChains.find(ec => ec.trackId === trackId);
        if (originalEffectChain) {
          draftState.project.effectChains.push({
            id: newEffectChainId,
            trackId: newTrackId,
            effects: originalEffectChain.effects.map(effect => ({
              ...effect,
              id: crypto.randomUUID()
            }))
          });
        }
        
        // Clone clips
        const originalClips = draftState.project.clips.filter(c => c.trackId === trackId);
        const newClips = originalClips.map(clip => ({
          ...clip,
          id: crypto.randomUUID(),
          trackId: newTrackId
        }));
        draftState.project.clips.push(...newClips);
      });
    },

    moveTrack: (trackId: string, newPosition: number) => {
      set((state) => {
        const trackIndex = state.project.tracks.findIndex(t => t.id === trackId);
        if (trackIndex === -1) return;

        const [track] = state.project.tracks.splice(trackIndex, 1);
        const clampedPosition = Math.min(Math.max(0, newPosition), state.project.tracks.length);
        state.project.tracks.splice(clampedPosition, 0, track);
      });
    },

    setTrackVolume: (trackId: string, volume: number) => {
      set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (track) {
          track.volume = Math.max(0, Math.min(2, volume));
        }
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onTrackVolumeChange?.(trackId, volume);
    },

    setTrackPan: (trackId: string, pan: number) => {
      set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (track) {
          track.pan = Math.max(-1, Math.min(1, pan));
        }
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onTrackPanChange?.(trackId, pan);
    },

    setTrackMute: (trackId: string, muted: boolean) => {
      set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (track) {
          track.muted = muted;
        }
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onTrackMuteChange?.(trackId, muted);
    },

    setTrackSolo: (trackId: string, solo: boolean) => {
      set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (track) {
          track.solo = solo;
        }
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onTrackSoloChange?.(trackId, solo);
    },

    setTrackArm: (trackId: string, armed: boolean) => {
      set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (track) {
          track.armed = armed;
        }
      });
    },

    setTrackHeight: (trackId: string, height: number) => {
      set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (track) {
          track.height = Math.max(20, Math.min(200, height));
        }
      });
    },

    setTrackColor: (trackId: string, color: string) => {
      set((state) => {
        const track = state.project.tracks.find(t => t.id === trackId);
        if (track) {
          track.color = color;
        }
      });
    },

    // Clip CRUD actions
    addClip: (clip: Omit<Clip, 'id'>) => {
      set((state) => {
        const newClip: Clip = {
          ...clip,
          id: crypto.randomUUID()
        };
        state.project.clips.push(newClip);
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onClipAdd?.(clip as Clip);
    },

    removeClip: (clipId: string) => {
      set((state) => {
        state.project.clips = state.project.clips.filter(c => c.id !== clipId);
        state.selection.selectedClipIds = state.selection.selectedClipIds.filter(id => id !== clipId);
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onClipRemove?.(clipId);
    },

    duplicateClip: (clipId: string) => {
      const state = get();
      const clip = state.project.clips.find(c => c.id === clipId);
      if (!clip) return;

      set((draftState) => {
        const newClip: Clip = {
          ...clip,
          id: crypto.randomUUID(),
          startTime: clip.startTime + clip.duration // Place right after original
        };
        draftState.project.clips.push(newClip);
      });
    },

    moveClip: (clipId: string, newTrackId: string, newStartTime: number) => {
      set((state) => {
        const clip = state.project.clips.find(c => c.id === clipId);
        if (clip) {
          clip.trackId = newTrackId;
          clip.startTime = Math.max(0, newStartTime);
        }
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onClipMove?.(clipId, newTrackId, newStartTime);
    },

    resizeClip: (clipId: string, newStartTime: number, newDuration: number) => {
      set((state) => {
        const clip = state.project.clips.find(c => c.id === clipId);
        if (clip) {
          clip.startTime = Math.max(0, newStartTime);
          clip.duration = Math.max(0.1, newDuration);
        }
      });
    },

    setClipGain: (clipId: string, gain: number) => {
      set((state) => {
        const clip = state.project.clips.find(c => c.id === clipId);
        if (clip) {
          clip.gain = Math.max(0, Math.min(2, gain));
        }
      });
    },

    setClipPan: (clipId: string, pan: number) => {
      set((state) => {
        const clip = state.project.clips.find(c => c.id === clipId);
        if (clip) {
          clip.pan = Math.max(-1, Math.min(1, pan));
        }
      });
    },

    setClipMute: (clipId: string, muted: boolean) => {
      set((state) => {
        const clip = state.project.clips.find(c => c.id === clipId);
        if (clip) {
          clip.muted = muted;
        }
      });
    },

    setClipSolo: (clipId: string, solo: boolean) => {
      set((state) => {
        const clip = state.project.clips.find(c => c.id === clipId);
        if (clip) {
          clip.solo = solo;
        }
      });
    },

    setClipColor: (clipId: string, color: string) => {
      set((state) => {
        const clip = state.project.clips.find(c => c.id === clipId);
        if (clip) {
          clip.color = color;
        }
      });
    },

    // Effect actions
    addEffect: (trackId: string, effect: Omit<Effect, 'id'>) => {
      set((state) => {
        const effectChain = state.project.effectChains.find(ec => ec.trackId === trackId);
        if (effectChain) {
          const newEffect: Effect = {
            ...effect,
            id: crypto.randomUUID(),
            position: effectChain.effects.length
          };
          effectChain.effects.push(newEffect);
        }
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onEffectAdd?.(effect as Effect);
    },

    removeEffect: (effectId: string) => {
      set((state) => {
        state.project.effectChains.forEach(effectChain => {
          const effectIndex = effectChain.effects.findIndex(e => e.id === effectId);
          if (effectIndex !== -1) {
            effectChain.effects.splice(effectIndex, 1);
            // Update positions of remaining effects
            effectChain.effects.forEach((effect, index) => {
              effect.position = index;
            });
          }
        });
        state.selection.selectedEffectIds = state.selection.selectedEffectIds.filter(id => id !== effectId);
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onEffectRemove?.(effectId);
    },

    moveEffect: (effectId: string, newPosition: number) => {
      set((state) => {
        state.project.effectChains.forEach(effectChain => {
          const effectIndex = effectChain.effects.findIndex(e => e.id === effectId);
          if (effectIndex !== -1) {
            const [effect] = effectChain.effects.splice(effectIndex, 1);
            const clampedPosition = Math.min(Math.max(0, newPosition), effectChain.effects.length);
            effectChain.effects.splice(clampedPosition, 0, effect);
            // Update positions
            effectChain.effects.forEach((effect, index) => {
              effect.position = index;
            });
          }
        });
      });
    },

    setEffectParameter: (effectId: string, parameter: string, value: number | string | boolean) => {
      set((state) => {
        state.project.effectChains.forEach(effectChain => {
          const effect = effectChain.effects.find(e => e.id === effectId);
          if (effect) {
            effect.parameters[parameter] = value;
          }
        });
      });
      const events = get() as unknown as AudioEngineEvents;
      events.onEffectParameterChange?.(effectId, parameter, value);
    },

    setEffectEnabled: (effectId: string, enabled: boolean) => {
      set((state) => {
        state.project.effectChains.forEach(effectChain => {
          const effect = effectChain.effects.find(e => e.id === effectId);
          if (effect) {
            effect.enabled = enabled;
          }
        });
      });
    },

    setEffectBypassed: (effectId: string, bypassed: boolean) => {
      set((state) => {
        state.project.effectChains.forEach(effectChain => {
          const effect = effectChain.effects.find(e => e.id === effectId);
          if (effect) {
            effect.bypassed = bypassed;
          }
        });
      });
    },

    // Selection actions
    selectTrack: (trackId: string, multi = false) => {
      set((state) => {
        if (multi) {
          if (state.selection.selectedTrackIds.includes(trackId)) {
            state.selection.selectedTrackIds = state.selection.selectedTrackIds.filter(id => id !== trackId);
          } else {
            state.selection.selectedTrackIds.push(trackId);
          }
        } else {
          state.selection.selectedTrackIds = [trackId];
        }
        state.selection.selectedClipIds = [];
        state.selection.selectedEffectIds = [];
      });
    },

    selectClip: (clipId: string, multi = false) => {
      set((state) => {
        if (multi) {
          if (state.selection.selectedClipIds.includes(clipId)) {
            state.selection.selectedClipIds = state.selection.selectedClipIds.filter(id => id !== clipId);
          } else {
            state.selection.selectedClipIds.push(clipId);
          }
        } else {
          state.selection.selectedClipIds = [clipId];
        }
        state.selection.selectedTrackIds = [];
        state.selection.selectedEffectIds = [];
      });
    },

    selectEffect: (effectId: string, multi = false) => {
      set((state) => {
        if (multi) {
          if (state.selection.selectedEffectIds.includes(effectId)) {
            state.selection.selectedEffectIds = state.selection.selectedEffectIds.filter(id => id !== effectId);
          } else {
            state.selection.selectedEffectIds.push(effectId);
          }
        } else {
          state.selection.selectedEffectIds = [effectId];
        }
        state.selection.selectedTrackIds = [];
        state.selection.selectedClipIds = [];
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selection.selectedTrackIds = [];
        state.selection.selectedClipIds = [];
        state.selection.selectedEffectIds = [];
        state.selection.selectionStartTime = undefined;
        state.selection.selectionEndTime = undefined;
        state.selection.selectionTrackStart = undefined;
        state.selection.selectionTrackEnd = undefined;
      });
    },

    selectAll: () => {
      set((state) => {
        state.selection.selectedTrackIds = state.project.tracks.map(t => t.id);
        state.selection.selectedClipIds = state.project.clips.map(c => c.id);
      });
    },

    selectTimeRange: (startTime: number, endTime: number) => {
      set((state) => {
        state.selection.selectionStartTime = Math.min(startTime, endTime);
        state.selection.selectionEndTime = Math.max(startTime, endTime);
      });
    },

    // Grid actions
    setZoomHorizontal: (zoom: number) => {
      set((state) => {
        state.grid.zoomHorizontal = Math.max(5, Math.min(100, zoom));
      });
    },

    setZoomVertical: (zoom: number) => {
      set((state) => {
        state.grid.zoomVertical = Math.max(20, Math.min(200, zoom));
      });
    },

    setScrollPosition: (x: number, y: number) => {
      set((state) => {
        state.grid.scrollPosition.x = Math.max(0, x);
        state.grid.scrollPosition.y = Math.max(0, y);
      });
    },

    setSnapEnabled: (enabled: boolean) => {
      set((state) => {
        state.grid.snapEnabled = enabled;
      });
    },

    setSnapDivision: (division: number) => {
      set((state) => {
        state.grid.snapDivision = division;
      });
    },

    setGridDivision: (division: number) => {
      set((state) => {
        state.grid.gridDivision = division;
      });
    },

    toggleGrid: () => {
      set((state) => {
        state.grid.showGrid = !state.grid.showGrid;
      });
    },

    toggleTimeRuler: () => {
      set((state) => {
        state.grid.showTimeRuler = !state.grid.showTimeRuler;
      });
    },

    toggleTrackNumbers: () => {
      set((state) => {
        state.grid.showTrackNumbers = !state.grid.showTrackNumbers;
      });
    },

    // UI actions
    toggleMixer: () => {
      set((state) => {
        state.ui.showMixer = !state.ui.showMixer;
      });
    },

    toggleBrowser: () => {
      set((state) => {
        state.ui.showBrowser = !state.ui.showBrowser;
      });
    },

    toggleInspector: () => {
      set((state) => {
        state.ui.showInspector = !state.ui.showInspector;
      });
    },

    toggleAutomation: () => {
      set((state) => {
        state.ui.showAutomation = !state.ui.showAutomation;
      });
    },

    setFocusedPanel: (panel) => {
      set((state) => {
        state.ui.focusedPanel = panel;
      });
    },

    // Project actions
    newProject: () => {
      set((state) => {
        state.project = createEmptyProject();
        state.transport = createInitialTransport();
        state.selection = createInitialSelection();
        state.history = createInitialHistory();
      });
    },

    loadProject: (project: Project) => {
      set((state) => {
        state.project = { ...project };
        state.transport = createInitialTransport();
        state.selection = createInitialSelection();
        state.history = {
          past: [],
          present: { ...project },
          future: [],
          maxSize: 50
        };
      });
    },

    setProjectName: (name: string) => {
      set((state) => {
        state.project.name = name.trim();
        state.project.metadata.modifiedAt = new Date();
      });
    },

    addAudioFile: (audioFile: AudioFile) => {
      set((state) => {
        state.project.audioFiles.push(audioFile);
        state.project.metadata.modifiedAt = new Date();
      });
    },

    removeAudioFile: (fileId: string) => {
      set((state) => {
        state.project.audioFiles = state.project.audioFiles.filter(f => f.id !== fileId);
        // Remove clips that use this audio file
        state.project.clips = state.project.clips.filter(c => 
          !(c.type === ClipType.AUDIO && (c as any).audioFileId === fileId)
        );
        state.project.metadata.modifiedAt = new Date();
      });
    },

    // History actions
    undo: () => {
      set((state) => {
        if (state.history.past.length === 0) return;
        
        const previous = state.history.past[state.history.past.length - 1];
        const newPast = state.history.past.slice(0, state.history.past.length - 1);
        
        state.history = {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future],
          maxSize: state.history.maxSize
        };
        
        state.project = { ...previous };
      });
    },

    redo: () => {
      set((state) => {
        if (state.history.future.length === 0) return;
        
        const next = state.history.future[0];
        const newFuture = state.history.future.slice(1);
        
        state.history = {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture,
          maxSize: state.history.maxSize
        };
        
        state.project = { ...next };
      });
    },

    saveToHistory: () => {
      set((state) => {
        const newPast = [...state.history.past, state.project];
        
        if (newPast.length > state.history.maxSize) {
          newPast.shift();
        }
        
        state.history = {
          past: newPast,
          present: { ...state.project },
          future: [],
          maxSize: state.history.maxSize
        };
      });
    },

    clearHistory: () => {
      set((state) => {
        state.history = {
          past: [],
          present: { ...state.project },
          future: [],
          maxSize: state.history.maxSize
        };
      });
    },

    // Derived selectors
    getSelectedTracks: () => {
      const { project, selection } = get();
      return project.tracks.filter(t => selection.selectedTrackIds.includes(t.id));
    },

    getSelectedClips: () => {
      const { project, selection } = get();
      return project.clips.filter(c => selection.selectedClipIds.includes(c.id));
    },

    getTrackById: (trackId: string) => {
      return get().project.tracks.find(t => t.id === trackId);
    },

    getClipById: (clipId: string) => {
      return get().project.clips.find(c => c.id === clipId);
    },

    getEffectById: (effectId: string) => {
      const { project } = get();
      for (const effectChain of project.effectChains) {
        const effect = effectChain.effects.find(e => e.id === effectId);
        if (effect) return effect;
      }
      return undefined;
    },

    getEffectChainByTrackId: (trackId: string) => {
      return get().project.effectChains.find(ec => ec.trackId === trackId);
    },

    getClipsByTrackId: (trackId: string) => {
      return get().project.clips.filter(c => c.trackId === trackId);
    },

    getTracksInRange: (startTime: number, endTime: number, startTrackIndex = 0, endTrackIndex = Infinity) => {
      const { project } = get();
      return project.tracks.slice(startTrackIndex, endTrackIndex).filter(track => {
        const trackClips = project.clips.filter(c => c.trackId === track.id);
        return trackClips.some(clip => 
          (clip.startTime < endTime && clip.startTime + clip.duration > startTime)
        );
      });
    },

    canUndo: () => {
      return get().history.past.length > 0;
    },

    canRedo: () => {
      return get().history.future.length > 0;
    }
  }))
);

// Export types and helper functions for external use
export type { AppStore };
export { createEmptyProject, createInitialTransport, createInitialSelection, createInitialGrid };