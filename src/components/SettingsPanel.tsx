import React, { useEffect } from 'react';
import { Settings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  useEffect(() => {
    const handleOpenSettings = () => {
      // This would be called by the navigation bar
    };

    window.addEventListener('openSettings', handleOpenSettings);

    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  const handleThemeChange = (theme: Settings['theme']) => {
    onSettingsChange({ ...settings, theme });
  };

  const handleCheckboxChange = (key: keyof Settings, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleHomepageChange = (homepageUrl: string) => {
    onSettingsChange({ ...settings, homepageUrl });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-settings" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="settings-content">
          <div className="setting-group">
            <h3>Appearance</h3>
            <label>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.theme === 'light'}
                onChange={() => handleThemeChange('light')}
              />
              Light Theme
            </label>
            <label>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
              />
              Dark Theme
            </label>
            <label>
              <input
                type="radio"
                name="theme"
                value="auto"
                checked={settings.theme === 'auto'}
                onChange={() => handleThemeChange('auto')}
              />
              Auto (System)
            </label>
          </div>

          <div className="setting-group">
            <h3>Privacy</h3>
            <label>
              <input
                type="checkbox"
                checked={settings.blockTrackers}
                onChange={(e) =>
                  handleCheckboxChange('blockTrackers', e.target.checked)
                }
              />
              Block tracking scripts
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.httpsOnly}
                onChange={(e) =>
                  handleCheckboxChange('httpsOnly', e.target.checked)
                }
              />
              Use HTTPS when available
            </label>
          </div>

          <div className="setting-group">
            <h3>Homepage</h3>
            <input
              type="text"
              value={settings.homepageUrl}
              onChange={(e) => handleHomepageChange(e.target.value)}
              placeholder="Homepage URL"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
