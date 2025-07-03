import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Ensure DATABASE_URL is available
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is not set');
}

// Log the database URL (without credentials) for debugging
console.log('Database URL configured:', databaseUrl.replace(/\/\/.*@/, '//***:***@'));

let sql: ReturnType<typeof neon>;
let db: ReturnType<typeof drizzle>;

try {
  // Create the neon connection with the database URL
  sql = neon(databaseUrl);
  
  // Create the drizzle instance
  db = drizzle(sql, { schema });
  
  console.log('Database connection initialized successfully');
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

export { db };
export * from './schema';