import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { createCustomAdapter } from './custom-auth-adapter';

export const authOptions: NextAuthOptions = {
  adapter: createCustomAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow Google Workspace domain emails
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;
        
        // Add your domain restriction here
        // For now, allowing all Google accounts
        return true;
      }
      return false;
    },
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await db.select().from(users).where(eq(users.email, session.user.email!)).limit(1);
        if (dbUser.length > 0) {
          session.user.id = dbUser[0].id;
          session.user.role = dbUser[0].role;
          session.user.hourlyRate = dbUser[0].hourlyRate;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'database',
  },
};