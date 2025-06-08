import { Form, Link, useSearchParams, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { json } from 'react-router';
import { requireAuth } from '~/services/auth';
import { BookService } from '~/services/books';
import type { UserBook } from '~/types';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireAuth(context, request);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || undefined;
  
  const bookService = new BookService(context);
  const userBooks = await bookService.getUserBooks(user.id, status);
  
  const stats = {
    total: userBooks.length,
    reading: userBooks.filter(b => b.status === 'reading').length,
    read: userBooks.filter(b => b.status === 'read').length,
    wantToRead: userBooks.filter(b => b.status === 'want_to_read').length,
  };
  
  return json({
    user,
    userBooks,
    stats,
    currentStatus: status,
  });
}

export default function MyBooks() {
  const { userBooks, stats, currentStatus } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'want_to_read': return 'Want to Read';
      case 'reading': return 'Currently Reading';
      case 'read': return 'Read';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'want_to_read': return 'bg-blue-100 text-blue-800';
      case 'reading': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="text-xl font-bold text-gray-900">
                  MyReads
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/books/search"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Search Books
                </Link>
                <Link
                  to="/books"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Books
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Form method="post" action="/auth/signout">
                <button
                  type="submit"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign out
                </button>
              </Form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Books</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Link
              to="/books"
              className={`p-4 rounded-lg text-center ${
                !currentStatus ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm">All Books</div>
            </Link>
            <Link
              to="/books?status=reading"
              className={`p-4 rounded-lg text-center ${
                currentStatus === 'reading' ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl font-bold">{stats.reading}</div>
              <div className="text-sm">Currently Reading</div>
            </Link>
            <Link
              to="/books?status=want_to_read"
              className={`p-4 rounded-lg text-center ${
                currentStatus === 'want_to_read' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl font-bold">{stats.wantToRead}</div>
              <div className="text-sm">Want to Read</div>
            </Link>
            <Link
              to="/books?status=read"
              className={`p-4 rounded-lg text-center ${
                currentStatus === 'read' ? 'bg-purple-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl font-bold">{stats.read}</div>
              <div className="text-sm">Read</div>
            </Link>
          </div>

          {userBooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {currentStatus
                  ? `No books in your "${getStatusLabel(currentStatus)}" list yet.`
                  : "You haven't added any books yet."}
              </p>
              <Link
                to="/books/search"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Search for Books
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBooks.map((userBook) => (
                <Link
                  key={userBook.id}
                  to={`/books/${userBook.bookId}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    {userBook.book?.coverImageUrl && (
                      <img
                        src={userBook.book.coverImageUrl}
                        alt={userBook.book.title}
                        className="w-32 h-48 object-cover mx-auto mb-4"
                      />
                    )}
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {userBook.book?.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{userBook.book?.author}</p>
                    <div className="flex justify-between items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          userBook.status
                        )}`}
                      >
                        {getStatusLabel(userBook.status)}
                      </span>
                      {userBook.rating && (
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < userBook.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}