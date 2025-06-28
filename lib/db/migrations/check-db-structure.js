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
    
    // List all tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `;
    
    console.log('Tables in database:');
    for (const table of tables) {
      console.log(`- ${table.tablename}`);
      
      // List columns for each table
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table.tablename};
      `;
      
      columns.forEach(column => {
        console.log(`  * ${column.column_name} (${column.data_type})`);
      });
      
      console.log(''); // Empty line for readability
    }
    
    console.log('Database structure check completed.');
  } catch (error) {
    console.error('Check failed:', error);
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
