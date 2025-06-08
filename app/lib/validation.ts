import { z } from 'zod';

export const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const bookSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const addBookSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  status: z.enum(['want_to_read', 'reading', 'read']),
});

export const updateBookSchema = z.object({
  status: z.enum(['want_to_read', 'reading', 'read']).optional(),
  rating: z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return undefined;
      return Number(val);
    },
    z.number().int().min(1).max(5).optional()
  ),
  review: z.string().max(5000).optional(),
  startDate: z.string().optional(),
  finishDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type UnlockInput = z.infer<typeof unlockSchema>;
export type BookSearchInput = z.infer<typeof bookSearchSchema>;
export type AddBookInput = z.infer<typeof addBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;