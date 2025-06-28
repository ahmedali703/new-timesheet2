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
    console.log('Altering user table to add correct emailVerified column...');
    
    // Check if the column exists already
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user' AND column_name = 'emailverified';
    `;
    
    // If the column doesn't exist, add it
    if (columns.length === 0) {
      await sql`
        ALTER TABLE "user" 
        ADD COLUMN "emailVerified" TIMESTAMP;
      `;
      console.log('✅ Added emailVerified column to user table');
    } else {
      console.log('✅ emailVerified column already exists');
    }
    
    // Update the column if email_verified exists
    const oldColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user' AND column_name = 'email_verified';
    `;
    
    if (oldColumns.length > 0) {
      await sql`
        UPDATE "user"
        SET "emailVerified" = email_verified
        WHERE email_verified IS NOT NULL;
      `;
      console.log('✅ Copied data from email_verified to emailVerified');
    }
    
    console.log('NextAuth.js column fix completed successfully!');
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
