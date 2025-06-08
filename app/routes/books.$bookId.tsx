import { Form, Link, useLoaderData, useFetcher } from 'react-router';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { json, redirect } from 'react-router';
import { requireAuth } from '~/services/auth-simple';
import { BookService } from '~/services/books-simple';
import { updateBookSchema } from '~/lib/validation';
import type { Book, BookEntry } from '~/types';
import { useState } from 'react';

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  await requireAuth(context, request);
  const bookId = params.bookId!;
  
  const bookService = new BookService(context);
  const [book, bookEntry] = await Promise.all([
    bookService.getBookDetails(bookId),
    bookService.getBookEntry(bookId),
  ]);
  
  if (!book) {
    throw new Response('Book not found', { status: 404 });
  }
  
  return json({
    book,
    bookEntry,
  });
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  await requireAuth(context, request);
  const bookId = params.bookId!;
  const formData = await request.formData();
  const intent = formData.get('intent');
  
  const bookService = new BookService(context);
  
  if (intent === 'delete') {
    await bookService.removeBook(bookId);
    return redirect('/books');
  }
  
  if (intent === 'update') {
    const data = Object.fromEntries(formData);
    delete data.intent;
    
    // Convert tags string to array
    if (data.tags && typeof data.tags === 'string') {
      data.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    const validatedData = updateBookSchema.parse(data);
    await bookService.updateBookEntry(bookId, validatedData);
    
    return json({ success: true });
  }
  
  if (intent === 'add') {
    const status = formData.get('status') as 'want_to_read' | 'reading' | 'read';
    await bookService.addBook(bookId, status);
    return json({ success: true });
  }
  
  return json({ error: 'Invalid action' }, { status: 400 });
}

export default function BookDetail() {
  const { book, bookEntry } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [isEditing, setIsEditing] = useState(false);
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'want_to_read': return 'Want to Read';
      case 'reading': return 'Currently Reading';
      case 'read': return 'Read';
      default: return status;
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
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Books
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Form method="post" action="/lock">
                <button
                  type="submit"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
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
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                {book.coverImageUrl && (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                )}
              </div>
              
              <div className="md:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{book.author}</p>
                
                {book.publishedDate && (
                  <p className="text-gray-500 mb-2">Published: {book.publishedDate}</p>
                )}
                {book.publisher && (
                  <p className="text-gray-500 mb-2">Publisher: {book.publisher}</p>
                )}
                {book.pageCount && (
                  <p className="text-gray-500 mb-2">Pages: {book.pageCount}</p>
                )}
                
                {book.description && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p className="text-gray-700">{book.description}</p>
                  </div>
                )}
                
                {!bookEntry ? (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Add to your library</h3>
                    <fetcher.Form method="post" className="flex gap-2">
                      <input type="hidden" name="intent" value="add" />
                      <button
                        type="submit"
                        name="status"
                        value="want_to_read"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Want to Read
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="reading"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Currently Reading
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="read"
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        Already Read
                      </button>
                    </fetcher.Form>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="border-t pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold">Your Reading Info</h3>
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                      
                      {isEditing ? (
                        <fetcher.Form method="post" className="space-y-4">
                          <input type="hidden" name="intent" value="update" />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              name="status"
                              defaultValue={bookEntry.status}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="want_to_read">Want to Read</option>
                              <option value="reading">Currently Reading</option>
                              <option value="read">Read</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rating
                            </label>
                            <select
                              name="rating"
                              defaultValue={bookEntry.rating || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">No rating</option>
                              <option value="1">★</option>
                              <option value="2">★★</option>
                              <option value="3">★★★</option>
                              <option value="4">★★★★</option>
                              <option value="5">★★★★★</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Review
                            </label>
                            <textarea
                              name="review"
                              defaultValue={bookEntry.review || ''}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Write your review..."
                            />
                          </div>
                          
                          {bookEntry.status === 'reading' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                name="startDate"
                                defaultValue={bookEntry.startDate || ''}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          )}
                          
                          {bookEntry.status === 'read' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  name="startDate"
                                  defaultValue={bookEntry.startDate || ''}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Finish Date
                                </label>
                                <input
                                  type="date"
                                  name="finishDate"
                                  defaultValue={bookEntry.finishDate || ''}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                            </>
                          )}
                          
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </fetcher.Form>
                      ) : (
                        <div className="space-y-3">
                          <p>
                            <span className="font-medium">Status:</span>{' '}
                            {getStatusLabel(bookEntry.status)}
                          </p>
                          {bookEntry.rating && (
                            <p>
                              <span className="font-medium">Rating:</span>{' '}
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={
                                    i < bookEntry.rating!
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }
                                >
                                  ★
                                </span>
                              ))}
                            </p>
                          )}
                          {bookEntry.review && (
                            <div>
                              <p className="font-medium">Review:</p>
                              <p className="text-gray-700 mt-1">{bookEntry.review}</p>
                            </div>
                          )}
                          {bookEntry.startDate && (
                            <p>
                              <span className="font-medium">Started:</span>{' '}
                              {new Date(bookEntry.startDate).toLocaleDateString()}
                            </p>
                          )}
                          {bookEntry.finishDate && (
                            <p>
                              <span className="font-medium">Finished:</span>{' '}
                              {new Date(bookEntry.finishDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <fetcher.Form method="post" className="mt-6">
                        <input type="hidden" name="intent" value="delete" />
                        <button
                          type="submit"
                          className="text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            if (!confirm('Remove this book from your library?')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Remove from Library
                        </button>
                      </fetcher.Form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}