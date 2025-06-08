import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleAuthService, isAuthenticated } from './auth-simple';
import type { AppLoadContext } from 'react-router';

// Mock bcrypt
vi.mock('~/lib/crypto', () => ({
  verifyPassword: vi.fn((password: string, hash: string) => {
    // Mock implementation - 'password' matches the hash
    return Promise.resolve(password === 'password' && hash === '$2a$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WrXJiYxw0DW0HJMgCZOy');
  }),
}));

// Mock environment
const mockContext: AppLoadContext = {
  cloudflare: {
    env: {
      APP_PASSWORD: '$2a$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WrXJiYxw0DW0HJMgCZOy', // hash for 'password'
      SESSION_DURATION: '86400000',
      DB: {} as any,
    },
    ctx: {} as any,
  },
} as AppLoadContext;

describe('SimpleAuthService', () => {
  let authService: SimpleAuthService;

  beforeEach(() => {
    authService = new SimpleAuthService(mockContext);
    vi.clearAllMocks();
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const isValid = await authService.verifyPassword('password');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await authService.verifyPassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('should return false if APP_PASSWORD not configured', async () => {
      const mockContextNoPassword = {
        cloudflare: {
          env: {
            SESSION_DURATION: '86400000',
            DB: {} as any,
          },
          ctx: {} as any,
        },
      } as AppLoadContext;
      
      const authServiceNoPassword = new SimpleAuthService(mockContextNoPassword);
      const isValid = await authServiceNoPassword.verifyPassword('password');
      expect(isValid).toBe(false);
    });
  });

  describe('createAuthCookie', () => {
    it('should create auth cookie with correct attributes', () => {
      const cookie = authService.createAuthCookie();
      
      expect(cookie).toContain('auth=true');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('Expires=');
    });
  });

  describe('destroyAuthCookie', () => {
    it('should create cookie that expires immediately', () => {
      const cookie = authService.destroyAuthCookie();
      
      expect(cookie).toBe('auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    });
  });
});

describe('isAuthenticated', () => {
  it('should return true if auth cookie exists', () => {
    // Mock the request with headers
    const request = {
      headers: {
        get: (name: string) => name === 'Cookie' ? 'auth=true; other=value' : null,
      },
    } as unknown as Request;
    
    expect(isAuthenticated(request)).toBe(true);
  });

  it('should return false if auth cookie does not exist', () => {
    const request = {
      headers: {
        get: (name: string) => name === 'Cookie' ? 'other=value' : null,
      },
    } as unknown as Request;
    
    expect(isAuthenticated(request)).toBe(false);
  });

  it('should return false if no cookies', () => {
    const request = {
      headers: {
        get: (name: string) => null,
      },
    } as unknown as Request;
    
    expect(isAuthenticated(request)).toBe(false);
  });
});