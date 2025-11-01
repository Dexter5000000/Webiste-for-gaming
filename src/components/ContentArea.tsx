import React from 'react';
import { Tab } from '../types';
import StartPage from './StartPage';

interface ContentAreaProps {
  tabs: Tab[];
}

const ContentArea: React.FC<ContentAreaProps> = ({ tabs }) => {
  const activeTab = tabs.find((tab) => tab.isActive);

  return (
    <div className="content-area">
      <div className="web-view-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`web-view ${tab.isActive ? 'active' : ''}`}
            style={{ display: tab.isActive ? 'block' : 'none' }}
          >
            {tab.url === 'zenith://start' ? (
              <StartPage />
            ) : tab.url.startsWith('http') ? (
              <iframe
                src={tab.url}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '0 0 8px 8px',
                }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={() => {
                  // Update tab title when iframe loads
                  try {
                    const iframe = document.querySelector(
                      `iframe[src="${tab.url}"]`
                    ) as HTMLIFrameElement;
                    if (iframe?.contentDocument?.title) {
                      // In a real implementation, you'd update the tab title
                      console.log('Page title:', iframe.contentDocument.title);
                    }
                  } catch (error) {
                    console.log('Cannot access iframe content due to CORS');
                  }
                }}
              />
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Cannot load URL: {tab.url}</h2>
                <p>This URL is not supported in the PWA version.</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {activeTab?.isLoading && (
        <div className="loading-indicator">
          <div className="loading-bar"></div>
        </div>
      )}
    </div>
  );
};

export default ContentArea;
