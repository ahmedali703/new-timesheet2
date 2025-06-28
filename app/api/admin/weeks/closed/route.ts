import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { weeks, tasks } from '@/lib/db/schema';
import { eq, and, not } from 'drizzle-orm';

// Get closed weeks with completed tasks for a specific developer
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get('developerId');
    
    if (!developerId) {
      return NextResponse.json({ error: 'Developer ID is required' }, { status: 400 });
    }
    
    // Find all closed weeks that have tasks for the specific developer
    const closedWeeks = await db.select({
      weekId: weeks.id,
      startDate: weeks.startDate,
      endDate: weeks.endDate,
      totalHours: tasks.hours,
      hasTasksCompleted: tasks.id
    })
    .from(weeks)
    .innerJoin(
      tasks,
      and(
        eq(tasks.weekId, weeks.id), 
        eq(tasks.userId, developerId),
        eq(tasks.status, 'approved')
      )
    )
    .where(eq(weeks.isOpen, false))
    .groupBy(weeks.id, tasks.id)
    .orderBy(weeks.endDate);
    
    // Format the data for the frontend
    const formattedWeeks = closedWeeks.reduce((acc: any[], current) => {
      // Check if week already exists in accumulator
      const existingWeekIndex = acc.findIndex(week => week.id === current.weekId);
      
      if (existingWeekIndex >= 0) {
        // If week exists, update total hours
        acc[existingWeekIndex].totalHours += parseFloat(current.totalHours.toString());
      } else {
        // Otherwise add new week
        acc.push({
          id: current.weekId,
          startDate: current.startDate,
          endDate: current.endDate,
          totalHours: parseFloat(current.totalHours.toString()),
          hasTasksCompleted: true
        });
      }
      
      return acc;
    }, []);
    
    return NextResponse.json({ weeks: formattedWeeks });
  } catch (error) {
    console.error('Error fetching closed weeks:', error);
    return NextResponse.json({ error: 'Failed to fetch closed weeks' }, { status: 500 });
  }
}
