import { execSync } from 'child_process';
import { existsSync } from 'fs';

async function globalSetup() {
  try {
    // Check if we're in CI and database might already be set up
    const isCI = process.env.CI === 'true';
    const dbPath = '.wrangler/state/v3/d1';
    
    if (isCI && existsSync(dbPath)) {
      console.log('Database already exists in CI, skipping setup...');
      return;
    }
    
    // Apply migrations to create the database schema
    console.log('Applying database migrations...');
    execSync('npx wrangler d1 migrations apply myreads-db --local', {
      stdio: 'inherit'
    });
    
    // Seed the local test database with sample data
    console.log('Seeding test database...');
    execSync('npx wrangler d1 execute myreads-db --file=./db/seed-test-data.sql --local', {
      stdio: 'inherit'
    });
    
    console.log('Test database initialized and seeded successfully');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
}

export default globalSetup;