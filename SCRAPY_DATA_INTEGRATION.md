# Scrapy Data Integration Guide

Integrate your scraped music data into Zenith DAW

## Step 1: Download Job Data from Scrapy Cloud

1. Go to **https://app.zyte.com/p/835669/jobs**
2. Find your completed **freesound** job
3. Click on it to open job details
4. Scroll down to **Items** section
5. Click **Export** → **JSON** (or CSV if preferred)
6. Save as `freesound-samples.json` to your workspace

## Step 2: Create Data Processing Script

Create `src/utils/processScrapyData.ts`:

```typescript
import fs from 'fs';
import path from 'path';

export interface FreesoundSample {
  id: string;
  name: string;
  url: string;
  username: string;
  duration: string;
  license: string;
  downloads: string;
  genre: string;
  source: string;
  page: number;
}

export interface ProcessedSample {
  id: string;
  title: string;
  freesoundUrl: string;
  artist: string;
  durationMs: number;
  genre: string;
  license: string;
  popularity: number; // from download count
  timestamp: string;
}

/**
 * Process raw Scrapy data into Zenith DAW format
 */
export async function processFreesoundData(
  inputPath: string
): Promise<ProcessedSample[]> {
  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  
  if (!Array.isArray(rawData)) {
    throw new Error('Expected JSON array of samples');
  }

  return rawData.map((sample: FreesoundSample) => ({
    id: `fs-${sample.id}`,
    title: sample.name,
    freesoundUrl: sample.url,
    artist: sample.username,
    durationMs: parseDuration(sample.duration),
    genre: sample.genre,
    license: sample.license,
    popularity: parseInt(sample.downloads) || 0,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Parse duration string (e.g., "2:34") to milliseconds
 */
function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;
  
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (minutes * 60 + seconds) * 1000;
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }
  return 0;
}

/**
 * Save processed samples to JSON
 */
export async function saveProcessedData(
  samples: ProcessedSample[],
  outputPath: string
): Promise<void> {
  fs.writeFileSync(
    outputPath,
    JSON.stringify(samples, null, 2),
    'utf-8'
  );
  console.log(`✅ Saved ${samples.length} samples to ${outputPath}`);
}

/**
 * Group samples by genre for organization
 */
export function groupByGenre(
  samples: ProcessedSample[]
): Record<string, ProcessedSample[]> {
  return samples.reduce((acc, sample) => {
    if (!acc[sample.genre]) {
      acc[sample.genre] = [];
    }
    acc[sample.genre].push(sample);
    return acc;
  }, {} as Record<string, ProcessedSample[]>);
}

/**
 * Sort samples by popularity
 */
export function sortByPopularity(samples: ProcessedSample[]): ProcessedSample[] {
  return [...samples].sort((a, b) => b.popularity - a.popularity);
}

/**
 * Filter samples by criteria
 */
export interface FilterCriteria {
  genre?: string;
  minDuration?: number; // in ms
  maxDuration?: number;
  minPopularity?: number;
}

export function filterSamples(
  samples: ProcessedSample[],
  criteria: FilterCriteria
): ProcessedSample[] {
  return samples.filter(sample => {
    if (criteria.genre && sample.genre !== criteria.genre) return false;
    if (criteria.minDuration && sample.durationMs < criteria.minDuration) return false;
    if (criteria.maxDuration && sample.durationMs > criteria.maxDuration) return false;
    if (criteria.minPopularity && sample.popularity < criteria.minPopularity) return false;
    return true;
  });
}
```

## Step 3: Create CLI Tool to Process Data

Create `scripts/process-scrapy-data.ts`:

```typescript
import { 
  processFreesoundData, 
  saveProcessedData, 
  groupByGenre,
  sortByPopularity 
} from '../src/utils/processScrapyData';
import path from 'path';
import fs from 'fs';

async function main() {
  // Paths
  const inputFile = process.argv[2] || './freesound-samples.json';
  const outputDir = './public/data';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📥 Processing ${inputFile}...`);
  
  try {
    // Process data
    const samples = await processFreesoundData(inputFile);
    console.log(`✨ Processed ${samples.length} samples`);

    // Save main file
    const mainOutput = path.join(outputDir, 'freesound-processed.json');
    await saveProcessedData(samples, mainOutput);

    // Group by genre
    const byGenre = groupByGenre(samples);
    console.log(`\n📂 Genres found: ${Object.keys(byGenre).join(', ')}`);

    // Save genre files
    for (const [genre, genreSamples] of Object.entries(byGenre)) {
      const genreOutput = path.join(outputDir, `freesound-${genre}.json`);
      await saveProcessedData(genreSamples, genreOutput);
    }

    // Save sorted by popularity
    const sorted = sortByPopularity(samples);
    const sortedOutput = path.join(outputDir, 'freesound-popular.json');
    await saveProcessedData(sorted, sortedOutput);

    console.log(`\n✅ All files saved to ${outputDir}`);
    console.log(`\nFiles created:`);
    console.log(`  - freesound-processed.json (all samples)`);
    Object.keys(byGenre).forEach(genre => {
      console.log(`  - freesound-${genre}.json (${byGenre[genre].length} samples)`);
    });
    console.log(`  - freesound-popular.json (sorted by popularity)`);

  } catch (error) {
    console.error('❌ Error processing data:', error);
    process.exit(1);
  }
}

main();
```

## Step 4: Run Processing Script

In your workspace terminal:

```bash
npm run build  # Ensure TypeScript is compiled
npx ts-node scripts/process-scrapy-data.ts freesound-samples.json
```

Or add to `package.json`:

```json
{
  "scripts": {
    "process:scrapy": "ts-node scripts/process-scrapy-data.ts"
  }
}
```

Then run:

```bash
npm run process:scrapy freesound-samples.json
```

## Step 5: Integrate Samples into Zenith DAW

Create `src/hooks/useScrappedSamples.ts`:

```typescript
import { useEffect, useState } from 'react';
import type { ProcessedSample } from '../utils/processScrapyData';

export interface UseScrappedSamplesOptions {
  genre?: string;
  sortBy?: 'popularity' | 'name' | 'duration';
}

export function useScrappedSamples(options?: UseScrappedSamplesOptions) {
  const [samples, setSamples] = useState<ProcessedSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSamples() {
      try {
        // Determine which file to load
        let filename = 'freesound-processed.json';
        if (options?.genre) {
          filename = `freesound-${options.genre}.json`;
        } else if (options?.sortBy === 'popularity') {
          filename = 'freesound-popular.json';
        }

        const response = await fetch(`/data/${filename}`);
        if (!response.ok) throw new Error('Failed to load samples');

        const data = await response.json();
        setSamples(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSamples([]);
      } finally {
        setLoading(false);
      }
    }

    loadSamples();
  }, [options?.genre, options?.sortBy]);

  return { samples, loading, error };
}
```

## Step 6: Use in AI Music Panel

Update `src/components/AIMusicPanel.tsx`:

```typescript
import { useScrappedSamples } from '../hooks/useScrappedSamples';

export function AIMusicPanel() {
  const { samples, loading } = useScrappedSamples({ sortBy: 'popularity' });

  // Use samples in generation
  const handleGenerate = async () => {
    const reference = samples[Math.floor(Math.random() * samples.length)];
    
    const request = {
      prompt: `Generate music similar to "${reference.title}" (${reference.genre})`,
      referenceGenre: reference.genre,
      referenceDuration: reference.durationMs,
      // ... other params
    };

    // Generate with reference data
    // ...
  };

  return (
    <div className="ai-music-panel">
      <p>📊 {samples.length} samples loaded</p>
      {/* UI components */}
    </div>
  );
}
```

## File Structure

After processing, your `/public/data` should look like:

```
public/data/
├── freesound-processed.json      # All 23 samples
├── freesound-ambient.json        # Only ambient genre
├── freesound-popular.json        # Sorted by downloads
└── (more genre files as collected)
```

## Next Steps

1. ✅ Download job data from Scrapy Cloud
2. ✅ Copy `freesound-samples.json` to workspace
3. ✅ Create processing script files
4. ✅ Run `npm run process:scrapy freesound-samples.json`
5. ✅ Use `useScrappedSamples` hook in components
6. ⏳ When you get more data (Archive.org, Hooktheory), repeat with different processors

## Troubleshooting

**"Expected JSON array" error:**
- Make sure you exported as JSON from Scrapy Cloud
- Check that the file is valid JSON: `cat freesound-samples.json | jq .`

**Files not loading in app:**
- Ensure files are in `public/data/` exactly
- Check browser DevTools Network tab for 404s
- Verify file names match hook parameters

**Duration parsing issues:**
- Check format: should be `MM:SS` or `HH:MM:SS`
- Add custom parser for different formats if needed

## Tips

- Start with the most popular samples for best results
- Group by genre to create focused training data
- Archive original raw data before processing
- Schedule Archive.org next (120-day data retention means you have time!)
