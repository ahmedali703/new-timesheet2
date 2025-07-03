import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Add error handling for the NextAuth handler
let handler: any;

try {
  handler = NextAuth(authOptions);
} catch (error) {
  console.error('NextAuth initialization error:', error);
  
  // Create a fallback handler that returns proper error responses
  handler = {
    GET: async (req: Request) => {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication service unavailable',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    },
    POST: async (req: Request) => {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication service unavailable',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

export { handler as GET, handler as POST };