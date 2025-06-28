import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, roleEnum } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Fetch users with optional role filter
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or HR privileges
    if (session.user.role !== 'admin' && session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    let query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      hourlyRate: users.hourlyRate,
      image: users.image,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users);
    
    // Create a base query
    let result;
    
    // Filter by role if provided
    if (role && ['admin', 'developer', 'hr'].includes(role)) {
      // Use properly typed role values from the enum
      const typedRole = role as (typeof roleEnum.enumValues)[number];
      result = await query.where(eq(users.role, typedRole));
    } else {
      result = await query;
    }
    
    return NextResponse.json({ users: result });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
