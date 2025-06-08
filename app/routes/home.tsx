import { Link } from 'react-router';
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MyReads - Track Your Reading Journey" },
    { name: "description", content: "Track books you've read, want to read, and are currently reading" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to MyReads
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your personal library to track books you've read, want to read, and are currently reading.
            Discover new books, write reviews, and organize your reading journey.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Get Started
            </Link>
            <Link
              to="/auth/signin"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pb-20">
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">Organize Your Library</h3>
            <p className="text-gray-600">
              Keep track of books across three lists: Want to Read, Currently Reading, and Read
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold mb-2">Rate & Review</h3>
            <p className="text-gray-600">
              Share your thoughts with ratings, reviews, and personal tags
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Discover Books</h3>
            <p className="text-gray-600">
              Search millions of books and add them to your reading lists instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
