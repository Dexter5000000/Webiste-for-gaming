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

// Helper function to track AI music generation errors
export const trackAIMusicError = (
  error: Error | string,
  stage: 'initialization' | 'generation' | 'synthesis' | 'mixing' | 'encoding' | 'unknown',
  context?: Record<string, unknown>
) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  honeybadger.notify(errorObj, {
    context: {
      ...context,
      category: 'ai-music',
      stage,
      timestamp: new Date().toISOString(),
    },
    fingerprint: `ai-music-${stage}-${errorObj.message}`,
  });
};

// Helper function to track audio buffer issues
export const trackBufferError = (
  error: Error | string,
  operation: 'create' | 'access' | 'synthesize' | 'mix' | 'encode',
  bufferInfo?: Record<string, unknown>
) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  honeybadger.notify(errorObj, {
    context: {
      category: 'buffer-operation',
      operation,
      bufferInfo,
      timestamp: new Date().toISOString(),
    },
    fingerprint: `buffer-${operation}-${errorObj.message}`,
  });
};

// Helper function to track synthesis issues
export const trackSynthesisError = (
  generatorType: string,
  operation: string,
  error: Error | string,
  details?: Record<string, unknown>
) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  honeybadger.notify(errorObj, {
    context: {
      category: 'synthesis',
      generatorType,
      operation,
      details,
      timestamp: new Date().toISOString(),
    },
    fingerprint: `synthesis-${generatorType}-${operation}`,
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

// Helper function to add AI music breadcrumbs
export const addAIMusicBreadcrumb = (
  stage: string,
  action: string,
  details?: Record<string, unknown>
) => {
  honeybadger.addBreadcrumb(`[AI Music] ${stage}: ${action}`, {
    metadata: {
      ...details,
      timestamp: new Date().toISOString(),
    },
    category: 'ai-music',
  });
};

export default honeybadger;
