export const dynamic = 'force-dynamic';

import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, context: { params: { nextauth: string[] } }) {
  return NextAuth(req, context, authOptions);
}

export async function POST(req: Request, context: { params: { nextauth: string[] } }) {
  return NextAuth(req, context, authOptions);
}