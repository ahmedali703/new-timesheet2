// Script to generate migration for the database schema
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not defined');
  process.exit(1);
}

console.log('🔍 Generating migration for schema changes...');

try {
  // Run drizzle-kit generate command
  execSync('npx drizzle-kit generate:pg', { stdio: 'inherit' });
  console.log('✅ Migration generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate migration:', error);
  process.exit(1);
}
