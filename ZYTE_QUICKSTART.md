# Quick Start: Using Zyte in Your DAW

## TL;DR

1. **Get API Key** → Sign up free at [Zyte.com](https://www.zyte.com)
2. **Set Environment Variable** → Add `VITE_ZYTE_API_KEY=your_key` to `.env.local`
3. **Use in Code** → Import and call `zyteCollector`

## One-Minute Setup

```bash
# 1. Create .env.local in project root
echo "VITE_ZYTE_API_KEY=your_api_key_here" > .env.local

# 2. Rebuild
npm run build

# 3. Done! Zyte is ready to use
```

## Common Use Cases

### Get Ambient Pad Samples
```typescript
const ambientSamples = await zyteCollector.fetchMusicSamples('ambient', 10);
ambientSamples.forEach(sample => {
  console.log(`${sample.name} (${sample.bpm} BPM)`);
});
```

### Fetch Music Theory Patterns
```typescript
const theory = await zyteCollector.fetchMusicTheoryData();
console.log('Available chord progressions:', theory.chordProgressions);
// Output: ['I-V-vi-IV', 'vi-IV-I-V', 'I-IV-V', ...]
```

### Use in AI Music Panel
```typescript
// In src/components/AIMusicPanel.tsx
import { zyteCollector } from '../audio/ai/ZyteDataCollector';

const handleEnhancedGeneration = async () => {
  // Show status
  const status = zyteCollector.getStatus();
  console.log('Zyte Status:', status);
  
  if (status.configured) {
    // Get theory data
    const theory = await zyteCollector.fetchMusicTheoryData();
    
    // Get samples for reference
    const samples = await zyteCollector.fetchMusicSamples(selectedGenre, 5);
    
    console.log('💡 Using real chord progressions:', theory.chordProgressions);
    console.log('🎵 Reference samples:', samples);
    
    // Generate music enhanced with this data
    const result = await aiMusicGenerator.generate({
      model: selectedModel,
      prompt: `${prompt} - inspired by ${samples.length} reference samples`,
      duration,
      // ... rest of config
    });
  }
};
```

## What You Get

### Samples (Per Genre)
```json
{
  "id": "freesound_12345_timestamp",
  "url": "https://freesound.org/samples/...",
  "name": "Ethereal Ambient Pad",
  "genre": "ambient",
  "bpm": 60,
  "duration": 30,
  "license": "cc-by",
  "source": "https://freesound.org/..."
}
```

### Music Theory Data
```json
{
  "chordProgressions": [
    "I-V-vi-IV",
    "vi-IV-I-V",
    "I-IV-V-IV",
    "ii-V-I",
    "I-vi-IV-V"
  ],
  "scalePatterns": [
    "pentatonic_minor",
    "pentatonic_major",
    "major_scale",
    "harmonic_minor",
    "dorian"
  ],
  "rhythmPatterns": [
    "4_on_the_floor",
    "swing_triplet",
    "shuffle",
    "syncopated",
    "half_time"
  ],
  "instrumentTypes": [
    "piano",
    "strings",
    "synth",
    "drums",
    "bass"
  ],
  "genres": {
    "electronic": 25,
    "ambient": 18,
    "dance": 22,
    "hip_hop": 15,
    "jazz": 12
  }
}
```

## API Functions

### `fetchMusicSamples(genre, limit)`
- **Genre**: `'ambient'`, `'electronic'`, `'dance'`, `'drums'`, `'jazz'`, `'classical'`
- **Limit**: Number of samples to fetch (default: 50)
- **Returns**: `Promise<MusicSample[]>`
- **Caching**: Results cached by `${genre}_${limit}`

### `fetchMusicTheoryData()`
- **No parameters**
- **Returns**: `Promise<MusicMetadata>`
- **Caching**: Single global cache, reused for all calls

### `getStatus()`
- **Returns**: `{ enabled, configured, cacheSize, metadataCached }`
- **Use for**: Debugging, checking if Zyte is ready

### `clearCache()`
- **Use for**: Development/testing, resets all caches
- **Useful for**: Testing new scraping logic

### `isConfigured()`
- **Returns**: `boolean`
- **Use for**: Conditional feature availability

## Environment Variables

### Development
```env
# .env.local (add to .gitignore)
VITE_ZYTE_API_KEY=your_api_key_here
```

### Production (GitHub Actions, Vercel, Netlify)
Set as secret environment variable in your deployment platform.

## Free Tier Limits

✅ **Unlimited:**
- Requests per month
- Crawl time
- Team members
- Projects

⏱️ **Data Retention:**
- 120 days

💾 **Perfect for:**
- All development work
- Small production deployments
- Learning & experimentation

## Troubleshooting

### "Zyte not enabled"
```typescript
if (!zyteCollector.isConfigured()) {
  console.warn('Using local samples instead');
  // Falls back automatically
}
```

### Slow First Load
- First call fetches fresh data (~3-5 seconds)
- All subsequent calls use cache (~<100ms)
- Consider calling `fetchMusicTheoryData()` on app startup

### Network Errors
- System automatically falls back to local samples
- Check browser DevTools → Network tab
- Verify API key is correct

## Next Steps

1. **Sign up for free** at [zyte.com](https://www.zyte.com)
2. **Add API key** to `.env.local`
3. **Try in console**:
   ```typescript
   import { zyteCollector } from './src/audio/ai/ZyteDataCollector';
   const status = zyteCollector.getStatus();
   console.log(status);
   ```
4. **Integrate into UI** - Use in AIMusicPanel or custom components
5. **Enhance AI music** - Reference samples while generating

## Support

- 📖 Full docs: `ZYTE_INTEGRATION.md`
- 💬 Ask in Discord: Extract Data Community
- 🐛 Issues: GitHub repo
- 📧 Zyte Support: [Zyte Developers](https://www.zyte.com/developers/)

---

**Status:** ✅ Ready to use - No credit card required for free tier!
