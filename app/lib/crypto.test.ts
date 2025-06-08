import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateSessionId } from './crypto';

describe('crypto utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should reject with invalid hash', async () => {
      const password = 'testPassword123';
      const invalidHash = 'invalid-hash';
      
      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID', () => {
      const sessionId = generateSessionId();
      
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate unique session IDs', () => {
      const sessionIds = new Set();
      
      for (let i = 0; i < 100; i++) {
        sessionIds.add(generateSessionId());
      }
      
      expect(sessionIds.size).toBe(100);
    });
  });
});