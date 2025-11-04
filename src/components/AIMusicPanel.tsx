import { memo, useState, useCallback, useRef } from 'react';
import { aiMusicGenerator } from '../audio/ai/AIMusicGenerator';
import { AI_MODELS, GENRE_ROUTING } from '../audio/ai/models';
import type { AIModelType, MusicGenre, GenerationProgress } from '../audio/ai/types';

interface AIMusicPanelProps {
  onAudioGenerated?: (audioBuffer: AudioBuffer, name: string, blob?: Blob) => void;
}

const GENRES: MusicGenre[] = [
  'electronic',
  'dance',
  'ambient',
  'rock',
  'jazz',
  'classical',
  'hip-hop',
  'pop',
  'experimental',
  'custom',
];

const AIMusicPanel = memo(function AIMusicPanel({ onAudioGenerated }: AIMusicPanelProps) {
  const [selectedModel, setSelectedModel] = useState<AIModelType>('stable-audio-open');
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre>('electronic');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastGeneratedBuffer = useRef<AudioBuffer | null>(null);
  const lastGeneratedBlob = useRef<Blob | null>(null);

  const modelConfig = AI_MODELS[selectedModel];

  const handleGenreChange = useCallback((genre: MusicGenre) => {
    setSelectedGenre(genre);
    if (genre !== 'custom') {
      const recommendedModels = GENRE_ROUTING[genre];
      if (recommendedModels && recommendedModels.length > 0) {
        setSelectedModel(recommendedModels[0]);
      }
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(null);

    if (generatedAudioUrl) {
      URL.revokeObjectURL(generatedAudioUrl);
      setGeneratedAudioUrl(null);
    }

    aiMusicGenerator.setProgressCallback((progressUpdate) => {
      setProgress(progressUpdate);
    });

    try {
      const result = await aiMusicGenerator.generate({
        model: selectedModel,
        prompt: prompt.trim(),
        duration,
        genre: selectedGenre !== 'custom' ? selectedGenre : undefined,
        temperature: 0.7,
        guidanceScale: 7.5,
      });

      if (result.success && result.audioBuffer && result.audioUrl) {
        setGeneratedAudioUrl(result.audioUrl);
        lastGeneratedBuffer.current = result.audioBuffer;
        lastGeneratedBlob.current = result.audioBlob ?? null;
        setError(null);
      } else {
        setError(result.error ?? 'Generation failed');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, duration, selectedGenre, generatedAudioUrl]);

  const handleAddToTimeline = useCallback(() => {
    if (lastGeneratedBuffer.current && onAudioGenerated) {
      const name = `AI Music - ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
      onAudioGenerated(
        lastGeneratedBuffer.current,
        name,
        lastGeneratedBlob.current ?? undefined
      );
      setError(null);
    }
  }, [prompt, onAudioGenerated]);

  const handleDownload = useCallback(() => {
    if (generatedAudioUrl) {
      const a = document.createElement('a');
      a.href = generatedAudioUrl;
      a.download = `ai-music-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [generatedAudioUrl]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h3 className="text-sm">🎵 AI Music Generation</h3>
        <p className="text-xs text-muted" style={{ marginTop: '4px' }}>
          Studio-quality free AI music generation
        </p>
      </div>

      <div className="panel-body">
        <div className="flex-col flex-gap-md">
          <div className="card">
            <label htmlFor="ai-genre-select" className="text-xs text-muted">
              Genre / Style
            </label>
            <select
              id="ai-genre-select"
              className="input"
              value={selectedGenre}
              onChange={(e) => handleGenreChange(e.target.value as MusicGenre)}
              disabled={isGenerating}
            >
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <label htmlFor="ai-model-select" className="text-xs text-muted">
              AI Model
            </label>
            <select
              id="ai-model-select"
              className="input"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as AIModelType)}
              disabled={isGenerating}
            >
              {Object.values(AI_MODELS).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.quality})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
              {modelConfig.description}
            </p>
            <div
              className="text-xs"
              style={{
                marginTop: '8px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span>✅ Free</span>
              <span>🎵 {modelConfig.sampleRate / 1000}kHz</span>
              <span>🔊 Stereo</span>
              <span>⏱️ Max {modelConfig.maxDuration}s</span>
            </div>
          </div>

          <div className="card">
            <label htmlFor="ai-prompt" className="text-xs text-muted">
              Prompt
            </label>
            <textarea
              id="ai-prompt"
              className="input"
              rows={4}
              placeholder="Describe the music you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            <p className="text-xs text-muted" style={{ marginTop: '4px' }}>
              Example: "Energetic electronic dance music with synth leads and heavy bass"
            </p>
          </div>

          <div className="card">
            <label htmlFor="ai-duration" className="text-xs text-muted">
              Duration: {duration}s
            </label>
            <input
              id="ai-duration"
              type="range"
              className="input"
              min={5}
              max={modelConfig.maxDuration}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={isGenerating}
            />
            <div
              className="text-xs text-muted"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
              }}
            >
              <span>5s</span>
              <span>{modelConfig.maxDuration}s</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            style={{ width: '100%' }}
          >
            {isGenerating ? '⏳ Generating...' : '🎼 Generate Music'}
          </button>

          {progress && (
            <div className="card" style={{ background: 'var(--color-bg-elevated)' }}>
              <div className="text-xs text-muted">{progress.message}</div>
              <div
                style={{
                  marginTop: '8px',
                  height: '4px',
                  background: 'var(--color-border)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: 'var(--color-primary)',
                    width: `${progress.progress}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                {progress.progress.toFixed(0)}%
              </div>
            </div>
          )}

          {error && (
            <div
              className="card"
              style={{
                background: 'rgba(248, 114, 114, 0.1)',
                border: '1px solid rgba(248, 114, 114, 0.3)',
              }}
            >
              <div className="text-xs" style={{ color: '#f87272' }}>
                ⚠️ {error}
              </div>
            </div>
          )}

          {generatedAudioUrl && (
            <div className="card" style={{ background: 'var(--color-bg-elevated)' }}>
              <div className="text-xs text-muted" style={{ marginBottom: '8px' }}>
                Generated Audio
              </div>
              <audio
                ref={audioRef}
                src={generatedAudioUrl}
                controls
                style={{ width: '100%' }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddToTimeline}
                  style={{ flex: 1 }}
                >
                  ➕ Add to Timeline
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleDownload}
                  style={{ flex: 1 }}
                >
                  💾 Download
                </button>
              </div>
            </div>
          )}

          <div
            className="card"
            style={{
              background: 'var(--color-bg-elevated)',
              borderLeft: '3px solid var(--color-primary)',
            }}
          >
            <div className="text-xs">
              <strong>💡 Tips:</strong>
              <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                <li>Be specific with instruments, tempo, and mood</li>
                <li>
                  HuggingFace models may take 1-2 min to load (cold start)
                </li>
                <li>All models are 100% free with no API keys required</li>
                <li>Generated audio is stereo at 44.1kHz or higher</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default AIMusicPanel;
