import { describe, it, expect } from 'vitest';
import {
  signUpSchema,
  signInSchema,
  bookSearchSchema,
  addBookSchema,
  updateBookSchema,
} from './validation';

describe('validation schemas', () => {
  describe('signUpSchema', () => {
    it('should validate correct sign up data', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      
      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
      };
      
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email']);
      }
    });

    it('should reject short username', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'ab',
        password: 'password123',
      };
      
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['username']);
      }
    });

    it('should reject username with special characters', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'test@user',
        password: 'password123',
      };
      
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['username']);
      }
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        password: '1234567',
      };
      
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['password']);
      }
    });
  });

  describe('signInSchema', () => {
    it('should validate correct sign in data', () => {
      const validData = {
        username: 'testuser',
        password: 'password123',
      };
      
      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty username', () => {
      const invalidData = {
        username: '',
        password: 'password123',
      };
      
      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        username: 'testuser',
        password: '',
      };
      
      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('bookSearchSchema', () => {
    it('should validate correct search data', () => {
      const validData = {
        query: 'Lord of the Rings',
        page: 1,
        limit: 20,
      };
      
      const result = bookSearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should provide defaults', () => {
      const validData = {
        query: 'Lord of the Rings',
      };
      
      const result = bookSearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject empty query', () => {
      const invalidData = {
        query: '',
      };
      
      const result = bookSearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should coerce string numbers', () => {
      const validData = {
        query: 'Lord of the Rings',
        page: '2',
        limit: '50',
      };
      
      const result = bookSearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });
  });

  describe('addBookSchema', () => {
    it('should validate correct add book data', () => {
      const validData = {
        bookId: 'OL123456W',
        status: 'reading',
      };
      
      const result = addBookSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        bookId: 'OL123456W',
        status: 'invalid_status',
      };
      
      const result = addBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty bookId', () => {
      const invalidData = {
        bookId: '',
        status: 'reading',
      };
      
      const result = addBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateBookSchema', () => {
    it('should validate complete update data', () => {
      const validData = {
        status: 'read',
        rating: 5,
        review: 'Great book!',
        startDate: '2024-01-01',
        finishDate: '2024-01-15',
        tags: ['fiction', 'fantasy'],
      };
      
      const result = updateBookSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate partial update data', () => {
      const validData = {
        rating: 4,
      };
      
      const result = updateBookSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid rating', () => {
      const invalidData = {
        rating: 6,
      };
      
      const result = updateBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too long review', () => {
      const invalidData = {
        review: 'a'.repeat(5001),
      };
      
      const result = updateBookSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});