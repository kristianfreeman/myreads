import type { AppLoadContext } from 'react-router';
import type { Book, UserBook, Tag } from '~/types';

interface OpenLibrarySearchResult {
  docs: Array<{
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    cover_i?: number;
    isbn?: string[];
    number_of_pages_median?: number;
    publisher?: string[];
    language?: string[];
  }>;
  numFound: number;
  start: number;
}

interface OpenLibraryWork {
  title: string;
  authors?: Array<{ author: { key: string } }>;
  description?: string | { value: string };
  covers?: number[];
}

export class BookService {
  constructor(private context: AppLoadContext) {}

  private get db() {
    return this.context.cloudflare.env.DB;
  }

  async searchBooks(query: string, page: number = 1, limit: number = 20): Promise<{
    books: Book[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MyReads/1.0 (https://github.com/yourusername/myreads)'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to search books');
    }

    const data: OpenLibrarySearchResult = await response.json();
    
    const books: Book[] = data.docs.map(doc => ({
      id: doc.key.replace('/works/', ''),
      title: doc.title,
      author: doc.author_name?.join(', ') || 'Unknown Author',
      description: undefined,
      coverImageUrl: doc.cover_i 
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : undefined,
      pageCount: doc.number_of_pages_median,
      publishedDate: doc.first_publish_year?.toString(),
      publisher: doc.publisher?.[0],
      language: doc.language?.[0] || 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return {
      books,
      total: data.numFound,
      page,
      totalPages: Math.ceil(data.numFound / limit),
    };
  }

  async getBookDetails(bookId: string): Promise<Book | null> {
    // First check if we have it in our database
    const cachedBook = await this.db
      .prepare('SELECT * FROM books WHERE id = ?')
      .bind(bookId)
      .first<Book>();

    if (cachedBook) {
      return cachedBook;
    }

    // Fetch from Open Library
    const url = `https://openlibrary.org/works/${bookId}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MyReads/1.0 (https://github.com/yourusername/myreads)'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data: OpenLibraryWork = await response.json();
    
    const book: Book = {
      id: bookId,
      title: data.title,
      author: 'Unknown Author', // Will need to fetch author details separately
      description: typeof data.description === 'string' 
        ? data.description 
        : data.description?.value,
      coverImageUrl: data.covers?.[0] 
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`
        : undefined,
      pageCount: undefined,
      publishedDate: undefined,
      publisher: undefined,
      language: 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache in database
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO books 
         (id, title, author, description, cover_image_url, page_count, published_date, publisher, language) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        book.id,
        book.title,
        book.author,
        book.description || null,
        book.coverImageUrl || null,
        book.pageCount || null,
        book.publishedDate || null,
        book.publisher || null,
        book.language
      )
      .run();

    return book;
  }

  async getUserBooks(userId: number, status?: string): Promise<UserBook[]> {
    let query = `
      SELECT ub.*, b.*
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = ?
    `;
    
    const params: any[] = [userId];
    
    if (status) {
      query += ' AND ub.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ub.updated_at DESC';

    const results = await this.db
      .prepare(query)
      .bind(...params)
      .all();

    return results.results.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      bookId: row.book_id,
      status: row.status,
      rating: row.rating,
      review: row.review,
      startDate: row.start_date,
      finishDate: row.finish_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      book: {
        id: row.book_id,
        title: row.title,
        author: row.author,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        pageCount: row.page_count,
        publishedDate: row.published_date,
        publisher: row.publisher,
        language: row.language,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    }));
  }

  async addBookToUser(
    userId: number,
    bookId: string,
    status: 'want_to_read' | 'reading' | 'read'
  ): Promise<UserBook> {
    // Ensure book exists in our database
    const book = await this.getBookDetails(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    const result = await this.db
      .prepare(
        `INSERT INTO user_books (user_id, book_id, status) 
         VALUES (?, ?, ?)
         ON CONFLICT (user_id, book_id) 
         DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP`
      )
      .bind(userId, bookId, status)
      .run();

    const userBook = await this.db
      .prepare(
        `SELECT ub.*, b.*
         FROM user_books ub
         JOIN books b ON ub.book_id = b.id
         WHERE ub.user_id = ? AND ub.book_id = ?`
      )
      .bind(userId, bookId)
      .first<any>();

    return {
      id: userBook.id,
      userId: userBook.user_id,
      bookId: userBook.book_id,
      status: userBook.status,
      rating: userBook.rating,
      review: userBook.review,
      startDate: userBook.start_date,
      finishDate: userBook.finish_date,
      createdAt: userBook.created_at,
      updatedAt: userBook.updated_at,
      book: book,
    };
  }

  async updateUserBook(
    userId: number,
    bookId: string,
    updates: {
      status?: 'want_to_read' | 'reading' | 'read';
      rating?: number;
      review?: string;
      startDate?: string;
      finishDate?: string;
    }
  ): Promise<UserBook | null> {
    const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      values.push(updates.status);
    }
    if (updates.rating !== undefined) {
      setClauses.push('rating = ?');
      values.push(updates.rating);
    }
    if (updates.review !== undefined) {
      setClauses.push('review = ?');
      values.push(updates.review);
    }
    if (updates.startDate !== undefined) {
      setClauses.push('start_date = ?');
      values.push(updates.startDate);
    }
    if (updates.finishDate !== undefined) {
      setClauses.push('finish_date = ?');
      values.push(updates.finishDate);
    }

    values.push(userId, bookId);

    await this.db
      .prepare(
        `UPDATE user_books 
         SET ${setClauses.join(', ')}
         WHERE user_id = ? AND book_id = ?`
      )
      .bind(...values)
      .run();

    return this.getUserBook(userId, bookId);
  }

  async getUserBook(userId: number, bookId: string): Promise<UserBook | null> {
    const result = await this.db
      .prepare(
        `SELECT ub.*, b.*
         FROM user_books ub
         JOIN books b ON ub.book_id = b.id
         WHERE ub.user_id = ? AND ub.book_id = ?`
      )
      .bind(userId, bookId)
      .first<any>();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      userId: result.user_id,
      bookId: result.book_id,
      status: result.status,
      rating: result.rating,
      review: result.review,
      startDate: result.start_date,
      finishDate: result.finish_date,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      book: {
        id: result.book_id,
        title: result.title,
        author: result.author,
        description: result.description,
        coverImageUrl: result.cover_image_url,
        pageCount: result.page_count,
        publishedDate: result.published_date,
        publisher: result.publisher,
        language: result.language,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
    };
  }

  async removeBookFromUser(userId: number, bookId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM user_books WHERE user_id = ? AND book_id = ?')
      .bind(userId, bookId)
      .run();
  }
}