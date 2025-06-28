// @ts-check

// Using CommonJS syntax for wider compatibility
const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  console.log('Connecting to database...');
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in environment variables!');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Checking database structure...');
    const tables = await sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `;
    
    console.log(`Found ${tables.length} existing tables:`, tables.map(t => t.tablename).join(', '));
    
    // Check if we need to create the singular "user" table that NextAuth expects
    if (!tables.some(t => t.tablename === 'user')) {
      console.log('Creating user table for NextAuth compatibility...');
      
      // First create a temporary view of our "users" table as "user"
      await sql`
        CREATE OR REPLACE VIEW "user" AS 
        SELECT * FROM users;
      `;
      console.log('✅ Created user view that maps to users table');
    }
    
    console.log('Fixing completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
