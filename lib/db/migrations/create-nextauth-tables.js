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
    // Check if tables exist
    console.log('Checking database structure...');
    const tables = await sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `;
    
    console.log(`Found ${tables.length} existing tables:`, tables.map(t => t.tablename).join(', '));
    
    // Create NextAuth.js tables with EXACT naming that it expects
    
    // Create "user" table (singular) if it doesn't exist
    if (!tables.some(t => t.tablename === 'user')) {
      console.log('Creating "user" table (singular) for NextAuth.js...');
      await sql`
        CREATE TABLE IF NOT EXISTS "user" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT,
          email TEXT UNIQUE,
          email_verified TIMESTAMP,
          image TEXT
        );
      `;
      
      // If 'users' exists, copy data from 'users' to 'user'
      if (tables.some(t => t.tablename === 'users')) {
        console.log('Copying existing users data to the new "user" table...');
        await sql`
          INSERT INTO "user" (id, name, email, image)
          SELECT id, name, email, image FROM users
          ON CONFLICT (email) DO NOTHING;
        `;
      }
      
      console.log('✅ "user" table created');
    }
    
    // Create other NextAuth tables with exact naming conventions it expects
    
    if (!tables.some(t => t.tablename === 'account')) {
      console.log('Creating account table...');
      await sql`
        CREATE TABLE IF NOT EXISTS account (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          provider TEXT NOT NULL,
          "providerAccountId" TEXT NOT NULL,
          refresh_token TEXT,
          access_token TEXT,
          expires_at INTEGER,
          token_type TEXT,
          scope TEXT,
          id_token TEXT,
          session_state TEXT,
          UNIQUE(provider, "providerAccountId")
        );
      `;
      console.log('✅ Account table created');
    }
    
    if (!tables.some(t => t.tablename === 'session')) {
      console.log('Creating session table...');
      await sql`
        CREATE TABLE IF NOT EXISTS session (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "sessionToken" TEXT UNIQUE NOT NULL,
          "userId" UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          expires TIMESTAMP NOT NULL
        );
      `;
      console.log('✅ Session table created');
    }
    
    if (!tables.some(t => t.tablename === 'verificationtoken')) {
      console.log('Creating verification token table with correct case...');
      await sql`
        CREATE TABLE IF NOT EXISTS verificationtoken (
          identifier TEXT NOT NULL,
          token TEXT NOT NULL,
          expires TIMESTAMP NOT NULL,
          PRIMARY KEY (identifier, token)
        );
      `;
      console.log('✅ Verification token table created');
    }
    
    console.log('NextAuth.js tables created successfully!');
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
