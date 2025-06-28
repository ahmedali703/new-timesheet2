'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useTaskUpdates } from '@/lib/contexts/task-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ExternalLink, AlertCircle, Bug, Plus, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export interface JiraTask {
  id: string;
  key: string;
  summary: string;
  status: string;
  url?: string;
}

interface TimesheetEntry {
  id: string;
  jiraTaskId: string | null;
  jiraTaskKey: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

interface JiraTasksProps {
  onSelectTaskForTimesheet?: (task: JiraTask) => void;
}

export function JiraTasks({ onSelectTaskForTimesheet }: JiraTasksProps = {}) {
  const { notifyTaskAdded, notifyTasksUpdated } = useTaskUpdates();
  const [tasks, setTasks] = useState<JiraTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jiraBaseUrl, setJiraBaseUrl] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // Timesheet entries state
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [loadingTimesheet, setLoadingTimesheet] = useState(false);

  useEffect(() => {
    fetchJiraTasks();
    fetchTimesheetEntries();
  }, [page, pageSize]);
  
  // Filter tasks when search query changes or tasks are loaded
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTasks(tasks);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTasks(tasks.filter(task => 
        task.key.toLowerCase().includes(query) || 
        task.summary.toLowerCase().includes(query) ||
        task.status.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, tasks]);
  
  // Fetch timesheet entries to check which Jira tasks have already been added
  const fetchTimesheetEntries = async () => {
    setLoadingTimesheet(true);
    try {
      const response = await fetch('/api/time-entries');
      if (response.ok) {
        const data = await response.json();
        setTimesheetEntries(data.timeEntries || []);
      }
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
    } finally {
      setLoadingTimesheet(false);
    }
  };

  const fetchJiraTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/jira/tasks?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Jira tasks');
      }
      
      // Save debug info
      setDebugInfo(data);
      
      if (data.hasJiraIntegration && Array.isArray(data.tasks)) {
        // Sort tasks to match Jira's default order (already done on server side by updated DESC)
        setTasks(data.tasks);
        if (data.jiraUrl) {
          setJiraBaseUrl(data.jiraUrl);
        }
        
        // Update pagination state
        if (data.pagination) {
          setTotalTasks(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
          setHasMore(data.pagination.hasMore);
        }
      } else if (!data.hasJiraIntegration) {
        setError('Please connect your account to Jira first.');
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch Jira tasks');
      console.error('Error fetching Jira tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const getTaskUrl = (taskKey: string) => {
    if (!jiraBaseUrl) return '#';
    return `${jiraBaseUrl}/browse/${taskKey}`;
  };

  // Handler for selecting a task to add to the timesheet
  // Helper function to get the timesheet status for a task
  const getTaskTimesheetStatus = (taskId: string): 'pending' | 'approved' | 'rejected' | null => {
    const entry = timesheetEntries.find(entry => entry.jiraTaskId === taskId);
    return entry ? entry.status as 'pending' | 'approved' | 'rejected' : null;
  };
  
  // Helper to determine if a task is already added to timesheet
  const isTaskAddedToTimesheet = (taskId: string): boolean => {
    const entry = timesheetEntries.find(entry => entry.jiraTaskId === taskId);
    // Consider a task as added if it's pending or approved
    // For rejected tasks, we're now checking if a resubmission is pending
    if (!entry) return false;
    
    if (entry.status === 'pending' || entry.status === 'approved') {
      return true;
    }
    
    // Check if there's another entry for this task that's not rejected
    // This handles the case where a task was rejected but then added again
    const hasActiveEntry = timesheetEntries.some(
      e => e.jiraTaskId === taskId && (e.status === 'pending' || e.status === 'approved')
    );
    
    return hasActiveEntry;
  };
  
  // Get the appropriate background color based on task status
  const getTaskBackgroundColor = (taskId: string): string => {
    const status = getTaskTimesheetStatus(taskId);
    if (status === 'approved') return 'bg-green-50';
    if (status === 'pending') return 'bg-orange-50';
    if (status === 'rejected') return 'bg-red-50';
    return 'hover:bg-gray-50';
  };

  const handleSelectForTimesheet = async (task: JiraTask) => {
    if (onSelectTaskForTimesheet) {
      // Create a new timesheet entry object
      const newEntry: TimesheetEntry = {
        id: `temp-${task.id}`,
        jiraTaskId: task.id,
        jiraTaskKey: task.key,
        status: 'pending'
      };
      
      // Add the new entry to the timesheetEntries state
      setTimesheetEntries(prev => {
        // Remove any existing entries for this task (e.g., rejected ones)
        const filteredEntries = prev.filter(entry => 
          // When resubmitting a rejected task, only filter out rejected entries
          // This ensures we don't remove pending or approved entries on refresh
          entry.jiraTaskId !== task.id || 
          (entry.jiraTaskId === task.id && entry.status !== 'rejected')
        );
        // Add the new entry
        return [...filteredEntries, newEntry];
      });
      
      // Call the parent handler to save to backend
      onSelectTaskForTimesheet(task);
      
      // Notify the task context about the new task (default to 1 hour)
      notifyTaskAdded(1);
      
      // Also notify of general tasks update to ensure all components refresh
      notifyTasksUpdated();
      
      // Refetch timesheet entries to ensure we have the latest state from the server
      // This helps in tracking the status of resubmitted tasks
      await fetchTimesheetEntries();
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>My Jira Tasks</CardTitle>
            <CardDescription>Tasks assigned to you in Jira</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchJiraTasks}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              <Bug className="h-4 w-4 mr-2" />
              {showDebug ? 'Hide Debug' : 'Debug'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Box */}
        <div className="mb-4">
          <div className="relative">
            <Input
              placeholder="Search tasks by key, summary or status"
              className="pr-10"
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-gray-100"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="bg-red-900/30 p-4 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="text-sm text-yellow-200">{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4 text-gray-300">
              No tasks are currently assigned to you in Jira.
            </div>
            
            {showDebug && debugInfo && (
              <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-3 mb-4">
                <div className="font-semibold mb-2 text-sm">Debug Information:</div>
                <div className="text-xs font-mono overflow-auto max-h-60 whitespace-pre">
                  {JSON.stringify(debugInfo, null, 2)}
                </div>
                <div className="mt-3 text-xs text-gray-300">
                  <p>Common issues:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Your email format in Jira might differ from the one in this app</li>
                    <li>You might not have any tasks assigned in Jira</li>
                    <li>Your Jira user might be inactive or have a different username</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div 
                key={task.id} 
                className={`border rounded-lg p-3 transition-colors ${getTaskBackgroundColor(task.id)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                        {task.key}
                      </span>
                      <span className="text-xs text-gray-300">{task.status}</span>
                    </div>
                    <h3 className="font-medium text-sm mt-1">{task.summary}</h3>
                  </div>
                  <div className="flex space-x-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="whitespace-nowrap"
                    >
                      <a 
                        href={getTaskUrl(task.key)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open in Jira
                      </a>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleSelectForTimesheet(task)}
                      disabled={isTaskAddedToTimesheet(task.id)}
                    >
                      {getTaskTimesheetStatus(task.id) === 'approved' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approved
                        </>
                      ) : getTaskTimesheetStatus(task.id) === 'pending' ? (
                        "Added"
                      ) : getTaskTimesheetStatus(task.id) === 'rejected' ? (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Again
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Timesheet
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination Controls */}
        {filteredTasks.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              {searchQuery ? 
                `Showing ${filteredTasks.length} filtered results` : 
                `Showing ${tasks.length} of ${totalTasks} tasks - Page ${page} of ${totalPages}`
              }
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
