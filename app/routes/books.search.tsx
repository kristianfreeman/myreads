import { Form, Link, useSearchParams, useLoaderData, useFetcher, redirect } from 'react-router';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { requireAuth } from '~/services/auth-simple';
import { BookService } from '~/services/books-simple';
import { bookSearchSchema, addBookSchema } from '~/lib/validation';
import type { Book } from '~/types';
import { BookCoverWithFallback } from '~/components/BookCover';

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAuth(context, request);
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  
  if (!query) {
    return { books: [], total: 0, page: 1, totalPages: 0, query: '' };
  }

  try {
    const bookService = new BookService(context);
    const searchResults = await bookService.searchBooks(query, page);
    
    return {
      ...searchResults,
      query,
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      books: [],
      total: 0,
      page: 1,
      totalPages: 0,
      query,
      error: 'Failed to search books',
    };
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAuth(context, request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  try {
    const validatedData = addBookSchema.parse(data);
    const bookService = new BookService(context);
    
    await bookService.addBook(
      validatedData.bookId,
      validatedData.status
    );
    
    // Redirect based on status
    if (validatedData.status === 'want_to_read') {
      return redirect('/dashboard');
    } else {
      // For 'reading' or 'read', go to book detail page
      return redirect(`/books/${validatedData.bookId}`);
    }
  } catch (error) {
    console.error('Add book error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to add book' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export default function BookSearch() {
  const { books, total, page, totalPages, query, error } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher();

  const handleAddBook = (bookId: string, status: 'want_to_read' | 'reading' | 'read') => {
    fetcher.submit(
      { bookId, status },
      { method: 'post' }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  MyReads
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/books/search"
                  className="border-indigo-500 text-gray-900 dark:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Search Books
                </Link>
                <Link
                  to="/books"
                  className="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Books
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Form method="post" action="/lock">
                <button
                  type="submit"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Lock
                </button>
              </Form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Search Books</h1>
          
          <Form method="get" className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                name="q"
                defaultValue={searchParams.get('q') || ''}
                placeholder="Search by title, author, or ISBN..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Search
              </button>
            </div>
          </Form>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}

          {query && books.length === 0 && !error && (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No books found for "{query}". Try a different search term.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <BookCoverWithFallback
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-32 h-48 object-cover mx-auto mb-4"
                  />
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{book.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{book.author}</p>
                  {book.publishedDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Published: {book.publishedDate}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddBook(book.id, 'want_to_read')}
                      disabled={fetcher.state !== 'idle'}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      Want to Read
                    </button>
                    <button
                      onClick={() => handleAddBook(book.id, 'reading')}
                      disabled={fetcher.state !== 'idle'}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      Reading
                    </button>
                    <button
                      onClick={() => handleAddBook(book.id, 'read')}
                      disabled={fetcher.state !== 'idle'}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
                    >
                      Read
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  to={`?q=${query}&page=${page - 1}`}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-gray-900 dark:text-gray-100">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  to={`?q=${query}&page=${page + 1}`}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}