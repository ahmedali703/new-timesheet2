'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface JiraConnectionProps {
  onConnected?: () => void;
  isConnected?: boolean;
}

export function JiraConnect({ onConnected, isConnected = false }: JiraConnectionProps) {
  const { toast } = useToast();
  const [apiToken, setApiToken] = useState('');
  const [cloudId, setCloudId] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiToken) {
      toast({
        title: "Missing API token",
        description: "Please enter your Jira API token",
        variant: "destructive"
      });
      return;
    }

    if (!cloudId) {
      toast({
        title: "Missing Cloud ID",
        description: "Please enter your Jira Cloud ID",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      setConnectionStatus('connecting');
      
      const response = await fetch('/api/jira/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiToken, cloudId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to Jira');
      }
      
      const data = await response.json();
      
      toast({
        title: "Jira connected",
        description: "Your Jira account has been successfully connected",
      });
      
      setConnectionStatus('connected');
      
      // Reset form
      setApiToken('');
      setCloudId('');
      
      // Trigger callback if provided
      if (onConnected) {
        onConnected();
      }
    } catch (error) {
      console.error('Error connecting to Jira:', error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Jira. Please check your API token and try again.",
        variant: "destructive"
      });
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            Connected to Jira
          </CardTitle>
          <CardDescription>
            Your Jira account is connected. You can now link Jira tasks to your time entries.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => setConnectionStatus('idle')}>
            Reconnect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect to Jira</CardTitle>
        <CardDescription>
          Connect your Jira account to link tasks with your time entries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cloudId">Jira Cloud ID</Label>
            <Input
              id="cloudId"
              value={cloudId}
              onChange={(e) => setCloudId(e.target.value)}
              placeholder="Enter your Jira Cloud ID"
              disabled={loading}
              required
            />
            <p className="text-xs text-slate-500">
              You can find your Cloud ID in your Jira account settings or URL
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiToken">Jira API Token</Label>
            <Input
              id="apiToken"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your Jira API token"
              disabled={loading}
              required
            />
            <p className="text-xs text-slate-500">
              <a 
                href="https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Learn how to generate an API token
              </a>
            </p>
          </div>

          {connectionStatus === 'error' && (
            <div className="bg-red-50 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-sm text-red-800">
                Failed to connect to Jira. Please check your credentials and try again.
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect to Jira'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
