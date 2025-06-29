'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, DollarSign, 
  Plus, RefreshCcw, ChevronRight, BarChart3, Calendar 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { TaskForm } from '@/components/forms/task-form';
import { WeekOverview } from './week-overview';
import { PaymentHistory } from './payment-history';
import { JiraSection } from '@/components/jira/jira-section';
import { JiraTask } from '@/components/jira/jira-tasks';
import { TaskTable } from '@/components/tasks/task-table';
import { taskColumns } from '@/components/tasks/columns';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

interface Task {
  id: string;
  description: string;
  hours: number;
  status: string;
  jiraTaskKey: string | null;
  adminComment?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WeekSummary {
  totalHours: number;
  approvedHours: number;
  totalPayout: number;
  approvedPayout: number;
}

export function EnhancedDeveloperDashboard() {
  const { data: session } = useSession();
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setWeekSummary(data.summary);
      } else {
        toast({
          title: "Error fetching tasks",
          description: "Could not load your tasks. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTaskSubmitted = () => {
    setShowTaskForm(false);
    setSelectedJiraTask(null);
    fetchTasks();
    toast({
      title: "Task submitted",
      description: "Your task has been successfully added.",
    });
  };
  
  const handleJiraTaskSelected = (task: JiraTask) => {
    setSelectedJiraTask(task);
    setShowTaskForm(true);
  };

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 20 }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div 
        className="flex justify-between items-center" 
        variants={fadeInUpVariants}
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
            Developer Dashboard
          </h2>
          <p className="text-gray-500 mt-1">
            Manage your tasks and track your progress
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={refreshing}
            className="transition-all hover:shadow-sm"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowTaskForm(true)} 
            size="sm"
            className="transition-all hover:scale-105 hover:shadow-md bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </motion.div>
      
      {/* Week Overview Component */}
      <motion.div variants={fadeInUpVariants}>
        <WeekOverview />
      </motion.div>

      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        variants={fadeInUpVariants}
      >
        <motion.div variants={statsVariants}>
          <Card className="transition-all hover:shadow-md hover:translate-y-[-2px] border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <div className="p-1.5 bg-blue-50 rounded-full">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekSummary.totalHours}</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={statsVariants}>
          <Card className="transition-all hover:shadow-md hover:translate-y-[-2px] border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
              <div className="p-1.5 bg-green-50 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekSummary.approvedHours}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for payment</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={statsVariants}>
          <Card className="transition-all hover:shadow-md hover:translate-y-[-2px] border-l-4 border-l-blue-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
              <div className="p-1.5 bg-blue-50 rounded-full">
                <DollarSign className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(weekSummary.totalPayout)}</div>
              <p className="text-xs text-muted-foreground mt-1">Potential earnings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={statsVariants}>
          <Card className="transition-all hover:shadow-md hover:translate-y-[-2px] border-l-4 border-l-green-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Payout</CardTitle>
              <div className="p-1.5 bg-green-50 rounded-full">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(weekSummary.approvedPayout)}</div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed earnings</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tasks List */}
      <motion.div 
        className="mt-6"
        variants={fadeInUpVariants}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">My Tasks</h2>
          <div className="text-sm text-gray-500">
            <Calendar className="inline h-4 w-4 mr-1 text-gray-400" /> This Week
          </div>
        </div>
        
        <TaskTable 
          columns={taskColumns} 
          data={tasks}
          isLoading={loading}
        />
      </motion.div>

      {/* Jira Integration */}
      <motion.div 
        className="mt-8"
        variants={fadeInUpVariants}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Jira Integration</h2>
          <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-800">
            Settings <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <JiraSection 
              onConnect={() => fetchTasks()} 
              onSelectTaskForTimesheet={handleJiraTaskSelected} 
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment History */}
      <motion.div 
        className="mt-8"
        variants={fadeInUpVariants}
      >
        <PaymentHistory />
      </motion.div>

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
    </motion.div>
  );
}
