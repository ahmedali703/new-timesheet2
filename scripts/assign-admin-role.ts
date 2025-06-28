import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Required for Neon database configuration
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

// Connect to database using Neon and Drizzle
// Add type assertion to convert from NeonQueryFunction<false, false> to NeonQueryFunction<boolean, boolean>
// This is required for compatibility between Neon and Drizzle
const sql = neon(DATABASE_URL) as any;
const db = drizzle(sql);

async function assignAdminRole() {
  try {
    console.log('Checking for existing users...');
    
    // Get all users in the database, ordered by creation date
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    
    if (allUsers.length === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    // Get the first user (oldest created user)
    const firstUser = allUsers[0];
    
    console.log(`Found user: ${firstUser.name} (${firstUser.email})`);
    
    // Check if the user already has a role
    if (firstUser.role) {
      console.log(`User already has role: ${firstUser.role}`);
    } else {
      // Assign admin role to the first user
      await db.update(users)
        .set({ 
          role: 'admin',
          updatedAt: new Date() 
        })
        .where(eq(users.id, firstUser.id));
      
      console.log(`Successfully assigned 'admin' role to ${firstUser.email}`);
    }
  } catch (error) {
    console.error('Error assigning admin role:', error);
  }
}

// Run the script
assignAdminRole().then(() => {
  console.log('Script completed.');
});
