import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';

setup('seed test database', async () => {
  // Seed the local test database with sample data
  try {
    execSync('npx wrangler d1 execute myreads-db --file=./db/seed-test-data.sql --local', {
      stdio: 'inherit'
    });
    console.log('Test database seeded successfully');
  } catch (error) {
    console.error('Failed to seed test database:', error);
  }
});