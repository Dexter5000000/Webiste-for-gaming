import scrapy
import json


class PersonalityTraitsSpider(scrapy.Spider):
    """
    Personality types and traits database scraper
    Scrapes MBTI types, personality traits, and descriptions
    
    Usage:
        scrapy crawl personality_traits
        scrapy crawl personality_traits -a pages=3
    """
    name = 'personality_traits'
    allowed_domains = ['16personalities.com', 'truity.com']
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_DELAY': 2,
    }

    def __init__(self, pages=1, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = int(pages)
        self.current_page = 1
        # 16 Personalities types
        self.start_urls = [
            'https://www.16personalities.com/personality-types'
        ]

    def parse(self, response):
        """Parse personality types from 16personalities"""
        
        # Extract personality type cards
        for card in response.css('div.type-card, div.personality-type'):
            type_code = card.css('::attr(data-type)').get()
            
            yield {
                'id': type_code or '',
                'name': card.css('h3::text').get('').strip(),
                'code': type_code or '',
                'description': card.css('p::text').get('').strip(),
                'traits': ','.join(card.css('span.trait::text').getall()),
                'strengths': ','.join(card.css('ul.strengths li::text').getall()),
                'weaknesses': ','.join(card.css('ul.weaknesses li::text').getall()),
                'url': response.urljoin(card.css('a::attr(href)').get('') or ''),
                'category': 'mbti',
                'source': '16personalities.com',
                'page': self.current_page,
            }

        # Follow personality detail pages
        if self.current_page < self.pages:
            for detail_link in response.css('a.type-link::attr(href)').getall()[:3]:  # Limit to 3
                yield scrapy.Request(
                    response.urljoin(detail_link),
                    callback=self.parse_personality_detail,
                    dont_obey_robotstxt=True,
                )

    def parse_personality_detail(self, response):
        """Parse detailed personality page"""
        
        personality_type = response.css('h1::text').get('').strip()
        
        yield {
            'id': personality_type[:4],  # Extract code like INTJ
            'name': personality_type,
            'description': response.css('div.description::text').get('').strip(),
            'characteristics': ','.join(response.css('div.characteristics li::text').getall()),
            'cognitive_functions': ','.join(response.css('div.functions li::text').getall()),
            'famous_people': ','.join(response.css('div.famous-people li::text').getall()),
            'career_matches': ','.join(response.css('div.careers li::text').getall()),
            'url': response.url,
            'category': 'mbti_detailed',
            'source': '16personalities.com',
        }
