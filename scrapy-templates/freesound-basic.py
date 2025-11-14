import scrapy


class FreesoundSpider(scrapy.Spider):
    """
    Freesound.org sample web scraper
    Scrapes public sound listings by tag/search
    
    Usage:
        scrapy crawl freesound -a query=ambient
        scrapy crawl freesound -a query=electronic -a pages=3
    """
    name = 'freesound'
    allowed_domains = ['freesound.org']
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 3,
        'COOKIES_ENABLED': True,
    }

    def __init__(self, query='ambient', pages=5, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.query = query
        self.pages = int(pages)
        self.current_page = 1
        # Search endpoint
        self.start_urls = [
            f'https://freesound.org/search/?q={query}&s=score'
        ]

    def parse(self, response):
        """Parse search results page"""
        
        # Extract sound entries - try multiple selectors
        for sound in response.css('li.sample, div.sample, div[data-sound-id], article'):
            # Get sound data - try different selector paths
            sound_link = (sound.css('a::attr(href)').get() or 
                         sound.css('h3 a::attr(href)').get() or
                         sound.css('[data-sound-url]::attr(data-sound-url)').get())
            
            sound_id = (sound.css('::attr(data-sound-id)').get() or 
                       sound.css('::attr(data-id)').get() or '')
            
            if not sound_link and not sound_id:
                continue
            
            # Extract ID from URL if needed
            if sound_id:
                sid = sound_id
            elif sound_link:
                try:
                    sid = sound_link.split('/')[-2]
                except (IndexError, ValueError):
                    sid = sound_link.split('/')[-1]
            else:
                continue
            
            name = (sound.css('h3::text').get() or 
                   sound.css('a::text').get() or 
                   sound.css('span.title::text').get(''))
            
            yield {
                'id': sid,
                'name': name.strip() if name else '',
                'url': response.urljoin(sound_link) if sound_link else '',
                'username': ((sound.css('a.user::text').get() or
                            sound.css('span.user::text').get() or
                            sound.css('[data-author]::text').get('')) or '').strip(),
                'duration': ((sound.css('span.duration::text').get() or
                            sound.css('[data-duration]::text').get('')) or '').strip(),
                'license': ((sound.css('span.license::text').get() or
                           sound.css('[data-license]::text').get('')) or '').strip(),
                'downloads': ((sound.css('span.num-downloads::text').get() or
                             sound.css('[data-downloads]::text').get('')) or '').strip(),
                'tags': ','.join(sound.css('a.tag::text, span.tag::text').getall()),
                'genre': self.query,
                'source': 'freesound.org',
                'page': self.current_page,
            }

        # Follow pagination
        if self.current_page < self.pages:
            next_page = response.css('a[rel="next"]::attr(href)').get()
            if next_page:
                self.current_page += 1
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse,
                    dont_obey_robotstxt=True,
                )
