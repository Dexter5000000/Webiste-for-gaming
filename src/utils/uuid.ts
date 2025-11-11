/**
 * Generate a UUID v4 string
 * Falls back to alternative methods for browsers that don't support crypto.randomUUID()
 * (e.g., Chrome 80, Android WebView, older browsers)
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID() first (available in modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Falls through to fallback
    }
  }

  // Fallback: Use crypto.getRandomValues() with manual formatting
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    try {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);

      // Set version 4 (random) and variant bits
      arr[6] = (arr[6] & 0x0f) | 0x40;
      arr[8] = (arr[8] & 0x3f) | 0x80;

      // Format as UUID string
      const hexArray = Array.from(arr).map((b) => b.toString(16).padStart(2, '0'));
      return [
        hexArray.slice(0, 4).join(''),
        hexArray.slice(4, 6).join(''),
        hexArray.slice(6, 8).join(''),
        hexArray.slice(8, 10).join(''),
        hexArray.slice(10, 16).join(''),
      ].join('-');
    } catch {
      // Falls through to fallback
    }
  }

  // Last resort fallback: Math.random() (less secure but works everywhere)
  // Only use this if neither crypto method is available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
