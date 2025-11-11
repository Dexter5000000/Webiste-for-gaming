import React, { useState, useEffect } from 'react';
import type { AudioSettings, ProjectSettings } from '../types';
import { getHuggingFaceToken, saveHuggingFaceToken, clearHuggingFaceToken } from '../utils/storage';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  projectSettings: ProjectSettings;
  onAudioSettingsChange: (settings: AudioSettings) => void;
  onProjectSettingsChange: (settings: ProjectSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  audioSettings,
  projectSettings,
  onAudioSettingsChange,
  onProjectSettingsChange,
}) => {
  const [hfToken, setHfToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = getHuggingFaceToken();
    if (savedToken) {
      setHfToken(savedToken);
      setTokenSaved(true);
    }
  }, []);

  const handleAudioSettingChange = (key: keyof AudioSettings, value: number) => {
    onAudioSettingsChange({ ...audioSettings, [key]: value });
  };

  const handleProjectSettingChange = (key: keyof ProjectSettings, value: string | number) => {
    onProjectSettingsChange({ ...projectSettings, [key]: value });
  };

  const handleSaveToken = () => {
    if (hfToken.trim()) {
      saveHuggingFaceToken(hfToken);
      setTokenSaved(true);
      setTimeout(() => setTokenSaved(false), 3000);
    }
  };

  const handleClearToken = () => {
    clearHuggingFaceToken();
    setHfToken('');
    setTokenSaved(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2>DAW Settings</h2>
          <button className="close-settings" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="settings-content">
          <div className="setting-group">
            <h3>Project</h3>
            <label>
              Project Name
              <input
                type="text"
                value={projectSettings.name}
                onChange={(e) =>
                  handleProjectSettingChange('name', e.target.value)
                }
                placeholder="Untitled Project"
              />
            </label>
            <label>
              Tempo (BPM)
              <input
                type="number"
                min="40"
                max="220"
                value={projectSettings.tempo}
                onChange={(e) =>
                  handleProjectSettingChange('tempo', parseInt(e.target.value))
                }
              />
            </label>
            <label>
              Time Signature
              <select
                value={projectSettings.timeSignature}
                onChange={(e) =>
                  handleProjectSettingChange('timeSignature', e.target.value)
                }
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
                <option value="5/4">5/4</option>
              </select>
            </label>
          </div>

          <div className="setting-group">
            <h3>Audio Settings</h3>
            <label>
              Sample Rate
              <select
                value={audioSettings.sampleRate}
                onChange={(e) =>
                  handleAudioSettingChange('sampleRate', parseInt(e.target.value))
                }
              >
                <option value="44100">44.1 kHz</option>
                <option value="48000">48 kHz</option>
                <option value="88200">88.2 kHz</option>
                <option value="96000">96 kHz</option>
              </select>
            </label>
            <label>
              Buffer Size
              <select
                value={audioSettings.bufferSize}
                onChange={(e) =>
                  handleAudioSettingChange('bufferSize', parseInt(e.target.value))
                }
              >
                <option value="64">64 samples</option>
                <option value="128">128 samples</option>
                <option value="256">256 samples</option>
                <option value="512">512 samples</option>
                <option value="1024">1024 samples</option>
                <option value="2048">2048 samples</option>
              </select>
            </label>
          </div>

          <div className="setting-group">
            <h3>Appearance</h3>
            <label>
              <input type="radio" name="theme" value="light" defaultChecked />
              Light Theme
            </label>
            <label>
              <input type="radio" name="theme" value="dark" />
              Dark Theme
            </label>
            <label>
              <input type="radio" name="theme" value="auto" />
              Auto (System)
            </label>
          </div>

          <div className="setting-group">
            <h3>🤗 HuggingFace API Token</h3>
            <p style={{ fontSize: '0.85em', marginBottom: '12px', color: 'var(--color-text-muted, #888)' }}>
              Enter your free HuggingFace token to use high-quality AI music models. 
              Your token is stored locally in your browser only and never sent to our servers.
            </p>
            <label>
              API Token
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={hfToken}
                  onChange={(e) => setHfToken(e.target.value)}
                  placeholder="hf_..."
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{ padding: '8px 12px', minWidth: 'auto' }}
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleSaveToken}
                disabled={!hfToken.trim()}
                style={{ flex: 1 }}
              >
                💾 Save Token
              </button>
              <button
                type="button"
                onClick={handleClearToken}
                style={{ flex: 1 }}
              >
                🗑️ Clear Token
              </button>
            </div>
            {tokenSaved && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px', 
                background: 'rgba(34, 197, 94, 0.1)', 
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '4px',
                fontSize: '0.85em',
                color: '#22c55e'
              }}>
                ✅ Token saved! Reload the AI Music panel to use high-quality models.
              </div>
            )}
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              background: 'var(--color-bg-elevated, #f5f5f5)', 
              borderRadius: '4px',
              fontSize: '0.8em'
            }}>
              <strong>How to get a free token:</strong>
              <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
                <li>Visit <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">huggingface.co/settings/tokens</a></li>
                <li>Create a new token with "Read" access</li>
                <li>Copy the token (starts with hf_...)</li>
                <li>Paste it above and click Save</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;