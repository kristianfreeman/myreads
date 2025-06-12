# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Router 7 + Cloudflare Workers application for a book reading tracker called "MyReads". The project uses:

- **React Router 7** with file-based routing and SSR
- **Cloudflare Workers** for edge deployment
- **TypeScript** throughout
- **Tailwind CSS** for styling
- **Vite** for build tooling

## Development Commands

### Core Development
- `npm run dev` - Start development server with HMR at localhost:5173
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Type Checking & Validation
- `npm run typecheck` - Run TypeScript type checking (includes typegen)
- `npm run cf-typegen` - Generate Cloudflare bindings types
- `npm run check` - Full validation: typecheck + build + deploy dry-run

### Deployment
- `npm run deploy` - Deploy to Cloudflare Workers
- `npx wrangler versions upload` - Deploy preview version
- `npx wrangler versions deploy` - Promote version to production

## Architecture

### Request Flow
1. Requests hit the Cloudflare Worker (`workers/app.ts`)
2. Worker creates React Router request handler with Cloudflare context
3. React Router handles SSR and routing via `app/root.tsx`
4. Routes defined in `app/routes.ts` using file-based routing

### Key Files
- `workers/app.ts` - Cloudflare Worker entry point, provides `env` and `ctx` to app
- `app/root.tsx` - Root layout component with error boundaries
- `app/routes.ts` - Route configuration
- `wrangler.json` - Cloudflare Workers configuration
- `react-router.config.ts` - React Router configuration with SSR enabled

### Cloudflare Integration
- App context includes `cloudflare.env` and `cloudflare.ctx` for accessing Workers runtime
- Environment variables defined in `wrangler.json` under `vars`
- TypeScript types for Cloudflare bindings generated via `cf-typegen`

### Styling
- Tailwind CSS 4.x configured via `@tailwindcss/vite` plugin
- Global styles in `app/app.css`
- Inter font loaded from Google Fonts

## Development Notes

### Type Generation
Always run `npm run cf-typegen` after modifying `wrangler.json` to update Cloudflare binding types.

### Environment Variables
- Development: Define in `wrangler.json` under `vars`
- Production: Use Cloudflare Workers secrets for sensitive data

### Secrets Management
The application uses a password for simple authentication. This password must be set as a Cloudflare Workers secret:

#### Production
Generate a bcrypt hash and set it as a secret in one command:
```bash
node scripts/hash-password.js | npx wrangler secret put APP_PASSWORD
```

Or manually:
1. Generate hash: `node scripts/hash-password.js`
2. Set secret: `npx wrangler secret put APP_PASSWORD`
3. Paste the bcrypt hash when prompted

#### Local Development
Create a `.dev.vars` file (ignored by git) with your local secrets:
```
APP_PASSWORD=$2b$10$YourBcryptHashHere
```

Never commit secrets to `wrangler.json`!

### Routing
- File-based routing in `app/routes/` directory
- Route configuration managed in `app/routes.ts`
- Type-safe route parameters via generated `+types` files

## Development Workflow

- Every time you make a change, it should have associated (passing) unit tests. After completing a task, run tests, confirm they pass, then make a git commit.

## Best Practices
- Any time you use something from an API, you should attempt to look up and make sure it works / the syntax is correct using web search