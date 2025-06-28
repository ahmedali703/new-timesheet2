import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateJiraCredentials, getSharedJiraCredentials } from '@/lib/jira-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's email to check if they exist in Jira
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found in session' }, { status: 400 });
    }

    // Use shared Jira credentials from environment variables
    // No need for users to provide their own tokens
    const { apiToken, jiraUrl } = getSharedJiraCredentials();
    if (!apiToken || !jiraUrl) {
      return NextResponse.json({ error: 'Jira credentials not configured in server environment' }, { status: 500 });
    }
    
    // Check if user exists in Jira using their email
    const userExistsInJira = await validateJiraCredentials(userEmail);
    
    if (!userExistsInJira) {
      return NextResponse.json({ 
        error: 'User not found in Jira', 
        details: 'Your email address was not found in the Jira instance. Please contact your administrator to be added to Jira.'
      }, { status: 404 });
    }

    // Mark the user as connected to Jira
    // Note: We don't store individual credentials anymore
    await db
      .update(users)
      .set({
        // Store a flag indicating the user is connected to Jira
        // We'll use the shared credentials for all API calls
        jiraConnected: true
      })
      .where(eq(users.id, session.user.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting to Jira:', error);
    return NextResponse.json({ 
      error: 'Failed to connect to Jira', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get shared credentials
    const { jiraUrl } = getSharedJiraCredentials();

    // Check if the user is connected to Jira
    const userWithJiraDetails = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { jiraConnected: true }
    });
    
    const hasJiraConnection = !!userWithJiraDetails?.jiraConnected;
    
    if (hasJiraConnection) {
      return NextResponse.json({
        connected: true,
        // We don't show individual tokens anymore since we use shared credentials
        url: jiraUrl
      });
    } else {
      // If the user has an email, let's check if they're in Jira
      if (session.user.email) {
        const userExistsInJira = await validateJiraCredentials(session.user.email);
        
        if (userExistsInJira) {
          // User exists in Jira but wasn't marked as connected in our system, update that
          await db
            .update(users)
            .set({ jiraConnected: true })
            .where(eq(users.id, session.user.id));
          
          return NextResponse.json({
            connected: true,
            url: jiraUrl
          });
        }
      }
      
      return NextResponse.json({ connected: false });
    }
  } catch (error) {
    console.error('Error checking Jira connection:', error);
    return NextResponse.json({ error: 'Failed to check Jira connection' }, { status: 500 });
  }
}
