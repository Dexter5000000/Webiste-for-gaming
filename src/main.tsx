import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import honeybadger from './utils/honeybadger.ts';
import './styles/index.css';

// Initialize Honeybadger error tracking
console.log('Honeybadger initialized:', honeybadger.getVersion());

// Add global error handlers for comprehensive error catching
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  honeybadger.notify(event.error || new Error(event.message), {
    context: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      category: 'window.onerror',
    },
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  honeybadger.notify(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
    context: {
      category: 'unhandled-promise-rejection',
      promise: event.promise,
    },
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
