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
  FileText
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setWeekSummary(data.summary);
        
        // Notify the context that tasks have been updated
        notifyTasksUpdated();
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmitted = () => {
    setShowTaskForm(false);
    setSelectedJiraTask(null);
    fetchTasks();
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
    <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Developer Dashboard</h2>
          <Button onClick={() => setShowTaskForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
        
        {/* Week Overview Component */}
        <WeekOverview />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekSummary.totalHours}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekSummary.approvedHours}</div>
            <p className="text-xs text-muted-foreground">Ready for payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weekSummary.totalPayout)}</div>
            <p className="text-xs text-muted-foreground">Potential earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weekSummary.approvedPayout)}</div>
            <p className="text-xs text-muted-foreground">Confirmed earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section - Using proper shadcn/ui Tabs */}
      <Tabs defaultValue="tasks" className="mt-8">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            My Tasks
          </TabsTrigger>
          <TabsTrigger value="jira" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Jira Integration
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* My Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>All tasks submitted this week</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tasks submitted yet. Click &quot;Add Task&quot; to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(task.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            {task.jiraTaskKey && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {task.jiraTaskKey}
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 mb-1">{task.description}</h3>
                          <p className="text-sm text-gray-500">
                            {task.hours} hours • {formatCurrency(Number(task.hours) * Number(session?.user?.hourlyRate || 0))}
                          </p>
                          {task.adminComment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong>Admin feedback:</strong> {task.adminComment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
          }}
          onSubmit={handleTaskSubmitted}
          selectedJiraTask={selectedJiraTask}
        />
      )}
    </div>
  );
}