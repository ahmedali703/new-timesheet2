import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and, SQL } from 'drizzle-orm';

// GET - Fetch user's time entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const weekId = url.searchParams.get('weekId');
    
    // Build query based on user role and filters
    let conditions: SQL<unknown>[] = [];
    
    // Regular users can only see their entries
    if (session.user.role !== 'admin' && session.user.role !== 'hr') {
      conditions.push(eq(tasks.userId, session.user.id));
    }
    
    // Filter by weekId if provided
    if (weekId) {
      conditions.push(eq(tasks.weekId, weekId));
    }
    
    // Construct the query with conditions if any
    const query = conditions.length > 0
      ? db.select().from(tasks).where(and(...conditions))
      : db.select().from(tasks);
    
    const timeEntries = await query;
    
    return NextResponse.json({ timeEntries });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new time entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { description, hours, date, weekId, jiraTaskId } = data;
    
    // Validate required fields
    if (!description || !hours || !date || !weekId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate hours
    if (isNaN(hours) || hours <= 0) {
      return NextResponse.json({ error: 'Invalid hours value' }, { status: 400 });
    }
    
    // Create time entry
    // Note: The tasks schema doesn't have a 'date' field directly
    // We'll need to store the date information in a different way
    // or adjust the schema if date tracking is required
    const newEntry = await db.insert(tasks).values({
      description,
      hours: hours.toString(), // Convert to string as required by the schema
      weekId,
      userId: session.user.id,
      status: 'pending',
      jiraTaskId: jiraTaskId || null,
      // Add jiraTaskKey if available
      jiraTaskKey: jiraTaskId ? `TASK-${jiraTaskId}` : null, // This should ideally come from the actual Jira integration
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return NextResponse.json({ timeEntry: newEntry[0] });
  } catch (error) {
    console.error('Error creating time entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
