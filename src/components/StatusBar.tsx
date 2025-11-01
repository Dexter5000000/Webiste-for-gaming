import React, { useState, useEffect } from 'react';

const StatusBar: React.FC = () => {
  const [pageStatus, setPageStatus] = useState('Ready');
  const [zoomLevel] = useState('100%');

  useEffect(() => {
    // Update page status based on loading state
    const updatePageStatus = () => {
      setPageStatus('Ready');
    };

    window.addEventListener('load', updatePageStatus);

    return () => {
      window.removeEventListener('load', updatePageStatus);
    };
  }, []);

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="page-status">{pageStatus}</span>
      </div>
      <div className="status-right">
        <span className="zoom-level">{zoomLevel}</span>
      </div>
    </div>
  );
};

export default StatusBar;
