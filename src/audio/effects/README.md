# Audio Effects System

A comprehensive effects processing system for the DAW application, featuring modular effect processors, chain management, and real-time parameter control.

## Features

### Effect Processors

- **Reverb**: Convolution-based spatial ambience with pre-delay and damping
- **Delay**: Echo and delay effects with LFO modulation
- **Multi-Band EQ**: 4-band parametric equalizer with real-time curve visualization
- **Compressor**: Dynamic range compression with gain reduction metering
- **Distortion**: Multiple distortion algorithms with tone control
- **Filter**: Multi-mode filter with LFO and envelope following

### Effect Chain Management

- Per-track effect chains
- Master bus effects chain
- Drag-and-drop reordering
- Bypass/enable controls
- Chain level control
- Serialization to/from JSON

### User Interface

- **EffectSlot**: Individual effect controls with parameter widgets
- **EffectChain**: Chain management with drag-and-drop
- **EffectsPanel**: Track/Master tabbed interface
- Real-time parameter updates
- Visual feedback (meters, curves)

## Architecture

### BaseEffect Class

Abstract base class for all effect processors:
- Parameter management with validation
- Wet/dry signal mixing
- Bypass functionality
- State serialization
- Audio node routing

### EffectsManager

Central management for all effect chains:
- Master and track chain management
- Effect creation and removal
- Serialization/deserialization
- State persistence

### Audio Integration

- Seamless integration with AudioEngine
- Real-time parameter updates
- Proper audio node routing
- Performance-optimized processing

## Usage

### Basic Setup

```typescript
import { AudioEngine } from './audio/AudioEngine';

const audioEngine = new AudioEngine();

// Add effects to master
const reverb = audioEngine.addEffectToMaster('reverb');
const compressor = audioEngine.addEffectToMaster('compressor');

// Add effects to track
const trackId = 'track-1';
const eq = audioEngine.addEffectToTrack(trackId, 'eq');
const delay = audioEngine.addEffectToTrack(trackId, 'delay');
```

### Parameter Control

```typescript
// Set effect parameters
reverb.setParameter('wetLevel', 0.4);
reverb.setParameter('roomSize', 5);
reverb.setParameter('damping', 8000);

eq.setParameter('band1Gain', 3);
eq.setParameter('band1Freq', 1000);
eq.setParameter('band1Q', 2);
```

### Chain Management

```typescript
// Bypass effects
audioEngine.effectsManager.bypassEffectInMaster(reverb.id, true);
audioEngine.effectsManager.bypassEffectInTrack(trackId, eq.id, false);

// Reorder effects
audioEngine.effectsManager.moveEffectInMaster(delay.id, 0);
audioEngine.effectsManager.moveEffectInTrack(trackId, eq.id, 1);

// Remove effects
audioEngine.removeEffectFromMaster(reverb.id);
audioEngine.removeEffectFromTrack(trackId, delay.id);
```

### Serialization

```typescript
// Save effects state
const serialized = audioEngine.effectsManager.serializeState();
localStorage.setItem('effects-state', serialized);

// Load effects state
const saved = localStorage.getItem('effects-state');
if (saved) {
  audioEngine.effectsManager.deserializeState(saved);
}
```

## Effect Parameters

### Reverb
- `wetLevel`: Wet signal level (0-1)
- `dryLevel`: Dry signal level (0-1)
- `preDelay`: Pre-delay time (0-0.2s)
- `damping`: High-frequency damping (100-20000Hz)
- `roomSize`: Room size (0.5-10s)

### Delay
- `wetLevel`: Wet signal level (0-1)
- `dryLevel`: Dry signal level (0-1)
- `delayTime`: Delay time (0.001-2s)
- `feedback`: Feedback amount (0-0.95)
- `filterFreq`: Low-pass filter (100-20000Hz)
- `modRate`: LFO rate (0-10Hz)
- `modDepth`: LFO depth (0-0.05s)

### Multi-Band EQ
- `wetLevel`: Wet signal level (0-1)
- `dryLevel`: Dry signal level (0-1)
- `lowShelfGain/lowShelfFreq`: Low shelf (-20 to +20dB, 20-500Hz)
- `band{1-4}Gain/Freq/Q`: Parametric bands (-20 to +20dB, 20-20000Hz, 0.1-30)
- `highShelfGain/highShelfFreq`: High shelf (-20 to +20dB, 2000-20000Hz)

### Compressor
- `wetLevel`: Wet signal level (0-1)
- `dryLevel`: Dry signal level (0-1)
- `threshold`: Threshold level (-60 to 0dB)
- `knee`: Knee width (0-40dB)
- `ratio`: Compression ratio (1:1 to 20:1)
- `attack`: Attack time (0.001-1s)
- `release`: Release time (0.01-2s)
- `makeupGain`: Output gain (0-24dB)

### Distortion
- `wetLevel`: Wet signal level (0-1)
- `dryLevel`: Dry signal level (0-1)
- `amount`: Distortion amount (0-100%)
- `drive`: Input drive (1-50)
- `tone`: Tone filter (100-10000Hz)
- `level`: Output level (0-2)
- `filterFreq/filterQ`: Pre-filter (100-20000Hz, 0.1-30)

### Filter
- `wetLevel`: Wet signal level (0-1)
- `dryLevel`: Dry signal level (0-1)
- `filterType`: Filter type (0=lowpass, 1=highpass, etc.)
- `frequency`: Cutoff frequency (20-20000Hz)
- `resonance`: Filter Q (0.1-30)
- `modRate`: LFO rate (0-20Hz)
- `modDepth`: LFO depth (0-5000Hz)
- `envAmount`: Envelope amount (0-20)
- `drive`: Input drive (1-10)

## Visual Features

### EQ Curve Visualization
Real-time frequency response display showing:
- Frequency response curve
- Band indicators
- Interactive frequency display

### Gain Reduction Meter
Compressor gain reduction visualization:
- Real-time gain reduction
- Color-coded levels
- Smooth animations

### Filter Response
Filter frequency response display:
- C frequency visualization
- Resonance peaks
- Type-specific curves

## Performance

### Optimization
- Efficient audio node management
- Minimal CPU overhead
- Smooth parameter transitions
- Proper cleanup on disposal

### Real-time Updates
- Immediate parameter response
- No audio glitches
- Smooth automation support
- Low-latency processing

## Integration

### AudioEngine Integration
Effects are fully integrated with the audio engine:
- Automatic routing setup
- Track output processing
- Master bus processing
- State synchronization

### UI Integration
React components provide:
- Real-time parameter binding
- Drag-and-drop support
- Responsive design
- Accessibility features

## Testing

Run the effects demo to test all features:

```javascript
import { demoEffects } from './audio/effects/demo';

// Run comprehensive demo
const result = demoEffects();
console.log('Demo result:', result);
```

This tests:
- Effect creation and management
- Parameter control
- Bypass and reordering
- Serialization
- Special features
- Error handling

## Future Enhancements

### Planned Features
- Effect presets
- Automation support
- Plugin architecture
- More effect types
- Advanced visualizations

### Extensibility
The system is designed for easy extension:
- New effect types via BaseEffect
- Custom parameter types
- Additional visualizations
- Third-party integration