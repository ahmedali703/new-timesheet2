'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JiraConnect } from './jira-connect';
import { JiraTasks, JiraTask } from './jira-tasks';
import { LinkIcon, ListTodo } from 'lucide-react';

interface JiraSectionProps {
  onConnect?: () => void;
  onSelectTaskForTimesheet?: (task: JiraTask) => void;
}

export function JiraSection({ onConnect, onSelectTaskForTimesheet }: JiraSectionProps) {
  const [activeTab, setActiveTab] = useState('tasks');

  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    }
    // Switch to tasks tab after successful connection
    setActiveTab('tasks');
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="tasks" className="flex items-center">
            <ListTodo className="h-4 w-4 mr-2" />
            My Tasks
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex items-center">
            <LinkIcon className="h-4 w-4 mr-2" />
            Connection
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="mt-4">
          <JiraConnect onConnect={handleConnect} />
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-4">
          <JiraTasks onSelectTaskForTimesheet={onSelectTaskForTimesheet} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
