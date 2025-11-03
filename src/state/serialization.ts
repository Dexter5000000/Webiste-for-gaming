import {
  Project,
  Track,
  Clip,
  Effect,
  EffectChain,
  AudioFile,
  AppState,
  TrackType,
  ClipType,
  EffectType,
} from './models';

// Serialization version for future compatibility
export const SERIALIZATION_VERSION = '1.0.0';

// Interface for the serialized project format
interface SerializedProject {
  version: string;
  project: {
    id: string;
    name: string;
    tempo: number;
    timeSignature: {
      numerator: number;
      denominator: number;
    };
    sampleRate: number;
    bitDepth: number;
    buffer: number;
    tracks: any[];
    clips: any[];
    effectChains: any[];
    audioFiles: any[];
    metadata: {
      createdAt: string;
      modifiedAt: string;
      version: string;
      author?: string;
      description?: string;
      tags: string[];
    };
  };
  transport: {
    isPlaying: boolean;
    isRecording: boolean;
    isLooping: boolean;
    isMetronomeEnabled: boolean;
    currentTime: number;
    loopStart: number;
    loopEnd: number;
    punchIn: number;
    punchOut: number;
    countIn: number;
    playbackSpeed: number;
  };
  selection: {
    selectedTrackIds: string[];
    selectedClipIds: string[];
    selectedEffectIds: string[];
    selectionStartTime?: number;
    selectionEndTime?: number;
    selectionTrackStart?: number;
    selectionTrackEnd?: number;
  };
  grid: {
    snapEnabled: boolean;
    snapDivision: number;
    gridDivision: number;
    showGrid: boolean;
    showTimeRuler: boolean;
    showTrackNumbers: boolean;
    zoomHorizontal: number;
    zoomVertical: number;
    scrollPosition: {
      x: number;
      y: number;
    };
  };
}

/**
 * Serializes a project to a JSON string
 * @param project - The project to serialize
 * @returns JSON string representation of the project
 */
export const serializeProject = (project: Project): string => {
  try {
    const serialized: SerializedProject = {
      version: SERIALIZATION_VERSION,
      project: {
        ...project,
        metadata: {
          ...project.metadata,
          createdAt: project.metadata.createdAt.toISOString(),
          modifiedAt: project.metadata.modifiedAt.toISOString(),
        },
      },
      transport: {
        isPlaying: false, // Don't save playback state
        isRecording: false, // Don't save recording state
        isLooping: false, // Don't save loop state
        isMetronomeEnabled: true,
        currentTime: 0,
        loopStart: 0,
        loopEnd: 16,
        punchIn: 0,
        punchOut: 16,
        countIn: 2,
        playbackSpeed: 1.0,
      },
      selection: {
        selectedTrackIds: [],
        selectedClipIds: [],
        selectedEffectIds: [],
      },
      grid: {
        snapEnabled: true,
        snapDivision: 4,
        gridDivision: 4,
        showGrid: true,
        showTimeRuler: true,
        showTrackNumbers: true,
        zoomHorizontal: 20,
        zoomVertical: 60,
        scrollPosition: { x: 0, y: 0 },
      },
    };

    return JSON.stringify(serialized, null, 2);
  } catch (error) {
    console.error('Failed to serialize project:', error);
    throw new Error('Project serialization failed');
  }
};

/**
 * Serializes the complete app state (including transport, selection, grid)
 * @param appState - The complete app state to serialize
 * @returns JSON string representation of the app state
 */
export const serializeAppState = (appState: AppState): string => {
  try {
    const serialized: SerializedProject = {
      version: SERIALIZATION_VERSION,
      project: {
        ...appState.project,
        metadata: {
          ...appState.project.metadata,
          createdAt: appState.project.metadata.createdAt.toISOString(),
          modifiedAt: appState.project.metadata.modifiedAt.toISOString(),
        },
      },
      transport: appState.transport,
      selection: appState.selection,
      grid: appState.grid,
    };

    return JSON.stringify(serialized, null, 2);
  } catch (error) {
    console.error('Failed to serialize app state:', error);
    throw new Error('App state serialization failed');
  }
};

/**
 * Deserializes a JSON string to a Project object
 * @param jsonString - The JSON string to deserialize
 * @returns Deserialized Project object
 */
export const rehydrateProject = (jsonString: string): Project => {
  try {
    const data: SerializedProject = JSON.parse(jsonString);

    // Check version compatibility
    if (data.version !== SERIALIZATION_VERSION) {
      console.warn(
        `Project version mismatch. Expected ${SERIALIZATION_VERSION}, got ${data.version}`
      );
      // In a real app, you might want to handle migration here
    }

    const projectData = data.project;

    // Convert date strings back to Date objects
    const metadata = {
      ...projectData.metadata,
      createdAt: new Date(projectData.metadata.createdAt),
      modifiedAt: new Date(projectData.metadata.modifiedAt),
    };

    // Recreate the project with proper typing
    const project: Project = {
      ...projectData,
      metadata,
      // Ensure arrays are properly typed
      tracks: projectData.tracks.map((track: any) =>
        validateAndFixTrack(track)
      ),
      clips: projectData.clips.map((clip: any) => validateAndFixClip(clip)),
      effectChains: projectData.effectChains.map((chain: any) =>
        validateAndFixEffectChain(chain)
      ),
      audioFiles: projectData.audioFiles.map((file: any) =>
        validateAndFixAudioFile(file)
      ),
    };

    return project;
  } catch (error) {
    console.error('Failed to rehydrate project:', error);
    throw new Error('Project rehydration failed');
  }
};

/**
 * Deserializes a JSON string to a complete AppState object
 * @param jsonString - The JSON string to deserialize
 * @returns Deserialized AppState object
 */
export const rehydrateAppState = (jsonString: string): AppState => {
  try {
    const data: SerializedProject = JSON.parse(jsonString);

    // Check version compatibility
    if (data.version !== SERIALIZATION_VERSION) {
      console.warn(
        `App state version mismatch. Expected ${SERIALIZATION_VERSION}, got ${data.version}`
      );
    }

    const projectData = data.project;

    // Convert date strings back to Date objects
    const metadata = {
      ...projectData.metadata,
      createdAt: new Date(projectData.metadata.createdAt),
      modifiedAt: new Date(projectData.metadata.modifiedAt),
    };

    const project: Project = {
      ...projectData,
      metadata,
      tracks: projectData.tracks.map((track: any) =>
        validateAndFixTrack(track)
      ),
      clips: projectData.clips.map((clip: any) => validateAndFixClip(clip)),
      effectChains: projectData.effectChains.map((chain: any) =>
        validateAndFixEffectChain(chain)
      ),
      audioFiles: projectData.audioFiles.map((file: any) =>
        validateAndFixAudioFile(file)
      ),
    };

    const appState: AppState = {
      project,
      transport: data.transport,
      selection: data.selection,
      grid: data.grid,
      ui: {
        showMixer: false,
        showBrowser: true,
        showInspector: true,
        showAutomation: false,
        focusedPanel: 'timeline',
      },
      history: {
        past: [],
        present: project,
        future: [],
        maxSize: 50,
      },
    };

    return appState;
  } catch (error) {
    console.error('Failed to rehydrate app state:', error);
    throw new Error('App state rehydration failed');
  }
};

/**
 * Validates and fixes track data during deserialization
 */
const validateAndFixTrack = (track: any): Track => {
  const baseTrack = {
    id: track.id || crypto.randomUUID(),
    name: track.name || 'Unknown Track',
    type: Object.values(TrackType).includes(track.type)
      ? track.type
      : TrackType.AUDIO,
    color: track.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
    muted: Boolean(track.muted),
    solo: Boolean(track.solo),
    armed: Boolean(track.armed),
    volume: Math.max(0, Math.min(2, Number(track.volume) || 1)),
    pan: Math.max(-1, Math.min(1, Number(track.pan) || 0)),
    height: Math.max(20, Math.min(200, Number(track.height) || 60)),
    visible: track.visible !== false,
    locked: Boolean(track.locked),
    effectChainId: track.effectChainId || crypto.randomUUID(),
  };

  switch (track.type) {
    case TrackType.AUDIO:
      return {
        ...baseTrack,
        type: TrackType.AUDIO,
        inputDevice: track.inputDevice,
        outputDevice: track.outputDevice,
        monitoring: Boolean(track.monitoring),
        inputGain: Math.max(0, Math.min(2, Number(track.inputGain) || 1)),
        recordEnabled: Boolean(track.recordEnabled),
      } as Track;

    case TrackType.MIDI:
      return {
        ...baseTrack,
        type: TrackType.MIDI,
        inputDevice: track.inputDevice,
        outputDevice: track.outputDevice,
        instrument: {
          type: track.instrument?.type || 'vsti',
          pluginId: track.instrument?.pluginId,
          midiChannel: Math.max(
            0,
            Math.min(15, Number(track.instrument?.midiChannel) || 0)
          ),
        },
        midiThru: Boolean(track.midiThru),
      } as Track;

    case TrackType.EFFECT:
      return {
        ...baseTrack,
        type: TrackType.EFFECT,
        receives: Array.isArray(track.receives) ? track.receives : [],
      } as Track;

    case TrackType.BUS:
      return {
        ...baseTrack,
        type: TrackType.BUS,
        receives: Array.isArray(track.receives) ? track.receives : [],
      } as Track;

    case TrackType.MASTER:
      return {
        ...baseTrack,
        type: TrackType.MASTER,
        limiter: {
          enabled: track.limiter?.enabled !== false,
          ceiling: Math.max(
            -20,
            Math.min(0, Number(track.limiter?.ceiling) || -0.1)
          ),
          release: Math.max(
            1,
            Math.min(1000, Number(track.limiter?.release) || 10)
          ),
        },
      } as Track;

    default:
      return baseTrack as Track;
  }
};

/**
 * Validates and fixes clip data during deserialization
 */
const validateAndFixClip = (clip: any): Clip => {
  const baseClip = {
    id: clip.id || crypto.randomUUID(),
    name: clip.name || 'Unknown Clip',
    type: Object.values(ClipType).includes(clip.type)
      ? clip.type
      : ClipType.AUDIO,
    trackId: clip.trackId || '',
    startTime: Math.max(0, Number(clip.startTime) || 0),
    duration: Math.max(
      0.01,
      Number(clip.duration) >= 0 ? Number(clip.duration) : 1
    ),
    color: clip.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
    muted: Boolean(clip.muted),
    solo: Boolean(clip.solo),
    gain: Math.max(0, Math.min(2, Number(clip.gain) || 1)),
    pan: Math.max(-1, Math.min(1, Number(clip.pan) || 0)),
  };

  if (clip.type === ClipType.AUDIO) {
    return {
      ...baseClip,
      type: ClipType.AUDIO,
      audioFileId: clip.audioFileId || '',
      sampleRate: Math.max(
        8000,
        Math.min(192000, Number(clip.sampleRate) || 44100)
      ),
      bitDepth: [16, 24, 32].includes(clip.bitDepth) ? clip.bitDepth : 24,
      channels: Math.max(1, Math.min(32, Number(clip.channels) || 2)),
      offset: Math.max(0, Number(clip.offset) || 0),
      fadeIn: Math.max(0, Number(clip.fadeIn) || 0),
      fadeOut: Math.max(0, Number(clip.fadeOut) || 0),
      warping: {
        enabled: Boolean(clip.warping?.enabled),
        algorithm: [
          'beats',
          'tones',
          'complex',
          'complexpro',
          're-pitch',
        ].includes(clip.warping?.algorithm)
          ? clip.warping.algorithm
          : 'beats',
      },
    } as Clip;
  } else if (clip.type === ClipType.MIDI) {
    return {
      ...baseClip,
      type: ClipType.MIDI,
      notes: Array.isArray(clip.notes)
        ? clip.notes.map(validateAndFixMidiNote)
        : [],
      velocity: Math.max(0, Math.min(127, Number(clip.velocity) || 100)),
      quantize: Math.max(1, Number(clip.quantize) || 4),
      length: Math.max(0.1, Number(clip.length) || 1),
    } as Clip;
  }

  return baseClip as Clip;
};

/**
 * Validates and fixes MIDI note data during deserialization
 */
const validateAndFixMidiNote = (note: any) => ({
  id: note.id || crypto.randomUUID(),
  pitch: Math.max(0, Math.min(127, Number(note.pitch) || 60)),
  velocity: Math.max(0, Math.min(127, Number(note.velocity) || 100)),
  startTime: Math.max(0, Number(note.startTime) || 0),
  duration: Math.max(0.01, Number(note.duration) || 0.25),
});

/**
 * Validates and fixes effect chain data during deserialization
 */
const validateAndFixEffectChain = (chain: any): EffectChain => ({
  id: chain.id || crypto.randomUUID(),
  trackId: chain.trackId || '',
  effects: Array.isArray(chain.effects)
    ? chain.effects.map((effect: any) => validateAndFixEffect(effect))
    : [],
});

/**
 * Validates and fixes effect data during deserialization
 */
const validateAndFixEffect = (effect: any): Effect => ({
  id: effect.id || crypto.randomUUID(),
  name: effect.name || 'Unknown Effect',
  type: Object.values(EffectType).includes(effect.type)
    ? effect.type
    : EffectType.REVERB,
  enabled: effect.enabled !== false,
  bypassed: Boolean(effect.bypassed),
  parameters:
    typeof effect.parameters === 'object' && effect.parameters !== null
      ? effect.parameters
      : {},
  position: Math.max(0, Number(effect.position) || 0),
});

/**
 * Validates and fixes audio file data during deserialization
 */
const validateAndFixAudioFile = (file: any): AudioFile => ({
  id: file.id || crypto.randomUUID(),
  name: file.name || 'Unknown Audio File',
  path: file.path || '',
  size: Math.max(0, Number(file.size) || 0),
  duration: Math.max(0, Number(file.duration) || 0),
  sampleRate: Math.max(
    8000,
    Math.min(192000, Number(file.sampleRate) || 44100)
  ),
  bitDepth: [16, 24, 32].includes(file.bitDepth) ? file.bitDepth : 24,
  channels: Math.max(1, Math.min(32, Number(file.channels) || 2)),
  format: file.format || 'wav',
  metadata: {
    artist: file.metadata?.artist,
    title: file.metadata?.title,
    album: file.metadata?.album,
    genre: file.metadata?.genre,
    year: file.metadata?.year
      ? Math.max(0, Number(file.metadata.year))
      : undefined,
  },
});

/**
 * Creates a backup of the current project
 * @param project - The project to backup
 * @returns Promise that resolves to the backup file path
 */
export const createProjectBackup = async (
  project: Project
): Promise<string> => {
  try {
    serializeProject(project);
    const fileName = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;

    // In a browser environment, we'd trigger a download
    // In Node.js, we'd write to filesystem
    // For now, return the serialized data
    return fileName;
  } catch (error) {
    console.error('Failed to create project backup:', error);
    throw new Error('Project backup failed');
  }
};

/**
 * Validates that a serialized project is properly formatted
 * @param jsonString - The JSON string to validate
 * @returns True if valid, false otherwise
 */
export const validateSerializedProject = (jsonString: string): boolean => {
  try {
    const data: SerializedProject = JSON.parse(jsonString);

    // Check required fields
    if (!data.version || !data.project) {
      return false;
    }

    const project = data.project;
    if (
      !project.id ||
      !project.name ||
      !project.tempo ||
      !project.timeSignature
    ) {
      return false;
    }

    if (!Array.isArray(project.tracks) || !Array.isArray(project.clips)) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Migration helper for future version upgrades
 * @param data - The deserialized data
 * @param fromVersion - The version the data was created with
 * @param toVersion - The target version
 * @returns Migrated data
 */
export const migrateProjectData = (
  data: any,
  fromVersion: string,
  toVersion: string
): any => {
  // This is a placeholder for future migration logic
  // For now, just return the data as-is
  console.log(`Migrating project from version ${fromVersion} to ${toVersion}`);
  return data;
};
