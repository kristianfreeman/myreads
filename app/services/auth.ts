import type { AppLoadContext } from 'react-router';
import { hashPassword, verifyPassword, generateSessionId } from '~/lib/crypto';

// Define User and Session types locally since they're not in ~/types
interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export class AuthService {
  constructor(private context: AppLoadContext) {}

  private get db() {
    return this.context.cloudflare.env.DB;
  }

  private get sessionDuration() {
    return parseInt(this.context.cloudflare.env.SESSION_DURATION || '86400000'); // 24 hours default
  }

  async createUser(email: string, username: string, password: string): Promise<User> {
    const passwordHash = await hashPassword(password);
    
    try {
      const result = await this.db
        .prepare(
          'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
        )
        .bind(email, username, passwordHash)
        .run();

      if (!result.success) {
        throw new Error('Failed to create user');
      }

      const user = await this.db
        .prepare('SELECT id, email, username, created_at, updated_at FROM users WHERE id = ?')
        .bind(result.meta.last_row_id)
        .first<User>();

      if (!user) {
        throw new Error('Failed to retrieve created user');
      }

      return user;
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        if (error.message.includes('users.email')) {
          throw new Error('Email already exists');
        }
        if (error.message.includes('users.username')) {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  async verifyCredentials(username: string, password: string): Promise<User | null> {
    const userWithPassword = await this.db
      .prepare(
        'SELECT id, email, username, password_hash, created_at, updated_at FROM users WHERE username = ?'
      )
      .bind(username)
      .first<User & { password_hash: string }>();

    if (!userWithPassword) {
      return null;
    }

    const isValid = await verifyPassword(password, userWithPassword.password_hash);
    if (!isValid) {
      return null;
    }

    const { password_hash, ...user } = userWithPassword;
    return user;
  }

  async createSession(userId: number): Promise<Session> {
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + this.sessionDuration).toISOString();

    await this.db
      .prepare(
        'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
      )
      .bind(sessionId, userId, expiresAt)
      .run();

    const session = await this.db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(sessionId)
      .first<Session>();

    if (!session) {
      throw new Error('Failed to create session');
    }

    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.db
      .prepare(
        'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
      )
      .bind(sessionId)
      .first<Session>();

    return session;
  }

  async getUserFromSession(sessionId: string): Promise<User | null> {
    const user = await this.db
      .prepare(
        `SELECT u.id, u.email, u.username, u.created_at, u.updated_at 
         FROM users u
         JOIN sessions s ON u.id = s.user_id
         WHERE s.id = ? AND s.expires_at > datetime("now")`
      )
      .bind(sessionId)
      .first<User>();

    return user;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM sessions WHERE id = ?')
      .bind(sessionId)
      .run();
  }

  async cleanExpiredSessions(): Promise<void> {
    await this.db
      .prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")')
      .run();
  }
}

export async function requireAuth(context: AppLoadContext, request: Request): Promise<User> {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = cookieHeader?.match(/session=([^;]+)/)?.[1];

  if (!sessionId) {
    throw Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authService = new AuthService(context);
  const user = await authService.getUserFromSession(sessionId);

  if (!user) {
    throw Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return user;
}

export function createSessionCookie(sessionId: string, maxAge: number = 86400): string {
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Secure`;
}

export function destroySessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}