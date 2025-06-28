'use client';

import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Loader } from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();

  // Wait for session to load
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
    return null;
  }

  // Check if user is admin or HR
  // Access the role from the session that's properly typed in next-auth.d.ts
  const userRole = (session as Session | null)?.user?.role;
  const isAuthorized = userRole === 'admin' || userRole === 'hr';
  
  // Redirect to dashboard if not authorized
  if (!isAuthorized) {
    redirect('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <AdminDashboard />
    </div>
  );
}
