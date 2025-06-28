// Script to check all the table names in the database
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const runQuery = async () => {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Query to list all tables in the database
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('Tables in the database:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // For each table, query the columns
    for (const table of tables) {
      const tableName = table.table_name;
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      `;
      
      console.log(`\nColumns in '${tableName}' table:`);
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }

  } catch (error) {
    console.error('Error checking database structure:', error);
  }
};

runQuery();
