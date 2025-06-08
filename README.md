# MyReads - Personal Book Tracking App

A single-user book tracking application built with React Router 7, Cloudflare Workers, and D1 database. Track your reading journey, discover new books, and write reviews for your personal library.

## Features

- 📚 **Book Management**: Track books across three lists - Want to Read, Currently Reading, and Read
- 🔍 **Book Search**: Search millions of books using the Open Library API
- ⭐ **Ratings & Reviews**: Rate books and write detailed reviews
- 📊 **Reading Statistics**: View your reading progress and statistics on a personalized dashboard
- 🔐 **Password Protection**: Simple password-based access control
- 🌐 **Edge Deployment**: Deployed globally on Cloudflare Workers for low latency
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, React Router 7, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers (Edge Runtime)
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Simple password protection with bcrypt hashing
- **Book Data**: Open Library API
- **Testing**: Vitest (Unit), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Cloudflare account (free tier works)
- Wrangler CLI (installed automatically with dependencies)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/myreads.git
cd myreads
```

2. Install dependencies:
```bash
npm install
```

3. Create a D1 database:
```bash
npx wrangler d1 create myreads-db
```

4. Update `wrangler.json` with your database ID from the output above.

5. Run database migrations:
```bash
npx wrangler d1 execute myreads-db --file=./db/migrations/0002_single_user.sql --local
```

6. Generate TypeScript types:
```bash
npm run cf-typegen
```

### Development

Start the development server:
```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

**Default password**: "password" (you should change this in production by updating the `APP_PASSWORD` hash in `wrangler.json`)

### Testing

Run unit tests:
```bash
npm test
```

Run E2E tests:
```bash
npm run test:e2e
```

View test coverage:
```bash
npm run test:coverage
```

## Building and Deployment

### Production Build

Create a production build:
```bash
npm run build
```

### Deploy to Cloudflare Workers

1. First, run the database migration on your remote database:
```bash
npx wrangler d1 execute myreads-db --file=./db/migrations/0002_single_user.sql --remote
```

2. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

3. Set a secure password hash:
```bash
# Generate a new password hash using bcrypt (you can use an online tool or Node.js)
# Then update the APP_PASSWORD in wrangler.json with your new hash
```

## Environment Variables

The following environment variables are configured in `wrangler.json`:

- `APP_PASSWORD`: Bcrypt hash of the application password
- `SESSION_DURATION`: Session duration in milliseconds (default: 24 hours)

## Database Schema

The application uses the following main tables:

- `books`: Cached book information from Open Library
- `book_entries`: Book entries with status, ratings, and reviews
- `tags`: Book tags
- `book_tags`: Many-to-many relationship for book tags

## API Integration

MyReads uses the [Open Library API](https://openlibrary.org/developers/api) for book data. No API key is required, but please be respectful of their rate limits.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

---

Built with ❤️ using React Router and Cloudflare Workers.
