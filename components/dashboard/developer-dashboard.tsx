'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Link, 
  ListChecks, 
  FileText,
  Pencil,
  Trash2
} from 'lucide-react';
import { TaskForm } from '@/components/forms/task-form';
import { formatCurrency } from '@/lib/utils';
import { WeekOverview } from './week-overview';
import { PaymentHistory } from './payment-history';
import { JiraSection } from '@/components/jira/jira-section';
import { JiraTask } from '@/components/jira/jira-tasks';
import { TaskProvider, useTaskUpdates } from '@/lib/contexts/task-context';

export function DeveloperDashboard() {
  return (
    <TaskProvider>
      <DashboardContent />
    </TaskProvider>
  );
}

interface Task {
  id: string;
  description: string;
  hours: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  jiraTaskKey?: string;
  createdAt: string;
}

interface WeekSummary {
  totalHours: number;
  approvedHours: number;
  totalPayout: number;
  approvedPayout: number;
}

function DashboardContent() {
  const { data: session } = useSession() as { data: Session | null };
  const { notifyTasksUpdated } = useTaskUpdates();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary>({
    totalHours: 0,
    approvedHours: 0,
    totalPayout: 0,
    approvedPayout: 0,
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedJiraTask, setSelectedJiraTask] = useState<JiraTask | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskPage, setTaskPage] = useState(1);
  const [tasksPerPage] = useState(5);
  const [taskPagination, setTaskPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    total: 0,
    totalPages: 1,
    hasMore: false
  });

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTasks = async (page = taskPage) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?page=${page}&pageSize=${tasksPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setWeekSummary(data.summary);
        setTaskPagination(data.pagination);
        
        // Notify the context that tasks have been updated
        notifyTasksUpdated();
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePreviousPage = () => {
    if (taskPage > 1) {
      const newPage = taskPage - 1;
      setTaskPage(newPage);
      fetchTasks(newPage);
    }
  };
  
  const handleNextPage = () => {
    if (taskPagination.hasMore) {
      const newPage = taskPage + 1;
      setTaskPage(newPage);
      fetchTasks(newPage);
    }
  };

  const handleTaskSubmitted = () => {
    setShowTaskForm(false);
    setSelectedJiraTask(null);
    setTaskToEdit(null);
    fetchTasks();
  };
  
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setShowTaskForm(true);
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh tasks after delete
        fetchTasks();
        notifyTasksUpdated();
      } else {
        alert('Failed to delete task. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('An error occurred while deleting the task.');
    }
  };
  
  const handleJiraTaskSelected = (task: JiraTask) => {
    setSelectedJiraTask(task);
    setShowTaskForm(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-900/50 text-green-200';
      case 'rejected':
        return 'bg-red-900/50 text-red-200';
      default:
        return 'bg-orange-900/50 text-orange-200';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Developer Dashboard
            </h2>
            <p className="text-blue-600/70 font-medium">Manage your tasks and track your progress</p>
          </div>
          <Button onClick={() => setShowTaskForm(true)} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
        
        {/* Week Overview Component */}
        <WeekOverview />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <WeekOverview />
        <div className="lg:col-span-2">
          <Card className="shadow-xl bg-black border border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Week Summary</CardTitle>
                  <CardDescription className="text-gray-300">Track your hours and earnings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <Card className="shadow bg-black border border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium mb-1 text-white">Total Hours</p>
                        <p className="text-2xl font-bold text-white">{weekSummary.totalHours.toFixed(1)}</p>
                      </div>
                      <div className="p-2 bg-blue-950/30 rounded-full border border-blue-900/30">
                        <Clock className="h-5 w-5 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {weekSummary.approvedHours.toFixed(1)} hours approved
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow bg-black border border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium mb-1 text-white">Total Payout</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(weekSummary.totalPayout)}</p>
                      </div>
                      <div className="p-2 bg-blue-950/30 rounded-full border border-blue-900/30">
                        <DollarSign className="h-5 w-5 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatCurrency(weekSummary.approvedPayout)} confirmed earnings
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section - Using proper shadcn/ui Tabs */}
      <Tabs defaultValue="tasks" className="mb-8">
        <TabsList className="grid w-full grid-cols-2 bg-gray-950 border border-gray-800">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-900/50 data-[state=active]:text-white">My Tasks</TabsTrigger>
          <TabsTrigger value="jira" className="data-[state=active]:bg-blue-900/50 data-[state=active]:text-white">Jira Integration</TabsTrigger>
        </TabsList>

        {/* My Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <Card className="w-full shadow-xl bg-black border border-gray-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white">Task Management</CardTitle>
                  <CardDescription className="text-gray-300">
                    Log and manage your tasks
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setShowTaskForm(true);
                    setTaskToEdit(null);
                    setSelectedJiraTask(null);
                  }}
                  className="whitespace-nowrap bg-blue-800 text-white hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <ListChecks className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-blue-600/70 mb-4">Click &quot;Add Task&quot; to get started with your timesheet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-500"></div>
                      <span className="ml-3 text-blue-600/70">Loading tasks...</span>
                    </div>
                  ) : tasks.map((task) => (
                    <div key={task.id} className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                      <div className="flex justify-between items-start flex-1">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-white">{task.description}</p>
                            {task.jiraTaskKey && (
                              <span className="text-xs bg-blue-950/30 text-blue-300 px-2 py-0.5 rounded-md flex items-center border border-blue-900/30">
                                <Link className="h-3 w-3 mr-1" />
                                {task.jiraTaskKey}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <p>{new Date(task.createdAt).toLocaleDateString()}</p>
                            <span>•</span>
                            <p>{task.hours} hours</p>
                            {task.adminComment && (
                              <span className="ml-2 text-orange-400 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {task.adminComment}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {/* Only allow editing for pending tasks */}
                          {task.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                              onClick={() => handleEditTask(task)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}
                          
                          {/* Only allow deletion for pending tasks */}
                          {task.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                    
                    {/* Pagination Controls */}
                    {taskPagination.total > 0 && (
                      <div className="flex items-center justify-between border-t border-gray-800 bg-black px-4 py-3 sm:px-6 mt-4">
                        <div className="flex flex-1 justify-between sm:hidden">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={taskPage <= 1}
                            onClick={handlePreviousPage}
                            className="bg-black border-gray-700 text-gray-300 hover:bg-gray-950"
                          >
                            Previous
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={!taskPagination.hasMore}
                            onClick={handleNextPage}
                            className="bg-black border-gray-700 text-gray-300 hover:bg-gray-950"
                          >
                            Next
                          </Button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-300">
                              Showing <span className="font-medium">{tasks.length > 0 ? (taskPage - 1) * tasksPerPage + 1 : 0}</span> to{' '}
                              <span className="font-medium">
                                {Math.min(taskPage * tasksPerPage, taskPagination.total)}
                              </span>{' '}
                              of <span className="font-medium">{taskPagination.total}</span> tasks
                            </p>
                          </div>
                          <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                              <Button 
                                variant="outline"
                                size="icon" 
                                className="rounded-l-md"
                                disabled={taskPage <= 1}
                                onClick={handlePreviousPage}
                              >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                </svg>
                              </Button>
                              <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                {taskPage} / {taskPagination.totalPages}
                              </div>
                              <Button 
                                variant="outline"
                                size="icon"
                                className="rounded-r-md"
                                disabled={!taskPagination.hasMore}
                                onClick={handleNextPage}
                              >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                              </Button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jira Integration Tab */}
        <TabsContent value="jira" className="mt-6">
          <div className="mb-2 text-sm text-gray-300">
            Connect your Jira account to view and select tasks when logging time
          </div>
          <Card>
            <CardContent className="pt-6">
              <JiraSection 
                onConnect={() => fetchTasks()} 
                onSelectTaskForTimesheet={handleJiraTaskSelected} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="mt-6">
          <PaymentHistory />
        </TabsContent>
      </Tabs>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={() => {
            setShowTaskForm(false);
            setSelectedJiraTask(null);
            setTaskToEdit(null);
          }}
          onSubmit={handleTaskSubmitted}
          selectedJiraTask={selectedJiraTask}
          taskToEdit={taskToEdit}
        />
      )}
    </div>
  );
}