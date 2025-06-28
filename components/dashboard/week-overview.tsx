'use client';

import { useState, useEffect } from 'react';
import { useTaskUpdates } from '@/lib/contexts/task-context';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ClockIcon, CalendarIcon, DollarSign, Clock3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Week {
  id: string;
  startDate: string;
  endDate: string;
  isOpen: boolean;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Re-fetch week status whenever ANY task-related changes happen
  // This includes adding/deleting tasks, approvals, or any timesheet changes
  useEffect(() => {
    if (lastTaskUpdate) {
      fetchWeekStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTaskUpdate]);
  
  // Poll for updates every 30 seconds to catch changes made from other clients
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchWeekStatus();
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <p>Loading current week information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weekStatus) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <p>No active week found. Please contact an administrator.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Week Overview</CardTitle>
            <CardDescription>
              {formatDate(weekStatus.startDate)} - {formatDate(weekStatus.endDate)}
              {' '}
              {weekStatus.isOpen ? (
                <span className="inline-flex bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-2">
                  Active
                </span>
              ) : (
                <span className="inline-flex bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-2">
                  Closed
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Hours Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Hours Progress</h3>
                <p className="text-xs text-muted-foreground">
                  {weekStatus.totalHoursWorked} of {weekStatus.totalHoursExpected} hours logged
                </p>
              </div>
              <div className="text-xs text-right">
                <div className="font-medium">{progressPercentage}%</div>
                <div className="text-muted-foreground">
                  {weekStatus.remainingHours} hours remaining
                </div>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Work details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock3 className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium">Working Hours</p>
                <p className="text-xs text-muted-foreground">
                  {weekStatus.hoursPerDay} hours/day × {weekStatus.daysPerWeek} days
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <ClockIcon className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium">Hourly Rate</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(weekStatus.hourlyRate)} per hour
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-700" />
              </div>
              <div>
                <p className="text-sm font-medium">Expected Earnings</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(weekStatus.expectedEarnings)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-700" />
              </div>
              <div>
                <p className="text-sm font-medium">Current Earnings</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(weekStatus.actualEarnings)} ({Math.round((weekStatus.actualEarnings / weekStatus.expectedEarnings) * 100)}%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
