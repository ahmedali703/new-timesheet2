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
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">TimeTracker</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{session.user?.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {session.user?.role}
              </span>
            </div>

            <Link href="/profile">
              <Button variant="outline" size="sm">
                <UserCircle className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>

            {session.user?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
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