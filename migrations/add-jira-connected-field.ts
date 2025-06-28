import { sql } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(process.cwd(), '.env') });

// Import db after environment variables are loaded
import { db } from '../lib/db';

// Add jira_connected column to users table if it doesn't exist
async function addJiraConnectedField() {
  console.log('Adding jira_connected column to users table...');
  try {
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'jira_connected'
    `);

    if (result.rows.length === 0) {
      // Add the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS jira_connected BOOLEAN DEFAULT false
      `);
      console.log('✅ Successfully added jira_connected column');
    } else {
      console.log('✅ jira_connected column already exists');
    }
  } catch (error) {
    console.error('Error adding jira_connected column:', error);
    throw error;
  }
}

// Run the migration
addJiraConnectedField()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
