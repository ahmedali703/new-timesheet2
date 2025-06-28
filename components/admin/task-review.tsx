'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle, User, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TaskForReview {
  id: string;
  description: string;
  hours: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  jiraTaskKey?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    hourlyRate: string;
  };
}

export function TaskReview() {
  const [tasks, setTasks] = useState<TaskForReview[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [reviewingTask, setReviewingTask] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/tasks?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);
  
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskReview = async (taskId: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminComment: comment,
        }),
      });

      if (response.ok) {
        setReviewingTask(null);
        setAdminComment('');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error reviewing task:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Task Review</h2>
        <div className="flex space-x-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No {filter === 'all' ? '' : filter} tasks found.
              </p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(task.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      {task.jiraTaskKey && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {task.jiraTaskKey}
                        </span>
                      )}
                    </div>

                    <h3 className="font-medium text-gray-900 mb-2">{task.description}</h3>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{task.user.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{task.hours} hours</span>
                      </div>
                      <span>
                        {formatCurrency(Number(task.hours) * Number(task.user.hourlyRate))}
                      </span>
                      <span>{formatDate(new Date(task.createdAt))}</span>
                    </div>

                    {task.adminComment && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Admin feedback:</strong> {task.adminComment}
                      </div>
                    )}

                    {reviewingTask === task.id && (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                          placeholder="Add feedback (optional for approval, required for rejection)"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleTaskReview(task.id, 'approved', adminComment)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleTaskReview(task.id, 'rejected', adminComment)}
                            disabled={!adminComment.trim()}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingTask(null);
                              setAdminComment('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {task.status === 'pending' && reviewingTask !== task.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewingTask(task.id)}
                    >
                      Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}