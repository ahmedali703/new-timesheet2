import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { developerWorkSchedules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Get a specific developer schedule by user ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    const schedules = await db
      .select()
      .from(developerWorkSchedules)
      .where(eq(developerWorkSchedules.userId, userId));

    // Return the schedule if found, or null if not
    const schedule = schedules.length > 0 ? schedules[0] : null;

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching developer schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch developer schedule' },
      { status: 500 }
    );
  }
}
