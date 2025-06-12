import type { AppLoadContext } from 'react-router';

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

// Simple in-memory rate limiter using Cloudflare KV would be better for production
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  context: AppLoadContext,
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<RateLimitResult> {
  const now = Date.now();
  const record = attempts.get(key);

  // Clean up old entries
  if (record && record.resetAt < now) {
    attempts.delete(key);
  }

  const current = attempts.get(key) || { count: 0, resetAt: now + windowMs };
  
  if (current.count >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: current.resetAt,
    };
  }

  // Increment count
  current.count++;
  attempts.set(key, current);

  return {
    success: true,
    remaining: limit - current.count,
    reset: current.resetAt,
  };
}

export function getRateLimitKey(request: Request, suffix: string = ''): string {
  // Get client IP from Cloudflare headers
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             'unknown';
  
  return `${ip}:${suffix}`;
}