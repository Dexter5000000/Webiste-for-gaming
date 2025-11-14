import json
from pathlib import Path

def process_anime_character_data(json_file_path: str, output_dir: str = 'public/data') -> dict:
    """
    Process MyAnimeList character data for AI chatbot integration
    Converts Scrapy JSON to chatbot-ready format
    """
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Load JSON data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    
    if not isinstance(raw_data, list):
        print("❌ Expected array of characters")
        return {}
    
    print(f"📥 Processing {len(raw_data)} characters from MyAnimeList...")
    
    # Transform data
    processed_characters = []
    for char in raw_data:
        processed = {
            'id': f"mal-{char.get('id', '')}",
            'name': char.get('name', '').strip(),
            'source': 'myanimelist',
            'mal_id': char.get('id', ''),
            'url': char.get('url', ''),
            'series': char.get('anime', '').strip() or 'Unknown',
            'roles': char.get('roles', '').strip() or 'Main',
            'category': char.get('query', 'fantasy'),  # fantasy, action, etc.
            'personality_traits': [],  # Empty - MyAnimeList doesn't provide
            'description': '',  # Would need to scrape detail page
            'timestamp': None,
        }
        
        if processed['name']:  # Only add if name exists
            processed_characters.append(processed)
    
    # Save full dataset
    output_file = Path(output_dir) / 'myanimelist-characters.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_characters, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(processed_characters)} characters to {output_file}")
    
    # Group by series
    by_series = {}
    for char in processed_characters:
        series = char['series']
        if series not in by_series:
            by_series[series] = []
        by_series[series].append(char)
    
    series_file = Path(output_dir) / 'myanimelist-by-series.json'
    with open(series_file, 'w', encoding='utf-8') as f:
        json.dump(by_series, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(by_series)} series grouping")
    
    # Group by category
    by_category = {}
    for char in processed_characters:
        cat = char['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(char)
    
    category_file = Path(output_dir) / 'myanimelist-by-category.json'
    with open(category_file, 'w', encoding='utf-8') as f:
        json.dump(by_category, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(by_category)} category grouping")
    
    # Create summary
    summary = {
        'total_characters': len(processed_characters),
        'unique_series': len(by_series),
        'categories': list(by_category.keys()),
        'series_list': list(by_series.keys()),
        'files': {
            'all': 'myanimelist-characters.json',
            'by_series': 'myanimelist-by-series.json',
            'by_category': 'myanimelist-by-category.json',
        }
    }
    
    summary_file = Path(output_dir) / 'myanimelist-summary.json'
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n📊 Summary:")
    print(f"  • Total characters: {summary['total_characters']}")
    print(f"  • Unique series: {summary['unique_series']}")
    print(f"  • Categories: {', '.join(summary['categories'])}")
    
    return summary

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python process_anime_character.py <json_file> [output_dir]")
        sys.exit(1)
    
    json_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'public/data'
    
    process_anime_character_data(json_file, output_dir)
