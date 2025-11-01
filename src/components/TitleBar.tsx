import React from 'react';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    // In PWA mode, this could minimize the window if supported
    console.log('Minimize clicked');
  };

  const handleMaximize = () => {
    // In PWA mode, this could toggle fullscreen
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleClose = () => {
    // In PWA mode, this could close the app
    window.close();
  };

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <div className="app-icon"></div>
        <span className="app-title">Zenith Browser</span>
      </div>
      <div className="title-bar-right">
        <button
          className="title-bar-button minimize-btn"
          onClick={handleMinimize}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 5h10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          className="title-bar-button maximize-btn"
          onClick={handleMaximize}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect
              x="1"
              y="1"
              width="8"
              height="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </button>
        <button className="title-bar-button close-btn" onClick={handleClose}>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
