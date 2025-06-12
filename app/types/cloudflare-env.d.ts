// Extend the auto-generated Cloudflare environment types with secrets
declare global {
  namespace Cloudflare {
    interface Env {
      // Secret set via wrangler secret put APP_PASSWORD
      APP_PASSWORD: string;
      // Secret set via wrangler secret put GOOGLE_BOOKS_API_KEY
      GOOGLE_BOOKS_API_KEY?: string;
    }
  }
}

export {};