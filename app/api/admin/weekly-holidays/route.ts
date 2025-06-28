// app/api/admin/weekly-holidays/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { weeklyHolidaySettings } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the latest holiday settings
    const settings = await db
      .select()
      .from(weeklyHolidaySettings)
      .orderBy(desc(weeklyHolidaySettings.createdAt))
      .limit(1);

    if (settings.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({ 
        holidays: {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: true,
          saturday: true,
          sunday: false,
        }
      });
    }

    const { id, updatedBy, createdAt, updatedAt, ...holidays } = settings[0];
    return NextResponse.json({ holidays });
  } catch (error) {
    console.error('Error fetching weekly holidays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const holidays = await request.json();

    // Validate the holidays object
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const isValid = validDays.every(day => 
      day in holidays && typeof holidays[day] === 'boolean'
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid holidays data' }, { status: 400 });
    }

    // Insert new holiday settings
    const newSettings = await db.insert(weeklyHolidaySettings).values({
      ...holidays,
      updatedBy: session.user.id,
    }).returning();

    if (newSettings.length === 0) {
      throw new Error('Failed to save holiday settings');
    }

    const { id, updatedBy, createdAt, updatedAt, ...savedHolidays } = newSettings[0];
    return NextResponse.json({ 
      holidays: savedHolidays, 
      message: 'Weekly holidays updated successfully' 
    });
  } catch (error) {
    console.error('Error updating weekly holidays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}