import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks, users, weeks } from '@/lib/db/schema';
import { and, desc, eq, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get current week
    const currentWeek = await db.select().from(weeks).where(eq(weeks.isOpen, true)).limit(1);
    if (currentWeek.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    // Build the where condition based on status
    const whereCondition = status && status !== 'all'
      ? and(
          eq(tasks.weekId, currentWeek[0].id),
          eq(tasks.status, status as any)
        )
      : eq(tasks.weekId, currentWeek[0].id);
    
    // Build and execute the complete query in one go
    const allTasks = await db
      .select({
        id: tasks.id,
        description: tasks.description,
        hours: tasks.hours,
        status: tasks.status,
        adminComment: tasks.adminComment,
        jiraTaskKey: tasks.jiraTaskKey,
        createdAt: tasks.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          hourlyRate: users.hourlyRate,
        },
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(tasks.createdAt));

    return NextResponse.json({ tasks: allTasks });
  } catch (error) {
    console.error('Error fetching tasks for review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}