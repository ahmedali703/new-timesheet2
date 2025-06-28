'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface JiraTask {
  id: string;
  key: string;
  summary: string;
}

interface JiraTaskSelectorProps {
  onTaskSelect: (task: JiraTask | null) => void;
  selectedTaskId?: string;
}

export function JiraTaskSelector({ onTaskSelect, selectedTaskId }: JiraTaskSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<JiraTask | null>(null);

  // Fetch tasks on mount and when search query changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function fetchJiraTasks() {
      try {
        setLoading(true);
        const response = await fetch(`/api/jira/tasks?query=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch Jira tasks');
        }
        
        const data = await response.json();
        setTasks(data.tasks || []);

        // If there's a selectedTaskId and we haven't found the task yet, look for it in the results
        if (selectedTaskId && !selectedTask) {
          const task = data.tasks.find((t: JiraTask) => t.id === selectedTaskId);
          if (task) {
            setSelectedTask(task);
          }
        }
      } catch (error) {
        console.error('Error fetching Jira tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if the user has searched or if we need to find a selected task
    if (searchQuery || selectedTaskId) {
      fetchJiraTasks();
    }
  }, [searchQuery, selectedTaskId, selectedTask]);

  // Fetch selected task by ID if not already loaded
  useEffect(() => {
    async function fetchTaskById(taskId: string) {
      try {
        setLoading(true);
        const response = await fetch(`/api/jira/tasks/${taskId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch Jira task');
        }
        
        const data = await response.json();
        if (data.task) {
          setSelectedTask(data.task);
        }
      } catch (error) {
        console.error('Error fetching Jira task by ID:', error);
      } finally {
        setLoading(false);
      }
    }

    if (selectedTaskId && !selectedTask) {
      fetchTaskById(selectedTaskId);
    }
  }, [selectedTaskId, selectedTask]);

  const handleSelectTask = (task: JiraTask) => {
    setSelectedTask(task);
    onTaskSelect(task);
    setOpen(false);
  };

  const handleClearTask = () => {
    setSelectedTask(null);
    onTaskSelect(null);
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : selectedTask ? (
                `${selectedTask.key}: ${selectedTask.summary.substring(0, 30)}${
                  selectedTask.summary.length > 30 ? '...' : ''
                }`
              ) : (
                'Select Jira task...'
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search Jira tasks..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              {loading && <div className="p-2 text-center text-sm">Loading...</div>}
              {!loading && tasks.length === 0 && (
                <CommandEmpty>
                  {searchQuery ? 'No matching tasks found' : 'Type to search for tasks'}
                </CommandEmpty>
              )}
              <CommandGroup>
                {tasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    value={task.key}
                    onSelect={() => handleSelectTask(task)}
                    className="flex items-center"
                  >
                    <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="font-medium">{task.key}</span>: {task.summary}
                    </div>
                    {selectedTask?.id === task.id && (
                      <Check className="ml-2 h-4 w-4 flex-shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedTask && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClearTask}
            className="h-10 w-10"
          >
            <span className="sr-only">Clear selection</span>
            <span aria-hidden>×</span>
          </Button>
        )}
      </div>
      {selectedTask && (
        <div className="text-xs text-muted-foreground mt-1">
          <a 
            href={`https://your-jira-instance.atlassian.net/browse/${selectedTask.key}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            View in Jira
          </a>
        </div>
      )}
    </div>
  );
}
