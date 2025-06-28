import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, weeks, paymentEvidence } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Helper for handling file uploads - in a real app, you would use a service like S3, Azure Blob Storage, etc.
// This is a simplified version that assumes files are stored in a public folder
async function saveFile(file: File): Promise<string> {
  // Generate a unique filename
  const fileName = `${Date.now()}-${file.name}`;
  
  // In a real app, this would save to cloud storage
  // For now, we'll just pretend and return a mock URL
  return `/uploads/${fileName}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const weekId = searchParams.get('weekId');

    if (!userId || !weekId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get payment evidence records
    const payments = await db
      .select({
        id: paymentEvidence.id,
        userId: paymentEvidence.userId,
        filename: paymentEvidence.filename,
        fileUrl: paymentEvidence.fileUrl,
        uploadedAt: paymentEvidence.createdAt,
        weekId: paymentEvidence.weekId,
        uploadedBy: {
          name: users.name,
          role: users.role
        }
      })
      .from(paymentEvidence)
      .innerJoin(users, eq(paymentEvidence.uploadedBy, users.id))
      .where(
        and(
          eq(paymentEvidence.userId, userId),
          eq(paymentEvidence.weekId, weekId)
        )
      )
      .orderBy(paymentEvidence.createdAt);

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payment evidence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const weekId = formData.get('weekId') as string;

    if (!file || !userId || !weekId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check if user and week exist
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const weekExists = await db
      .select({ id: weeks.id })
      .from(weeks)
      .where(eq(weeks.id, weekId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (weekExists.length === 0) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    // Save file and get URL
    const fileUrl = await saveFile(file);

    // Create payment evidence record
    const result = await db.insert(paymentEvidence).values({
      userId,
      weekId,
      filename: file.name,
      fileUrl,
      uploadedBy: session.user.id,
      createdAt: new Date()
    }).returning();

    return NextResponse.json({ 
      success: true,
      evidence: result[0]
    });
  } catch (error) {
    console.error('Error uploading payment evidence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
