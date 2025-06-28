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
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-200 border-t-blue-500"></div>
        <span className="ml-4 text-lg text-blue-600/70">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Admin Dashboard
        </h1>
        <p className="text-blue-600/70 text-lg">Manage your team and projects efficiently</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border border-blue-100/50 rounded-xl p-2">
        <nav className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50/50'
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
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50/50'
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
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50/50'
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
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Users
            </div>
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'schedules'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Schedules
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === 'invoices'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-blue-600/70 hover:text-blue-700 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </div>
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-slide-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-gradient hover:scale-105 transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Total Developers</CardTitle>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalDevelopers}</div>
                <p className="text-sm text-blue-600/70 font-medium">Active freelancers</p>
              </CardContent>
            </Card>

            <Card className="card-gradient hover:scale-105 transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Total Hours</CardTitle>
                <div className="p-2 bg-green-100 rounded-full">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalHours}</div>
                <p className="text-sm text-blue-600/70 font-medium">This week</p>
              </CardContent>
            </Card>

            <Card className="card-gradient hover:scale-105 transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Total Cost</CardTitle>
                <div className="p-2 bg-purple-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">${stats.totalCost}</div>
                <p className="text-sm text-blue-400/80 font-medium">Weekly budget</p>
              </CardContent>
            </Card>

            <Card className="card-gradient hover:scale-105 transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-200">Pending Tasks</CardTitle>
                <div className="p-2 bg-orange-900/50 rounded-full">
                  <AlertCircle className="h-5 w-5 text-orange-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{stats.pendingTasks}</div>
                <p className="text-sm text-blue-400/80 font-medium">Awaiting review</p>
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