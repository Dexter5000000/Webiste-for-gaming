# Scrapy Project Template for Music Data Collection

This directory contains starter templates for deploying music data spiders to Scrapy Cloud.

## Quick Start

```bash
# 1. Copy this template
cp -r scrapy-templates/freesound-basic music_scraper
cd music_scraper

# 2. Install dependencies
pip install scrapy scrapycloud

# 3. Test locally
scrapy crawl freesound -a genre=ambient

# 4. Deploy to cloud
scrapycloud deploy

# 5. Run in cloud
scrapycloud schedule freesound -a genre=ambient
```

## Available Templates

### 1. freesound-basic/
Simple spider for Freesound.org samples
- Scrapes sample metadata (name, duration, license, BPM)
- Supports genre filtering
- Pagination support
- ~15 lines of code

### 2. archive-org/
Archive.org music scraper
- Large public domain collection
- Metadata extraction
- Direct download links
- Organized by genre

### 3. music-theory/
Music theory data scraper
- Chord progressions from Hooktheory
- Scale patterns
- Song metadata
- Perfect for AI training

## To Add Your Own Template

```bash
mkdir scrapy-templates/my-spider
cat > scrapy-templates/my-spider/spider.py << 'EOF'
import scrapy

class MySpider(scrapy.Spider):
    name = 'my_spider'
    allowed_domains = ['example.com']
    start_urls = ['https://example.com']

    def parse(self, response):
        yield {
            'data': response.css('::text').get()
        }
EOF
```

## Deployment Guide

See `../SCRAPY_CLOUD_DEPLOY.md` for full instructions
