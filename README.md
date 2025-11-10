# Zenith DAW

[![Build Status](https://travis-ci.com/Dexter5000000/Webiste-for-gaming.svg?branch=main)](https://travis-ci.com/Dexter5000000/Webiste-for-gaming)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A professional digital audio workstation (DAW) built with modern web technologies, featuring a comprehensive timeline, mixer, and instrument system.

## Features

- 🎵 **Professional Timeline**: Multi-track audio/MIDI sequencing with clip-based workflow
- 🎛️ **Full Mixer**: Complete mixing console with volume, pan, mute, and solo controls
- 🎹 **Instrument Support**: Built-in synthesizers and drum machines
- ⚡ **Real-time Audio**: Web Audio API integration for low-latency performance
- 🎨 **Modern Interface**: Clean, responsive design built with React and TypeScript
- 🔧 **Extensible Architecture**: Modular components for easy customization

## Prerequisites

Before running Zenith DAW, you need to install Node.js:

1. **Download Node.js**: Go to https://nodejs.org/
2. **Install**: Download the LTS version and install it
3. **Verify**: Open a command prompt and run:
   ```
   node --version
   npm --version
   ```

## Installation

1. **Clone or download** this repository
2. **Open terminal** in the project directory
3. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the DAW

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── TransportBar.tsx # Playback controls and tempo
│   │   ├── TrackLane.tsx    # Track management interface
│   │   ├── TimelineViewport.tsx # Main timeline view
│   │   ├── MixerDock.tsx    # Mixing console
│   │   ├── SidePanels.tsx   # Instrument and property panels
│   │   ├── SettingsPanel.tsx # Application settings
│   │   └── timeline/        # Timeline-specific components
│   ├── audio/               # Audio engine and processing
│   │   ├── AudioEngine.ts   # Core audio management
│   │   ├── instruments/     # Built-in instruments
│   │   ├── workers/         # Audio processing workers
│   │   └── worklet/         # Audio worklets
│   ├── state/               # State management
│   ├── styles/              # CSS stylesheets
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main application component
│   └── types.ts             # TypeScript type definitions
├── public/                  # Static assets
├── dist/                    # Build output
├── package.json             # Project configuration
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── .eslintrc.json           # ESLint configuration
```

## Key Features

### Timeline & Sequencing
- **Multi-track Support**: Audio, MIDI, and instrument tracks
- **Clip-based Workflow**: Arrange and edit audio/MIDI clips
- **Zoom & Navigation**: Detailed timeline navigation with zoom controls
- **Grid Snapping**: Precise editing with beat-based grid

### Mixing & Processing
- **Channel Strips**: Individual volume, pan, mute, and solo controls
- **Real-time Mixing**: Low-latency audio processing
- **Track Management**: Add, remove, and organize tracks
- **Visual Feedback**: Color-coded tracks and meters

### Instruments & Audio
- **Built-in Synthesizers**: Subtractivesynthesis and drum machines
- **Audio Engine**: Professional Web Audio API implementation
- **Effects Processing**: Reverb, delay, and other audio effects
- **MIDI Support**: Full MIDI recording and playback

### User Interface
- **Responsive Design**: Adapts to different screen sizes
- **Keyboard Shortcuts**: Professional workflow shortcuts
- **Modern React UI**: Component-based architecture
- **TypeScript**: Type-safe development experience

## Development

### Adding Features
1. **Components**: Create new React components in `src/components/`
2. **Audio**: Add instruments or effects in `src/audio/`
3. **Styling**: Add CSS to `src/styles/`
4. **Types**: Update TypeScript types in `src/types.ts`

### Development Commands
- **Development**: `npm run dev` - Start dev server with hot reload
- **Build**: `npm run build` - Create production build
- **Preview**: `npm run preview` - Preview production build
- **Test**: `npm run test` - Run unit tests
- **Lint**: `npm run lint` - Run ESLint
- **Format**: `npm run format` - Format code with Prettier

## Audio Architecture

The DAW uses a modular audio architecture:
- **AudioEngine**: Core audio management and context
- **Workers**: Background audio processing for performance
- **Worklets**: Low-latency audio processing
- **Instruments**: Pluggable instrument system

## Contributing

This is a professional DAW project focused on:
- **Performance**: Low-latency audio processing
- **Usability**: Intuitive workflow for music production
- **Extensibility**: Modular architecture for custom features
- **Quality**: Type-safe, well-tested codebase

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure Node.js is properly installed
3. Try reinstalling dependencies with `npm install`
4. Verify your browser supports Web Audio API

---

**Zenith DAW** - Professional audio production in the browser.