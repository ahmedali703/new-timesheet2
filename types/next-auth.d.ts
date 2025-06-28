import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'admin' | 'developer' | 'hr';
      hourlyRate?: string;
    };
  }

  interface User {
    id: string;
    role?: 'admin' | 'developer' | 'hr';
    hourlyRate?: string;
  }
}