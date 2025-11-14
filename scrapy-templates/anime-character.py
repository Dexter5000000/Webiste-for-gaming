import scrapy
import json


class AnimeCharacterSpider(scrapy.Spider):
    """
    MyAnimeList character database scraper
    Scrapes anime character profiles for character-building
    
    Usage:
        scrapy crawl anime_character -a query=fantasy
        scrapy crawl anime_character -a query=romance -a pages=3
    """
    name = 'anime_character'
    allowed_domains = ['myanimelist.net']
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 2,
        'COOKIES_ENABLED': True,
    }

    def __init__(self, query='fantasy', pages=3, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.query = query
        self.pages = int(pages)
        self.current_page = 1
        # Search characters
        self.start_urls = [
            f'https://myanimelist.net/character.php?q={query}'
        ]

    def parse(self, response):
        """Parse character search results from MyAnimeList"""
        
        # Extract character rows
        for row in response.css('tr'):
            char_link = row.css('td a::attr(href)').get()
            if not char_link or '/character/' not in char_link:
                continue
            
            char_id = char_link.split('/')[-2] if '/' in char_link else ''
            
            yield {
                'id': char_id,
                'name': row.css('td a::text').get('').strip(),
                'url': response.urljoin(char_link),
                'anime': row.css('td:nth-child(2) a::text').get('').strip(),
                'roles': row.css('td:nth-child(3)::text').get('').strip(),
                'query': self.query,
                'source': 'myanimelist.net',
                'page': self.current_page,
            }

        # Pagination
        if self.current_page < self.pages:
            next_page = response.css('a[rel="next"]::attr(href)').get()
            if next_page:
                self.current_page += 1
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse,
                    dont_obey_robotstxt=True,
                )
