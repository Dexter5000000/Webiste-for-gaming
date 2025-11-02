// State management module exports
export * from './models';
export * from './store';
export * from './serialization';

// Re-export commonly used types and functions
export type { AppStore, AudioEngineEvents } from './store';
export { 
  createEmptyProject,
  createInitialTransport,
  createInitialSelection,
  createInitialGrid
} from './store';
export { 
  serializeProject, 
  rehydrateProject, 
  serializeAppState, 
  rehydrateAppState,
  validateSerializedProject,
  createProjectBackup
} from './serialization';