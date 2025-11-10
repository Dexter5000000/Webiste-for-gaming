import Honeybadger from '@honeybadger-io/js';

// Initialize Honeybadger
const honeybadger = Honeybadger.configure({
  apiKey: import.meta.env.VITE_HONEYBADGER_API_KEY || '',
  environment: import.meta.env.MODE || 'development',
  revision: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Only report errors in production
  reportData: import.meta.env.PROD,
  
  // Enable breadcrumbs for better debugging
  breadcrumbsEnabled: true,
  maxBreadcrumbs: 40,
  
  // Enable console breadcrumbs
  enableUnhandledRejection: true,
  enableUncaught: true,
  
  // Custom filters
  filters: [
    'password',
    'password_confirmation',
    'credit_card',
    'ssn'
  ],
  
  // Development settings
  debug: !import.meta.env.PROD,
});

// Add custom context
honeybadger.setContext({
  application: 'Zenith DAW',
  component: 'Web Audio Workstation',
});

// Helper function to track audio-specific errors
export const trackAudioError = (error: Error, context?: Record<string, unknown>) => {
  honeybadger.notify(error, {
    context: {
      ...context,
      category: 'audio',
    },
    fingerprint: `audio-error-${error.message}`,
  });
};

// Helper function to track component errors
export const trackComponentError = (
  error: Error,
  componentName: string,
  context?: Record<string, unknown>
) => {
  honeybadger.notify(error, {
    context: {
      ...context,
      component: componentName,
      category: 'component',
    },
  });
};

// Helper function to add breadcrumbs
export const addBreadcrumb = (message: string, metadata?: Record<string, unknown>) => {
  honeybadger.addBreadcrumb(message, {
    metadata,
    category: 'custom',
  });
};

export default honeybadger;
