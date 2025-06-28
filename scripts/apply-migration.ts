// Script to apply migrations to the database
import fs from 'fs';
import path from 'path';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not defined');
  process.exit(1);
}

// Use type assertion to fix the compatibility issue between Neon and Drizzle
const sql = neon(process.env.DATABASE_URL) as unknown as NeonQueryFunction<boolean, boolean>;

async function applyMigrations() {
  try {
    console.log('🔄 Applying migrations to the database...');
    
    // Get the latest migration file from the drizzle folder
    const migrationDir = path.join(process.cwd(), 'drizzle');
    if (!fs.existsSync(migrationDir)) {
      console.error(`❌ Migration directory not found: ${migrationDir}`);
      console.log('💡 Run "npm run generate-migration" first to generate migrations.');
      process.exit(1);
    }

    // Find all SQL files in the migrations folder
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations are applied in order

    if (migrationFiles.length === 0) {
      console.error('❌ No migration files found');
      console.log('💡 Run "npm run generate-migration" first to generate migrations.');
      process.exit(1);
    }

    // Apply each migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📦 Applying migration: ${file}`);
      await sql(sqlContent);
      console.log(`✅ Migration applied successfully: ${file}`);
    }

    console.log('🎉 All migrations applied successfully!');
  } catch (error) {
    console.error('❌ Failed to apply migrations:', error);
    process.exit(1);
  }
}

// Run the migrations
applyMigrations();
