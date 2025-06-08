import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

export const signInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
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
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().max(5000).optional(),
  startDate: z.string().optional(),
  finishDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type BookSearchInput = z.infer<typeof bookSearchSchema>;
export type AddBookInput = z.infer<typeof addBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;