import React, { useState } from 'react';

const StartPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickLinks = [
    { title: 'Google', url: 'https://www.google.com', icon: 'G' },
    { title: 'GitHub', url: 'https://www.github.com', icon: 'GH' },
    {
      title: 'Stack Overflow',
      url: 'https://www.stackoverflow.com',
      icon: 'SO',
    },
    { title: 'YouTube', url: 'https://www.youtube.com', icon: 'YT' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleQuickLinkClick = (url: string) => {
    // Navigate to the URL
    window.open(url, '_blank');
  };

  return (
    <div className="start-page">
      <div className="start-page-content">
        <div className="logo">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#667eea' }} />
                <stop offset="100%" style={{ stopColor: '#764ba2' }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>Welcome to Zenith Browser</h1>
        <p>A minimalistic, clean browsing experience</p>

        <div className="quick-search">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search the web..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>

        <div className="quick-links">
          <h3>Quick Access</h3>
          <div className="links-grid">
            {quickLinks.map((link, index) => (
              <button
                key={index}
                className="quick-link"
                onClick={() => handleQuickLinkClick(link.url)}
              >
                <div className="link-icon">{link.icon}</div>
                <span>{link.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
