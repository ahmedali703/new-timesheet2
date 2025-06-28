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
    <nav className="glass border-b border-white/20 backdrop-blur-lg bg-white/80 shadow-lg shadow-blue-500/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  MyQuery TimeTracker
                </span>
                <div className="text-xs text-blue-600/60 font-medium">Professional Edition</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-100/50">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                <UserCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">{session.user?.name}</span>
                <span className="text-xs bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent font-medium capitalize">
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