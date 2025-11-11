/**
 * Environment variable helper for safe access to Vite-injected secrets.
 * Only variables prefixed with VITE_ are available in the browser.
 * Non-VITE_ variables are for server-side use only.
 */

/**
 * Safely parse a boolean string from environment.
 * @param value - The string value ('true', 'false', or undefined)
 * @param fallback - Default value if parsing fails
 * @returns Parsed boolean or fallback
 */
export function parseBool(value: string | undefined, fallback = false): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

/**
 * Safely access VITE_ environment variables.
 * These are injected at build time and safe to expose in the bundle.
 */
export const ENV = {
  // Feature flags (can be toggled per environment)
  RULE_BASED_AI: parseBool(
    import.meta.env.VITE_FEATURE_RULE_BASED,
    true
  ),
  MARKOV_AI: parseBool(
    import.meta.env.VITE_FEATURE_MARKOV,
    false
  ),

  // App metadata
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) || 'ApexDAW',
  BUILD_CHANNEL: (import.meta.env.VITE_BUILD_CHANNEL as string) || 'dev',
  APP_VERSION: (import.meta.env.VITE_APP_VERSION as string) || '0.0.1',

  // Analytics and monitoring (if added later)
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN as string | undefined,

  // API endpoints (never use actual private keys here)
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string) || '',
};

/**
 * Helper to check if running in production environment.
 */
export function isProd(): boolean {
  return ENV.BUILD_CHANNEL === 'prod';
}

/**
 * Helper to check if running in staging environment.
 */
export function isStaging(): boolean {
  return ENV.BUILD_CHANNEL === 'staging';
}

/**
 * Helper to check if running in development environment.
 */
export function isDev(): boolean {
  return ENV.BUILD_CHANNEL === 'dev' || import.meta.env.DEV;
}
