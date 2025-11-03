# Audio Import/Export Integration

## Overview

This document describes the audio file import/export integration that connects the audio utilities to the UI for clip placement and playback.

## Changes Made

### 1. App.tsx - Main Integration

**Added:**
- Import of `useAudioImportExport` hook
- Audio buffer storage via refs:
  - `audioBuffersRef`: Stores decoded AudioBuffer objects mapped by audioFileId
  - `audioFilesRef`: Stores original file data (ArrayBuffer/Blob) for export
  - `nextClipIdRef` and `nextAudioFileIdRef`: ID counters for new clips/files
- Changed clips from read-only state to mutable state with setClips

**Handlers:**
- `handleImportAudio`: Imports audio files and creates timeline clips
  - Decodes audio files using the `importAudio` hook function
  - Places clips on the selected track (prefers audio tracks)
  - Calculates duration in beats based on tempo
  - Stores waveform data for visualization
  - Places clips sequentially starting at playhead position
  
- `handleExportAudio`: Placeholder for mixdown export
- `handleExportStems`: Placeholder for stem export  
- `handleExportProject`: Exports project as .zdaw archive
- `handleImportProject`: Imports project from archive

**Props passed to SidePanels:**
- All import/export handlers
- Processing state (isImporting, isExporting)
- Progress and status messages

### 2. SidePanels.tsx - Prop Plumbing

**Added:**
- Props for processing state: `isProcessing`, `progress`, `statusMessage`, `errorMessage`
- Forwarded all props to ImportExportPanel component

### 3. TimelineViewport.tsx - Waveform Rendering

**Added:**
- Canvas ref map for waveform rendering per clip
- useEffect hook that:
  - Creates canvas elements for each clip with waveform data
  - Renders waveform visualization from Float32Array data
  - Updates when clips or zoom level changes
- Canvas overlay on timeline clips to display waveforms

**Rendering:**
- Waveform drawn with vertical lines from center
- Uses amplitude data to show peak levels
- Supports multi-channel audio (merges channels for display)
- Semi-transparent overlay on clip background

### 4. DistortionEffect.ts - Bug Fix

**Fixed:**
- Malformed code structure with methods outside class
- Added missing `getEffectInput()` method
- Properly wrapped parameter initialization in `initializeParameters()` method

## How It Works

### Audio Import Flow

1. User drags/drops or selects audio files in ImportExportPanel
2. Files are passed to `handleImportAudio` in App.tsx
3. `importAudio` hook function:
   - Reads file as ArrayBuffer
   - Decodes using Web Audio API
   - Generates downsampled waveform data
4. For each imported file:
   - Create unique audioFileId and clipId
   - Store AudioBuffer in audioBuffersRef
   - Store original data in audioFilesRef
   - Calculate duration in beats (seconds * tempo / 60)
   - Create TimelineClip with waveform data
5. Clips added to timeline state
6. TimelineViewport renders clips with waveforms

### Clip Placement

- **Track Selection**: Prioritizes selected audio tracks, falls back to any track
- **Position**: Clips placed at current playhead position
- **Sequential**: Multiple files placed one after another
- **Duration**: Calculated based on audio duration and current tempo

### Waveform Display

- Generated at import time with configurable samples-per-pixel ratio
- Stored as Float32Array per channel
- Rendered on canvas with vertical lines showing amplitude
- Updates automatically when zoom changes

## File Format Support

**Import:**
- WAV (PCM audio)
- MP3 (MPEG Layer-3)
- OGG (Vorbis)
- FLAC (Free Lossless Audio Codec)

**Export:**
- WAV: Native PCM encoding
- MP3: Using lamejs library
- OGG: Using wasm-media-encoders

## Testing

To test the implementation:

1. Launch the application
2. Open the Import/Export panel from the right sidebar
3. Drag and drop or browse for audio files
4. Imported files should appear as clips on the timeline
5. Clips should display waveforms
6. Multiple files import sequentially

## Future Enhancements

- Complete mixdown export functionality
- Stem export implementation  
- Link audio buffers to AudioEngine for playback
- Clip trimming and editing
- Fade in/out controls
- Time stretching/pitch shifting
