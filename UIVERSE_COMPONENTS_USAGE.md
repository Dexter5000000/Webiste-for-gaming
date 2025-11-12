# UIverse Components Usage Examples

This file demonstrates how to use the UIverse components in the Zenith DAW.

## Quick Start

```typescript
import { 
  GradientButton, 
  Switch, 
  Spinner, 
  Card, 
  ModernInput 
} from '@/components/uiverse';
```

---

## Component Examples

### GradientButton

```typescript
import { GradientButton } from '@/components/uiverse';
import { PlayIcon } from '@/icons';

// Basic button
<GradientButton onClick={() => console.log('Playing')}>
  Play
</GradientButton>

// With icon
<GradientButton icon={<PlayIcon />} variant="primary" size="lg">
  Play
</GradientButton>

// Different variants
<GradientButton variant="primary">Primary</GradientButton>
<GradientButton variant="secondary">Secondary</GradientButton>
<GradientButton variant="accent">Accent</GradientButton>
<GradientButton variant="success">Success</GradientButton>
<GradientButton variant="danger">Danger</GradientButton>

// Different sizes
<GradientButton size="sm">Small</GradientButton>
<GradientButton size="md">Medium</GradientButton>
<GradientButton size="lg">Large</GradientButton>

// Loading state
<GradientButton loading={isExporting}>
  Export Audio
</GradientButton>
```

---

### Switch (Toggle)

```typescript
import { Switch } from '@/components/uiverse';
import { useState } from 'react';

export function MuteToggle() {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <Switch
      label="Master Mute"
      checked={isMuted}
      onChange={(e) => setIsMuted(e.target.checked)}
    />
  );
}

// Different colors
<Switch color="primary" label="Primary" />
<Switch color="success" label="Success" />
<Switch color="warning" label="Warning" />
<Switch color="danger" label="Danger" />

// Different sizes
<Switch size="sm" label="Small" />
<Switch size="md" label="Medium" />
<Switch size="lg" label="Large" />
```

---

### Spinner (Loader)

```typescript
import { Spinner } from '@/components/uiverse';

// Basic spinner
<Spinner />

// With label
<Spinner label="Loading audio..." />

// Different sizes
<Spinner size="sm" label="Loading..." />
<Spinner size="md" label="Processing..." />
<Spinner size="lg" label="Generating..." />

// Different colors
<Spinner color="primary" />
<Spinner color="secondary" />
<Spinner color="accent" />
<Spinner color="white" />

// In a loading state
{isLoading ? (
  <Spinner label="Exporting..." />
) : (
  <div>Export Complete!</div>
)}
```

---

### Card

```typescript
import { Card } from '@/components/uiverse';

// Basic card
<Card title="Reverb" subtitle="Hall Reverb">
  <p>Effect parameters</p>
</Card>

// Interactive card
<Card 
  variant="elevated"
  title="Presets"
  interactive
  onClick={() => openPresets()}
>
  <p>Click to browse presets</p>
</Card>

// With image
<Card
  image="https://example.com/preset.jpg"
  title="Ambient Pad"
  subtitle="Lush and dreamy"
  interactive
>
  <button>Use Preset</button>
</Card>

// Different variants
<Card variant="default">Default</Card>
<Card variant="elevated">Elevated</Card>
<Card variant="outlined">Outlined</Card>
<Card variant="filled">Filled</Card>
```

---

### ModernInput

```typescript
import { ModernInput } from '@/components/uiverse';
import { useState } from 'react';

export function TempoInput() {
  const [tempo, setTempo] = useState(120);

  return (
    <ModernInput
      label="Tempo (BPM)"
      type="number"
      value={tempo}
      onChange={(e) => setTempo(Number(e.target.value))}
      placeholder="Enter BPM..."
    />
  );
}

// With icon
import { MetronomeIcon } from '@/icons';

<ModernInput
  label="Tempo"
  icon={<MetronomeIcon />}
  type="number"
  placeholder="120"
/>

// Different variants
<ModernInput variant="default" label="Default" />
<ModernInput variant="filled" label="Filled" />
<ModernInput variant="outlined" label="Outlined" />

// Different sizes
<ModernInput size="sm" label="Small" />
<ModernInput size="md" label="Medium" />
<ModernInput size="lg" label="Large" />

// With error
<ModernInput
  label="Track Name"
  error="Track name is required"
  value=""
/>
```

---

## Integration in DAW Components

### TransportBar.tsx

```typescript
import { GradientButton } from '@/components/uiverse';
import { PlayIcon, StopIcon, RecordIcon } from '@/icons';

export function TransportBar() {
  return (
    <div className="transport-bar">
      <GradientButton 
        icon={<PlayIcon />}
        variant="primary"
        onClick={handlePlay}
      >
        Play
      </GradientButton>
      
      <GradientButton 
        icon={<StopIcon />}
        variant="secondary"
        onClick={handleStop}
      >
        Stop
      </GradientButton>
      
      <GradientButton 
        icon={<RecordIcon />}
        variant="danger"
        onClick={handleRecord}
      >
        Record
      </GradientButton>
    </div>
  );
}
```

### EffectSlot.tsx

```typescript
import { Switch, Card } from '@/components/uiverse';

export function EffectSlot({ effect, onToggle }) {
  return (
    <Card variant="outlined" title={effect.name}>
      <div className="effect-controls">
        <Switch
          label="Bypass"
          checked={effect.bypassed}
          onChange={(e) => onToggle(!e.target.checked)}
        />
      </div>
    </Card>
  );
}
```

### AIMusicPanel.tsx

```typescript
import { GradientButton, Spinner } from '@/components/uiverse';

export function AIMusicPanel() {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="ai-panel">
      {isGenerating ? (
        <Spinner label="Generating music..." />
      ) : (
        <GradientButton
          variant="accent"
          size="lg"
          onClick={() => handleGenerate()}
        >
          Generate Music
        </GradientButton>
      )}
    </div>
  );
}
```

---

## Customization

### CSS Variables

Add these to your design tokens file to customize UIverse components:

```css
:root {
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  
  /* Colors */
  --color-primary: #6366f1;
  --color-secondary: #ec4899;
  --color-accent: #14b8a6;
}
```

### Theme Support

All UIverse components support dark mode automatically via media queries:

```css
@media (prefers-color-scheme: dark) {
  /* Dark mode styles automatically applied */
}
```

---

## Performance

- **No external dependencies** - Pure CSS and React
- **GPU-accelerated animations** - Smooth 60fps
- **Minimal bundle impact** - ~8KB (minified + gzipped)
- **Type-safe** - Full TypeScript support

---

## Accessibility

All components include:
- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Color contrast compliance
- ✅ Screen reader friendly

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

---

*For more components, visit https://uiverse.io*
