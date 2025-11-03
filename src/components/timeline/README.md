# Timeline Clip Editing System

A professional DAW-style timeline interface for audio clip manipulation with full support for multi-track editing, waveform visualization, and advanced editing operations.

## Features

### Timeline Viewport
- **Zoomable Canvas**: Zoom in/out using mouse wheel + Ctrl/Cmd or zoom controls
- **Scrollable**: Pan horizontally and vertically to navigate large projects
- **Bars/Beats Grid**: Visual grid aligned to musical time signatures
- **Playhead**: Real-time position indicator following playback
- **Loop Region**: Define and visualize loop sections (enabled via state)
- **Virtualization**: Efficient rendering for large projects with many clips

### Audio Clip Operations
- **Drag & Move**: Click and drag clips to reposition on timeline and across tracks
- **Trim Start/End**: Drag clip edges to adjust duration (non-destructive)
- **Slip Edit**: Hold Alt/Option while dragging to adjust clip offset
- **Duplicate**: Ctrl/Cmd+D to duplicate selected clips
- **Split**: Ctrl/Cmd+S to split selected clip at midpoint
- **Delete**: Delete or Backspace to remove selected clips
- **Multi-Select**: Shift+Click to add to selection, or marquee select by dragging
- **Snapping**: Toggle grid snapping for precise alignment to beats

### Waveform Rendering
- **Placeholder Waveforms**: Generated deterministically per clip for consistent preview
- **Peak Computation**: Precomputed waveform peaks for efficient rendering
- **Web Worker Support**: Offloads peak computation to worker thread (with fallback)
- **Adaptive Resolution**: Waveform detail scales with zoom level
- **Visual Feedback**: Waveforms rendered inline with clips

### Multi-Track System
- **Lane Stacking**: Unlimited tracks with independent clips
- **Height Resizing**: Drag track bottom edge to resize vertically
- **Mute/Solo/Arm**: Per-track buttons for audio routing control
- **Track Reordering**: Drag tracks to reorder (future enhancement)
- **Collapsed Tracks**: Minimize tracks to save space (future enhancement)
- **Color Coding**: Per-track color customization (future enhancement)

### Interaction Gestures
- **Keyboard Shortcuts**:
  - `Delete`/`Backspace`: Delete selected clips
  - `Ctrl/Cmd+D`: Duplicate selected clips
  - `Ctrl/Cmd+S`: Split selected clip
  - `Shift+Click`: Add to selection
  - `Alt+Drag`: Slip edit mode
- **Mouse Gestures**:
  - Click: Select clip
  - Drag: Move clip(s)
  - Edge Drag: Trim clip
  - Empty Space Drag: Marquee selection
  - Wheel: Scroll timeline
  - Ctrl/Cmd+Wheel: Zoom timeline
  - Middle Mouse: Pan timeline (future enhancement)

## Architecture

### State Management
- `TimelineStateStore`: Central state store managing tracks, clips, viewport, and selection
- `TimelineContext`: React context providing state and actions to components
- `AudioEngineState`: Integration point with audio engine (tempo, playback state)

### Components
- `Timeline`: Main container with controls and layout
- `TimelineCanvas`: Canvas-based renderer for clips, grid, and playhead
- `TimelineRuler`: Bar/beat ruler display
- `TrackList`: Vertical list of track headers
- `TrackHeader`: Individual track controls (mute/solo/arm, name, resize)
- `TimelineDemo`: Standalone demo with transport controls

### Data Types
- `AudioClip`: Clip metadata (position, duration, waveform, etc.)
- `TrackConfig`: Track settings (name, height, mute/solo/arm)
- `TimelineViewport`: Zoom, scroll, and snap settings
- `ClipSelection`: Selected clip IDs and drag state
- `ClipInteraction`: Active drag/trim/slip operation state

### Utilities
- `waveformGenerator.ts`: Generates placeholder waveform data
- `WaveformCache.ts`: Manages waveform peak computation and caching
- `waveform-processor.worker.ts`: Web worker for peak computation

## Usage

```typescript
import { TimelineDemo } from './components/timeline';

// Render the timeline demo
<TimelineDemo />

// Or use Timeline directly with custom controls
import { Timeline, TimelineProvider } from './components/timeline';
import { TimelineStateStore } from './audio/clips';

const store = new TimelineStateStore();

<TimelineProvider store={store}>
  <Timeline 
    tempo={120} 
    isPlaying={false} 
    playheadPosition={0} 
  />
</TimelineProvider>
```

## Integration with Audio Engine

The timeline integrates with the existing `AudioEngine` for audio playback:

1. **Clip Scheduling**: Convert clip positions to beat times and schedule via `AudioEngine.scheduleClip()`
2. **Transport Sync**: Update playhead position from `AudioEngine` transport events
3. **Tempo Changes**: Recalculate clip positions when tempo changes
4. **Buffer Management**: Load audio buffers via `AudioBufferCache` and reference by `bufferId`

## Future Enhancements

- [ ] Context menu for clip operations
- [ ] Fade in/out curve editing
- [ ] Clip gain automation
- [ ] Track drag-and-drop reordering
- [ ] Undo/redo support
- [ ] Copy/paste clipboard
- [ ] Real audio file loading
- [ ] MIDI clip support
- [ ] Automation lanes
- [ ] Time signature changes
- [ ] Tempo automation

## Performance Considerations

- **Canvas Rendering**: Uses `requestAnimationFrame` for smooth 60fps updates
- **Virtualization**: Only renders visible clips (future enhancement)
- **Waveform Caching**: Precomputed peaks avoid real-time computation
- **Worker Threading**: Offloads heavy computation from main thread
- **State Immutability**: Efficient React re-renders via immutable state updates

## Testing

To test the timeline:

1. Launch the application
2. Navigate to the start page (timeline loads by default)
3. Use transport controls to play/pause/stop
4. Add tracks via "+ Add Track" button
5. Click and drag clips to move them
6. Drag clip edges to trim
7. Use keyboard shortcuts for duplicate/split/delete operations
8. Zoom and scroll to navigate the timeline
9. Toggle snap to grid for different editing modes
