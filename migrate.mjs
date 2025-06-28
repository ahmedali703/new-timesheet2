import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Ensure the required packages are installed
try {
  require('@neondatabase/serverless');
  require('dotenv');
} catch (error) {
  console.log('Installing required dependencies...');
  execSync('pnpm add -D @neondatabase/serverless dotenv', { stdio: 'inherit' });
}

console.log('Running NextAuth.js tables migration...');

try {
  execSync('node lib/db/migrations/add-nextauth-tables.js', { stdio: 'inherit' });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
