import scrapy
import json


class HooktheorySpider(scrapy.Spider):
    """
    Hooktheory.com spider for chord progressions and music theory data
    Scrapes popular chord progressions to help AI music generation
    
    Usage:
        scrapy crawl hooktheory
        scrapy crawl hooktheory -a limit=500
    """
    name = 'hooktheory'
    allowed_domains = ['hooktheory.com']

    def __init__(self, limit='100', *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.limit = int(limit)
        self.api_base = 'https://www.hooktheory.com/api/v1'
        self.processed_count = 0
        self.start_urls = [
            f'{self.api_base}/trends/listData?ajax=true'
        ]

    def parse(self, response):
        """Parse trends endpoint"""
        try:
            data = json.loads(response.text)
        except json.JSONDecodeError:
            self.logger.error("Failed to parse JSON from API")
            return

        if 'trends' not in data:
            self.logger.warning("No trends found in response")
            return

        for trend in data.get('trends', []):
            if self.processed_count >= self.limit:
                break

            # Extract chord progression
            chords = trend.get('chords', [])
            chord_list = []
            
            for chord in chords:
                chord_name = chord.get('chord', '')
                if chord_name:
                    chord_list.append(chord_name)

            if chord_list:
                yield {
                    'progression': ' → '.join(chord_list),
                    'count': trend.get('count', 0),
                    'relative_count': trend.get('relativefitnessscore', 0),
                    'num_songs': trend.get('num_songs', 0),
                    'notation': self._chords_to_notation(chord_list),
                    'key': self._detect_key(chord_list),
                    'source': 'hooktheory.com',
                    'music_theory_data': True,
                }
                self.processed_count += 1

    def _chords_to_notation(self, chords):
        """Convert chord names to standard notation"""
        notation_map = {
            'I': '1', 'i': '1',
            'II': '2', 'ii': '2',
            'III': '3', 'iii': '3',
            'IV': '4', 'iv': '4',
            'V': '5', 'v': '5',
            'VI': '6', 'vi': '6',
            'VII': '7', 'vii': '7',
        }
        
        result = []
        for chord in chords:
            # Extract roman numeral and modifiers
            base = chord.split('-')[0] if '-' in chord else chord
            result.append(notation_map.get(base, chord))
        
        return ' '.join(result)

    def _detect_key(self, chords):
        """Detect likely key from chord progression"""
        # Simple heuristic based on first chord
        if chords:
            first = chords[0].lower()
            if 'maj' in first or first.startswith('I'):
                return 'Major'
            elif 'min' in first or first.startswith('vi'):
                return 'Minor'
        return 'Unknown'
