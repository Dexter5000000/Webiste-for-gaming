import scrapy


class AnimeGfSpider(scrapy.Spider):
    """
    anime.gf character scraper
    Scrapes anime girl/character profiles with detailed personality info
    
    Usage:
        scrapy crawl anime_gf
        scrapy crawl anime_gf -a category=tsundere -a pages=5
    """
    name = 'anime_gf'
    allowed_domains = ['anime.gf']
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 2,
        'COOKIES_ENABLED': True,
    }

    def __init__(self, category='popular', pages=5, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.category = category
        self.pages = int(pages)
        self.current_page = 1
        
        # Build URL based on category
        if category == 'popular':
            url = 'https://anime.gf/characters'
        else:
            url = f'https://anime.gf/characters?filter={category}'
        
        self.start_urls = [url]

    def parse(self, response):
        """Parse character listing pages"""
        
        # Extract character cards - try multiple selector paths
        for card in response.css('div.character-card, div.char-card, div[data-character], div.card, article, li'):
            char_link = (card.css('a::attr(href)').get() or
                        card.css('h3 a::attr(href)').get() or
                        card.css('[data-url]::attr(data-url)').get())
            
            if not char_link or not char_link.startswith('/'):
                continue
            
            # Extract character ID from URL
            char_id = char_link.split('/')[-1] if '/' in char_link else ''
            
            name = (card.css('h3::text').get() or
                   card.css('h4::text').get() or
                   card.css('span.name::text').get() or
                   card.css('a::text').get(''))
            
            yield {
                'id': char_id,
                'name': name.strip() if name else '',
                'anime': ((card.css('p.anime-title::text').get() or
                          card.css('span.anime::text').get()) or '').strip(),
                'description': ((card.css('p.description::text').get() or
                                card.css('div.bio::text').get()) or '').strip(),
                'personality_type': ((card.css('span.personality::text').get() or
                                     card.css('span.type::text').get()) or '').strip(),
                'traits': ','.join(card.css('span.trait, span.tag::text').getall()),
                'image_url': (card.css('img::attr(src)').get() or
                             card.css('img::attr(data-src)').get() or ''),
                'rating': ((card.css('span.rating::text').get() or
                           card.css('[data-rating]::text').get()) or '').strip(),
                'popularity': ((card.css('span.popularity::text').get() or
                               card.css('[data-popularity]::text').get()) or '').strip(),
                'url': response.urljoin(char_link),
                'category': self.category,
                'source': 'anime.gf',
                'page': self.current_page,
            }
            
            # Follow to character detail page for more info
            yield scrapy.Request(
                response.urljoin(char_link),
                callback=self.parse_character_detail,
                meta={'char_data': {
                    'name': name.strip() if name else '',
                    'category': self.category,
                }},
                dont_obey_robotstxt=True,
            )

        # Pagination
        if self.current_page < self.pages:
            next_page = response.css('a.next, a[rel="next"]::attr(href)').get()
            if next_page:
                self.current_page += 1
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse,
                    dont_obey_robotstxt=True,
                )

    def parse_character_detail(self, response):
        """Parse individual character detail page"""
        
        char_data = response.meta.get('char_data', {})
        
        yield {
            'id': response.url.split('/')[-1],
            'name': response.css('h1.title::text').get('').strip() or char_data.get('name', ''),
            'anime': response.css('a.anime-link::text').get('').strip(),
            'description': response.css('div.bio-text::text').get('').strip(),
            'personality': response.css('span.personality-type::text').get('').strip(),
            'traits': ','.join(response.css('span.character-trait::text').getall()),
            'personality_traits': ','.join(response.css('div.personality-section span::text').getall()),
            'role': response.css('span.character-role::text').get('').strip(),
            'age': response.css('span.age::text').get('').strip(),
            'height': response.css('span.height::text').get('').strip(),
            'hair_color': response.css('span.hair-color::text').get('').strip(),
            'eye_color': response.css('span.eye-color::text').get('').strip(),
            'voice_actor': response.css('span.voice-actor::text').get('').strip(),
            'likes': ','.join(response.css('div.likes ul li::text').getall()),
            'dislikes': ','.join(response.css('div.dislikes ul li::text').getall()),
            'skills': ','.join(response.css('div.skills ul li::text').getall()),
            'image_url': response.css('img.character-image::attr(src)').get(''),
            'rating': response.css('span.rating::text').get('').strip(),
            'votes': response.css('span.votes::text').get('').strip(),
            'url': response.url,
            'category': char_data.get('category', 'popular'),
            'source': 'anime.gf',
            'detailed': True,
        }
