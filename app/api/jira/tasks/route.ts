import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchJiraTasks, getSharedJiraCredentials } from '@/lib/jira-client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Jira connection status from the database
    const userWithJiraDetails = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        email: true,
        jiraConnected: true
      }
    });

    // Check if user has Jira integration set up
    if (!userWithJiraDetails?.jiraConnected) {
      return NextResponse.json({ 
        tasks: [], 
        hasJiraIntegration: false,
        message: "You're not connected to Jira. Please check if your email is registered in Jira."
      });
    }

    // Use shared credentials from environment variables
    try {
      // Get the user's email from the database record
      const userEmail = userWithJiraDetails.email;
      
      if (!userEmail) {
        throw new Error('User email not found');
      }

      // Get shared Jira credentials
      const { apiToken, jiraUrl } = getSharedJiraCredentials();
      
      if (!apiToken || !jiraUrl) {
        throw new Error('Jira credentials not found in environment variables');
      }

      // Use the jira-client utility to fetch tasks with shared authentication
      try {
        const jiraTasks = await fetchJiraTasks(userEmail);

        return NextResponse.json({ 
          tasks: jiraTasks,
          hasJiraIntegration: true,
          jiraUrl: jiraUrl,
          email: userEmail,
          debugInfo: {
            numTasksFound: jiraTasks.length,
            timestamp: new Date().toISOString()
          }
        });
      } catch (fetchError: any) {
        // Return detailed error information for debugging
        console.error('Error fetching Jira tasks from client:', fetchError);
        
        return NextResponse.json({
          tasks: [],
          hasJiraIntegration: true,
          jiraUrl: jiraUrl,
          email: userEmail,
          error: fetchError.message || 'Unknown error fetching Jira tasks',
          errorDetails: fetchError.toString(),
          debugInfo: {
            taskFetchFailed: true,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (jiraError) {
      console.error('Error connecting to Jira API:', jiraError);
      return NextResponse.json({
        tasks: [],
        hasJiraIntegration: true,
        error: 'Failed to connect to Jira. Please check your Jira credentials.'
      });
    }

  } catch (error) {
    console.error('Error fetching Jira tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}