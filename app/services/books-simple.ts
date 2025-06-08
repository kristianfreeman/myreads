import type { AppLoadContext } from 'react-router';
import type { Book, BookEntry, Tag } from '~/types';

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
      .first<any>();

    if (cachedBook) {
      return {
        id: cachedBook.id,
        title: cachedBook.title,
        author: cachedBook.author,
        description: cachedBook.description,
        coverImageUrl: cachedBook.cover_image_url,
        pageCount: cachedBook.page_count,
        publishedDate: cachedBook.published_date,
        publisher: cachedBook.publisher,
        language: cachedBook.language,
        createdAt: cachedBook.created_at,
        updatedAt: cachedBook.updated_at,
      };
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
    
    // Fetch author names
    let authorName = 'Unknown Author';
    if (data.authors && data.authors.length > 0) {
      const authorPromises = data.authors.map(async (authorRef) => {
        const authorKey = authorRef.author.key.replace('/authors/', '');
        const authorResponse = await fetch(`https://openlibrary.org/authors/${authorKey}.json`, {
          headers: {
            'User-Agent': 'MyReads/1.0 (https://github.com/yourusername/myreads)'
          }
        });
        
        if (authorResponse.ok) {
          const authorData: any = await authorResponse.json();
          return authorData.name || 'Unknown Author';
        }
        return null;
      });
      
      const authorNames = await Promise.all(authorPromises);
      const validAuthors = authorNames.filter((name): name is string => name !== null);
      if (validAuthors.length > 0) {
        authorName = validAuthors.join(', ');
      }
    }
    
    const book: Book = {
      id: bookId,
      title: data.title,
      author: authorName,
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

  async getBookEntries(status?: string): Promise<BookEntry[]> {
    let query = `
      SELECT be.*, b.*
      FROM book_entries be
      JOIN books b ON be.book_id = b.id
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE be.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY be.updated_at DESC';

    const results = await this.db
      .prepare(query)
      .bind(...params)
      .all();

    return results.results.map((row: any) => ({
      id: row.id,
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

  async addBook(
    bookId: string,
    status: 'want_to_read' | 'reading' | 'read'
  ): Promise<BookEntry> {
    // Ensure book exists in our database
    const book = await this.getBookDetails(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    const result = await this.db
      .prepare(
        `INSERT INTO book_entries (book_id, status) 
         VALUES (?, ?)
         ON CONFLICT (book_id) 
         DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP`
      )
      .bind(bookId, status)
      .run();

    const bookEntry = await this.db
      .prepare(
        `SELECT be.*, b.*
         FROM book_entries be
         JOIN books b ON be.book_id = b.id
         WHERE be.book_id = ?`
      )
      .bind(bookId)
      .first<any>();

    return {
      id: bookEntry.id,
      bookId: bookEntry.book_id,
      status: bookEntry.status,
      rating: bookEntry.rating,
      review: bookEntry.review,
      startDate: bookEntry.start_date,
      finishDate: bookEntry.finish_date,
      createdAt: bookEntry.created_at,
      updatedAt: bookEntry.updated_at,
      book: book,
    };
  }

  async updateBookEntry(
    bookId: string,
    updates: {
      status?: 'want_to_read' | 'reading' | 'read';
      rating?: number;
      review?: string;
      startDate?: string;
      finishDate?: string;
    }
  ): Promise<BookEntry | null> {
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

    values.push(bookId);

    await this.db
      .prepare(
        `UPDATE book_entries 
         SET ${setClauses.join(', ')}
         WHERE book_id = ?`
      )
      .bind(...values)
      .run();

    return this.getBookEntry(bookId);
  }

  async getBookEntry(bookId: string): Promise<BookEntry | null> {
    const result = await this.db
      .prepare(
        `SELECT be.*, b.*
         FROM book_entries be
         JOIN books b ON be.book_id = b.id
         WHERE be.book_id = ?`
      )
      .bind(bookId)
      .first<any>();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
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

  async removeBook(bookId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM book_entries WHERE book_id = ?')
      .bind(bookId)
      .run();
  }
}