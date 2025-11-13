# Scrapy Cloud - Deploy Web Spiders for Music Data

## 🚀 Quick Deploy Guide

Scrapy Cloud lets you deploy web spiders to the cloud and run them at scale. Perfect for collecting music samples, metadata, and theory data automatically.

### What is Scrapy Cloud?

A battle-tested cloud platform for running web crawlers (spiders):
- **Deploy code** via CLI or GitHub
- **Run forever** - no time limits
- **Scale automatically** - handle thousands of pages
- **120-day data retention** - keep your scraped data
- **Scheduled jobs** - run daily/weekly/monthly
- **Monitoring dashboard** - track all jobs

**Value:** $150-300/month → **FREE for students** 🎉

## 📋 Prerequisites

```bash
# 1. Install Scrapy
pip install scrapy scrapycloud

# 2. Get Zyte API key (from student pack)
# Add to .env or shell: export SCRAPY_CLOUD_APIKEY=your_key

# 3. Verify installation
scrapy --version
scrapycloud --version
```

## 🎯 Option 1: Deploy Your Own Spider

### Step 1: Create Spider Project

```bash
# Create new Scrapy project
scrapy startproject music_scraper
cd music_scraper

# Generate spider template
scrapy genspider freesound freesound.org
```

### Step 2: Write Your Spider

**File: `music_scraper/spiders/freesound.py`**

```python
import scrapy
import json

class FreesoundSpider(scrapy.Spider):
    name = 'freesound'
    allowed_domains = ['freesound.org']
    
    def __init__(self, genre='ambient', *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.genre = genre
        self.start_urls = [
            f'https://freesound.org/browse/tags/{genre}/'
        ]

    def parse(self, response):
        """Parse sample listing page"""
        
        # Extract samples
        for sample_box in response.css('li[data-sound-id]'):
            yield {
                'id': sample_box.css('::attr(data-sound-id)').get(),
                'name': sample_box.css('a.title::text').get('').strip(),
                'url': response.urljoin(sample_box.css('a.title::attr(href)').get()),
                'username': sample_box.css('a.user::text').get('').strip(),
                'duration': sample_box.css('span.duration::text').get(''),
                'license': sample_box.css('span.license::text').get('').strip(),
                'downloads': sample_box.css('span.num-downloads::text').get('').strip(),
                'genre': self.genre,
                'source': 'freesound.org',
                'scraped_at': response.headers.get('Date', b'').decode(),
            }

        # Pagination - follow next page
        next_page = response.css('a.next::attr(href)').get()
        if next_page:
            yield scrapy.Request(
                response.urljoin(next_page),
                callback=self.parse,
                meta={'dont_redirect': True}
            )
```

### Step 3: Deploy to Scrapy Cloud

```bash
# First time setup - creates project in cloud
scrapycloud deploy

# You'll see:
# Scrapy Cloud project: music-scraper
# Spider 'freesound' deployed successfully
```

### Step 4: Run Spider in Cloud

```bash
# Via command line
scrapycloud schedule freesound -a genre=ambient

# Or via API for different genres
scrapycloud schedule freesound -a genre=electronic
scrapycloud schedule freesound -a genre=dance
scrapycloud schedule freesound -a genre=jazz
```

### Step 5: Monitor & Collect Data

```bash
# View running jobs
scrapycloud jobs

# Get job data (JSON)
scrapycloud job <job_id> | jq . > samples.json

# Download full dataset
scrapycloud job <job_id> > music_samples.json
```

## 🐙 Option 2: Deploy via GitHub

### Step 1: Push Scrapy Project to GitHub

```bash
# In music_scraper directory
git init
git add .
git commit -m "Initial Scrapy project"
git remote add origin https://github.com/yourusername/music-scraper.git
git push -u origin main
```

### Step 2: Connect GitHub to Scrapy Cloud

1. Go to [Scrapy Cloud Dashboard](https://app.scrapycloud.com)
2. Click **"Create Project"**
3. Select **"Deploy from GitHub"**
4. Choose your GitHub repo
5. Select branch (main)
6. Scrapy Cloud auto-deploys!

### Step 3: Auto-Deploy on Push

```bash
# Push code changes
git add .
git commit -m "Improve spider"
git push origin main

# Scrapy Cloud automatically deploys!
# Check dashboard for status
```

## 📊 Music Data Spider Examples

### Example 1: Archive.org Music Scraper

```python
class ArchiveOrgSpider(scrapy.Spider):
    name = 'archive_music'
    
    def start_requests(self):
        genres = ['ambient', 'electronic', 'jazz', 'classical']
        for genre in genres:
            url = f'https://archive.org/advancedsearch.php?q={genre}&mediatype=audio'
            yield scrapy.Request(url, callback=self.parse)

    def parse(self, response):
        for item in response.css('div.results-item'):
            yield {
                'title': item.css('div.title-text::text').get('').strip(),
                'download_url': item.css('a.download-button::attr(href)').get(),
                'creator': item.css('div.creator::text').get('').strip(),
                'date': item.css('div.date::text').get('').strip(),
                'license': item.css('div.license::text').get('').strip(),
                'source': 'archive.org',
            }
```

### Example 2: Music Theory Data Spider

```python
class MusicTheorySpider(scrapy.Spider):
    name = 'music_theory'
    allowed_domains = ['hooktheory.com']
    start_urls = ['https://www.hooktheory.com/theorytab']

    def parse(self, response):
        # Extract chord progressions
        for song in response.css('div.song-row'):
            yield {
                'song': song.css('a.song-title::text').get(),
                'artist': song.css('a.artist::text').get(),
                'chords': song.css('div.chords::text').get(),
                'key': song.css('div.key::text').get(),
                'genre': song.css('div.genre::text').get(),
                'source': 'hooktheory.com',
            }
```

## ⚙️ Scrapy Cloud Dashboard

Once deployed, monitor everything:

1. **Jobs Tab**
   - View running/completed jobs
   - Job status and progress
   - Start/stop jobs
   - View logs

2. **Data Tab**
   - Browse scraped data
   - Filter/search results
   - Export JSON/CSV
   - Download all data

3. **Spiders Tab**
   - See all deployed spiders
   - View spider stats
   - Edit spider settings
   - Version history

4. **Schedule Tab**
   - Schedule recurring jobs
   - Daily/weekly/monthly runs
   - Cron expressions
   - Job notifications

## 📈 Practical Workflow for Zenith DAW

### Week 1: Setup & Scrape

```bash
# Deploy spider
scrapycloud deploy

# Run for each genre
for genre in ambient electronic dance jazz classical; do
  scrapycloud schedule freesound -a genre=$genre
done

# Let it run overnight
```

### Week 2: Collect Data

```bash
# Once jobs complete, download data
scrapycloud job <job_1_id> > ambient_samples.json
scrapycloud job <job_2_id> > electronic_samples.json
scrapycloud job <job_3_id> > dance_samples.json

# Combine all
jq -s add *.json > all_samples.json
```

### Week 3: Integrate with DAW

```typescript
// Load samples into Zenith DAW
import allSamples from './all_samples.json';

const enhanceAIMusic = (prompt: string) => {
  // Match samples to requested genre
  const relevantSamples = allSamples.filter(s => 
    prompt.includes(s.genre)
  );
  
  // Use as reference for generation
  return {
    prompt,
    reference_samples: relevantSamples.slice(0, 5),
    avg_bpm: Math.round(
      relevantSamples.reduce((sum, s) => sum + s.bpm, 0) / 
      relevantSamples.length
    ),
  };
};
```

## 🔧 Advanced: Scheduled Recurring Jobs

### Setup Auto-Collection

```bash
# Deploy spider
scrapycloud deploy

# Schedule to run daily at 2 AM
scrapycloud schedule freesound \
  -a genre=ambient \
  --when="0 2 * * *"

# Schedule weekly for all genres
for genre in ambient electronic dance; do
  cron="0 1 * * 0"  # Sunday 1 AM
  scrapycloud schedule freesound \
    -a genre=$genre \
    --when=$cron
done
```

### Monitor Scheduled Jobs

```bash
# View all schedules
scrapycloud schedules

# Cancel schedule
scrapycloud schedules --remove <schedule_id>

# View schedule history
scrapycloud jobs | grep scheduled
```

## 📱 API Integration Example

Use collected data in your DAW:

```typescript
// src/hooks/useScrapyCloudData.ts
import { useEffect, useState } from 'react';

interface MusicSample {
  id: string;
  name: string;
  url: string;
  genre: string;
  bpm?: number;
  license: string;
  source: string;
}

export function useScrapyCloudData(genre?: string) {
  const [samples, setSamples] = useState<MusicSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from Scrapy Cloud data
    // In production: fetch from Scrapy Cloud API
    // For now: load from local JSON
    
    fetch('/data/music_samples.json')
      .then(r => r.json())
      .then(data => {
        if (genre) {
          setSamples(data.filter((s: MusicSample) => s.genre === genre));
        } else {
          setSamples(data);
        }
        setLoading(false);
      });
  }, [genre]);

  return { samples, loading };
}

// Usage in component
export function AIMusicPanel() {
  const { samples } = useScrapyCloudData('ambient');
  
  return (
    <div>
      <h3>Reference Samples: {samples.length}</h3>
      {samples.map(s => (
        <div key={s.id}>
          <a href={s.url}>{s.name}</a>
          <p>{s.license}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🎓 Student Project Ideas

### Project 1: Music Trend Tracker
- Scrape daily samples from Freesound
- Track genre popularity over time
- Build visualization dashboard

### Project 2: Sample Recommendation Engine
- Collect 1000+ samples (use Scrapy Cloud)
- Train ML model (scikit-learn)
- Recommend based on genre/BPM

### Project 3: DJ Training Dataset
- Scrape chord progressions (Hooktheory)
- Download sample packs
- Build music theory reference

### Project 4: Music Analysis Tool
- Collect samples with metadata
- Analyze BPM/key distributions
- Generate statistics/insights

## 📊 Pricing for Students

| Feature | Regular | Student Pack |
|---------|---------|------|
| Monthly requests | Limited | **Unlimited** ✅ |
| Crawl time | Limited | **Unlimited** ✅ |
| Data retention | 30 days | **120 days** ✅ |
| Scheduled jobs | Limited | **Unlimited** ✅ |
| Team size | Limited | **Unlimited** ✅ |
| **Monthly cost** | **$150-300** | **$0** 🎉 |

## 🆘 Troubleshooting

### "Spider not deployed"
```bash
# Make sure project has scrapycloud.cfg
scrapycloud init

# Deploy again
scrapycloud deploy
```

### "Jobs not running"
```bash
# Check project was created
scrapycloud projects

# View job logs
scrapycloud job <job_id> --log

# Increase resources
scrapycloud settings -a SPIDER_PARALLELISM=2
```

### "Data not saving"
- Check spider yields dictionaries
- Verify data persistence is enabled
- Check job logs for errors

## 📚 Resources

- **[Scrapy Documentation](https://docs.scrapy.org/)** - Official docs
- **[Scrapy Cloud Docs](https://doc.scrapycloud.com/)** - Cloud-specific
- **[Zyte Blog](https://www.zyte.com/blog/)** - Tutorials
- **[GitHub Integration](https://doc.scrapycloud.com/github-integration.html)** - Auto-deploy

## ✅ Deployment Checklist

- [ ] Install Scrapy: `pip install scrapy scrapycloud`
- [ ] Set up Scrapy project: `scrapy startproject music_scraper`
- [ ] Create spider: `scrapy genspider freesound freesound.org`
- [ ] Write parsing logic
- [ ] Test locally: `scrapy crawl freesound`
- [ ] Get Scrapy Cloud API key
- [ ] Deploy: `scrapycloud deploy`
- [ ] Schedule jobs
- [ ] Monitor in dashboard
- [ ] Download data
- [ ] Integrate with Zenith DAW

---

**Status:** Ready to deploy! 🚀  
**Cost:** FREE (included with student pack)  
**Time to first job:** ~15 minutes
