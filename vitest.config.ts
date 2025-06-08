import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./app/test/setup.ts'],
    globals: true,
    exclude: ['node_modules', 'dist', '.git', 'e2e/**/*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'app/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'workers/',
        'e2e/',
      ],
    },
  },
  resolve: {
    alias: {
      '~': '/app',
    },
  },
});