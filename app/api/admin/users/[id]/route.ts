import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// PUT - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authorized (admin only)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Only admins can modify user data.' }, { status: 401 });
    }
    
    const userId = params.id;
    const data = await request.json();
    const { role, hourlyRate } = data;

    // Validate input
    if (role && !['admin', 'developer', 'hr'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (hourlyRate !== undefined && (isNaN(hourlyRate) || hourlyRate < 0)) {
      return NextResponse.json({ error: 'Invalid hourly rate' }, { status: 400 });
    }

    // Update user
    const result = await db
      .update(users)
      .set({
        role: role,
        hourlyRate: hourlyRate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
