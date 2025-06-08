import { describe, it, expect } from 'vitest';
import {
  unlockSchema,
  bookSearchSchema,
  addBookSchema,
  updateBookSchema,
} from './validation';

describe('validation schemas', () => {
  describe('unlockSchema', () => {
    it('should validate correct unlock data', () => {
      const validData = {
        password: 'password123',
      };
      
      const result = unlockSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalidData = {
        password: '',
      };
      
      const result = unlockSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['password']);
      }
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