import scrapy


class ArchiveOrgAudioSpider(scrapy.Spider):
    """
    Archive.org audio scraper
    Scrapes public domain and creative commons music
    
    Usage:
        scrapy crawl archive_org -a genre=ambient
        scrapy crawl archive_org -a genre=classical
    """
    name = 'archive_org'
    allowed_domains = ['archive.org']

    def __init__(self, genre='ambient', pages=3, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.genre = genre
        self.pages = int(pages)
        self.current_page = 1
        self.start_urls = [
            f'https://archive.org/advancedsearch.php?q={genre}&mediatype=audio&rows=100'
        ]

    def parse(self, response):
        """Parse search results"""
        
        for item in response.css('div.results-item'):
            identifier = item.css('div.identifier::text').get('')
            if identifier:
                identifier = identifier.strip()
                
            yield {
                'title': item.css('div.title-text a::text').get('').strip(),
                'identifier': identifier,
                'creator': item.css('div.creator::text').get('').strip(),
                'date': item.css('div.date::text').get('').strip(),
                'description': item.css('div.description::text').get('').strip(),
                'download_url': f'https://archive.org/download/{identifier}/' if identifier else '',
                'genre': self.genre,
                'source': 'archive.org',
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
                    meta={'dont_redirect': True}
                )
