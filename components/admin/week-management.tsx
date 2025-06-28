'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Calendar, 
  Lock, 
  Unlock, 
  Settings,
  CalendarDays,
  Info,
  ChevronRight
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { format, addDays, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';

interface Week {
  id: string;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  taskCount: number;
}

interface WeeklyHolidays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

const DAYS_OF_WEEK = [
{ key: 'sunday', label: 'Sunday', value: 0 },
{ key: 'monday', label: 'Monday', value: 1 },
{ key: 'tuesday', label: 'Tuesday', value: 2 },
{ key: 'wednesday', label: 'Wednesday', value: 3 },
{ key: 'thursday', label: 'Thursday', value: 4 },
{ key: 'friday', label: 'Friday', value: 5 },
{ key: 'saturday', label: 'Saturday', value: 6 },

];

export function WeekManagement() {
  const { toast } = useToast();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('weeks');
  
  // Weekly holidays state
  const [weeklyHolidays, setWeeklyHolidays] = useState<WeeklyHolidays>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: true, // Default Friday as holiday
    saturday: true, // Default Saturday as holiday
    sunday: false,
  });
  
  const [savingHolidays, setSavingHolidays] = useState(false);

  useEffect(() => {
    fetchWeeks();
    fetchWeeklyHolidays();
  }, []);

  const fetchWeeks = async () => {
    try {
      const response = await fetch('/api/admin/weeks');
      if (response.ok) {
        const data = await response.json();
        setWeeks(data.weeks);
      }
    } catch (error) {
      console.error('Error fetching weeks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch weeks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyHolidays = async () => {
    try {
      const response = await fetch('/api/admin/weekly-holidays');
      if (response.ok) {
        const data = await response.json();
        if (data.holidays) {
          setWeeklyHolidays(data.holidays);
        }
      }
    } catch (error) {
      console.error('Error fetching weekly holidays:', error);
    }
  };

  const saveWeeklyHolidays = async () => {
    setSavingHolidays(true);
    try {
      const response = await fetch('/api/admin/weekly-holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weeklyHolidays),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Weekly holidays updated successfully",
        });
      } else {
        throw new Error('Failed to save holidays');
      }
    } catch (error) {
      console.error('Error saving holidays:', error);
      toast({
        title: "Error",
        description: "Failed to save weekly holidays",
        variant: "destructive"
      });
    } finally {
      setSavingHolidays(false);
    }
  };

  const calculateNextWeekDates = () => {
    // Find the last closed week
    const closedWeeks = weeks.filter(w => !w.isOpen).sort((a, b) => 
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );
    
    if (closedWeeks.length > 0) {
      const lastWeek = closedWeeks[0];
      const lastEndDate = new Date(lastWeek.endDate);
      const nextStartDate = addDays(lastEndDate, 1);
      
      // Calculate end date (7 days later)
      const nextEndDate = addDays(nextStartDate, 6);
      
      setStartDate(format(nextStartDate, 'yyyy-MM-dd'));
      setEndDate(format(nextEndDate, 'yyyy-MM-dd'));
      setShowCreateForm(true);
    } else {
      // No previous weeks, let user choose dates
      setShowCreateForm(true);
    }
  };

  const getWorkingDaysCount = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let workingDays = 0;
    
    for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
      const dayOfWeek = date.getDay();
      const dayKey = DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.key as keyof WeeklyHolidays;
      
      if (dayKey && !weeklyHolidays[dayKey]) {
        workingDays++;
      }
    }
    
    return workingDays;
  };

  const handleCreateWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/weeks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setStartDate('');
        setEndDate('');
        fetchWeeks();
        toast({
          title: "Success",
          description: "Week created successfully",
        });
      } else {
        throw new Error('Failed to create week');
      }
    } catch (error) {
      console.error('Error creating week:', error);
      toast({
        title: "Error",
        description: "Failed to create week",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWeekStatus = async (weekId: string, isOpen: boolean) => {
    try {
      const response = await fetch(`/api/admin/weeks/${weekId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isOpen: !isOpen,
        }),
      });

      if (response.ok) {
        fetchWeeks();
        toast({
          title: "Success",
          description: `Week ${!isOpen ? 'opened' : 'closed'} successfully`,
        });
      }
    } catch (error) {
      console.error('Error updating week status:', error);
      toast({
        title: "Error",
        description: "Failed to update week status",
        variant: "destructive"
      });
    }
  };

  const getLastClosedWeek = () => {
    const closedWeeks = weeks.filter(w => !w.isOpen).sort((a, b) => 
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );
    return closedWeeks[0] || null;
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Week Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="weeks">
            <Calendar className="h-4 w-4 mr-2" />
            Weeks
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Holiday Settings
          </TabsTrigger>
        </TabsList>

        {/* Weeks Tab */}
        <TabsContent value="weeks" className="space-y-6">
          {/* Last Closed Week Info */}
          {getLastClosedWeek() && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-base text-blue-900">Last Closed Week</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800">
                  {formatDate(new Date(getLastClosedWeek()!.startDate))} - {formatDate(new Date(getLastClosedWeek()!.endDate))}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {getLastClosedWeek()!.taskCount} tasks submitted
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={calculateNextWeekDates}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Week
            </Button>
          </div>

          {/* Create Week Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Week</CardTitle>
                <CardDescription>
                  Define a new week period for timesheet logging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateWeek} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  {startDate && endDate && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Working Days: </span>
                        <span className="text-blue-600 font-semibold">
                          {getWorkingDaysCount(startDate, endDate)} days
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on your weekly holiday settings
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowCreateForm(false);
                      setStartDate('');
                      setEndDate('');
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create Week'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Weeks List */}
          <div className="grid gap-4">
            {weeks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No weeks created yet. Create your first week to get started.</p>
                </CardContent>
              </Card>
            ) : (
              weeks.map((week) => (
                <Card key={week.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${week.isOpen ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {week.isOpen ? (
                          <Unlock className="h-4 w-4 text-green-600" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {formatDate(new Date(week.startDate))} - {formatDate(new Date(week.endDate))}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{week.taskCount} tasks submitted</span>
                          <span>•</span>
                          <span>{getWorkingDaysCount(week.startDate, week.endDate)} working days</span>
                          <span>•</span>
                          <span className={week.isOpen ? 'text-green-600' : 'text-gray-600'}>
                            {week.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => toggleWeekStatus(week.id, week.isOpen)}
                    >
                      {week.isOpen ? 'Close Week' : 'Open Week'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Holiday Settings</CardTitle>
              <CardDescription>
                Select which days are holidays in your work week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.key}
                      checked={weeklyHolidays[day.key as keyof WeeklyHolidays]}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        setWeeklyHolidays({
                          ...weeklyHolidays,
                          [day.key]: checked === true
                        });
                      }}
                    />
                    <Label
                      htmlFor={day.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Summary</h4>
                <p className="text-sm text-gray-600">
                  Working days per week: {' '}
                  <span className="font-semibold text-blue-600">
                    {7 - Object.values(weeklyHolidays).filter(Boolean).length} days
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Holidays: {' '}
                  <span className="font-semibold text-red-600">
                    {DAYS_OF_WEEK
                      .filter(day => weeklyHolidays[day.key as keyof WeeklyHolidays])
                      .map(day => day.label)
                      .join(', ') || 'None'}
                  </span>
                </p>
              </div>
              
              <Button 
                onClick={saveWeeklyHolidays} 
                disabled={savingHolidays}
                className="w-full"
              >
                {savingHolidays ? 'Saving...' : 'Save Holiday Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}