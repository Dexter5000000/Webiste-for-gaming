# DAW UI Shell Layout

This document describes the responsive, dark-themed Digital Audio Workstation (DAW) layout implementation.

## Overview

The DAW layout provides a professional music production interface with a comprehensive design system, modular components, and full keyboard accessibility.

## Architecture

### Design System

#### Design Tokens (`src/styles/tokens.css`)
- **Color System**: Dark theme with semantic colors
  - Background layers: base, surface, elevated, panel
  - Text hierarchy: primary, secondary, muted
  - Accent colors with soft variants
  - Status colors: positive, warning, danger
- **Spacing Scale**: 3xs to 3xl (2px to 40px)
- **Typography**: Sans-serif + monospace with size scale
- **Component Dimensions**: Transport bar, track rows, mixer heights
- **Shadows & Effects**: Soft and strong shadows, focus rings

#### Primitives (`src/styles/design-system.css`)
- **Layout**: Panel, card, flex utilities, grid
- **Buttons**: Primary, secondary, ghost, icon variants
- **Form Controls**: Inputs, range sliders with accent theming
- **Resizers**: Horizontal and vertical drag handles
- **Scrollbars**: Custom styled with accent color
- **Accessibility**: Focus rings, reduced motion support

### Components

#### TransportBar
**Purpose**: Top control bar for playback, tempo, and workspace toggles

**Features**:
- Play/pause/stop/record/loop controls
- Tempo adjustment (40-220 BPM) with increment buttons
- Time signature display
- Playhead position in bars.beats.ticks format
- Metronome toggle
- Zoom controls with percentage display
- Panel visibility toggles (tracks, inspector, mixer)

**Keyboard Shortcuts**:
- `Space`: Toggle play/pause
- `Escape`: Stop playback
- `Cmd/Ctrl + +/-`: Zoom in/out
- `Cmd/Ctrl + 0`: Reset zoom

#### TrackLane
**Purpose**: Individual track row in the track list

**Features**:
- Color-coded track indicator
- Track name and type (audio/midi/instrument)
- Arm, mute, solo buttons
- Selection state visualization
- Keyboard navigation (Enter/Space to select)

**Props**:
- `track`: Track data (id, name, type, color, controls state)
- Event handlers for selection and control toggles

#### TimelineViewport
**Purpose**: Main canvas for arranging clips/regions

**Features**:
- Ruler with bar numbers
- Grid background that scales with zoom
- Animated playhead indicator
- Clip rendering with positioning
- Drag/resize support (placeholder)

**Props**:
- `playheadPosition`: Current beat position
- `zoomLevel`: Scale factor (0.25-4.0)
- `tracks`: Track list for rendering rows
- `clips`: Timeline clips with start/length/color

#### SidePanels
**Purpose**: Right-side inspector and instrument panels

**Tabs**:
1. **Inspector**: Track properties (name, volume, pan, color)
2. **Instrument**: Virtual instrument controls (type, presets, ADSR)

**Features**:
- Tabbed interface
- Resizable width (220-480px)
- Collapsible with smooth animation
- Form controls for parameters

#### MixerDock
**Purpose**: Bottom horizontal mixer strip

**Features**:
- Channel strips with:
  - Color indicator
  - Vertical fader with visual track
  - Mute/solo buttons
  - Pan display
- Resizable height (140-360px)
- Collapsible with expand/collapse button

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      TransportBar                           │
├──────────┬────────────────────────────────┬─────────────────┤
│          │      Timeline Header           │                 │
│  Track   ├────────────────────────────────┤   Side Panels   │
│  List    │                                │   - Inspector   │
│          │      Timeline Viewport         │   - Instrument  │
│          │      (Canvas + Clips)          │                 │
│          │                                │                 │
├──────────┴────────────────────────────────┴─────────────────┤
│                      MixerDock                              │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (>1200px)
- Full layout with all panels visible
- Track list: 240-420px (resizable)
- Side panels: 280-480px (resizable)
- Mixer: 200-360px (resizable)

### Tablet (900-1200px)
- Narrower default widths
- Side panels become overlay at mobile breakpoint
- Transport info scales down

### Mobile (<640px)
- Transport info hidden
- Track list becomes overlay
- Mixer becomes collapsible overlay
- Stacked layout with touch-friendly controls

## Keyboard Accessibility

### Global Shortcuts
- `Space`: Toggle play/pause
- `Escape`: Stop playback and reset
- `Cmd/Ctrl + +`: Zoom in timeline
- `Cmd/Ctrl + -`: Zoom out timeline
- `Cmd/Ctrl + 0`: Reset zoom to 100%

### Navigation
- `Tab`: Navigate between controls
- `Enter`/`Space`: Activate buttons
- Track lanes are keyboard-selectable
- All controls have focus indicators

### Accessibility Features
- ARIA labels on all interactive elements
- Role attributes for semantic structure
- Live regions for status updates (tempo, zoom)
- Proper heading hierarchy
- Focus management for panels

## Panel Resizing

### Implementation
Uses pointer events with capture for smooth dragging:
- **Track List**: Vertical resizer on right edge
- **Inspector**: Vertical resizer on left edge
- **Mixer**: Horizontal resizer on top edge

### Constraints
- Track list: 160-420px
- Inspector: 220-480px
- Mixer: 140-360px

### UX Details
- Cursor changes to resize indicator on hover
- Body cursor and selection disabled during drag
- Visual feedback on resize handles
- Smooth transitions when collapsing/expanding

## State Management

### App State
- Playback state (playing, recording, looping)
- Transport settings (tempo, metronome)
- Timeline state (playhead position, zoom level)
- Track data (5 mock tracks with controls)
- Panel visibility (tracks, inspector, mixer collapsed)
- Panel dimensions (widths/heights for resizing)

### Animation
- Playhead advances via `requestAnimationFrame`
- Beat-accurate positioning based on tempo
- Loop handling with seamless wraparound
- Automatic stop at end when not looping

## Mock Data

### Default Tracks
1. **Kick** (Audio) - Teal
2. **Snare** (Audio) - Orange
3. **Hi-Hat** (MIDI) - Red
4. **Bass** (Instrument) - Purple
5. **Synth Lead** (Instrument) - Green

### Default Clips
- Various patterns across tracks
- Different start positions and lengths
- Color-coded matching track colors

## Theming

### Dark Theme
- Base background: `#0e1016`
- Surface layers progressively lighter
- High contrast text for readability
- Accent color: Teal (`#66d6b6`)
- Subtle borders and dividers

### Color Philosophy
- Professional DAW aesthetic
- Low eye strain for extended sessions
- Clear visual hierarchy
- Focus on content (timeline/tracks)

## Future Enhancements

1. **Clip Interactions**: Drag, resize, split, copy/paste
2. **Waveform Display**: Audio visualization in clips
3. **MIDI Piano Roll**: Note editing interface
4. **Automation Lanes**: Parameter automation curves
5. **Plugin Panels**: Effects and instrument UIs
6. **Context Menus**: Right-click actions
7. **Undo/Redo**: History management
8. **Project Save/Load**: Persistence layer
9. **Audio Engine**: Web Audio API integration
10. **MIDI Support**: Web MIDI API integration

## Development

### Build
```bash
npm run build
```

### Development Server
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

## Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox required
- Pointer Events API for resizing
- requestAnimationFrame for smooth playback animation

## File Structure

```
src/
├── components/
│   ├── TransportBar.tsx       - Top control bar
│   ├── TrackLane.tsx          - Track list item
│   ├── TimelineViewport.tsx   - Main canvas area
│   ├── SidePanels.tsx         - Right-side panels
│   └── MixerDock.tsx          - Bottom mixer strip
├── styles/
│   ├── tokens.css             - Design tokens
│   ├── design-system.css      - Primitives & utilities
│   ├── shell.css              - Layout styles
│   └── index.css              - Entry point
└── App.tsx                    - Main app component
```
