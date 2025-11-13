# Complete Scrapy Cloud + Zenith DAW Integration Guide

## 🎯 End-to-End Workflow

Deploy web spiders to collect music samples, then use them in Zenith DAW for enhanced AI music generation.

## 📊 Architecture Overview

```
Scrapy Cloud (Zyte)
    ↓ (collects data)
Music Sample Database
    ↓ (exports JSON)
Zenith DAW
    ↓ (uses for reference)
Enhanced AI Music Generation
```

## 🚀 Step-by-Step Deployment

### Phase 1: Setup (30 minutes)

**1. Get Scrapy Cloud Access**
- Sign up for GitHub Student Pack: https://education.github.com/pack
- Claim Zyte offer
- Get API key

**2. Install Tools**
```bash
pip install scrapy scrapycloud
```

**3. Create Scrapy Project**
```bash
scrapy startproject music_scraper
cd music_scraper
scrapy genspider freesound freesound.org
```

### Phase 2: Deploy Spider (15 minutes)

**1. Copy Starter Template**
```bash
# From Zenith DAW repo
cp ../Webiste-for-gaming/scrapy-templates/freesound-basic.py \
   music_scraper/spiders/freesound.py
```

**2. Test Locally**
```bash
scrapy crawl freesound -a genre=ambient
# Should see 10-20 samples
```

**3. Deploy to Cloud**
```bash
scrapycloud deploy
# Output: Project 'music-scraper' created
# Output: Spider 'freesound' deployed
```

### Phase 3: Collect Data (2-24 hours)

**1. Schedule Collection**
```bash
# Collect from multiple genres
for genre in ambient electronic dance jazz classical; do
  scrapycloud schedule freesound -a genre=$genre
done

# Check status
scrapycloud jobs
```

**2. Monitor Progress**
- Go to: https://app.scrapycloud.com
- View running jobs
- Watch data collection in real-time

**3. Download Data**
```bash
# Once jobs complete
scrapycloud job <job_id> > ambient_samples.json
scrapycloud job <job_id> > electronic_samples.json
scrapycloud job <job_id> > dance_samples.json

# Combine all
jq -s add *.json > all_music_samples.json
```

### Phase 4: Integrate with Zenith DAW (20 minutes)

**1. Add Data to Project**
```bash
# Copy sample data to Zenith DAW
cp all_music_samples.json \
   ../Webiste-for-gaming/public/data/music_samples.json
```

**2. Create Hook to Load Data**
```typescript
// src/hooks/useScrapyData.ts
import { useEffect, useState } from 'react';

export interface MusicSample {
  id: string;
  name: string;
  url: string;
  genre: string;
  bpm?: number;
  license: string;
  source: string;
}

export function useScrapyData(genre?: string) {
  const [samples, setSamples] = useState<MusicSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/music_samples.json')
      .then(r => r.json())
      .then(data => {
        if (genre) {
          setSamples(
            data.filter((s: MusicSample) => s.genre === genre)
          );
        } else {
          setSamples(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load samples:', err);
        setLoading(false);
      });
  }, [genre]);

  return { samples, loading };
}
```

**3. Use in AI Music Panel**
```typescript
// src/components/AIMusicPanel.tsx
import { useScrapyData } from '../hooks/useScrapyData';

export default function AIMusicPanel() {
  const { samples: referenceSamples } = useScrapyData(selectedGenre);

  const handleGenerate = async () => {
    // Calculate stats from reference samples
    const avgBpm = referenceSamples.length > 0
      ? Math.round(
          referenceSamples.reduce((sum, s) => sum + (s.bpm || 120), 0) /
          referenceSamples.length
        )
      : 120;

    const enhancedPrompt = `${prompt} - BPM around ${avgBpm} - inspired by ${referenceSamples.length} real samples`;

    // Generate with enhanced context
    const result = await aiMusicGenerator.generate({
      model: selectedModel,
      prompt: enhancedPrompt,
      duration,
      genre: selectedGenre,
    });

    // Display reference samples
    console.log('📚 Reference samples used:', {
      count: referenceSamples.length,
      avgBpm,
      samples: referenceSamples.slice(0, 3),
    });
  };

  return (
    <div className="ai-music-panel">
      {/* Existing controls */}
      
      {/* New: Show reference samples */}
      {referenceSamples.length > 0 && (
        <div className="reference-samples">
          <h4>📚 Reference Samples ({referenceSamples.length})</h4>
          <ul>
            {referenceSamples.slice(0, 5).map(s => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name}
                </a>
                <span className="metadata">
                  {s.bpm} BPM • {s.license}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## 📈 Real-World Workflow

### Day 1: Deploy Spiders
```
09:00 - Claim Zyte from student pack
09:30 - Install Scrapy tools
10:00 - Create spider project
10:30 - Deploy to Scrapy Cloud
11:00 - Schedule collection for all genres
```

### Day 2: Collect Data
```
Overnight - Spiders run in cloud (100+ samples per genre)
Morning - Download collected data (~1000+ samples)
Afternoon - Process and prepare for DAW
```

### Day 3: Integrate & Generate
```
Morning - Add samples to Zenith DAW
Afternoon - Test enhanced AI music generation
Evening - Deploy to GitHub Pages
```

## 🔄 Scheduled Collection

Run spiders automatically every week:

```bash
# Schedule daily collection at 2 AM
scrapycloud schedule freesound \
  -a genre=ambient \
  --when="0 2 * * *"

# Schedule weekly for all genres (Sunday 1 AM)
for genre in ambient electronic dance jazz; do
  scrapycloud schedule freesound \
    -a genre=$genre \
    --when="0 1 * * 0"
done
```

## 📊 Data Processing

### Clean & Standardize Data

```python
# process_samples.py
import json
import re

def process_samples(input_file, output_file):
    with open(input_file) as f:
        samples = json.load(f)
    
    processed = []
    for sample in samples:
        # Extract BPM from duration if available
        bpm = extract_bpm(sample.get('duration', ''))
        
        processed.append({
            'id': sample['id'],
            'name': clean_name(sample['name']),
            'genre': sample['genre'].lower(),
            'bpm': bpm,
            'license': sample['license'].lower(),
            'url': sample['url'],
            'source': 'freesound.org',
        })
    
    # Save clean data
    with open(output_file, 'w') as f:
        json.dump(processed, f, indent=2)
    
    print(f'✅ Processed {len(processed)} samples')

def extract_bpm(duration_str):
    # Parse "120 BPM" format
    match = re.search(r'(\d+)', duration_str)
    return int(match.group(1)) if match else 120

def clean_name(name):
    return ' '.join(name.split())[:50]

if __name__ == '__main__':
    process_samples('raw_samples.json', 'processed_samples.json')
```

## 🎯 Project Ideas

### 1. **Automated Music Dataset**
- Collect samples weekly
- Build machine learning dataset
- Train custom models
- Deploy as service

### 2. **DJ Practice Tool**
- Reference samples by genre/BPM
- Chord progression database
- Mixing analysis tool
- Performance tracking

### 3. **Music Trend Tracker**
- Collect samples daily
- Analyze patterns
- Track genre popularity
- Generate reports

### 4. **Sample Recommendation Engine**
- Collect 10,000+ samples (Scrapy Cloud)
- Train recommendation model
- Deploy in Zenith DAW
- Personalized suggestions

## 💰 Cost Breakdown (Student)

| Service | Regular | Student |
|---------|---------|---------|
| Scrapy Cloud | $150-300/mo | **FREE** ✅ |
| Zyte API | $100-200/mo | **FREE** ✅ |
| Data storage | Varies | 120 days free ✅ |
| **Total Value** | **$250-500+** | **$0** 🎉 |

## 🆘 Troubleshooting

### Spider not collecting data
```bash
# Check logs
scrapycloud job <job_id> --log

# Common issues:
# 1. Website changed structure → Update CSS selectors
# 2. Rate limited → Add delay between requests
# 3. JavaScript rendering → Enable in settings
```

### Data not showing in DAW
```bash
# Verify JSON is valid
jq . public/data/music_samples.json

# Check fetch path
# Browser DevTools → Network tab → Check request
```

### Scrapy Cloud errors
```bash
# Test locally first
scrapy crawl freesound -a genre=ambient

# Check project created
scrapycloud projects

# Reinitialize if needed
scrapycloud init --apikey your_key
```

## 📚 Full Documentation

- **[SCRAPY_CLOUD_DEPLOY.md](./SCRAPY_CLOUD_DEPLOY.md)** - Detailed deployment guide
- **[ZYTE_INTEGRATION.md](./ZYTE_INTEGRATION.md)** - Zyte API reference
- **[ZYTE_QUICKSTART.md](./ZYTE_QUICKSTART.md)** - Quick reference
- **[STUDENT_PACK_SETUP.md](./STUDENT_PACK_SETUP.md)** - Student benefits

## ✅ Deployment Checklist

- [ ] Claim Zyte through GitHub Student Pack
- [ ] Install Scrapy: `pip install scrapy scrapycloud`
- [ ] Create Scrapy project
- [ ] Copy spider template
- [ ] Test locally
- [ ] Deploy to Scrapy Cloud
- [ ] Schedule collection
- [ ] Download data
- [ ] Add to Zenith DAW
- [ ] Integrate with AI Music Panel
- [ ] Test enhanced generation
- [ ] Deploy to GitHub Pages

## 🚀 You're Ready!

1. **Get Zyte** (free student pack)
2. **Deploy spiders** (15 minutes)
3. **Collect data** (overnight)
4. **Enhance DAW** (20 minutes)
5. **Generate amazing music** 🎵

---

**Status:** Complete integration ready!  
**Time needed:** 2-3 hours total setup  
**Cost:** $0 (FREE for students)  
**Payoff:** Professional-grade data collection + enhanced AI music 🚀
