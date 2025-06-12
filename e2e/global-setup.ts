import { execSync } from 'child_process';

async function globalSetup() {
  try {
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