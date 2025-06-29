'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { JiraConnect } from './jira-connect';
import { CheckIcon, ChevronsUpDown, LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JiraTask {
  id: string;
  key: string;
  summary: string;
}

interface TaskSelectorProps {
  onTaskSelect: (task: { id: string; key: string; summary: string }) => void;
  selectedTaskId?: string;
  disabled?: boolean;
}

export function JiraTaskSelector({ onTaskSelect, selectedTaskId, disabled = false }: TaskSelectorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [tasks, setTasks] = useState<JiraTask[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  const selectedTask = tasks.find(task => task.id === selectedTaskId);

  // Check if the user has Jira connected
  const checkJiraConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jira/tasks');
      const data = await response.json();
      
      // If Jira integration is set up
      if (data.hasJiraIntegration) {
        setIsConnected(true);
        setTasks(data.tasks || []);
      } else {
        // No Jira integration
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking Jira connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Refresh Jira tasks
  const refreshJiraTasks = () => {
    checkJiraConnection();
  };

  // Check Jira connection when component mounts
  useEffect(() => {
    checkJiraConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTaskSelect = (task: JiraTask) => {
    onTaskSelect(task);
    setOpen(false);
  };

  const handleJiraConnect = () => {
    setShowConnect(false);
    checkJiraConnection();
  };

  if (showConnect) {
    return (
      <div className="space-y-4">
        <JiraConnect onConnect={handleJiraConnect} />
        <Button variant="outline" size="sm" onClick={() => setShowConnect(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm">Connect your Jira account to select tasks</div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-left flex items-center"
          onClick={() => setShowConnect(true)}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Connect Jira Account
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {selectedTask ? (
              <div className="flex items-center justify-between w-full">
                <span>{selectedTask.key}</span>
                <span className="truncate text-sm text-gray-500 max-w-[250px]">
                  {selectedTask.summary}
                </span>
              </div>
            ) : (
              <span>{loading ? "Loading tasks..." : "Select Jira task..."}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search Jira tasks..." />
            <CommandEmpty>
              {error ? (
                <div className="text-sm text-red-500 p-2">{error}</div>
              ) : (
                "No tasks found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`${task.key}-${task.summary}`}
                  onSelect={() => handleTaskSelect(task)}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center">
                      <span className="font-medium">{task.key}</span>
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedTaskId === task.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    <span className="text-sm text-gray-600 truncate">
                      {task.summary}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Connected to Jira</span>
        <button 
          onClick={refreshJiraTasks} 
          className="text-blue-500 hover:underline"
          disabled={loading}
        >
          Refresh tasks
        </button>
      </div>
    </div>
  );
}
