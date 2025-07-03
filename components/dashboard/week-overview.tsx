'use client';

import { useState, useEffect } from 'react';
import { useTaskUpdates } from '@/lib/contexts/task-context';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ClockIcon, CalendarIcon, DollarSign, Clock3, TrendingUp, Target, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

interface WeekStatus {
  currentWeekId: string;
  startDate: string;
  endDate: string;
  totalHoursWorked: number;
  totalHoursExpected: number;
  hourlyRate: number;
  daysPerWeek: number;
  hoursPerDay: number;
  expectedEarnings: number;
  actualEarnings: number;
  remainingHours: number;
  isOpen: boolean;
}

export function WeekOverview() {
  const { toast } = useToast();
  const { lastTaskUpdate } = useTaskUpdates();
  const [loading, setLoading] = useState(true);
  const [weekStatus, setWeekStatus] = useState<WeekStatus | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    fetchWeekStatus();
  }, []);
  
  useEffect(() => {
    if (lastTaskUpdate) {
      fetchWeekStatus();
    }
  }, [lastTaskUpdate]);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchWeekStatus();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (weekStatus) {
      const percentage = Math.min(
        Math.round((weekStatus.totalHoursWorked / weekStatus.totalHoursExpected) * 100),
        100
      );
      setProgressPercentage(percentage);
    }
  }, [weekStatus]);

  const fetchWeekStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/developer/week-status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch week status');
      }
      
      const data = await response.json();
      setWeekStatus(data);
    } catch (error) {
      console.error('Error fetching week status:', error);
      toast({
        title: "Error",
        description: "Failed to load current week information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-modern">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!weekStatus) {
    return (
      <div className="card-modern">
        <div className="flex justify-center items-center h-40">
          <div className="text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No active week found. Please contact an administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">Current Week Progress</h3>
            <p className="text-gray-400 text-sm">
              {formatDate(weekStatus.startDate)} - {formatDate(weekStatus.endDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {weekStatus.isOpen ? (
              <span className="badge-success flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Active
              </span>
            ) : (
              <span className="badge-error">Closed</span>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-lg font-medium text-white">Hours Progress</h4>
              <p className="text-sm text-gray-400">
                {weekStatus.totalHoursWorked} of {weekStatus.totalHoursExpected} hours completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold gradient-text">{progressPercentage}%</div>
              <div className="text-sm text-gray-400">
                {weekStatus.remainingHours} hours remaining
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="progress-modern">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-50"></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div 
            className="glass rounded-xl p-4 border border-white/10"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Daily Hours</p>
                <p className="text-lg font-semibold text-white">
                  {weekStatus.hoursPerDay}h × {weekStatus.daysPerWeek}d
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="glass rounded-xl p-4 border border-white/10"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Hourly Rate</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(weekStatus.hourlyRate)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="glass rounded-xl p-4 border border-white/10"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Target className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Expected</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(weekStatus.expectedEarnings)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="glass rounded-xl p-4 border border-white/10"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Current</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(weekStatus.actualEarnings)}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.round((weekStatus.actualEarnings / weekStatus.expectedEarnings) * 100)}% of target
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        {weekStatus.remainingHours > 0 && (
          <motion.div 
            className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  Keep up the momentum! 
                </p>
                <p className="text-xs text-gray-400">
                  You have {weekStatus.remainingHours} hours left to reach your weekly goal
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}