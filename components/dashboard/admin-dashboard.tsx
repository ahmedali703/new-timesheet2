'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  FileText,
  Settings,
  BarChart3,
  UserCheck,
  Timer,
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TaskReview } from '@/components/admin/task-review';
import { UserManagement } from '@/components/admin/user-management';
import { WeekManagement } from '@/components/admin/week-management';
import { PaymentEvidence } from '@/components/admin/payment-evidence';
import { InvoiceManagement } from '@/components/admin/invoice-management';
import { DeveloperSchedule } from '@/components/admin/developer-schedule';

interface AdminStats {
  totalDevelopers: number;
  totalHours: number;
  totalCost: number;
  pendingTasks: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalDevelopers: 0,
    totalHours: 0,
    totalCost: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
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
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 20 
      }
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
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your team and track project progress
          </p>
        </div>
        <Button 
          onClick={fetchStats}
          disabled={loading}
          className="btn-modern"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Refresh Stats
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="nav-modern">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Task Review
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="weeks" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weeks
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Schedules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <motion.div 
            className="dashboard-grid"
            variants={fadeInUpVariants}
          >
            <motion.div variants={statsVariants}>
              <Card className="card-modern glow-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Developers</CardTitle>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{stats.totalDevelopers}</div>
                  <p className="text-xs text-muted-foreground">Active team members</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={statsVariants}>
              <Card className="card-modern glow-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Clock className="h-4 w-4 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{stats.totalHours}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={statsVariants}>
              <Card className="card-modern glow-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">
                    ${stats.totalCost.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Current week</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={statsVariants}>
              <Card className="card-modern glow-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold gradient-text">{stats.pendingTasks}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUpVariants}>
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveTab('tasks')}
                    className="btn-modern h-auto p-4 flex-col gap-2"
                  >
                    <UserCheck className="h-6 w-6" />
                    Review Tasks
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('users')}
                    className="btn-modern h-auto p-4 flex-col gap-2"
                  >
                    <Users className="h-6 w-6" />
                    Manage Users
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('weeks')}
                    className="btn-modern h-auto p-4 flex-col gap-2"
                  >
                    <Calendar className="h-6 w-6" />
                    Week Settings
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('invoices')}
                    className="btn-modern h-auto p-4 flex-col gap-2"
                  >
                    <FileText className="h-6 w-6" />
                    Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="tasks">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TaskReview />
          </motion.div>
        </TabsContent>

        <TabsContent value="users">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <UserManagement />
          </motion.div>
        </TabsContent>

        <TabsContent value="weeks">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WeekManagement />
          </motion.div>
        </TabsContent>

        <TabsContent value="invoices">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <InvoiceManagement />
          </motion.div>
        </TabsContent>

        <TabsContent value="payments">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PaymentEvidence />
          </motion.div>
        </TabsContent>

        <TabsContent value="schedules">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DeveloperSchedule />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}