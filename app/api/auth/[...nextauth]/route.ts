export const dynamic = 'force-dynamic';

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

async function handler(req: Request, context: { params: { nextauth: string[] } }) {
  return NextAuth(authOptions)(req, context);
}

export { handler as GET, handler as POST };