// Test setup for Vitest
import { vi } from 'vitest';

// Mock crypto.randomUUID for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => 'test-' + Math.random().toString(36).slice(2, 11),
  } as Crypto;
}

// Mock any browser-specific APIs if needed
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
