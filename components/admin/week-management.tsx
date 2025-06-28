'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, Lock, Unlock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Week {
  id: string;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  taskCount: number;
}

export function WeekManagement() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWeeks();
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
    } finally {
      setLoading(false);
    }
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
      }
    } catch (error) {
      console.error('Error creating week:', error);
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
      }
    } catch (error) {
      console.error('Error updating week status:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Week Management</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Week
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
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
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
                    <p className="text-sm text-gray-500">
                      {week.taskCount} tasks submitted • Status: {week.isOpen ? 'Open' : 'Closed'}
                    </p>
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
    </div>
  );
}