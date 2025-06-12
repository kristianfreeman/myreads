# MyReads - Personal Book Tracking App

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kristianfreeman/myreads)

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

## Quick Deploy

### Deploy with Cloudflare Deploy Button

1. Click the "Deploy to Cloudflare Workers" button above
2. Authorize Cloudflare to access your GitHub account
3. Choose a name for your repository and Worker
4. Click "Deploy" to create the Worker

⚠️ **Important**: After deployment, you must configure the password:

1. Go to your [Cloudflare Workers dashboard](https://dash.cloudflare.com)
2. Select your newly created Worker
3. Go to Settings → Variables and Secrets
4. Add a new secret:
   - Variable name: `APP_PASSWORD`
   - Value: A bcrypt hash of your desired password
   
   To generate a bcrypt hash:
   ```bash
   # Option 1: Use an online bcrypt generator
   # Option 2: Clone the repo and use the included script:
   git clone https://github.com/kristianfreeman/myreads
   cd myreads
   npm install
   node scripts/hash-password.js
   ```

5. Save and deploy your changes

Your MyReads instance will now be accessible at `https://your-worker-name.your-subdomain.workers.dev`

## Manual Setup

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
npm run db:migrations:apply:local
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

### Setting the Password

For local development, create a `.dev.vars` file:
```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Or create manually with test password
echo 'APP_PASSWORD=$2b$10$EbzfqltyN01YU8i05F/fo.in5ZyOXo3FHP6i4AvrakJqYJPqS6d/q' > .dev.vars
```

This sets the password to "password". For production, use a secure password (see deployment section).

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

1. Deploy to Cloudflare Workers (this will automatically run migrations):
```bash
npm run deploy
```

2. Set a secure password:
```bash
# Generate and set password in one command:
node scripts/hash-password.js | npx wrangler secret put APP_PASSWORD

# Or manually:
node scripts/hash-password.js
# Copy the hash, then:
npx wrangler secret put APP_PASSWORD
# Paste the hash when prompted
```

## Configuration

### Environment Variables

Configured in `wrangler.json`:
- `SESSION_DURATION`: Session duration in milliseconds (default: 24 hours)

### Secrets

Must be set via Cloudflare dashboard or wrangler CLI:
- `APP_PASSWORD`: Bcrypt hash of the application password (required)

**Never commit passwords or secrets to `wrangler.json`!**

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
