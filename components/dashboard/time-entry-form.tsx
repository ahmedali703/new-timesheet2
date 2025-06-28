'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { JiraTaskSelector } from './jira-task-selector';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from 'lucide-react';

interface TimeEntry {
  description: string;
  hours: number;
  date: string;
  jiraTaskId?: string;
}

interface JiraTask {
  id: string;
  key: string;
  summary: string;
}

interface TimeEntryFormProps {
  weekId: string;
  onSuccess?: () => void;
  defaultDate?: string;
}

export function TimeEntryForm({ weekId, onSuccess, defaultDate }: TimeEntryFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<JiraTask | null>(null);
  
  const [formData, setFormData] = useState<TimeEntry>({
    description: '',
    hours: 0,
    date: defaultDate || new Date().toISOString().split('T')[0],
    jiraTaskId: undefined
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hours' ? parseFloat(value) || 0 : value
    }));
  };

  const handleTaskSelect = (task: JiraTask | null) => {
    setSelectedTask(task);
    
    if (task) {
      // Auto-fill description with task summary if empty
      if (!formData.description) {
        setFormData(prev => ({
          ...prev,
          description: `${task.key}: ${task.summary}`,
          jiraTaskId: task.id
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          jiraTaskId: task.id
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        jiraTaskId: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.hours <= 0) {
      toast({
        title: "Invalid hours",
        description: "Please enter a valid number of hours.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.description) {
      toast({
        title: "Missing description",
        description: "Please provide a task description.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          weekId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save time entry');
      }
      
      toast({
        title: "Time entry added",
        description: "Your time entry has been saved successfully.",
      });
      
      // Reset form
      setFormData({
        description: '',
        hours: 0,
        date: formData.date,
        jiraTaskId: undefined
      });
      setSelectedTask(null);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast({
        title: "Error",
        description: "Failed to save your time entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Your Time</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium">
              Date
            </label>
            <div className="flex w-full items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="flex-1"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Jira Task (optional)
            </label>
            <JiraTaskSelector onTaskSelect={handleTaskSelect} selectedTaskId={formData.jiraTaskId} />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe what you worked on..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="hours" className="block text-sm font-medium">
              Hours
            </label>
            <Input
              type="number"
              id="hours"
              name="hours"
              value={formData.hours || ''}
              onChange={handleInputChange}
              min="0.25"
              step="0.25"
              placeholder="0.00"
              required
            />
          </div>
          
          <CardFooter className="px-0 pt-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Time Entry'}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
