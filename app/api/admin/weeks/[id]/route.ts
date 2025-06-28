import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { weeks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isOpen } = await request.json();

    const updatedWeek = await db
      .update(weeks)
      .set({ isOpen })
      .where(eq(weeks.id, params.id))
      .returning();

    return NextResponse.json({ week: updatedWeek[0] });
  } catch (error) {
    console.error('Error updating week:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}