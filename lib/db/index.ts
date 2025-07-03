import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Ensure DATABASE_URL is available
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the neon connection with the database URL
const sql = neon(databaseUrl);

// Create the drizzle instance
export const db = drizzle(sql, { schema });

export * from './schema';