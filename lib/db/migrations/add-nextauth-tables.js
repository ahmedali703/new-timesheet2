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
    
    // Check if we need to create role_enum
    if (!tables.some(t => t.tablename === 'role')) {
      console.log('Creating role_enum...');
      await sql`CREATE TYPE role AS ENUM ('admin', 'developer', 'hr');`;
      console.log('✅ role_enum created');
    }
    
    // Check if we need to create task_status_enum
    if (!tables.some(t => t.tablename === 'task_status')) {
      console.log('Creating task_status_enum...');
      await sql`CREATE TYPE task_status AS ENUM ('pending', 'approved', 'rejected');`;
      console.log('✅ task_status_enum created');
    }

    // Create users table if it doesn't exist
    if (!tables.some(t => t.tablename === 'users')) {
      console.log('Creating users table...');
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          image TEXT,
          role role NOT NULL DEFAULT 'developer',
          hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT '0',
          jira_token TEXT,
          jira_url TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `;
      console.log('✅ Users table created');
    }
    
    // Create account table
    if (!tables.some(t => t.tablename === 'account')) {
      console.log('Creating account table...');
      await sql`
        CREATE TABLE IF NOT EXISTS account (
          "userId" UUID NOT NULL,
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
          PRIMARY KEY (provider, "providerAccountId"),
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `;
      console.log('✅ Account table created');
    }
    
    // Create session table
    if (!tables.some(t => t.tablename === 'session')) {
      console.log('Creating session table...');
      await sql`
        CREATE TABLE IF NOT EXISTS session (
          "sessionToken" TEXT PRIMARY KEY,
          "userId" UUID NOT NULL,
          expires TIMESTAMP NOT NULL,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `;
      console.log('✅ Session table created');
    }
    
    // Create verification token table
    if (!tables.some(t => t.tablename === 'verificationToken')) {
      console.log('Creating verification token table...');
      await sql`
        CREATE TABLE IF NOT EXISTS "verificationToken" (
          identifier TEXT NOT NULL,
          token TEXT NOT NULL,
          expires TIMESTAMP NOT NULL,
          PRIMARY KEY (identifier, token)
        );
      `;
      console.log('✅ Verification token table created');
    }
    
    // Create weeks table if it doesn't exist
    if (!tables.some(t => t.tablename === 'weeks')) {
      console.log('Creating weeks table...');
      await sql`
        CREATE TABLE IF NOT EXISTS weeks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          is_open BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `;
      console.log('✅ Weeks table created');
    }
    
    // Create tasks table if it doesn't exist
    if (!tables.some(t => t.tablename === 'tasks')) {
      console.log('Creating tasks table...');
      await sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          week_id UUID NOT NULL REFERENCES weeks(id),
          jira_task_id TEXT,
          jira_task_key TEXT,
          description TEXT NOT NULL,
          hours DECIMAL(5, 2) NOT NULL,
          status task_status NOT NULL DEFAULT 'pending',
          admin_comment TEXT,
          approved_by UUID REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `;
      console.log('✅ Tasks table created');
    }
    
    // Create invoices table if it doesn't exist
    if (!tables.some(t => t.tablename === 'invoices')) {
      console.log('Creating invoices table...');
      await sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          week_id UUID REFERENCES weeks(id),
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          uploaded_by UUID NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `;
      console.log('✅ Invoices table created');
    }
    
    // Create payments table if it doesn't exist
    if (!tables.some(t => t.tablename === 'payments')) {
      console.log('Creating payments table...');
      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          week_id UUID NOT NULL REFERENCES weeks(id),
          total_hours DECIMAL(8, 2) NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          approved_by UUID NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `;
      console.log('✅ Payments table created');
    }
    
    console.log('Migration completed successfully!');
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
