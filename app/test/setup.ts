import '@testing-library/jest-dom/vitest';

// Mock Cloudflare environment
(global as any).Cloudflare = {
  env: {
    JWT_SECRET: 'test-secret',
    SESSION_DURATION: '86400000',
    DB: {} as any,
  },
} as any;