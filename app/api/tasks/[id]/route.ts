import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Handle GET request for a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    
    // Get the task
    const task = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, session.user.id)
        )
      )
      .limit(1);

    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: task[0] });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle PUT request to update a specific task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    const body = await request.json();
    
    // Validate input
    if (!body.description || !body.hours) {
      return NextResponse.json(
        { error: 'Description and hours are required' },
        { status: 400 }
      );
    }

    // Check if the task exists and belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only allow updates if task is in pending status
    if (existingTask[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending tasks can be updated' },
        { status: 403 }
      );
    }

    // Update the task
    await db
      .update(tasks)
      .set({
        description: body.description,
        hours: body.hours.toString(),
        jiraTaskId: body.jiraTaskId || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle DELETE request to delete a specific task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    
    // Check if the task exists and belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only allow deletion if task is in pending status
    if (existingTask[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending tasks can be deleted' },
        { status: 403 }
      );
    }

    // Delete the task
    await db
      .delete(tasks)
      .where(eq(tasks.id, taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
