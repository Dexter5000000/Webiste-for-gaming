import React from 'react';
import { Tab } from '../types';

interface TabStripProps {
  tabs: Tab[];
  onNewTab: () => void;
  onCloseTab: (tabId: number) => void;
  onSwitchTab: (tabId: number) => void;
}

const TabStrip: React.FC<TabStripProps> = ({
  tabs,
  onNewTab,
  onCloseTab,
  onSwitchTab,
}) => {
  return (
    <div className="tab-strip">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.isActive ? 'active' : ''}`}
          onClick={() => onSwitchTab(tab.id)}
        >
          <div className="tab-favicon">
            {tab.favicon ? (
              <img src={tab.favicon} alt="" width="12" height="12" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle
                  cx="6"
                  cy="6"
                  r="5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            )}
          </div>
          <span className="tab-title">{tab.title}</span>
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              <path
                d="M1 1l6 6M7 1l-6 6"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </button>
        </div>
      ))}
      <button className="new-tab-btn" onClick={onNewTab}>
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
};

export default TabStrip;
