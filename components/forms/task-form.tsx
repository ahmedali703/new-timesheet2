'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface JiraTask {
  id: string;
  key: string;
  summary: string;
  status?: string;
}

interface TaskFormProps {
  onClose: () => void;
  onSubmit: () => void;
  selectedJiraTask?: JiraTask | null;
}

export function TaskForm({ onClose, onSubmit, selectedJiraTask }: TaskFormProps) {
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [selectedJiraTaskId, setSelectedJiraTaskId] = useState('');
  const [jiraTasks, setJiraTasks] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJiraTasks();
    
    // If a Jira task was passed in, pre-select it
    if (selectedJiraTask) {
      setSelectedJiraTaskId(selectedJiraTask.id);
      // Pre-populate description with task summary
      setDescription(`${selectedJiraTask.key}: ${selectedJiraTask.summary}`);
    }
  }, [selectedJiraTask]);

  const fetchJiraTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jira/tasks');
      if (response.ok) {
        const data = await response.json();
        setJiraTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching Jira tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !hours) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          hours: parseFloat(hours),
          jiraTaskId: selectedJiraTaskId || null,
        }),
      });

      if (response.ok) {
        onSubmit();
      } else {
        console.error('Error submitting task');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add New Task</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Log your work hours for this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="jira-task" className="block text-sm font-medium text-gray-700 mb-1">
                Jira Task (Optional)
              </label>
              <select
                id="jira-task"
                value={selectedJiraTaskId}
                onChange={(e) => setSelectedJiraTaskId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select a Jira task...</option>
                {jiraTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.key} - {task.summary}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-xs text-gray-500 mt-1">Loading Jira tasks...</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Task Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what you worked on..."
                required
              />
            </div>

            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
                Hours Worked *
              </label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g., 2.5"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Submitting...' : 'Submit Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}