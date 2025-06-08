import { Form, Link, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { json } from 'react-router';
import { requireAuth } from '~/services/auth';
import { BookService } from '~/services/books';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireAuth(context, request);
  const bookService = new BookService(context);
  const userBooks = await bookService.getUserBooks(user.id);
  
  const stats = {
    total: userBooks.length,
    reading: userBooks.filter(b => b.status === 'reading').length,
    read: userBooks.filter(b => b.status === 'read').length,
    wantToRead: userBooks.filter(b => b.status === 'want_to_read').length,
    averageRating: userBooks
      .filter(b => b.rating)
      .reduce((sum, b) => sum + (b.rating || 0), 0) / 
      (userBooks.filter(b => b.rating).length || 1),
    thisYear: userBooks.filter(b => 
      b.status === 'read' && 
      b.finishDate && 
      new Date(b.finishDate).getFullYear() === new Date().getFullYear()
    ).length,
  };
  
  const recentlyAdded = userBooks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
    
  const currentlyReading = userBooks
    .filter(b => b.status === 'reading')
    .slice(0, 4);
  
  return json({ user, stats, recentlyAdded, currentlyReading });
}

export default function Dashboard() {
  const { user, stats, recentlyAdded, currentlyReading } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">MyReads</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Books
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Hi, {user.username}!</span>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Reading Dashboard</h2>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Books</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.reading}</div>
              <div className="text-sm text-gray-600">Reading</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.read}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.wantToRead}</div>
              <div className="text-sm text-gray-600">Want to Read</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.averageRating.toFixed(1)}★
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-indigo-600">{stats.thisYear}</div>
              <div className="text-sm text-gray-600">This Year</div>
            </div>
          </div>

          {/* Currently Reading Section */}
          {currentlyReading.length > 0 && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Currently Reading</h3>
                <Link to="/books?status=reading" className="text-indigo-600 hover:text-indigo-700">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentlyReading.map((userBook) => (
                  <Link
                    key={userBook.id}
                    to={`/books/${userBook.bookId}`}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    {userBook.book?.coverImageUrl && (
                      <img
                        src={userBook.book.coverImageUrl}
                        alt={userBook.book.title}
                        className="w-24 h-36 object-cover mx-auto mb-3"
                      />
                    )}
                    <h4 className="font-medium text-gray-900 line-clamp-2">
                      {userBook.book?.title}
                    </h4>
                    <p className="text-sm text-gray-600">{userBook.book?.author}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recently Added Section */}
          {recentlyAdded.length > 0 && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Recently Added</h3>
                <Link to="/books" className="text-indigo-600 hover:text-indigo-700">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentlyAdded.map((userBook) => (
                  <Link
                    key={userBook.id}
                    to={`/books/${userBook.bookId}`}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    {userBook.book?.coverImageUrl && (
                      <img
                        src={userBook.book.coverImageUrl}
                        alt={userBook.book.title}
                        className="w-24 h-36 object-cover mx-auto mb-3"
                      />
                    )}
                    <h4 className="font-medium text-gray-900 line-clamp-2">
                      {userBook.book?.title}
                    </h4>
                    <p className="text-sm text-gray-600">{userBook.book?.author}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                      userBook.status === 'reading' 
                        ? 'bg-green-100 text-green-800'
                        : userBook.status === 'read'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userBook.status === 'want_to_read' 
                        ? 'Want to Read' 
                        : userBook.status === 'reading'
                        ? 'Reading'
                        : 'Read'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/books/search"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Discover Books</h3>
              <p className="text-gray-600">Search for new books to read</p>
            </Link>
            <Link
              to="/books"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">My Library</h3>
              <p className="text-gray-600">Manage your book collection</p>
            </Link>
            <Link
              to="/books?status=want_to_read"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">Reading List</h3>
              <p className="text-gray-600">Books you want to read next</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}