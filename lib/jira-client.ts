export interface JiraAccount {
  accessToken: string;
  cloudId: string;
  userId: string;
}

export interface JiraTask {
  id: string;
  key: string;
  summary: string;
  status: string;
  assignee?: {
    name: string;
    displayName: string;
  };
  updated: string;
}

export interface JiraTaskResponse {
  tasks: JiraTask[];
  total: number;
  startAt: number;
  maxResults: number;
  hasMore: boolean;
}

/**
 * Fetch open tasks for a user from Jira using shared API token
 * @param email - User's email to find their assigned tasks
 * @param startAt - Starting index for pagination
 * @param maxResults - Maximum number of results to return
 * @param apiToken - Optional Jira API token, falls back to env if not provided
 * @param jiraUrl - Optional Jira URL, falls back to env if not provided
 */
export async function fetchJiraTasks(
  email: string,
  startAt: number = 0,
  maxResults: number = 10,
  apiToken?: string, 
  jiraUrl?: string
): Promise<JiraTaskResponse> {
  try {
    // Use provided credentials or fall back to environment variables
    const token = apiToken || process.env.JIRA_API_TOKEN;
    const url = jiraUrl || process.env.JIRA_URL;
    const adminEmail = process.env.JIRA_EMAIL || "admin@myquery.ai";
    
    if (!token || !url) {
      throw new Error('Jira credentials not found in environment variables');
    }
    
    // Format the Jira URL correctly
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    // Create Basic Auth token from admin email and API token
    // Using admin credentials with shared API token allows fetching tasks for any user
    const authToken = Buffer.from(`${adminEmail}:${token}`).toString('base64');
    
    // Prepare email variations to try different formats in Jira
    const emailWithoutDomain = email.split('@')[0];
    
    // JQL query to find open issues assigned to the user
    // Using multiple formats to be more flexible in finding matches
    // We try both the full email and just the username part
    const jqlQuery = encodeURIComponent(`assignee in ("${email}", "${emailWithoutDomain}") AND status not in (Done, Closed) ORDER BY updated DESC`);
    
    console.log(`Searching for Jira tasks with query: ${decodeURIComponent(jqlQuery)}`);
    
    const response = await fetch(`${baseUrl}/rest/api/2/search?jql=${jqlQuery}&startAt=${startAt}&maxResults=${maxResults}&fields=summary,key,status,assignee,updated`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`Found ${data.issues?.length || 0} Jira tasks for user ${email}`);
    
    if (!data.issues || data.issues.length === 0) {
      console.log('No issues found. Debug info:', {
        totalIssues: data.total,
        maxResults: data.maxResults,
        startAt: data.startAt,
        jiraUrl: baseUrl
      });
    }
    
    const tasks = (data.issues || []).map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name || 'Unknown',
      assignee: issue.fields.assignee ? {
        name: issue.fields.assignee.name,
        displayName: issue.fields.assignee.displayName,
      } : undefined,
      updated: issue.fields.updated
    }));
    
    return {
      tasks,
      total: data.total || 0,
      startAt: data.startAt || 0,
      maxResults: data.maxResults || 10,
      hasMore: (data.startAt + data.maxResults) < data.total
    };
  } catch (error) {
    console.error('Error fetching Jira tasks:', error);
    throw new Error('Failed to fetch tasks from Jira');
  }
}

/**
 * Check if a user exists in Jira by email
 * Uses shared credentials from environment variables
 * @param email - User's email to check in Jira
 * @param apiToken - Optional Jira API token, falls back to env if not provided
 * @param jiraUrl - Optional Jira URL, falls back to env if not provided
 * @returns Promise resolving to a boolean indicating if the user exists in Jira
 */
export async function validateJiraCredentials(
  email: string,
  apiToken?: string,
  jiraUrl?: string
): Promise<boolean> {
  try {
    // Use provided credentials or fall back to environment variables
    const token = apiToken || process.env.JIRA_API_TOKEN;
    const url = jiraUrl || process.env.JIRA_URL;
    const adminEmail = process.env.JIRA_EMAIL || "admin@myquery.ai";
    
    if (!token || !url) {
      throw new Error('Jira credentials not found in environment variables');
    }
    
    // Format the Jira URL correctly
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    // Create Basic Auth token using admin credentials
    const authToken = Buffer.from(`${adminEmail}:${token}`).toString('base64');

    // Search for the user by email in Jira
    const query = encodeURIComponent(`user = "${email}"`);
    const response = await fetch(`${baseUrl}/rest/api/2/user/search?query=${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }
    
    const users = await response.json();
    // If any users were found with this email, return true
    return users && users.length > 0;
  } catch (error) {
    console.error('Error checking if user exists in Jira:', error);
    return false;
  }
}

/**
 * Check if a user exists in Jira and mark them as connected
 * Note: We don't store individual Jira credentials anymore, we use shared token
 * @param userId - User ID in our system
 * @param email - User's email to check in Jira
 * @returns Promise resolving to boolean indicating if user was found in Jira
 */
export async function connectUserToJira(
  userId: string, 
  email: string
): Promise<boolean> {
  // Check if the user exists in Jira
  const userExists = await validateJiraCredentials(email);
  
  if (!userExists) {
    throw new Error('Failed to connect to Jira: User not found in Jira');
  }
  
  // User exists in Jira, set them as connected in our database
  // Note: We'll update the user record in the API route
  return true;
}

/**
 * Get shared Jira credentials from environment variables
 * @returns Object with Jira API token, URL and admin email
 */
export function getSharedJiraCredentials() {
  return {
    apiToken: process.env.JIRA_API_TOKEN,
    jiraUrl: process.env.JIRA_URL,
    adminEmail: process.env.JIRA_EMAIL || "admin@myquery.ai"
  };
}
