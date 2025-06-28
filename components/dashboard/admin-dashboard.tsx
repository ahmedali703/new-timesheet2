'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, DollarSign, CheckCircle, XCircle, AlertCircle, FileText, UserCog, Receipt } from 'lucide-react';
import { WeekManagement } from '@/components/admin/week-management';
import { TaskReview } from '@/components/admin/task-review';
import { PaymentEvidence } from '@/components/admin/payment-evidence';
import { UserManagement } from '@/components/admin/user-management';
import { DeveloperSchedule } from '@/components/admin/developer-schedule';
import { InvoiceManagement } from '@/components/admin/invoice-management';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'weeks' | 'tasks' | 'payments' | 'users' | 'schedules' | 'invoices'>('overview');
  const [loading, setLoading] = useState(true);

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
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-700 border-t-blue-500"></div>
        <span className="ml-4 text-lg text-gray-300">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-300 text-lg">Manage your team and projects efficiently</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black backdrop-blur-sm border border-gray-800 rounded-xl p-2">
        <nav className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-blue-950 text-blue-400 shadow-lg border border-blue-900/50'
                : 'text-blue-400 hover:text-blue-300 hover:bg-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('weeks')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'weeks'
                ? 'bg-blue-950 text-blue-400 shadow-lg border border-blue-900/50'
                : 'text-blue-400 hover:text-blue-300 hover:bg-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Weeks
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'tasks'
                ? 'bg-blue-950 text-blue-400 shadow-lg border border-blue-900/50'
                : 'text-blue-400 hover:text-blue-300 hover:bg-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tasks
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'payments'
                ? 'bg-blue-950 text-blue-400 shadow-lg border border-blue-900/50'
                : 'text-blue-400 hover:text-blue-300 hover:bg-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </div>
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-slide-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-black border-gray-800 hover:scale-105 transition-transform duration-200 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-200">Total Developers</CardTitle>
                <div className="p-2 bg-blue-950/30 rounded-full border border-blue-900/30">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-100 mb-1">{stats.totalDevelopers}</div>
                <p className="text-sm text-gray-400 font-medium">Active freelancers</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-gray-800 hover:scale-105 transition-transform duration-200 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-200">Total Hours</CardTitle>
                <div className="p-2 bg-green-950/30 rounded-full border border-green-900/30">
                  <Clock className="h-5 w-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-100 mb-1">{stats.totalHours}</div>
                <p className="text-sm text-gray-400 font-medium">This week</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-gray-800 hover:scale-105 transition-transform duration-200 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-200">Total Cost</CardTitle>
                <div className="p-2 bg-purple-900/30 rounded-full border border-purple-700/30">
                  <DollarSign className="h-5 w-5 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-100 mb-1">${stats.totalCost}</div>
                <p className="text-sm text-gray-400 font-medium">Weekly budget</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-gray-800 hover:scale-105 transition-transform duration-200 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-200">Pending Tasks</CardTitle>
                <div className="p-2 bg-orange-900/30 rounded-full border border-orange-700/30">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-100 mb-1">{stats.pendingTasks}</div>
                <p className="text-sm text-gray-400 font-medium">Awaiting review</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Week Management Tab */}
      {activeTab === 'weeks' && <WeekManagement />}

      {/* Task Review Tab */}
      {activeTab === 'tasks' && <TaskReview />}

      {/* Payment Evidence Tab */}
      {activeTab === 'payments' && <PaymentEvidence />}
      
      {/* User Management Tab */}
      {activeTab === 'users' && <UserManagement />}
      
      {/* Developer Schedule Tab */}
      {activeTab === 'schedules' && <DeveloperSchedule />}
      
      {/* Invoice Management Tab */}
      {activeTab === 'invoices' && <InvoiceManagement />}
    </div>
  );
}