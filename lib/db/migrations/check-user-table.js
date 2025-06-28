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
    console.log('Checking user table structure...');
    
    // Check user table columns with exact case 
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user';
    `;
    
    console.log('Columns in "user" table:');
    columns.forEach(column => {
      console.log(`  * ${column.column_name} (${column.data_type})`);
    });
    
    // Check if we have the emailVerified column with exact case
    const hasEmailVerified = columns.some(column => column.column_name === 'emailVerified');
    
    if (!hasEmailVerified) {
      console.log('Adding emailVerified column with exact case...');
      
      // Try different approaches to handle case-sensitivity issues
      try {
        await sql`ALTER TABLE "user" ADD COLUMN "emailVerified" TIMESTAMP;`;
        console.log('✅ Added "emailVerified" column with proper case');
      } catch (e) {
        console.log('First approach failed:', e.message);
        
        try {
          // Try alternative approach with double quotes
          await sql`ALTER TABLE "user" ADD COLUMN emailverified TIMESTAMP;`;
          console.log('✅ Added emailverified column (lowercase)');
          
          // Now let's create a view to handle this
          await sql`
            CREATE OR REPLACE VIEW user_view AS
            SELECT 
              id, 
              name, 
              email, 
              emailverified AS "emailVerified",
              image
            FROM "user";
          `;
          console.log('✅ Created view with proper column case mapping');
        } catch (innerE) {
          console.log('Alternative approach also failed:', innerE.message);
        }
      }
    }
    
    console.log('User table check completed.');
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
