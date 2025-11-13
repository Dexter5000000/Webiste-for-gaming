# GitHub Student Developer Pack + Zyte Setup Guide

## 🎓 Get Zyte Free as a Student

### Step 1: Claim Your GitHub Student Developer Pack

1. Go to **[GitHub Education](https://education.github.com/pack)**
2. Click **"Sign up for the GitHub Student Developer Pack"**
3. Verify your student status (school email or student ID)
4. Once approved (~24 hours), you get access to all partner benefits

### Step 2: Redeem Zyte Benefits

After approval:
1. Visit your [GitHub Student Pack dashboard](https://education.github.com/pack)
2. Find **Zyte** in the partner list
3. Click **"Get access"** or **"Claim offer"**
4. You'll be redirected to Zyte to link your GitHub account
5. Zyte will create your free account automatically

### Step 3: What You Get

✅ **Scrapy Cloud (Free Tier for Students):**
- ✅ **Unlimited requests** (no rate limits)
- ✅ **Unlimited crawl time** (spiders run as long as needed)
- ✅ **120-day data retention**
- ✅ **Unlimited projects** (organize multiple scraping jobs)
- ✅ **Unlimited team members** (invite classmates)
- ✅ **GitHub integration** (deploy directly from GitHub)
- ✅ **Command-line tools** (deploy via terminal)
- ✅ **Scheduled crawls** (automate data collection)

**Value:** ~$150-300/month if purchased individually

### Step 4: Get Your API Key

1. Log in to [Zyte App](https://app.zyte.com)
2. Go to **Settings → API Key**
3. Copy your API key
4. Add to your project:

```bash
# In your project root
echo "VITE_ZYTE_API_KEY=your_api_key_here" > .env.local
```

## 🚀 Using Zyte in Zenith DAW

### Quick Setup

```bash
# 1. Add API key to .env.local
VITE_ZYTE_API_KEY=your_api_key_from_github_pack

# 2. Rebuild
npm run build

# 3. You're ready! Import and use:
```

### Example: Fetch Music Samples

```typescript
import { zyteCollector } from '@/audio/ai/ZyteDataCollector';

// Check if configured
if (zyteCollector.isConfigured()) {
  // Fetch 50 ambient samples from across the web
  const samples = await zyteCollector.fetchMusicSamples('ambient', 50);
  
  console.log(`✅ Found ${samples.length} samples:`);
  samples.forEach(sample => {
    console.log(`  🎵 ${sample.name} - ${sample.bpm} BPM - ${sample.license}`);
  });
}
```

### Use Cases for Student Projects

#### 1. **Build a Music Sample Database**
```typescript
const genres = ['ambient', 'electronic', 'dance', 'jazz'];
const allSamples = [];

for (const genre of genres) {
  const samples = await zyteCollector.fetchMusicSamples(genre, 100);
  allSamples.push(...samples);
}

console.log(`Collected ${allSamples.length} samples total`);
// Save to local database or export as JSON
```

#### 2. **Monitor Music Theory Trends**
```typescript
// Schedule daily scrapes using Scrapy Cloud
const musicData = await zyteCollector.fetchMusicTheoryData();

// Track chord progression popularity
console.log('Popular progressions:', musicData.chordProgressions);

// Analyze rhythm patterns
console.log('Available rhythms:', musicData.rhythmPatterns);
```

#### 3. **Create a DJ Training Tool**
```typescript
// Fetch real samples + theory data
const theory = await zyteCollector.fetchMusicTheoryData();
const samples = await zyteCollector.fetchMusicSamples('electronic', 200);

// Use as training data for AI models
// Export for analysis
```

#### 4. **Build a Music Search Engine**
```typescript
// Scrape metadata from multiple music sites
// Index by genre, BPM, chord progression
// Create searchable database of samples
```

## 📚 Scrapy Cloud Features

### Deploy Spiders to Cloud

```bash
# 1. Install Scrapy and tools
pip install scrapy scrapycloud

# 2. Create a spider (in Zenith DAW project or separate)
scrapy startproject music_scraper
cd music_scraper
scrapy genspider freesound freesound.org

# 3. Deploy to Scrapy Cloud
scrapycloud deploy

# 4. View results
# Dashboard: https://app.scrapycloud.com
```

### Example Spider for Music Samples

```python
# music_scraper/spiders/freesound_spider.py
import scrapy

class FreesoundSpider(scrapy.Spider):
    name = 'freesound'
    allowed_domains = ['freesound.org']
    start_urls = ['https://freesound.org/browse/tags/ambient/']

    def parse(self, response):
        for sample in response.css('div.sound'):
            yield {
                'id': sample.css('::attr(data-id)').get(),
                'name': sample.css('a.title::text').get(),
                'duration': sample.css('.duration::text').get(),
                'license': sample.css('.license::text').get(),
                'url': sample.css('a.title::attr(href)').get(),
            }
        
        # Follow pagination
        next_page = response.css('a.next::attr(href)').get()
        if next_page:
            yield scrapy.Request(next_page, callback=self.parse)
```

### Monitor in Dashboard

- Real-time job monitoring
- Data export (JSON, CSV)
- Scheduled jobs
- Error tracking
- Performance analytics

## 💡 Advanced: Integrate with AI Music Generator

### Step 1: Store Samples Locally

```typescript
// Fetch samples once (take advantage of 120-day cache)
const samples = await zyteCollector.fetchMusicSamples('electronic', 500);

// Export to JSON
const json = JSON.stringify(samples, null, 2);
localStorage.setItem('music_samples_electronic', json);
```

### Step 2: Use as Training Data

```typescript
// In AIMusicGenerator.ts
async generateEnhanced(request: GenerationRequest): Promise<GenerationResult> {
  // Get real-world samples
  const samples = JSON.parse(
    localStorage.getItem('music_samples_electronic') || '[]'
  );
  
  // Extract BPM range
  const avgBpm = samples.reduce((sum, s) => sum + s.bpm, 0) / samples.length;
  
  // Use as hint for generation
  const enhancedPrompt = `${request.prompt} - BPM around ${Math.round(avgBpm)}`;
  
  return this.generate({
    ...request,
    prompt: enhancedPrompt,
  });
}
```

### Step 3: Schedule Regular Updates

```typescript
// Refresh sample cache weekly using Scrapy Cloud scheduled jobs
const refreshSamples = async () => {
  if (zyteCollector.isConfigured()) {
    zyteCollector.clearCache();
    const fresh = await zyteCollector.fetchMusicSamples('electronic', 500);
    localStorage.setItem('music_samples_electronic', JSON.stringify(fresh));
    console.log('✅ Sample cache refreshed');
  }
};

// Call on app startup
window.addEventListener('load', refreshSamples);
```

## 🎯 Student Project Ideas

### 1. **AI DJ Assistant**
- Scrape chord progressions, BPM patterns
- Train ML model on real sample data
- Generate DJ-ready transitions

### 2. **Music Dataset Creator**
- Use Scrapy Cloud to crawl music sites
- Build searchable database
- Share with research community

### 3. **Trend Analysis Tool**
- Monitor popular music patterns
- Track genre evolution over time
- Visualize data with charts

### 4. **Sample Recommendation Engine**
- Learn user preferences
- Recommend similar samples from scraped data
- Personalize for different genres

### 5. **Music Theory Visualizer**
- Scrape chord/scale data
- Create interactive learning tool
- Help students understand theory

## 📖 Documentation Links

### Zyte Resources
- **[Zyte Dashboard](https://app.zyte.com)** - Main interface
- **[Zyte Developers](https://www.zyte.com/developers/)** - API docs
- **[Zyte Blog](https://www.zyte.com/blog/)** - Tutorials & updates

### Scrapy Cloud Resources
- **[Scrapy Cloud Docs](https://doc.scrapycloud.com/)** - Full reference
- **[Scrapy Docs](https://docs.scrapy.org/)** - Spider development
- **[GitHub Integration](https://doc.scrapycloud.com/github-integration.html)** - Auto-deploy from GitHub

### GitHub Student Pack
- **[GitHub Education](https://education.github.com/pack)** - All benefits
- **[GitHub Student Verified](https://education.github.com/students)** - Status check

## ⚙️ Setup Checklist

- [ ] Sign up for [GitHub Student Developer Pack](https://education.github.com/pack)
- [ ] Wait for verification (~24 hours)
- [ ] Find Zyte in pack and claim offer
- [ ] Create Zyte account (linked to GitHub)
- [ ] Get API key from Zyte settings
- [ ] Add `VITE_ZYTE_API_KEY=...` to `.env.local`
- [ ] Run `npm run build`
- [ ] Test: `zyteCollector.getStatus()` in console
- [ ] Start building awesome projects! 🚀

## 🆘 Troubleshooting

### "Account pending verification"
- GitHub Student Pack approval takes ~24 hours
- Check your email for verification link
- Once approved, access partner benefits

### "Zyte not configured"
```typescript
import { zyteCollector } from '@/audio/ai/ZyteDataCollector';

const status = zyteCollector.getStatus();
console.log(status);
// If configured: false, add API key and rebuild
```

### "Rate limits hit"
- Student pack has unlimited requests
- Verify API key is correct
- Check that you claimed the offer in the pack

### API Key Not Working
```bash
# Make sure .env.local exists in project root
cat .env.local
# Should show: VITE_ZYTE_API_KEY=your_key_here

# Rebuild if you added key
npm run build

# Restart dev server
npm run dev
```

## 💰 Value You're Getting

| Feature | Regular Price | Student Price |
|---------|---------------|---------------|
| Scrapy Cloud | $150-300/month | **FREE** ✅ |
| API requests | Limited | **Unlimited** ✅ |
| Team members | Extra cost | **Unlimited** ✅ |
| Data retention | 30 days | **120 days** ✅ |
| GitHub deploy | Extra | **Included** ✅ |
| **Total Value** | **$150-300/month** | **$0** 🎉 |

## 🎓 Portfolio Value

Using Zyte + Scrapy Cloud for student projects shows:
- ✅ Real-world web scraping experience
- ✅ Data collection at scale
- ✅ Cloud deployment knowledge
- ✅ AI/ML data preparation
- ✅ DevOps & automation skills

Perfect for:
- Portfolio projects
- CS/Data Science coursework
- Internship applications
- Open-source contributions

## 🚀 Next Steps

1. **Sign up** for GitHub Student Pack
2. **Claim** Zyte offer
3. **Add API key** to `.env.local`
4. **Start scraping** with Zenith DAW
5. **Build projects** for your portfolio

---

**Questions?** Check out the resources above or ask in the Zyte/Scrapy community!

**Happy scraping & music generation! 🎵🐍**
