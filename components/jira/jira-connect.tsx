'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LinkIcon, CheckCircle, X } from 'lucide-react';

interface JiraConnectionProps {
  onConnect?: () => void;
}

export function JiraConnect({ onConnect }: JiraConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [jiraUrl, setJiraUrl] = useState('');

  useEffect(() => {
    checkJiraConnection();
  }, []);

  const checkJiraConnection = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/jira/connect');
      const data = await response.json();
      setIsConnected(data.connected);
      if (data.connected && data.url) {
        setJiraUrl(data.url);
      }
    } catch (error) {
      console.error('Error checking Jira connection:', error);
      setError('Failed to verify Jira connection status');
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConnecting(true);
    
    try {
      // Call the API to check if the user exists in Jira
      const response = await fetch('/api/jira/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
        // No need to send credentials anymore
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to connect to Jira');
      }
      
      setIsConnected(true);
      checkJiraConnection(); // Refresh connection info
      
      if (onConnect) {
        onConnect();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to connect to Jira');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/jira/connect', {
        method: 'DELETE',
      });
      setIsConnected(false);
      setJiraUrl('');
    } catch (error) {
      console.error('Error disconnecting from Jira:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <LinkIcon className="mr-2 h-5 w-5" />
          Jira Connection
        </CardTitle>
        <CardDescription>
          Automatically connect your account with Jira to select tasks when logging time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {checking ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-3">Checking Jira connection...</span>
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Connected to Jira</span>
            </div>
            <div className="text-sm text-gray-500">
              <p><strong>Jira URL:</strong> {jiraUrl}</p>
              <p className="mt-1">Your account has been successfully connected to Jira. You can now select tasks from your Jira account when logging time.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <p className="text-sm text-blue-800">
                Your account will be automatically connected to Jira if your email is registered there. 
                No need to enter API tokens or credentials.  
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 p-3 rounded-md">
                <div className="flex items-center space-x-2">
                  <X className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <Button 
              type="button" 
              onClick={(e) => handleConnect(e)} 
              disabled={connecting}
            >
              {connecting ? 'Checking...' : 'Check Jira Connection'}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button variant="outline" onClick={handleDisconnect}>
            Disconnect from Jira
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
