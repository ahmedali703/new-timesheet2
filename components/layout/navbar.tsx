'use client';

import { signOut, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Clock, Settings, UserCircle } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  const { data: session } = useSession() as { data: Session | null };

  if (!session) return null;

  return (
    <nav className="glass border-b border-blue-900/30 backdrop-blur-md bg-black shadow-lg shadow-black/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-blue-800 rounded-xl shadow-md border border-blue-700/50">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">
                  MyQuery TimeTracker
                </span>
                <div className="text-xs text-blue-400 font-medium">Professional Edition</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-black backdrop-blur-sm rounded-full px-4 py-2 border border-blue-900/50">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-800 rounded-full border border-blue-700/50">
                <UserCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{session.user?.name}</span>
                <span className="text-xs text-blue-400 font-medium capitalize">
                  {session.user?.role}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="bg-black backdrop-blur-sm border-red-900/50 text-red-400 hover:bg-red-950/60 hover:border-red-800/60 transition-all duration-200 hover:shadow-md"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}