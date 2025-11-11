/**
 * Browser localStorage utility for DAW settings and user preferences
 */

export const STORAGE_KEYS = {
  HF_TOKEN: 'zenith_daw_hf_token',
  THEME: 'zenith_daw_theme',
  LAST_PROJECT: 'zenith_daw_last_project',
} as const;

/**
 * Get HuggingFace token from localStorage
 * Priority: localStorage (user-entered) > env variable (developer)
 */
export function getHuggingFaceToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const localToken = localStorage.getItem(STORAGE_KEYS.HF_TOKEN);
  const envToken = import.meta.env?.VITE_HUGGINGFACE_TOKEN as string | undefined;
  
  const token = localToken || envToken || null;
  
  // Filter out placeholder values
  if (token === 'your_token_here' || token === 'your_huggingface_token_here') {
    return null;
  }
  
  return token;
}

/**
 * Save HuggingFace token to localStorage
 */
export function saveHuggingFaceToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.HF_TOKEN, token.trim());
}

/**
 * Remove HuggingFace token from localStorage
 */
export function clearHuggingFaceToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.HF_TOKEN);
}
