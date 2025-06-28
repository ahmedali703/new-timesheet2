import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { developerWorkSchedules } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Get all developer schedules (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allSchedules = await db.select().from(developerWorkSchedules);

    return NextResponse.json({ schedules: allSchedules });
  } catch (error) {
    console.error('Error fetching developer schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch developer schedules' },
      { status: 500 }
    );
  }
}

// POST - Create or update a developer schedule (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.userId || !data.daysPerWeek || !data.hoursPerDay) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if schedule already exists for this user
    const existingSchedules = await db
      .select()
      .from(developerWorkSchedules)
      .where(eq(developerWorkSchedules.userId, data.userId));
    
    let schedule;
    
    if (existingSchedules.length > 0) {
      // Update existing schedule
      const existingSchedule = existingSchedules[0];
      
      await db
        .update(developerWorkSchedules)
        .set({
          daysPerWeek: data.daysPerWeek,
          hoursPerDay: data.hoursPerDay,
          expectedPayout: data.expectedPayout,
          updatedAt: new Date()
        })
        .where(eq(developerWorkSchedules.id, existingSchedule.id));
      
      // Get updated record
      const updatedSchedules = await db
        .select()
        .from(developerWorkSchedules)
        .where(eq(developerWorkSchedules.id, existingSchedule.id));
      
      schedule = updatedSchedules[0];
    } else {
      // Create new schedule
      const newSchedules = await db
        .insert(developerWorkSchedules)
        .values({
          userId: data.userId,
          daysPerWeek: data.daysPerWeek,
          hoursPerDay: data.hoursPerDay,
          expectedPayout: data.expectedPayout,
        })
        .returning();
      
      schedule = newSchedules[0];
    }

    return NextResponse.json({ 
      message: 'Developer schedule saved successfully',
      schedule 
    });
  } catch (error) {
    console.error('Error saving developer schedule:', error);
    return NextResponse.json(
      { error: 'Failed to save developer schedule' },
      { status: 500 }
    );
  }
}
