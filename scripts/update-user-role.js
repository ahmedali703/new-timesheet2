require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function updateUserRole() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Get all users to select from (you can specify an email instead)
    const users = await sql`SELECT id, email, name, role FROM users`;
    
    console.log('Current users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || user.email} (${user.role || 'no role'})`);
    });
    
    // Update the first user to admin role
    if (users.length > 0) {
      const userId = users[0].id;
      await sql`UPDATE users SET role = 'admin' WHERE id = ${userId}`;
      console.log(`\nUpdated user ${users[0].name || users[0].email} to admin role`);
      
      // Verify the update
      const updatedUser = await sql`SELECT id, email, name, role FROM users WHERE id = ${userId}`;
      console.log('Updated user details:', updatedUser[0]);
    } else {
      console.log('No users found in the database');
    }
  } catch (err) {
    console.error('Error updating user role:', err);
  }
}

updateUserRole();
