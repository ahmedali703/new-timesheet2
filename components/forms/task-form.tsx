'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { JiraTaskSelector } from '@/components/jira/task-selector';
import { useToast } from '@/components/ui/use-toast';
import { useTaskUpdates } from '@/lib/contexts/task-context';
import { JiraTask } from '@/components/jira/jira-tasks';
import { Clock, Plus, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskFormProps {
  onClose: () => void;
  onSubmit: () => void;
  selectedJiraTask?: JiraTask | null;
}

export function TaskForm({ onClose, onSubmit, selectedJiraTask }: TaskFormProps) {
  const { toast } = useToast();
  const { notifyTaskAdded } = useTaskUpdates();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [jiraTaskId, setJiraTaskId] = useState<string | undefined>();

  // Pre-fill form if a Jira task is selected
  useEffect(() => {
    if (selectedJiraTask) {
      setDescription(`${selectedJiraTask.key}: ${selectedJiraTask.summary}`);
      setJiraTaskId(selectedJiraTask.id);
    }
  }, [selectedJiraTask]);

  const handleJiraTaskSelect = (task: { id: string; key: string; summary: string }) => {
    setJiraTaskId(task.id);
    if (!description) {
      setDescription(`${task.key}: ${task.summary}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a task description.",
        variant: "destructive"
      });
      return;
    }

    if (!hours || parseFloat(hours) <= 0) {
      toast({
        title: "Invalid hours",
        description: "Please enter a valid number of hours.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          hours: parseFloat(hours),
          jiraTaskId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      toast({
        title: "Task created",
        description: "Your task has been submitted for review.",
      });

      // Notify context about the new task
      notifyTaskAdded(parseFloat(hours));

      // Reset form
      setDescription('');
      setHours('');
      setJiraTaskId(undefined);

      onSubmit();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass border border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl gradient-text">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            Add New Task
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="card-modern border-0">
            <CardHeader className="pb-4">
              <CardDescription className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Log your work hours and track progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Jira Task Selection */}
                <div className="space-y-2">
                  <Label htmlFor="jira-task" className="text-sm font-medium text-white">
                    Jira Task (Optional)
                  </Label>
                  <JiraTaskSelector 
                    onTaskSelect={handleJiraTaskSelect}
                    selectedTaskId={jiraTaskId}
                    disabled={loading}
                  />
                </div>

                {/* Task Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-white">
                    Task Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you worked on..."
                    className="input-modern min-h-[100px] resize-none"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Hours Input */}
                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-sm font-medium text-white">
                    Hours Worked *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="hours"
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="0.00"
                      className="input-modern pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="glass border border-white/20 hover:bg-white/5"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-modern"
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}