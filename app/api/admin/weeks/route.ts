import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { weeks, tasks } from '@/lib/db/schema';
import { eq, count, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all weeks with task counts
    const allWeeks = await db
      .select({
        id: weeks.id,
        startDate: weeks.startDate,
        endDate: weeks.endDate,
        isOpen: weeks.isOpen,
        taskCount: count(tasks.id),
      })
      .from(weeks)
      .leftJoin(tasks, eq(weeks.id, tasks.weekId))
      .groupBy(weeks.id, weeks.startDate, weeks.endDate, weeks.isOpen)
      .orderBy(desc(weeks.startDate));

    return NextResponse.json({ weeks: allWeeks });
  } catch (error) {
    console.error('Error fetching weeks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newWeek = await db.insert(weeks).values({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isOpen: true,
    }).returning();

    return NextResponse.json({ week: newWeek[0] });
  } catch (error) {
    console.error('Error creating week:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}