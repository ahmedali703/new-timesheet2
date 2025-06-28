import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentEvidence } from '@/lib/db/schema';
import { eq, and, SQL } from 'drizzle-orm';

// GET - Fetch all payment evidence records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authorized (admin or HR)
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const weekId = url.searchParams.get('weekId');
    
    // Build query based on filters
    let conditions: SQL<unknown>[] = [];
    
    if (userId) {
      conditions.push(eq(paymentEvidence.userId, userId));
    }
    
    if (weekId) {
      conditions.push(eq(paymentEvidence.weekId, weekId));
    }
    
    const query = conditions.length > 0
      ? db.select().from(paymentEvidence).where(and(...conditions))
      : db.select().from(paymentEvidence);
    
    // Fetch payment evidence records
    const records = await query;
    
    return NextResponse.json({ paymentEvidence: records });
  } catch (error) {
    console.error('Error fetching payment evidence records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new payment evidence record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authorized (admin or HR)
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const data = await request.json();
    const { userId, filename, fileUrl, weekId } = data;
    
    // Validate required fields
    if (!userId || !filename || !fileUrl || !weekId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create payment evidence record
    const record = await db.insert(paymentEvidence).values({
      userId,
      filename,
      fileUrl,
      weekId,
      uploadedBy: session.user.id,
      createdAt: new Date()
    }).returning();
    
    return NextResponse.json({ paymentEvidence: record[0] });
  } catch (error) {
    console.error('Error creating payment evidence record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
