import type { AppLoadContext } from 'react-router';
import { redirect } from 'react-router';
import { verifyPassword } from '~/lib/crypto';

export class SimpleAuthService {
  constructor(private context: AppLoadContext) {}

  private get sessionDuration() {
    return parseInt(this.context.cloudflare.env.SESSION_DURATION || '86400000'); // 24 hours default
  }

  async verifyPassword(password: string): Promise<boolean> {
    const hashedPassword = this.context.cloudflare.env.APP_PASSWORD;
    if (!hashedPassword) {
      console.error('APP_PASSWORD not configured');
      return false;
    }
    
    return verifyPassword(password, hashedPassword);
  }

  createAuthCookie(): string {
    const expires = new Date(Date.now() + this.sessionDuration);
    return `auth=true; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}; Secure`;
  }

  destroyAuthCookie(): string {
    return 'auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  }
}

export async function requireAuth(context: AppLoadContext, request: Request): Promise<void> {
  const cookieHeader = request.headers.get('Cookie');
  const isAuthenticated = cookieHeader?.includes('auth=true');

  if (!isAuthenticated) {
    throw redirect('/unlock');
  }
}

export function isAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get('Cookie');
  return cookieHeader?.includes('auth=true') || false;
}