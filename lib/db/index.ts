import { drizzle } from 'drizzle-orm/neon-http';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import * as schema from './schema';

// Use type assertion to fix the compatibility issue between Neon and Drizzle
const sql = neon(process.env.DATABASE_URL!) as unknown as NeonQueryFunction<boolean, boolean>;
export const db = drizzle(sql, { schema });