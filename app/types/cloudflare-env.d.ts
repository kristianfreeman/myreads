// Extend the auto-generated Cloudflare environment types with secrets
declare global {
  namespace Cloudflare {
    interface Env {
      // Secret set via wrangler secret put APP_PASSWORD
      APP_PASSWORD: string;
    }
  }
}

export {};