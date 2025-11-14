import scrapy


class CharacterPersonalityDatabaseSpider(scrapy.Spider):
    """
    CharacterDB character personality scraper
    Scrapes character personality profiles and traits
    
    Usage:
        scrapy crawl character_db -a category=fantasy
        scrapy crawl character_db -a category=anime -a pages=5
    """
    name = 'character_db'
    allowed_domains = ['character-stats-database.herokuapp.com', 'characterdb.com']
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 2,
    }

    def __init__(self, category='fantasy', pages=5, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.category = category
        self.pages = int(pages)
        self.current_page = 1
        # Browse characters
        self.start_urls = [
            f'https://character-stats-database.herokuapp.com/characters?category={category}'
        ]

    def parse(self, response):
        """Parse character database"""
        
        # Extract character entries
        for char in response.css('div.character-entry, tr.character-row'):
            char_id = char.css('::attr(data-id)').get() or char.css('td:first-child::text').get('').strip()
            char_name = char.css('span.name, td.name::text').get('').strip()
            
            if not char_name:
                continue
            
            yield {
                'id': char_id or '',
                'name': char_name,
                'description': char.css('p.description, td.description::text').get('').strip(),
                'personality': char.css('span.personality, td.personality::text').get('').strip(),
                'traits': ','.join(char.css('span.trait, td.traits::text').getall()),
                'category': self.category,
                'origin': char.css('span.origin, td.origin::text').get('').strip(),
                'role': char.css('span.role, td.role::text').get('').strip(),
                'source': 'character-db',
                'url': response.urljoin(char.css('a::attr(href)').get('') or ''),
                'page': self.current_page,
            }

        # Pagination
        if self.current_page < self.pages:
            next_page = response.css('a.next, a[aria-label*="next"]::attr(href)').get()
            if next_page:
                self.current_page += 1
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse,
                    dont_obey_robotstxt=True,
                )
