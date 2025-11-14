import scrapy


class MusopenSpider(scrapy.Spider):
    """
    Musopen.org spider for classical music samples
    Scrapes public domain classical music recordings
    
    Usage:
        scrapy crawl musopen
        scrapy crawl musopen -a composer=bach -a pages=5
    """
    name = 'musopen'
    allowed_domains = ['musopen.org']

    def __init__(self, composer='', category='classical', pages=3, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.composer = composer
        self.category = category
        self.pages = int(pages)
        self.current_page = 1
        
        # Build search URL
        if composer:
            self.start_urls = [
                f'https://musopen.org/music/?search={composer}&sort=name'
            ]
        else:
            self.start_urls = [
                f'https://musopen.org/music/?category={category}&sort=popular'
            ]

    def parse(self, response):
        """Parse music listings"""
        
        for item in response.css('div.music-item'):
            title = item.css('h3.music-title::text').get('').strip()
            composer = item.css('span.composer::text').get('').strip()
            duration = item.css('span.duration::text').get('').strip()
            
            download_btn = item.css('a.download::attr(href)').get()
            music_id = item.css('div.music-item::attr(data-id)').get('')
            
            if title and music_id:
                yield {
                    'title': title,
                    'composer': composer,
                    'duration': duration,
                    'music_id': music_id,
                    'download_url': response.urljoin(download_btn) if download_btn else '',
                    'category': self.category,
                    'format': self._get_format(download_btn),
                    'page': self.current_page,
                    'source': 'musopen.org',
                }
        
        # Pagination
        if self.current_page < self.pages:
            next_page = response.css('a.next-page::attr(href)').get()
            if next_page:
                self.current_page += 1
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse
                )

    def _get_format(self, url):
        """Extract audio format from download URL"""
        if not url:
            return 'unknown'
        if '.mp3' in url:
            return 'mp3'
        elif '.flac' in url:
            return 'flac'
        elif '.ogg' in url:
            return 'ogg'
        elif '.wav' in url:
            return 'wav'
        return 'unknown'
