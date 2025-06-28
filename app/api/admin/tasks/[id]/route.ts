import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, adminComment } = await request.json();

    if (status === 'rejected' && !adminComment?.trim()) {
      return NextResponse.json({ error: 'Admin comment required for rejection' }, { status: 400 });
    }

    const updatedTask = await db
      .update(tasks)
      .set({
        status,
        adminComment: adminComment || null,
        approvedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, params.id))
      .returning();

    return NextResponse.json({ task: updatedTask[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}