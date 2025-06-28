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
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-gradient hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Total Hours</CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{weekSummary.totalHours}</div>
            <p className="text-sm text-blue-600/70 font-medium mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Approved Hours</CardTitle>
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{weekSummary.approvedHours}</div>
            <p className="text-sm text-emerald-600/70 font-medium mt-1">Ready for payment</p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Total Payout</CardTitle>
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(weekSummary.totalPayout)}</div>
            <p className="text-sm text-amber-600/70 font-medium mt-1">Potential earnings</p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Approved Payout</CardTitle>
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(weekSummary.approvedPayout)}</div>
            <p className="text-sm text-emerald-600/70 font-medium mt-1">Confirmed earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section - Using proper shadcn/ui Tabs */}
      <Tabs defaultValue="tasks" className="mt-8">
        <TabsList className="bg-white/60 backdrop-blur-sm border border-blue-100/50 p-1 h-12">
          <TabsTrigger value="tasks" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
            <ListChecks className="h-4 w-4" />
            My Tasks
          </TabsTrigger>
          <TabsTrigger value="jira" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
            <Link className="h-4 w-4" />
            Jira Integration
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
            <FileText className="h-4 w-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* My Tasks Tab */}
        <TabsContent value="tasks" className="mt-6 animate-slide-in">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">My Tasks</CardTitle>
              <CardDescription className="text-blue-600/70">All tasks submitted this week</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <ListChecks className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-blue-600/70 mb-4">Click "Add Task" to get started with your timesheet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-500"></div>
                      <span className="ml-3 text-blue-600/70">Loading tasks...</span>
                    </div>
                  ) : tasks.map((task) => (
                    <div key={task.id} className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            {getStatusIcon(task.status)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            {task.jiraTaskKey && (
                              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                                {task.jiraTaskKey}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2 text-lg">{task.description}</h3>
                          <p className="text-sm text-blue-600/70 font-medium">
                            {task.hours} hours • {formatCurrency(Number(task.hours) * Number(session?.user?.hourlyRate || 0))}
                          </p>
                          {task.adminComment && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg text-sm">
                              <strong className="text-blue-800">Admin feedback:</strong> 
                              <span className="text-blue-700 ml-1">{task.adminComment}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {/* Only allow editing for pending tasks */}
                          {task.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
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
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                        <div className="flex flex-1 justify-between sm:hidden">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={taskPage <= 1}
                            onClick={handlePreviousPage}
                          >
                            Previous
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={!taskPagination.hasMore}
                            onClick={handleNextPage}
                          >
                            Next
                          </Button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
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
          <div className="mb-2 text-sm text-gray-500">
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