# Audio Import/Export System

This document describes the audio file import/export functionality implemented for the Zenith DAW application.

## Features

### Audio Import

1. **Multiple Input Methods**:
   - Drag-and-drop audio files onto the import zone
   - Browser file picker (standard HTML input)
   - File System Access API (when supported) for better UX

2. **Supported Formats**:
   - WAV (PCM audio)
   - MP3 (MPEG Layer-3)
   - OGG (Vorbis)
   - FLAC (Free Lossless Audio Codec)

3. **Audio Processing**:
   - Decoding via `AudioContext.decodeAudioData()`
   - Automatic waveform generation for visualization
   - Sample rate and channel detection
   - File metadata extraction

4. **Waveform Generation**:
   - Creates downsampled waveform data for efficient rendering
   - Configurable samples-per-pixel ratio
   - Peak detection for accurate visual representation
   - Per-channel waveform data for stereo files

### Audio Export

1. **Export Formats**:
   - **WAV**: Native PCM encoding, lossless
   - **MP3**: Encoded using lamejs library (configurable bitrate)
   - **OGG**: Encoded using wasm-media-encoders (Vorbis codec)

2. **Export Options**:
   - Full mixdown export
   - Per-track stem export (individual tracks)
   - Configurable bitrate (for MP3: 8-320 kbps)
   - Configurable quality (for OGG: 0-10 scale)
   - Custom sample rates

3. **Mixdown Rendering**:
   - Uses `OfflineAudioContext` for offline rendering
   - Respects track volume, pan, and mute settings
   - Time-accurate clip placement based on tempo
   - Support for audio clips with start/end times

### Project Archive

1. **Export**:
   - Creates ZIP archive with project data and audio assets
   - JSON file containing complete project state
   - Embedded audio files in assets folder
   - Metadata with export timestamp

2. **Import**:
   - Loads project from ZIP archive
   - Restores project state and audio files
   - Validates archive structure
   - Progress tracking during import

### File System Access API

1. **When Available**:
   - Native file picker dialogs
   - Direct file system access
   - Save location selection
   - Better user experience

2. **Fallback**:
   - Standard HTML file input
   - Automatic download with generated filenames
   - Works in all browsers

## Code Structure

### Utilities

- **`src/utils/audioImport.ts`**:
  - `importAudioFile()`: Import single audio file
  - `importMultipleAudioFiles()`: Batch import
  - `generateWaveformData()`: Create waveform visualization data
  - `openFileWithSystemAccess()`: File picker with FSAPI support
  - `isAudioFileSupported()`: Format detection

- **`src/utils/audioExport.ts`**:
  - `exportAudioBuffer()`: Main export function
  - `encodeWAV()`: WAV encoding
  - `encodeMP3()`: MP3 encoding (lamejs)
  - `encodeOGG()`: OGG/Vorbis encoding (wasm-media-encoders)
  - `renderMixdown()`: Offline audio rendering with track mixing
  - `saveFileWithSystemAccess()`: File saving with FSAPI support

- **`src/utils/projectArchive.ts`**:
  - `exportProjectArchive()`: Create ZIP archive
  - `importProjectArchive()`: Load project from ZIP
  - `exportProjectJSON()`: Export project metadata only
  - `importProjectJSON()`: Import project metadata

### Hooks

- **`src/hooks/useAudioImportExport.ts`**:
  - `importAudio()`: Import audio files with progress tracking
  - `exportMixdown()`: Export full mix
  - `exportStems()`: Export individual track stems
  - `exportProject()`: Export project archive
  - `importProject()`: Import project archive
  - State management for progress, status, and errors

### Components

- **`src/components/ImportExportPanel.tsx`**:
  - UI for import/export operations
  - Drag-and-drop zone for audio files
  - Export buttons for different formats
  - Progress indicator and status messages
  - Error handling and display

- **`src/components/SidePanels.tsx`**:
  - Integrated Import/Export tab
  - Accessible from the right sidebar
  - Tabbed interface with Inspector and Instrument panels

### Type Definitions

- **`src/types/lamejs.d.ts`**:
  - TypeScript definitions for lamejs library
  - Mp3Encoder class interface

## Usage Examples

### Importing Audio Files

```typescript
import { useAudioImportExport } from './hooks/useAudioImportExport';

const { importAudio, progress, statusMessage } = useAudioImportExport();

// Import files
const handleImport = async (files: File[]) => {
  const result = await importAudio(files);
  if (result.success) {
    // Process imported audio data
    result.importedData?.forEach((data) => {
      // Add to project
      // data.audioFile - file metadata
      // data.audioBuffer - decoded audio
      // data.waveformData - visualization data
    });
  }
};
```

### Exporting Audio

```typescript
// Export mixdown
const handleExport = async (format: 'wav' | 'mp3' | 'ogg') => {
  const result = await exportMixdown(audioBuffer, 'my-song', format, {
    bitrate: 192, // for MP3
    quality: 0.9, // for OGG
  });
};
```

### Rendering Mixdown

```typescript
import { renderMixdown, MixdownTrack, MixdownClip } from './utils/audioExport';

const tracks: MixdownTrack[] = [
  { id: '1', volume: 0.8, pan: 0, muted: false },
  { id: '2', volume: 1.0, pan: -0.5, muted: false },
];

const clips: MixdownClip[] = [
  {
    id: 'c1',
    trackId: '1',
    start: 0, // beats
    length: 16, // beats
    audioBuffer: buffer1,
  },
];

const mixedBuffer = await renderMixdown(120, tracks, clips, 44100);
```

## Dependencies

- **lamejs** (v1.2.1): MP3 encoding
- **jszip** (v3.10.1): Project archive creation
- **wasm-media-encoders** (v0.7.0): OGG/Vorbis encoding

## Browser Compatibility

- **Audio Import/Export**: All modern browsers with Web Audio API support
- **File System Access API**: Chrome 86+, Edge 86+
- **Fallback**: All browsers with HTML5 file input support

## Progress Tracking

All import/export operations support progress callbacks:

```typescript
{
  onProgress: (progress: number) => {
    // progress is 0.0 to 1.0
    console.log(`Progress: ${Math.round(progress * 100)}%`);
  },
  onError: (error: Error) => {
    console.error('Operation failed:', error);
  }
}
```

## Error Handling

All functions throw errors that can be caught and displayed to users:

- Invalid file formats
- Decoding failures
- Encoding errors
- File system access denied
- Network errors (for future remote operations)

## Performance Considerations

1. **Waveform Generation**: Uses downsampling to reduce memory usage
2. **Encoding**: Processes audio in chunks to avoid blocking
3. **Progress Updates**: Throttled to prevent excessive re-renders
4. **Memory Management**: Releases audio buffers after processing

## Future Enhancements

1. **Additional Formats**: AAC, FLAC export
2. **Batch Operations**: Export multiple tracks simultaneously
3. **Cloud Storage**: Direct export to cloud services
4. **Metadata Editing**: Edit audio file metadata before export
5. **Normalization**: Auto-leveling during export
6. **Dithering**: Bit-depth reduction with dithering
7. **Resampling**: Sample rate conversion during export
