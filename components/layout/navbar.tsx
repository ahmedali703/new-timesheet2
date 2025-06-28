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
    <nav className="glass border-b border-gray-700/50 backdrop-blur-lg bg-gray-800/80 shadow-lg shadow-black/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
                  MyQuery TimeTracker
                </span>
                <div className="text-xs text-blue-400/80 font-medium">Professional Edition</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-gray-700/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-600/50">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full">
                <UserCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{session.user?.name}</span>
                <span className="text-xs bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent font-medium capitalize">
                  {session.user?.role}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="bg-white/60 backdrop-blur-sm border-red-200/50 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 hover:shadow-md"
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