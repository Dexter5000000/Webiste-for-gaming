import scrapy
import json
import time


class FreesoundSpider(scrapy.Spider):
    """
    Freesound.org sample scraper using API
    Falls back to web scraping if API is unavailable
    
    Usage:
        scrapy crawl freesound -a genre=ambient
        scrapy crawl freesound -a genre=electronic -a pages=3
    """
    name = 'freesound'
    allowed_domains = ['freesound.org']
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'CONCURRENT_REQUESTS': 2,
        'DOWNLOAD_DELAY': 2,
        'COOKIES_ENABLED': False,
    }

    def __init__(self, genre='ambient', pages=5, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.genre = genre
        self.pages = int(pages)
        self.current_page = 1
        # Try API first
        self.start_urls = [
            f'https://freesound.org/api/v2/search/text/?query={genre}&sort=rating_desc&fields=id,name,duration,description,username,license,download,url'
        ]

    def parse(self, response):
        """Parse API or web response"""
        
        # Check if it's API JSON response
        if response.headers.get('content-type', b'').decode('utf-8', 'ignore').startswith('application/json'):
            yield from self.parse_api(response)
        else:
            # Fallback to web scraping
            yield from self.parse_web(response)

    def parse_api(self, response):
        """Parse Freesound API JSON response"""
        try:
            data = json.loads(response.text)
            results = data.get('results', [])
            
            if not results:
                self.logger.warning(f"No results from API for genre: {self.genre}")
                return
            
            for item in results:
                yield {
                    'id': str(item.get('id', '')),
                    'name': item.get('name', ''),
                    'url': item.get('url', ''),
                    'username': item.get('username', ''),
                    'duration': str(item.get('duration', '')),
                    'license': item.get('license', ''),
                    'downloads': str(item.get('download', 0)),
                    'description': item.get('description', ''),
                    'genre': self.genre,
                    'source': 'freesound.org',
                    'page': self.current_page,
                }
            
            # Pagination via API
            if self.current_page < self.pages:
                next_url = data.get('next')
                if next_url:
                    self.current_page += 1
                    yield scrapy.Request(
                        next_url,
                        callback=self.parse,
                        dont_obey_robotstxt=True,
                        meta={'dont_redirect': True}
                    )
        
        except json.JSONDecodeError:
            self.logger.error("Failed to parse API response")

    def parse_web(self, response):
        """Fallback: Parse web HTML response"""
        
        # Extract samples from page HTML
        for sample_box in response.css('li[data-sound-id]'):
            sample_id = sample_box.css('::attr(data-sound-id)').get('').strip()
            if sample_id:
                yield {
                    'id': sample_id,
                    'name': sample_box.css('a.title::text').get('').strip(),
                    'url': response.urljoin(
                        sample_box.css('a.title::attr(href)').get('')
                    ),
                    'username': sample_box.css('a.user::text').get('').strip(),
                    'duration': sample_box.css('span.duration::text').get('').strip(),
                    'license': sample_box.css('span.license::text').get('').strip(),
                    'downloads': sample_box.css('span.num-downloads::text').get('').strip(),
                    'genre': self.genre,
                    'source': 'freesound.org',
                    'page': self.current_page,
                }

        # Pagination - follow next page
        if self.current_page < self.pages:
            next_page = response.css('a.next::attr(href)').get()
            if next_page:
                self.current_page += 1
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse,
                    dont_obey_robotstxt=True,
                    meta={'dont_redirect': True}
                )
