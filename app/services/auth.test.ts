import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, createSessionCookie, destroySessionCookie } from './auth';
import type { AppLoadContext } from 'react-router';

// Mock D1 database
const mockDb = {
  prepare: vi.fn(),
};

const mockContext: AppLoadContext = {
  cloudflare: {
    env: {
      JWT_SECRET: 'test-secret',
      SESSION_DURATION: '86400000',
      DB: mockDb,
    },
    ctx: {} as any,
  },
} as AppLoadContext;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockContext);
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockRun = vi.fn().mockResolvedValue({
        success: true,
        meta: { last_row_id: 1 },
      });

      const mockFirst = vi.fn().mockResolvedValue(mockUser);

      mockDb.prepare
        .mockReturnValueOnce({ bind: vi.fn().mockReturnThis(), run: mockRun })
        .mockReturnValueOnce({ bind: vi.fn().mockReturnThis(), first: mockFirst });

      const result = await authService.createUser(
        'test@example.com',
        'testuser',
        'password123'
      );

      expect(result).toEqual(mockUser);
      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
    });

    it('should throw error for duplicate email', async () => {
      const mockRun = vi.fn().mockRejectedValue(
        new Error('UNIQUE constraint failed: users.email')
      );

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: mockRun,
      });

      await expect(
        authService.createUser('test@example.com', 'testuser', 'password123')
      ).rejects.toThrow('Email already exists');
    });

    it('should throw error for duplicate username', async () => {
      const mockRun = vi.fn().mockRejectedValue(
        new Error('UNIQUE constraint failed: users.username')
      );

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: mockRun,
      });

      await expect(
        authService.createUser('test@example.com', 'testuser', 'password123')
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('verifyCredentials', () => {
    it('should return user for valid credentials', async () => {
      const mockUserWithPassword = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password_hash: '$2a$10$validhash',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockFirst = vi.fn().mockResolvedValue(mockUserWithPassword);

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: mockFirst,
      });

      // Mock bcrypt compare to return true
      vi.mock('bcryptjs', () => ({
        default: {
          compare: vi.fn().mockResolvedValue(true),
          genSalt: vi.fn(),
          hash: vi.fn(),
        },
      }));

      const result = await authService.verifyCredentials('testuser', 'password123');

      expect(result).toBeTruthy();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: mockFirst,
      });

      const result = await authService.verifyCredentials('nonexistent', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 1,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockFirst = vi.fn().mockResolvedValue(mockSession);

      mockDb.prepare
        .mockReturnValueOnce({ bind: vi.fn().mockReturnThis(), run: mockRun })
        .mockReturnValueOnce({ bind: vi.fn().mockReturnThis(), first: mockFirst });

      const result = await authService.createSession(1);

      expect(result).toEqual(mockSession);
      expect(result.id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  describe('getSession', () => {
    it('should return valid session', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const mockFirst = vi.fn().mockResolvedValue(mockSession);

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: mockFirst,
      });

      const result = await authService.getSession('session-123');

      expect(result).toEqual(mockSession);
    });

    it('should return null for expired session', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: mockFirst,
      });

      const result = await authService.getSession('expired-session');

      expect(result).toBeNull();
    });
  });
});

describe('Cookie helpers', () => {
  describe('createSessionCookie', () => {
    it('should create session cookie with default max age', () => {
      const cookie = createSessionCookie('session-123');
      
      expect(cookie).toContain('session=session-123');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Max-Age=86400');
      expect(cookie).toContain('Secure');
    });

    it('should create session cookie with custom max age', () => {
      const cookie = createSessionCookie('session-123', 3600);
      
      expect(cookie).toContain('Max-Age=3600');
    });
  });

  describe('destroySessionCookie', () => {
    it('should create cookie that expires immediately', () => {
      const cookie = destroySessionCookie();
      
      expect(cookie).toContain('session=');
      expect(cookie).toContain('Max-Age=0');
    });
  });
});