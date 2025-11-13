import scrapy


class FreesoundSpider(scrapy.Spider):
    """
    Freesound.org sample scraper
    
    Usage:
        scrapy crawl freesound -a genre=ambient
        scrapy crawl freesound -a genre=electronic
    """
    name = 'freesound'
    allowed_domains = ['freesound.org']

    def __init__(self, genre='ambient', pages=5, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.genre = genre
        self.pages = int(pages)
        self.current_page = 1
        self.start_urls = [
            f'https://freesound.org/browse/tags/{genre}/'
        ]

    def parse(self, response):
        """Parse sample listing page"""
        
        # Extract samples from page
        for sample_box in response.css('li[data-sound-id]'):
            yield {
                'id': sample_box.css('::attr(data-sound-id)').get(),
                'name': sample_box.css('a.title::text').get('').strip(),
                'url': response.urljoin(
                    sample_box.css('a.title::attr(href)').get()
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
                    meta={'dont_redirect': True}
                )
