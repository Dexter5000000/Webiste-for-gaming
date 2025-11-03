import React, { useState } from 'react';
import { TimelineDemo } from './timeline/TimelineDemo';

const StartPage: React.FC = () => {
  const [showTimeline, setShowTimeline] = useState(true);

  if (showTimeline) {
    return <TimelineDemo />;
  }

  return (
    <div className="start-page">
      <div className="start-page-content">
        <div className="logo">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="none" stroke="url(#gradient)" strokeWidth="4" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#667eea' }} />
                <stop offset="100%" style={{ stopColor: '#764ba2' }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>Welcome to Zenith Browser</h1>
        <p>This build features an experimental audio timeline workspace.</p>

        <button className="quick-link" onClick={() => setShowTimeline(true)} style={{ marginTop: '24px' }}>
          Launch Timeline
        </button>
      </div>
    </div>
  );
};

export default StartPage;
