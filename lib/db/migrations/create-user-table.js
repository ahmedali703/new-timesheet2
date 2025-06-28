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
    // Check if user table exists
    const tables = await sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' AND tablename = 'user';
    `;
    
    if (tables.length === 0) {
      // Create the user table with exact column names NextAuth.js expects
      console.log('Creating "user" table for NextAuth.js...');
      
      try {
        // Try to use double quotes to deal with "user" being a reserved keyword
        await sql`
          CREATE TABLE IF NOT EXISTS "user" (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT,
            email TEXT UNIQUE,
            "emailVerified" TIMESTAMP,
            image TEXT
          );
        `;
        console.log('✅ "user" table created successfully');
      } catch (innerError) {
        console.error('Error creating "user" table:', innerError.message);
        console.log('Trying alternative approach...');
        
        // Try alternative syntax
        await sql`
          CREATE TABLE IF NOT EXISTS "user" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "name" TEXT,
            "email" TEXT UNIQUE,
            "emailVerified" TIMESTAMP,
            "image" TEXT
          );
        `;
        console.log('✅ "user" table created with alternative syntax');
      }
      
      // Copy data from users table to user table
      console.log('Copying data from users to user table...');
      await sql`
        INSERT INTO "user" (id, name, email, image)
        SELECT id, name, email, image FROM users
        ON CONFLICT (email) DO NOTHING;
      `;
      console.log('✅ Data copied from users to user table');
    } else {
      console.log('✅ "user" table already exists');
      
      // Check if emailVerified column exists
      const columns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'emailVerified';
      `;
      
      // Add emailVerified column if it doesn't exist
      if (columns.length === 0) {
        console.log('Adding emailVerified column to user table...');
        await sql`
          ALTER TABLE "user" 
          ADD COLUMN "emailVerified" TIMESTAMP;
        `;
        console.log('✅ Added emailVerified column to user table');
      }
    }
    
    console.log('NextAuth.js user table setup completed successfully!');
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
