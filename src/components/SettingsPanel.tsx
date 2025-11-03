import React from 'react';
import type { AudioSettings, ProjectSettings } from '../types';

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
  const handleAudioSettingChange = (key: keyof AudioSettings, value: any) => {
    onAudioSettingsChange({ ...audioSettings, [key]: value });
  };

  const handleProjectSettingChange = (key: keyof ProjectSettings, value: any) => {
    onProjectSettingsChange({ ...projectSettings, [key]: value });
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
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;