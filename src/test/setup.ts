// Test setup for Vitest
import { vi } from 'vitest';

// Mock crypto.randomUUID for Node.js environment
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => 'test-' + Math.random().toString(36).substr(2, 9),
  } as any;
}

// Mock any browser-specific APIs if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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