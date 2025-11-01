import React, { useState } from 'react';
import { Tab } from '../types';

interface NavigationBarProps {
  tabs: Tab[];
  updateTab: (tabId: number, updates: Partial<Tab>) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ tabs, updateTab }) => {
  const [addressInput, setAddressInput] = useState('');

  const activeTab = tabs.find((tab) => tab.isActive);

  const handleBack = () => {
    if (activeTab) {
      window.history.back();
    }
  };

  const handleForward = () => {
    if (activeTab) {
      window.history.forward();
    }
  };

  const handleRefresh = () => {
    if (activeTab) {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (activeTab) {
      updateTab(activeTab.id, { url: 'zenith://start', title: 'New Tab' });
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab && addressInput.trim()) {
      let url = addressInput.trim();

      // Add protocol if missing
      if (
        !url.startsWith('http://') &&
        !url.startsWith('https://') &&
        !url.startsWith('zenith://')
      ) {
        url = 'https://' + url;
      }

      updateTab(activeTab.id, { url, isLoading: true });

      // In a real browser, this would navigate the iframe
      // For now, we'll just update the URL
      setTimeout(() => {
        updateTab(activeTab.id, {
          isLoading: false,
          title: url,
        });
      }, 1000);
    }
  };

  const handleSettings = () => {
    // Dispatch custom event for settings
    window.dispatchEvent(new CustomEvent('openSettings'));
  };

  return (
    <div className="nav-bar">
      <div className="nav-controls">
        <button className="nav-button back-btn" onClick={handleBack}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M10 3l-5 5 5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <button className="nav-button forward-btn" onClick={handleForward}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M6 3l5 5-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <button className="nav-button refresh-btn" onClick={handleRefresh}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M13 7A6 6 0 1 1 3 7a6 6 0 0 1 10 0z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M13 4v3h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
        <button className="nav-button home-btn" onClick={handleHome}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M8 1l7 7-1.5 1.5L8 4 2.5 9.5 1 8l7-7z"
              fill="currentColor"
            />
            <path
              d="M3 9v6h3v-4h4v4h3V9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      <div className="address-bar-container">
        <form onSubmit={handleAddressSubmit} className="address-bar">
          <div className="security-indicator">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path
                d="M7 1l4 2v4.5c0 2.5-4 5.5-4 5.5s-4-3-4-5.5V3l4-2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>
          <input
            type="text"
            className="address-input"
            placeholder="Search or enter address..."
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
          />
          <button type="button" className="bookmark-btn">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path
                d="M3 1h8v12l-4-3-4 3V1z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </button>
        </form>
      </div>

      <div className="browser-actions">
        <button className="action-button settings-btn" onClick={handleSettings}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle
              cx="8"
              cy="8"
              r="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M8 1v2M8 13v2M15 8h-2M3 8H1M13.36 13.36l-1.42-1.42M4.05 4.05L2.64 2.64M13.36 2.64l-1.42 1.42M4.05 11.95l-1.41 1.41"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </button>
        <button className="action-button menu-btn">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="3" cy="8" r="1" fill="currentColor" />
            <circle cx="8" cy="8" r="1" fill="currentColor" />
            <circle cx="13" cy="8" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NavigationBar;
