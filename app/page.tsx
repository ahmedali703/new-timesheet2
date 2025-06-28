'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { DeveloperDashboard } from '@/components/dashboard/developer-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Session } from 'next-auth';

export default function Home() {
  const { data: session, status } = useSession() as { data: Session | null, status: string };
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="animate-fade-in">
          {session.user?.role === 'admin' || session.user?.role === 'hr' ? (
            <AdminDashboard />
          ) : (
            <DeveloperDashboard />
          )}
        </div>
      </main>
    </div>
  );
}