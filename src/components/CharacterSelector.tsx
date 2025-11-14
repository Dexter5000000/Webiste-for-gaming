import React, { useState, useEffect } from 'react';

export interface Character {
  id: string;
  name: string;
  series: string;
  roles: string;
  url: string;
  category: string;
  source: string;
  personality_traits?: string[];
  description?: string;
}

export interface CharacterSelectProps {
  onSelectCharacter?: (character: Character) => void;
  source?: 'myanimelist' | 'anime_gf' | 'all';
  category?: string;
  limit?: number;
}

export function CharacterSelector({ 
  onSelectCharacter, 
  source = 'myanimelist',
  category,
  limit = 50 
}: CharacterSelectProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  useEffect(() => {
    loadCharacters();
  }, [source, category]);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      let filename = '';
      
      switch (source) {
        case 'myanimelist':
          filename = 'myanimelist-characters.json';
          break;
        case 'anime_gf':
          filename = 'anime-gf-characters.json';
          break;
        default:
          filename = 'all-characters.json';
      }

      const response = await fetch(`/data/${filename}`);
      if (!response.ok) throw new Error('Failed to load characters');

      let data: Character[] = await response.json();

      // Filter by category if specified
      if (category) {
        data = data.filter(c => c.category === category);
      }

      // Limit results
      data = data.slice(0, limit);

      setCharacters(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = characters.filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.series.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (character: Character) => {
    setSelectedChar(character);
    onSelectCharacter?.(character);
  };

  if (loading) {
    return <div className="character-selector loading">Loading characters...</div>;
  }

  if (error) {
    return <div className="character-selector error">Error: {error}</div>;
  }

  return (
    <div className="character-selector">
      <div className="character-selector-header">
        <h2>Select AI Character</h2>
        <p className="count">{filtered.length} characters found</p>
      </div>

      <input
        type="text"
        placeholder="Search by name or series..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="character-search"
      />

      <div className="character-grid">
        {filtered.map(character => (
          <div
            key={character.id}
            className={`character-card ${selectedChar?.id === character.id ? 'selected' : ''}`}
            onClick={() => handleSelect(character)}
          >
            <div className="character-card-content">
              <h3 className="character-name">{character.name}</h3>
              <p className="character-series">{character.series}</p>
              {character.roles && (
                <p className="character-roles">{character.roles}</p>
              )}
              <div className="character-meta">
                <span className="source-badge">{character.source}</span>
                <span className="category-badge">{character.category}</span>
              </div>
            </div>
            {selectedChar?.id === character.id && (
              <div className="selection-indicator">✓</div>
            )}
          </div>
        ))}
      </div>

      {selectedChar && (
        <div className="selected-character-details">
          <h3>Selected Character</h3>
          <div className="details">
            <p><strong>Name:</strong> {selectedChar.name}</p>
            <p><strong>Series:</strong> {selectedChar.series}</p>
            <p><strong>Source:</strong> {selectedChar.source}</p>
            <a href={selectedChar.url} target="_blank" rel="noopener noreferrer">
              View on {selectedChar.source}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterSelector;
