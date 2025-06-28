import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, tasks, weeks, developerWorkSchedules } from '@/lib/db/schema';
import { eq, and, SQL, desc } from 'drizzle-orm';

// GET - Fetch current week status for a developer
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user with hourly rate
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current or most recent week
    const currentWeek = await db.query.weeks.findFirst({
      orderBy: [desc(weeks.startDate)],
    });

    if (!currentWeek) {
      return NextResponse.json({ error: 'No weeks found' }, { status: 404 });
    }

    // Get user's work schedule or use default values
    let daysPerWeek = 5; // Default
    let hoursPerDay = 8; // Default
    
    try {
      // Try to fetch work schedule
      const workSchedules = await db.select()
        .from(developerWorkSchedules)
        .where(eq(developerWorkSchedules.userId, session.user.id));
      
      if (workSchedules && workSchedules.length > 0) {
        const workSchedule = workSchedules[0];
        daysPerWeek = workSchedule.daysPerWeek || daysPerWeek;
        hoursPerDay = workSchedule.hoursPerDay || hoursPerDay;
      }
    } catch (error) {
      console.error('Error fetching work schedule:', error);
      // Continue with defaults
    }
    const totalHoursExpected = daysPerWeek * hoursPerDay;

    // Get hours worked this week
    const conditions: SQL<unknown>[] = [
      eq(tasks.userId, session.user.id),
      eq(tasks.weekId, currentWeek.id)
    ];
    
    const weekTasks = await db.select()
      .from(tasks)
      .where(and(...conditions));

    // Calculate total hours worked and earnings
    const hourlyRate = currentUser.hourlyRate ? parseFloat(String(currentUser.hourlyRate)) : 0;
    let totalHoursWorked = 0;
    let actualEarnings = 0;

    weekTasks.forEach(task => {
      const hours = parseFloat(String(task.hours));
      totalHoursWorked += hours;
      
      // Only count approved tasks in actual earnings
      if (task.status === 'approved') {
        actualEarnings += hours * hourlyRate;
      }
    });

    const expectedEarnings = totalHoursExpected * hourlyRate;
    const remainingHours = Math.max(0, totalHoursExpected - totalHoursWorked);

    return NextResponse.json({
      currentWeekId: currentWeek.id,
      startDate: currentWeek.startDate,
      endDate: currentWeek.endDate,
      isOpen: currentWeek.isOpen,
      totalHoursWorked,
      totalHoursExpected,
      hourlyRate,
      daysPerWeek,
      hoursPerDay,
      expectedEarnings,
      actualEarnings,
      remainingHours
    });
  } catch (error) {
    console.error('Error fetching week status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch week status' },
      { status: 500 }
    );
  }
}
