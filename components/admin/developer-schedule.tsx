'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hourlyRate: number;
}

interface DeveloperSchedule {
  id?: string;
  userId: string;
  daysPerWeek: number;
  hoursPerDay: number;
  expectedPayout?: number;
}

export function DeveloperSchedule() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Record<string, DeveloperSchedule>>({});
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [currentSchedule, setCurrentSchedule] = useState<DeveloperSchedule | null>(null);

  const fetchSchedules = useCallback(async (developers: User[]) => {
    try {
      const schedulesMap: Record<string, DeveloperSchedule> = {};
      
      for (const dev of developers) {
        const response = await fetch(`/api/admin/developer-schedule/${dev.id}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.schedule) {
            schedulesMap[dev.id] = data.schedule;
          }
        }
      }
      
      setSchedules(schedulesMap);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  }, []);
  
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      // Filter to only show developers
      const devs = data.users.filter((user: User) => user.role === 'developer');
      setUsers(devs);
      
      // Fetch schedules for developers
      await fetchSchedules(devs);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch developers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchSchedules]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (selectedUser) {
      const schedule = schedules[selectedUser];
      setCurrentSchedule(schedule || {
        userId: selectedUser,
        daysPerWeek: 5,
        hoursPerDay: 8
      });
    } else {
      setCurrentSchedule(null);
    }
  }, [selectedUser, schedules]);



  const handleSaveSchedule = async () => {
    if (!currentSchedule || !selectedUser) return;
    
    try {
      const response = await fetch('/api/admin/developer-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentSchedule)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }
      
      const data = await response.json();
      
      // Update schedules with the new one
      setSchedules({
        ...schedules,
        [selectedUser]: data.schedule
      });
      
      toast({
        title: "Success",
        description: "Developer schedule saved successfully",
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Failed to save developer schedule",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof DeveloperSchedule, value: number) => {
    if (!currentSchedule) return;
    
    setCurrentSchedule({
      ...currentSchedule,
      [field]: value
    });
  };

  const calculateExpectedPayout = () => {
    if (!currentSchedule || !selectedUser) return 0;
    
    const user = users.find(u => u.id === selectedUser);
    if (!user) return 0;
    
    return user.hourlyRate * currentSchedule.daysPerWeek * currentSchedule.hoursPerDay * 4; // Monthly estimate (4 weeks)
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer Work Schedule</CardTitle>
        <CardDescription>
          Set expected working days and hours for developers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="developer">Select Developer</Label>
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a developer" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {currentSchedule && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daysPerWeek">Working Days per Week</Label>
                    <Input
                      id="daysPerWeek"
                      type="number"
                      min="1"
                      max="7"
                      value={currentSchedule.daysPerWeek}
                      onChange={(e) => handleInputChange('daysPerWeek', parseInt(e.target.value) || 5)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hoursPerDay">Working Hours per Day</Label>
                    <Input
                      id="hoursPerDay"
                      type="number"
                      min="1"
                      max="24"
                      value={currentSchedule.hoursPerDay}
                      onChange={(e) => handleInputChange('hoursPerDay', parseInt(e.target.value) || 8)}
                    />
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="font-semibold mb-2">Expected Monthly Payout:</div>
                  <div className="text-2xl font-bold">${calculateExpectedPayout().toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    Based on {currentSchedule.daysPerWeek} days/week × {currentSchedule.hoursPerDay} hours/day × 4 weeks
                  </div>
                </div>
                
                <Button onClick={handleSaveSchedule}>
                  Save Schedule
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
