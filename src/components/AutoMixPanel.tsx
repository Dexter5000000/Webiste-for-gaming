import React, { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../state/store';
import { autoMix, applyAutoMixSettings } from '../audio/ai/AutoMixer';
import '../EffectsPanel.css'; // Reuse existing panel styles

interface AutoMixPanelProps {
  onClose?: () => void;
}

export const AutoMixPanel: React.FC<AutoMixPanelProps> = ({ onClose }) => {
  const { project, setTrackVolume, setTrackPan } = useAppStore(
    useShallow((state) => ({
      project: state.project,
      setTrackVolume: state.setTrackVolume,
      setTrackPan: state.setTrackPan,
    }))
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAutoMix = useCallback(async () => {
    try {
      setIsProcessing(true);
      setResult(null);

      // Run AI auto-mix analysis
      const mixResult = await autoMix(project.clips, project.tracks);

      if (!mixResult.success) {
        setResult(`⚠️ ${mixResult.message}`);
        return;
      }

      // Apply the mix settings to tracks
      applyAutoMixSettings(mixResult, {
        updateTrackVolume: (trackId: string, volume: number) => {
          setTrackVolume(trackId, volume);
        },
        updateTrackPan: (trackId: string, pan: number) => {
          setTrackPan(trackId, pan);
        },
      });

      setResult(`✅ ${mixResult.message}`);
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  }, [project.clips, project.tracks, setTrackVolume, setTrackPan]);

  return (
    <div className="effects-panel">
      <div className="effects-panel-header">
        <h2>🤖 AI Auto-Mix</h2>
        {onClose && <button onClick={onClose}>×</button>}
      </div>

      <div className="effects-panel-content">
        <p style={{ fontSize: '0.9em', color: '#888', marginBottom: '1rem' }}>
          Intelligent automatic mixing powered by AI analysis. Balances track levels, panning, and
          dynamics — completely free, no subscriptions needed.
        </p>

        <button
          onClick={handleAutoMix}
          disabled={isProcessing || !project.clips.length}
          style={{
            width: '100%',
            padding: '0.8rem',
            backgroundColor: isProcessing ? '#666' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
        >
          {isProcessing ? '🔄 Analyzing...' : '✨ Auto-Mix Now'}
        </button>

        {result && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.8rem',
              backgroundColor: result.includes('✅') ? '#e8f5e9' : '#fff3e0',
              border: `1px solid ${result.includes('✅') ? '#4caf50' : '#ff9800'}`,
              borderRadius: '4px',
              fontSize: '0.9em',
              fontFamily: 'monospace',
            }}
          >
            {result}
          </div>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '0.85em',
            color: '#555',
          }}
        >
          <h4>What it does:</h4>
          <ul style={{ marginLeft: '1.5em', lineHeight: '1.6' }}>
            <li>📊 Analyzes loudness of each track</li>
            <li>🎚️ Balances levels for professional mix</li>
            <li>🎵 Spreads instruments across stereo field</li>
            <li>🛡️ Prevents clipping and distortion</li>
            <li>⚡ Runs instantly in your browser</li>
          </ul>
        </div>

        <div
          style={{
            marginTop: '1rem',
            padding: '0.8rem',
            backgroundColor: '#e3f2fd',
            borderLeft: '3px solid #2196f3',
            fontSize: '0.85em',
            color: '#1565c0',
          }}
        >
          💡 <strong>Tip:</strong> You can still fine-tune individual tracks after auto-mixing. Use
          the Mixer panel to make adjustments!
        </div>
      </div>
    </div>
  );
};

export default AutoMixPanel;
