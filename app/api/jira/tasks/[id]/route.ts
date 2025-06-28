import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock Jira tasks for demonstration (same as in the main tasks route)
const mockJiraTasks = [
  { id: '1', key: 'PROJ-123', summary: 'Implement user authentication' },
  { id: '2', key: 'PROJ-124', summary: 'Fix database connection issue' },
  { id: '3', key: 'PROJ-125', summary: 'Add responsive design to dashboard' },
  { id: '4', key: 'PROJ-126', summary: 'Optimize API performance' },
  { id: '5', key: 'PROJ-127', summary: 'Update documentation' },
];

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
    
    // In a real implementation, you would:
    // 1. Get the user's Jira credentials from the database
    // 2. Make API call to Jira to fetch the specific task by ID
    // 3. Return the actual task data

    // For now, find the task in our mock data
    const task = mockJiraTasks.find(task => task.id === taskId);
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error fetching Jira task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
