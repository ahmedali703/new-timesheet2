// Script to apply migrations to the database
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not defined');
  process.exit(1);
}

// Fix for Node.js ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsPath = path.join(__dirname, '..', 'drizzle');

async function main() {
  console.log('🔍 Applying migrations...');
  console.log(`Using migrations folder: ${migrationsPath}`);
  
  try {
    // Needed for Neon serverless driver
    neonConfig.fetchConnectionCache = true;
    
    // We already checked that DATABASE_URL exists, but TypeScript needs reassurance
    const databaseUrl = process.env.DATABASE_URL as string;
    
    // Type assertion to fix compatibility between Neon and Drizzle
    const sql = neon(databaseUrl) as any;
    const db = drizzle(sql);
    
    // Run migrations
    await migrate(db, { migrationsFolder: migrationsPath });
    
    console.log('✅ Migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply migrations:', error);
    process.exit(1);
  }
}

main();
