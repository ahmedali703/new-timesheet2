import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks, weeks, users } from '@/lib/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Get pagination parameters from query
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '5');
  
  // Calculate offset
  const offset = (page - 1) * pageSize;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current week
    const currentWeek = await db.select().from(weeks).where(eq(weeks.isOpen, true)).limit(1);
    if (currentWeek.length === 0) {
      return NextResponse.json({ 
        tasks: [], 
        summary: { totalHours: 0, approvedHours: 0, totalPayout: 0, approvedPayout: 0 }
      });
    }

    // Count total tasks for pagination
    const totalResult = await db
      .select({ value: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.weekId, currentWeek[0].id)
        )
      );
    const total = totalResult[0].value;
    
    // Get paginated user's tasks for current week
    const userTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.weekId, currentWeek[0].id)
        )
      )
      .orderBy(desc(tasks.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Get user's hourly rate
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    const hourlyRate = Number(user[0]?.hourlyRate || 0);

    // Calculate summary
    const totalHours = userTasks.reduce((sum, task) => sum + Number(task.hours), 0);
    const approvedHours = userTasks
      .filter(task => task.status === 'approved')
      .reduce((sum, task) => sum + Number(task.hours), 0);
    
    const totalPayout = totalHours * hourlyRate;
    const approvedPayout = approvedHours * hourlyRate;

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;
    
    return NextResponse.json({
      tasks: userTasks,
      summary: {
        totalHours,
        approvedHours,
        totalPayout,
        approvedPayout,
      },
      pagination: {
        currentPage: page,
        pageSize,
        total,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, hours, jiraTaskId } = await request.json();

    if (!description || !hours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current open week
    const currentWeek = await db.select().from(weeks).where(eq(weeks.isOpen, true)).limit(1);
    if (currentWeek.length === 0) {
      return NextResponse.json({ error: 'No open week available' }, { status: 400 });
    }

    // Create task
    const newTask = await db.insert(tasks).values({
      userId: session.user.id,
      weekId: currentWeek[0].id,
      description,
      hours: hours.toString(),
      jiraTaskId: jiraTaskId || null,
      jiraTaskKey: jiraTaskId ? `TASK-${jiraTaskId.slice(-4)}` : null, // Mock Jira key
    }).returning();

    return NextResponse.json({ task: newTask[0] });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}