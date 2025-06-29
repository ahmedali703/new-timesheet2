'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Task, getStatusBadge } from './task-table';
import { format } from 'date-fns';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const taskColumns: ColumnDef<Task>[] = [
  {
    accessorKey: 'description',
    header: 'Task Description',
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      const jiraTaskKey = row.original.jiraTaskKey;
      
      return (
        <div className="flex flex-col space-y-1 max-w-[500px]">
          <div className="font-medium flex items-center">
            {description}
            {jiraTaskKey && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-1 h-5 w-5 text-blue-600 hover:text-blue-800"
                      onClick={() => window.open(`https://jira.company.com/browse/${jiraTaskKey}`, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open Jira task: {jiraTaskKey}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {row.original.adminComment && (
            <div className="text-xs px-2 py-1 bg-gray-50 border border-gray-100 rounded flex items-start">
              <MessageSquare className="h-3 w-3 mt-0.5 mr-1 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">{row.original.adminComment}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'hours',
    header: 'Hours',
    cell: ({ row }) => {
      const hours = parseFloat(row.getValue('hours'));
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }).format(hours);
      
      return (
        <div className="text-center font-medium">
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
          {getStatusBadge(row.getValue('status'))}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = row.original.createdAt;
      if (!date) return <div className="text-gray-500 text-sm">—</div>;
      
      return (
        <div className="text-sm text-gray-600">
          {format(new Date(date), 'MMM d, yyyy')}
        </div>
      );
    },
  },
];
