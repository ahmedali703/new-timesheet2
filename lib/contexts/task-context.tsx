'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface TaskContextType {
  lastTaskUpdate: Date | null;
  notifyTaskAdded: (hours: number) => void;
  notifyTaskStatusChanged: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [lastTaskUpdate, setLastTaskUpdate] = useState<Date | null>(null);

  const notifyTaskAdded = (hours: number) => {
    setLastTaskUpdate(new Date());
  };

  const notifyTaskStatusChanged = () => {
    setLastTaskUpdate(new Date());
  };

  return (
    <TaskContext.Provider value={{ 
      lastTaskUpdate,
      notifyTaskAdded,
      notifyTaskStatusChanged
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskUpdates() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskUpdates must be used within a TaskProvider');
  }
  return context;
}
