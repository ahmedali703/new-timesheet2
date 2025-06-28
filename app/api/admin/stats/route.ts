import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks, weeks, users } from '@/lib/db/schema';
import { eq, and, count, sum } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current week
    const currentWeek = await db.select().from(weeks).where(eq(weeks.isOpen, true)).limit(1);
    
    // Count total developers
    const totalDevelopers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'developer'));

    let totalHours = 0;
    let totalCost = 0;
    let pendingTasks = 0;

    if (currentWeek.length > 0) {
      // Get tasks for current week with user data
      const weekTasks = await db
        .select({
          hours: tasks.hours,
          status: tasks.status,
          hourlyRate: users.hourlyRate,
        })
        .from(tasks)
        .innerJoin(users, eq(tasks.userId, users.id))
        .where(eq(tasks.weekId, currentWeek[0].id));

      totalHours = weekTasks.reduce((sum, task) => sum + Number(task.hours), 0);
      totalCost = weekTasks.reduce((sum, task) => sum + (Number(task.hours) * Number(task.hourlyRate)), 0);
      pendingTasks = weekTasks.filter(task => task.status === 'pending').length;
    }

    return NextResponse.json({
      totalDevelopers: totalDevelopers[0].count,
      totalHours,
      totalCost,
      pendingTasks,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}