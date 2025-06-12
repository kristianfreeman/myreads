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

export interface BookEntry {
  id: number;
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

export interface UserBook extends BookEntry {
  userId: number;
}

export interface Tag {
  id: number;
  name: string;
  createdAt: string;
}

export interface BookTag {
  bookEntryId: number;
  tagId: number;
  createdAt: string;
  tag?: Tag;
}