export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: number;
  expiresAt: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImageUrl?: string;
  pageCount?: number;
  publishedDate?: string;
  publisher?: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserBook {
  id: number;
  userId: number;
  bookId: string;
  status: 'want_to_read' | 'reading' | 'read';
  rating?: number;
  review?: string;
  startDate?: string;
  finishDate?: string;
  createdAt: string;
  updatedAt: string;
  book?: Book;
}

export interface Tag {
  id: number;
  name: string;
  createdAt: string;
}

export interface UserBookTag {
  userBookId: number;
  tagId: number;
  createdAt: string;
  tag?: Tag;
}