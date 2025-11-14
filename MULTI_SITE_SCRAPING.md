# Maximizing Single Scrapy Cloud Unit for Multi-Site Collection

## 🎯 Strategy: One Unit, Many Sites

With 1 free Scrapy Cloud unit, you can collect from **unlimited sites** by:
1. Creating **multiple spiders** (all in one project)
2. **Scheduling them sequentially** or in batches
3. Using **shared storage** (120-day retention)
4. **Combining data** from all sources

## 📊 Recommended Sites for Music Data

### Tier 1: High Priority (Start Here)
These have the best data for AI music generation:

#### 1. **Freesound.org** ⭐ (BEST)
- 700,000+ free samples
- Metadata: name, duration, license, BPM, tags
- Multiple genres readily available
- **Why**: Most complete sample library
- **Estimated data**: 1000+ samples per genre

#### 2. **Archive.org Audio** ⭐
- Millions of public domain recordings
- Music, spoken word, field recordings
- Direct download URLs
- **Why**: Large volume, good metadata
- **Estimated data**: 5000+ items searchable

#### 3. **Hooktheory.com** ⭐
- Chord progressions from real songs
- Song metadata (key, tempo, genre)
- Artist & song info
- **Why**: Perfect for training AI on real music patterns
- **Estimated data**: 500+ chord progressions

### Tier 2: Medium Priority (Secondary)
Good supplementary data:

#### 4. **Musopen.org**
- Classical & orchestral music
- Public domain recordings
- High-quality metadata
- Estimated: 500+ classical pieces

#### 5. **YouTube Audio Library** (Scrape indirect)
- Free royalty-free tracks
- Metadata from descriptions
- Genre tags
- Estimated: 1000+ tracks

#### 6. **LoopLabs.com**
- Drum loops & samples
- BPM information
- Genre-specific packs
- Estimated: 200+ loops

### Tier 3: Supplementary (If time allows)
- SoundBible.com (effects + ambient)
- BBC Sound Effects Library
- Zapsplat.com (samples)

## 🐍 One Project, Multiple Spiders

Create all spiders in **single Scrapy project**:

```
music-scraper/
├── scrapy.cfg
├── music_scraper/
│   ├── __init__.py
│   ├── settings.py
│   └── spiders/
│       ├── freesound.py        ← Tier 1
│       ├── archive_org.py      ← Tier 1
│       ├── hooktheory.py       ← Tier 1
│       ├── musopen.py          ← Tier 2
│       └── more_spiders.py     ← Tier 2+
```

## 📝 Spider Templates

### Template 1: Freesound Spider (Already Have)
```python
class FreesoundSpider(scrapy.Spider):
    name = 'freesound'
    allowed_domains = ['freesound.org']
    # Your existing spider
```

### Template 2: Archive.org Spider
```python
import scrapy

class ArchiveOrgSpider(scrapy.Spider):
    name = 'archive_org'
    allowed_domains = ['archive.org']
    
    def __init__(self, genre='ambient', *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.genre = genre
        self.start_urls = [
            f'https://archive.org/advancedsearch.php?q={genre}&mediatype=audio&rows=100'
        ]

    def parse(self, response):
        for item in response.css('div.results-item'):
            yield {
                'title': item.css('div.title-text a::text').get('').strip(),
                'identifier': item.css('div.identifier::text').get('').strip(),
                'creator': item.css('div.creator::text').get('').strip(),
                'date': item.css('div.date::text').get('').strip(),
                'download_url': f"https://archive.org/download/{item.css('div.identifier::text').get('')}/",
                'genre': self.genre,
                'source': 'archive.org',
            }
        
        # Pagination
        next_page = response.css('a.next::attr(href)').get()
        if next_page:
            yield scrapy.Request(next_page, callback=self.parse)
```

### Template 3: Hooktheory Spider
```python
import scrapy

class HooktheorySpider(scrapy.Spider):
    name = 'hooktheory'
    allowed_domains = ['hooktheory.com']
    start_urls = ['https://www.hooktheory.com/theorytab']

    def parse(self, response):
        for song in response.css('tr.song-row'):
            yield {
                'song': song.css('td.song a::text').get('').strip(),
                'artist': song.css('td.artist a::text').get('').strip(),
                'chords': song.css('td.chords::text').get('').strip(),
                'key': song.css('td.key::text').get('').strip(),
                'genre': song.css('td.genre::text').get('').strip(),
                'url': response.urljoin(song.css('td.song a::attr(href)').get()),
                'source': 'hooktheory.com',
            }
        
        # Pagination
        next_page = response.css('a.next::attr(href)').get()
        if next_page:
            yield scrapy.Request(next_page, callback=self.parse)
```

## ⏱️ Scheduling Strategy (One Unit Limitation)

### Approach A: Sequential (Safe)
Run one spider at a time to avoid overwhelming the unit:

```bash
# Day 1: Freesound (5 genres)
for genre in ambient electronic dance jazz classical; do
  scrapycloud schedule freesound -a genre=$genre
done

# Day 2: Archive.org (3 genres)
for genre in ambient electronic jazz; do
  scrapycloud schedule archive_org -a genre=$genre
done

# Day 3: Hooktheory
scrapycloud schedule hooktheory
```

### Approach B: Batched (More Efficient)
Group by time to let them complete:

```bash
# Morning batch (Tier 1 - high priority)
scrapycloud schedule freesound -a genre=ambient
scrapycloud schedule archive_org -a genre=ambient
scrapycloud schedule hooktheory

# Wait 4-6 hours, then:
scrapycloud schedule freesound -a genre=electronic
scrapycloud schedule archive_org -a genre=electronic

# Next day: Tier 2
scrapycloud schedule musopen -a genre=classical
```

### Approach C: Scheduled Recurring (Automated)
Set up daily runs (leverages 120-day retention):

```bash
# Schedule each to run at different times
# Freesound: Daily at 1 AM
scrapycloud schedule freesound -a genre=ambient --when="0 1 * * *"

# Archive.org: Daily at 2 AM
scrapycloud schedule archive_org -a genre=ambient --when="0 2 * * *"

# Hooktheory: Weekly on Sunday at 3 AM
scrapycloud schedule hooktheory --when="0 3 * * 0"
```

## 📦 Combine All Data

Create a script to merge data from all spiders:

```python
# combine_spider_data.py
import json
from pathlib import Path
from collections import defaultdict

def combine_scrapy_data():
    """Combine data from all spiders"""
    
    all_data = []
    metadata = defaultdict(int)
    
    # Simulated: In reality, you'd fetch from Scrapy Cloud API
    spiders_data = {
        'freesound': 'freesound_data.json',
        'archive_org': 'archive_data.json',
        'hooktheory': 'hooktheory_data.json',
        'musopen': 'musopen_data.json',
    }
    
    for spider_name, filename in spiders_data.items():
        try:
            with open(filename) as f:
                spider_data = json.load(f)
                all_data.extend(spider_data)
                metadata[spider_name] = len(spider_data)
                print(f"✅ Loaded {len(spider_data)} items from {spider_name}")
        except FileNotFoundError:
            print(f"⚠️  No data for {spider_name} yet")
    
    # Save combined data
    combined = {
        'total_items': len(all_data),
        'sources': dict(metadata),
        'data': all_data,
    }
    
    with open('all_music_data.json', 'w') as f:
        json.dump(combined, f, indent=2)
    
    print(f"\n✅ Combined {len(all_data)} items from {len(metadata)} sources")
    print(f"📊 Breakdown:\n{json.dumps(dict(metadata), indent=2)}")

if __name__ == '__main__':
    combine_scrapy_data()
```

## 🎯 Recommended 3-Week Plan

### Week 1: Setup & Tier 1
```
Mon: Deploy 3 spiders (freesound, archive_org, hooktheory)
Tue-Wed: Run Tier 1 jobs (ambient, electronic, dance genres)
Thu-Fri: Monitor + download data
```

### Week 2: Tier 2 & Processing
```
Mon-Tue: Deploy + run Tier 2 spiders (musopen, youtube, looplabs)
Wed-Thu: Process & combine all data
Fri: Integration with Zenith DAW
```

### Week 3: Optimization & Scheduling
```
Mon: Set up recurring jobs (daily/weekly)
Tue-Thu: Test DAW integration
Fri: Deploy to production
```

## 💾 Data Storage (120-day Retention)

Your free unit includes:
- ✅ Store unlimited data for 120 days
- ✅ Combine from all spiders
- ✅ Re-run anytime within 120 days
- ✅ Export in JSON/CSV

**Strategy**: Collect everything in first 2 weeks, then use 120 days to:
- Train models
- Build databases
- Integrate with DAW
- Run periodic updates

## 🔄 API: Get Data from Scrapy Cloud

Once deployed, retrieve data programmatically:

```python
import requests
import json

def get_scrapy_job_data(job_id):
    """Get data from completed Scrapy Cloud job"""
    
    # Replace with your project & job details
    url = f'https://storage.scrapinghub.com/collections/s/{project_id}/o/{job_id}'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    return data['items']

# Example: Get all Freesound data
freesound_items = get_scrapy_job_data('freesound_job_id')
print(f"Collected {len(freesound_items)} samples from Freesound")

# Save locally
with open('freesound_samples.json', 'w') as f:
    json.dump(freesound_items, f)
```

## ✅ Maximization Checklist

- [ ] Deploy all spiders to single project
- [ ] Schedule Tier 1 first (Freesound, Archive.org, Hooktheory)
- [ ] Let jobs complete (4-8 hours each)
- [ ] Download combined data
- [ ] Process & standardize format
- [ ] Load into Zenith DAW
- [ ] Set up recurring jobs for continuous updates
- [ ] Monitor storage (you have 120 days)

## 🚀 Your Best Sites (Ranked)

**For Music Samples:**
1. ⭐⭐⭐ Freesound.org (1000+ per genre)
2. ⭐⭐ Archive.org (5000+ total)
3. ⭐ Musopen (500+ classical)

**For Music Theory:**
1. ⭐⭐⭐ Hooktheory (500+ progressions)
2. ⭐⭐ YouTube Metadata (indirect)
3. ⭐ BBC Sound Effects (patterns)

**For Your One Unit:**
→ Start with **Freesound + Archive.org + Hooktheory**  
→ That's already 6000+ items of high-quality music data  
→ Then expand to Tier 2 sites

---

**With 1 free unit + smart scheduling, you can collect from 10+ sites! 🎯**

Ready to deploy all spiders?
