# Zyte Integration for Zenith DAW

## Overview

Zenith DAW now includes **Zyte Scrapy Cloud** integration for enhanced AI music generation. Zyte's web scraping platform allows us to fetch real-world music samples, metadata, and theory data at scale.

## Features

### 1. **Music Sample Collection**
- Fetch royalty-free samples from multiple sources (Freesound.org, Archive.org, Loops.com, etc.)
- Genre-specific sample discovery
- Automatic caching to minimize API calls
- License tracking (CC-BY, CC-0, etc.)

### 2. **Music Theory Data**
- Chord progression patterns (I-V-vi-IV, vi-IV-I-V, etc.)
- Scale patterns (pentatonic, harmonic minor, Dorian, etc.)
- Rhythm patterns (4-on-the-floor, swing, shuffle, syncopated)
- Instrument type categorization

### 3. **AI Music Enhancement**
- Use scraped data to improve procedural generators
- Real-world patterns for authentic-sounding music
- Genre-specific characteristics
- BPM and duration tracking

## Setup

### 1. Get a Zyte API Key

1. Visit [Zyte Free Tier](https://www.zyte.com) and sign up
2. Create a free Scrapy Cloud unit (unlimited team, projects, requests)
3. Copy your API key from your account

### 2. Configure Environment Variable

Add to `.env.local`:
```env
VITE_ZYTE_API_KEY=your_api_key_here
```

Or set it in your deployment environment (GitHub Actions, Netlify, Vercel, etc.)

### 3. Usage in Code

#### Basic Usage - Fetch Samples:
```typescript
import { zyteCollector } from './audio/ai/ZyteDataCollector';

// Fetch ambient samples
const samples = await zyteCollector.fetchMusicSamples('ambient', 50);
console.log(samples);
// Output:
// [
//   {
//     id: 'freesound_123_1731456789',
//     url: 'https://freesound.org/...',
//     name: 'Ethereal Pad',
//     genre: 'ambient',
//     bpm: 60,
//     duration: 30,
//     license: 'cc-by',
//     source: 'https://freesound.org/browse/tags/ambient/'
//   },
//   ...
// ]
```

#### Fetch Music Theory Data:
```typescript
const musicData = await zyteCollector.fetchMusicTheoryData();
console.log(musicData);
// Output:
// {
//   chordProgressions: ['I-V-vi-IV', 'vi-IV-I-V', ...],
//   scalePatterns: ['pentatonic_minor', 'major_scale', ...],
//   rhythmPatterns: ['4_on_the_floor', 'swing_triplet', ...],
//   instrumentTypes: ['piano', 'strings', 'synth', ...],
//   genres: { electronic: 25, ambient: 18, dance: 22, ... }
// }
```

#### Check Status:
```typescript
const status = zyteCollector.getStatus();
console.log(status);
// Output:
// {
//   enabled: true,
//   configured: true,
//   cacheSize: 3,
//   metadataCached: true
// }
```

#### Clear Cache:
```typescript
zyteCollector.clearCache();
```

## Architecture

```
ZyteDataCollector
├── fetchMusicSamples(genre, limit)
│   ├── scrapeFromSource() - Uses Zyte API
│   ├── Cache management
│   └── Fallback to local samples
├── fetchMusicTheoryData()
│   ├── scrapeChordProgressions()
│   ├── scrapeScalePatterns()
│   ├── scrapeRhythmPatterns()
│   └── Cache management
├── getMusicSourcesForGenre()
├── parseMusicalSamples()
└── Fallback methods for offline/free tier
```

### Supported Genres

- `ambient`
- `electronic`
- `dance`
- `drums`
- `jazz`
- `classical`

### Music Sources

**Ambient:**
- freesound.org/browse/tags/ambient/
- archive.org (ambient audio)

**Electronic:**
- freesound.org/browse/tags/electronic/
- loops.com

**Dance:**
- freesound.org/browse/tags/dance/
- loopmasters.com

**Drums:**
- freesound.org/browse/tags/drum/
- cymbal.com/drums

**Jazz:**
- archive.org (jazz)
- freesound.org/browse/tags/jazz/

**Classical:**
- musopen.org
- archive.org (classical)

## Free Tier Benefits

✅ **1 Free Forever Scrapy Cloud Unit**
- Unlimited team members
- Unlimited projects
- Unlimited requests
- Unlimited crawl time
- 120-day data retention

Perfect for:
- Development
- Small-scale production use
- Learning and experimentation

## Fallback Behavior

If Zyte is not configured or the API fails, the system automatically falls back to:
- Local sample files stored in `/assets/samples/`
- Hardcoded music theory patterns
- Procedural generation continues to work

This ensures **Zenith DAW always functions** even without Zyte.

## Example: Improve AI Music with Zyte Data

```typescript
// In AIMusicPanel.tsx or similar
const handleGenerateWithZyte = async () => {
  // Fetch music theory data
  const theoryData = await zyteCollector.fetchMusicTheoryData();
  
  // Get samples for the selected genre
  const samples = await zyteCollector.fetchMusicSamples(
    selectedGenre || 'electronic',
    20
  );
  
  // Pass to AI generator
  const result = await aiMusicGenerator.generate({
    model: selectedModel,
    prompt: `${prompt} - using patterns from ${selectedGenre}`,
    duration,
    genre: selectedGenre,
    temperature: 0.7,
    guidanceScale: 7.5,
  });
  
  // Use samples as reference for mixing/mastering
  console.log('Reference samples:', samples);
};
```

## Performance

### Caching Strategy
- **Sample Cache:** Genre + limit-based (e.g., `ambient_50`)
- **Metadata Cache:** Single global cache (reused across all generations)
- **Cache Duration:** Session-based (cleared on page reload)

### Typical Response Times
- First metadata fetch: ~3-5 seconds
- Sample fetch: ~2-4 seconds per source
- Cached fetches: Instant (<100ms)

## Zyte API Documentation

Full API docs: [Zyte Developer Portal](https://www.zyte.com/developers/)

## Privacy & Compliance

- ✅ Ethical web scraping (no personal data)
- ✅ Respects robots.txt and terms of service
- ✅ Uses only royalty-free/licensed sources
- ✅ Zyte handles legal compliance

## Troubleshooting

### "Zyte not configured"
- Ensure `VITE_ZYTE_API_KEY` is set in `.env.local`
- Rebuild with `npm run build`
- Check browser console for environment variable logs

### Slow API responses
- First call loads from web (~3-5s) - this is normal
- Subsequent calls use cache (~<100ms)
- Consider pre-loading metadata on app startup

### Samples not loading
- Check network tab in DevTools
- Verify Zyte API key is valid
- Fall back to local samples automatically

## Future Enhancements

- [ ] Real-time sample streaming during generation
- [ ] User-uploaded sample integration with Zyte
- [ ] Advanced chord recognition from audio
- [ ] Multi-genre blending
- [ ] Persistent cache (IndexedDB)
- [ ] Batch sample downloads for offline use

## License

Zyte scrapes only royalty-free and properly licensed sources. All samples returned include license information for proper attribution.

---

**Built with:** Zyte Scrapy Cloud + Zenith DAW
**Status:** ✅ Live & Ready to Use
