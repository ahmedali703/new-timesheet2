'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { JiraConnect } from '@/components/jira/jira-connect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState('');
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setJiraUrl(data.user.jiraUrl || '');
          // We don't show the actual token for security reasons
          setJiraToken(data.user.jiraToken ? '••••••••••••••••' : '');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          jiraUrl,
          // Only send token if it's changed (not the masked version)
          jiraToken: jiraToken && !jiraToken.includes('•') ? jiraToken : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      setSavedProfile(true);
      fetchUserProfile(); // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating your profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, redirect to login
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  if (status === 'loading') {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="jira">Jira Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-gray-500">Your email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jiraUrl">Jira Site URL</Label>
                  <Input
                    id="jiraUrl"
                    value={jiraUrl}
                    onChange={(e) => setJiraUrl(e.target.value)}
                    placeholder="https://your-domain.atlassian.net"
                  />
                  <p className="text-xs text-gray-500">
                    Enter your Jira site URL (e.g., https://your-domain.atlassian.net)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jiraToken">Jira API Token</Label>
                  <Input
                    id="jiraToken"
                    type="password"
                    value={jiraToken}
                    onChange={(e) => setJiraToken(e.target.value)}
                    placeholder="Enter your Jira API token"
                  />
                  <p className="text-xs text-gray-500">
                    You can create an API token in your{" "}
                    <a 
                      href="https://id.atlassian.com/manage-profile/security/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Atlassian account settings
                    </a>
                  </p>
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="jira">
          <Card>
            <CardHeader>
              <CardTitle>Jira Integration</CardTitle>
              <CardDescription>
                Connect your Jira account to import tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JiraConnect onConnect={() => setSavedProfile(true)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
