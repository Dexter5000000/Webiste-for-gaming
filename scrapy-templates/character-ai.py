import scrapy
import json


class CharacterAiSpider(scrapy.Spider):
    """
    Character.ai-like character profile scraper
    Scrapes AI character profiles, descriptions, personalities
    
    Usage:
        scrapy crawl character_ai -a category=fantasy
        scrapy crawl character_ai -a category=romance -a pages=3
    """
    name = 'character_ai'
    allowed_domains = ['character.ai']
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 2,
        'COOKIES_ENABLED': True,
    }

    def __init__(self, category='fantasy', pages=5, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.category = category
        self.pages = int(pages)
        self.current_page = 1
        # Browse by category
        self.start_urls = [
            f'https://character.ai/search?q={category}'
        ]

    def parse(self, response):
        """Parse character search results"""
        
        # Extract character cards
        for card in response.css('div[data-character-id]'):
            char_id = card.css('::attr(data-character-id)').get()
            char_link = card.css('a::attr(href)').get()
            
            if not char_link:
                continue
            
            yield {
                'id': char_id or '',
                'name': card.css('h3::text').get('').strip(),
                'description': card.css('p.description::text').get('').strip(),
                'category': self.category,
                'author': card.css('span.author::text').get('').strip(),
                'rating': card.css('span.rating::text').get('').strip(),
                'chat_count': card.css('span.chats::text').get('').strip(),
                'url': response.urljoin(char_link),
                'avatar': card.css('img::attr(src)').get(''),
                'tags': ','.join(card.css('span.tag::text').getall()),
                'source': 'character.ai',
                'page': self.current_page,
            }

        # Pagination
        if self.current_page < self.pages:
            next_page = response.css('a.next::attr(href)').get()
            if next_page:
                self.current_page += 1
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse,
                    dont_obey_robotstxt=True,
                )
